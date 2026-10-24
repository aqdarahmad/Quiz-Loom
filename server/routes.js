import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { pool } from "./db.js";
import { signToken, requireAuth, requireAdmin } from "./auth.js";

const router = Router();
const q = (text, params) => pool.query(text, params);
const toId = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const bad = (res, message, status = 400) => res.status(status).json({ message });

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
});

const questionDto = (r, withAnswer = true) => ({
  id: r.id,
  question: r.question,
  type: r.type,
  options: r.options,
  ...(withAnswer ? { correctAnswer: r.correct_answer } : {}),
});

// ---------- Auth ----------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, try again later" },
});

router.post("/signup", authLimiter, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (username.length < 3) return bad(res, "Username must be at least 3 characters");
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, "Invalid email address");
  if (password.length < 6) return bad(res, "Password must be at least 6 characters");

  const dup = await q("SELECT 1 FROM users WHERE lower(username)=lower($1) OR email=$2", [username, email]);
  if (dup.rowCount) return bad(res, "Username or email already exists", 409);

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await q(
    "INSERT INTO users (username,email,password_hash,full_name) VALUES ($1,$2,$3,$1) RETURNING *",
    [username, email, hash]
  );
  res.status(201).json({ user: publicUser(rows[0]), token: signToken(rows[0]) });
});

router.post("/login", authLimiter, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const { rows } = await q(
    "SELECT * FROM users WHERE lower(username)=lower($1) OR email=lower($1)",
    [username]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return bad(res, "Invalid username or password", 401);
  res.json({ user: publicUser(user), token: signToken(user) });
});

// ---------- Catalog ----------
const categoryDto = (r) => ({ id: r.id, name: r.name, description: r.description, image: r.image });

router.get("/Main_categories", requireAuth, async (_req, res) => {
  const { rows } = await q("SELECT * FROM categories ORDER BY id");
  res.json(rows.map(categoryDto));
});

router.get("/landingpagedata", async (_req, res) => {
  const { rows } = await q("SELECT * FROM categories ORDER BY id");
  res.json({ categories: rows.map(categoryDto) });
});

router.get("/SubCategories", requireAuth, async (req, res) => {
  const main = toId(req.query.mainCategory);
  if (main === null) return res.json([]);
  const { rows } = await q(
    "SELECT * FROM subcategories WHERE main_category_id=$1 ORDER BY id",
    [main]
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      mainCategoryId: r.main_category_id,
    }))
  );
});

router.post("/categories/sub/add", requireAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();
  const main = toId(req.body.mainCategoryId);
  if (!name || main === null) return bad(res, "name and mainCategoryId are required");
  const cat = await q("SELECT 1 FROM categories WHERE id=$1", [main]);
  if (!cat.rowCount) return bad(res, "Category not found", 404);
  const { rows } = await q(
    "INSERT INTO subcategories (main_category_id,name,description) VALUES ($1,$2,$3) RETURNING *",
    [main, name, description]
  );
  res.status(201).json(rows[0]);
});

router.delete("/deleteSubCategory/:id", requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  if (id === null) return bad(res, "Invalid id");
  await q("DELETE FROM subcategories WHERE id=$1", [id]);
  res.status(204).end();
});

// ---------- Questions ----------
router.get("/questionBanks", requireAdmin, async (req, res) => {
  const sub = toId(req.query.subcategoryId);
  if (sub === null) return res.json({ questions: [] });
  const { rows } = await q("SELECT * FROM questions WHERE subcategory_id=$1 ORDER BY id", [sub]);
  res.json({ subcategoryId: sub, questions: rows.map((r) => questionDto(r)) });
});

function parseQuestion(body) {
  const question = String(body.question || "").trim();
  const type = body.type;
  if (question.length < 5) return { error: "Question must be at least 5 characters" };
  if (!["multiple-choice", "true-false"].includes(type)) return { error: "Invalid question type" };
  let options = type === "true-false" ? ["True", "False"] : body.options;
  if (!Array.isArray(options) || options.length < 2 || options.some((o) => !String(o).trim()))
    return { error: "All options must be filled" };
  options = options.map((o) => String(o).trim());
  const correct = Number(body.correctAnswer ?? 0);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length)
    return { error: "Invalid correct answer" };
  return { question, type, options, correct };
}

router.post("/questions", requireAdmin, async (req, res) => {
  const sub = toId(req.body.subcategoryId);
  const p = parseQuestion(req.body);
  if (sub === null) return bad(res, "subcategoryId is required");
  if (p.error) return bad(res, p.error);
  const { rows } = await q(
    "INSERT INTO questions (subcategory_id,question,type,options,correct_answer) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [sub, p.question, p.type, JSON.stringify(p.options), p.correct]
  );
  res.status(201).json(questionDto(rows[0]));
});

router.put("/questions/:id", requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  const p = parseQuestion(req.body);
  if (id === null) return bad(res, "Invalid id");
  if (p.error) return bad(res, p.error);
  const { rows } = await q(
    "UPDATE questions SET question=$2,type=$3,options=$4,correct_answer=$5 WHERE id=$1 RETURNING *",
    [id, p.question, p.type, JSON.stringify(p.options), p.correct]
  );
  if (!rows[0]) return bad(res, "Question not found", 404);
  res.json(questionDto(rows[0]));
});

router.delete("/questions/:id", requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  if (id === null) return bad(res, "Invalid id");
  await q("DELETE FROM questions WHERE id=$1", [id]);
  res.status(204).end();
});

// ---------- Students (admin) ----------
const STUDENT_STATS = `
  SELECT u.id, u.username, u.full_name, u.email,
         COUNT(z.id)::int AS completed,
         COALESCE(ROUND(AVG(z.score)),0)::int AS avg_score
  FROM users u
  LEFT JOIN quizzes z ON z.student_id=u.id AND z.submitted_at IS NOT NULL
  WHERE u.role='student'`;

router.get("/students/performance", requireAdmin, async (_req, res) => {
  const { rows } = await q(`${STUDENT_STATS} GROUP BY u.id`);
  const total = rows.length;
  const active = rows.filter((r) => r.completed > 0);
  const passed = active.filter((r) => r.avg_score >= 50).length;
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  res.json({
    totalStudents: total,
    avgScore: active.length
      ? Math.round(active.reduce((s, r) => s + r.avg_score, 0) / active.length)
      : 0,
    passRate: pct(passed, active.length),
    failRate: active.length ? 100 - pct(passed, active.length) : 0,
    motivatedStudents: active.filter((r) => r.avg_score >= 50).length,
    weakStudents: active.filter((r) => r.avg_score < 50).length,
  });
});

router.get("/students", requireAdmin, async (_req, res) => {
  const { rows } = await q(`${STUDENT_STATS} GROUP BY u.id ORDER BY u.id`);
  res.json(
    rows.map((r) => ({
      student_id: r.id,
      name: r.full_name || r.username,
      email: r.email,
      score: r.avg_score,
      quizzesCompleted: r.completed,
      status: r.completed > 0 ? (r.avg_score >= 50 ? "Passing" : "Needs improvement") : "No quizzes yet",
    }))
  );
});

router.get("/students/:id", requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  if (id === null) return bad(res, "Invalid id");
  const { rows } = await q(`${STUDENT_STATS} AND u.id=$1 GROUP BY u.id`, [id]);
  const r = rows[0];
  if (!r) return bad(res, "Student not found", 404);
  res.json({
    student_id: r.id,
    name: r.full_name || r.username,
    email: r.email,
    score: r.avg_score,
    quizzesCompleted: r.completed,
    status: r.completed > 0 ? (r.avg_score >= 50 ? "Passing" : "Needs improvement") : "No quizzes yet",
  });
});

// "studentsDelate" (sic) is the path the frontend calls; keep both spellings.
router.delete(["/studentsDelate/:id", "/students/:id"], requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  if (id === null) return bad(res, "Invalid id");
  await q("DELETE FROM users WHERE id=$1 AND role='student'", [id]);
  res.status(204).end();
});

router.get("/quizzes/effectiveness", requireAdmin, async (_req, res) => {
  const { rows } = await q(`
    SELECT c.name AS main_category,
           COUNT(z.id)::int AS started,
           COUNT(z.id) FILTER (WHERE z.submitted_at IS NOT NULL)::int AS finished,
           COUNT(z.id) FILTER (WHERE z.score >= 80)::int AS easy,
           COUNT(z.id) FILTER (WHERE z.score >= 50 AND z.score < 80)::int AS medium,
           COUNT(z.id) FILTER (WHERE z.score < 50)::int AS hard
    FROM categories c
    LEFT JOIN subcategories s ON s.main_category_id=c.id
    LEFT JOIN quizzes z ON z.subcategory_id=s.id
    GROUP BY c.id ORDER BY c.id`);
  // easy/medium/hard = how many attempts scored >=80 / 50-79 / <50
  res.json(
    rows.map((r) => ({
      mainCategory: r.main_category,
      difficulty: { easy: r.easy, medium: r.medium, hard: r.hard },
      completionRate: r.started ? Math.round((r.finished / r.started) * 100) : 0,
    }))
  );
});

// ---------- Student profile ----------
const profileDto = (u) => ({
  fullName: u.full_name,
  username: u.username,
  email: u.email,
  password: "",
  avatar: u.avatar,
});

router.get("/studentprofile", requireAuth, async (req, res) => {
  const { rows } = await q("SELECT * FROM users WHERE id=$1", [req.auth.id]);
  if (!rows[0]) return bad(res, "User not found", 404);
  res.json(profileDto(rows[0]));
});

router.put("/changestudentprofile", requireAuth, async (req, res) => {
  const { rows } = await q("SELECT * FROM users WHERE id=$1", [req.auth.id]);
  const u = rows[0];
  if (!u) return bad(res, "User not found", 404);

  const username = String(req.body.username ?? u.username).trim();
  const email = String(req.body.email ?? u.email).trim().toLowerCase();
  const fullName = String(req.body.fullName ?? u.full_name).trim();
  const avatar = String(req.body.avatar ?? u.avatar);
  const password = String(req.body.password || "");
  if (username.length < 3) return bad(res, "Username must be at least 3 characters");
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, "Invalid email address");
  if (password && password.length < 6) return bad(res, "Password must be at least 6 characters");
  if (avatar.length > 1_500_000) return bad(res, "Avatar image is too large");

  const dup = await q(
    "SELECT 1 FROM users WHERE id<>$1 AND (lower(username)=lower($2) OR email=$3)",
    [u.id, username, email]
  );
  if (dup.rowCount) return bad(res, "Username or email already exists", 409);

  const hash = password ? await bcrypt.hash(password, 10) : u.password_hash;
  const upd = await q(
    "UPDATE users SET username=$2,email=$3,full_name=$4,avatar=$5,password_hash=$6 WHERE id=$1 RETURNING *",
    [u.id, username, email, fullName, avatar, hash]
  );
  res.json(profileDto(upd.rows[0]));
});

// ---------- Quiz taking ----------
router.post("/quiz/start", requireAuth, async (req, res) => {
  const sub = toId(req.body.subCategoryId);
  const count = Math.min(Math.max(Number(req.body.numberOfQuestions) || 20, 1), 50);
  if (sub === null) return bad(res, "subCategoryId is required");
  const s = await q("SELECT * FROM subcategories WHERE id=$1", [sub]);
  if (!s.rows[0]) return bad(res, "Quiz not found", 404);
  const qs = await q(
    "SELECT * FROM questions WHERE subcategory_id=$1 ORDER BY random() LIMIT $2",
    [sub, count]
  );
  if (!qs.rowCount) return bad(res, "This quiz has no questions yet", 409);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const z = await client.query(
      "INSERT INTO quizzes (student_id,subcategory_id,subcategory_name) VALUES ($1,$2,$3) RETURNING id, started_at",
      [req.auth.id, sub, s.rows[0].name]
    );
    for (const [i, row] of qs.rows.entries()) {
      await client.query(
        "INSERT INTO quiz_questions (quiz_id,question_id,position) VALUES ($1,$2,$3)",
        [z.rows[0].id, row.id, i]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({
      quizId: z.rows[0].id,
      startTime: z.rows[0].started_at,
      questions: qs.rows.map((r) => questionDto(r, false)),
      answers: [],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.put("/quiz/:quizId/answer", requireAuth, async (req, res) => {
  const quizId = toId(req.params.quizId);
  const qid = toId(req.body.id);
  const sel = Number(req.body.selectedAnswer);
  if (quizId === null || qid === null || !Number.isInteger(sel) || sel < 0)
    return bad(res, "Invalid answer");
  const r = await q(
    `UPDATE quiz_questions qq SET selected_answer=$4
     FROM quizzes z
     WHERE qq.quiz_id=z.id AND z.id=$1 AND z.student_id=$2 AND z.submitted_at IS NULL AND qq.question_id=$3`,
    [quizId, req.auth.id, qid, sel]
  );
  if (!r.rowCount) return bad(res, "Quiz or question not found", 404);
  res.json({ ok: true });
});

router.post("/quiz/submit", requireAuth, async (req, res) => {
  const quizId = toId(req.body.quizId);
  if (quizId === null) return bad(res, "quizId is required");
  const z = await q("SELECT * FROM quizzes WHERE id=$1 AND student_id=$2", [quizId, req.auth.id]);
  const quiz = z.rows[0];
  if (!quiz) return bad(res, "Quiz not found", 404);
  if (quiz.submitted_at) return bad(res, "Quiz already submitted", 409);

  const { rows } = await q(
    `SELECT qq.selected_answer, qu.correct_answer
     FROM quiz_questions qq JOIN questions qu ON qu.id=qq.question_id
     WHERE qq.quiz_id=$1`,
    [quizId]
  );
  const correct = rows.filter((r) => r.selected_answer === r.correct_answer).length;
  const wrong = rows.length - correct;
  const score = rows.length ? Math.round((correct / rows.length) * 100) : 0;
  const upd = await q(
    "UPDATE quizzes SET submitted_at=now(), score=$2, correct_count=$3, wrong_count=$4 WHERE id=$1 RETURNING started_at, submitted_at",
    [quizId, score, correct, wrong]
  );
  const mins = (new Date(upd.rows[0].submitted_at) - new Date(upd.rows[0].started_at)) / 60000;
  res.json({
    score,
    correctCount: correct,
    wrongCount: wrong,
    timeTaken: Math.max(0.1, Math.round(mins * 10) / 10),
  });
});

router.get("/viewhistory", requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT subcategory_name, score, correct_count, wrong_count
     FROM quizzes WHERE student_id=$1 AND submitted_at IS NOT NULL
     ORDER BY submitted_at DESC`,
    [req.auth.id]
  );
  const scores = rows.map((r) => r.score);
  res.json({
    total: rows.length,
    avg: rows.length ? Math.round(scores.reduce((a, b) => a + b, 0) / rows.length) : 0,
    highest: rows.length ? Math.max(...scores) : 0,
    lowest: rows.length ? Math.min(...scores) : 0,
    passRate: rows.length ? Math.round((scores.filter((s) => s >= 50).length / rows.length) * 100) : 0,
    quizzes: rows.map((r) => ({
      name: r.subcategory_name,
      score: r.score,
      correct: r.correct_count,
      wrong: r.wrong_count,
    })),
  });
});

export default router;
