// Optional demo data for screenshots/portfolio.
//   npm run seed:demo          -> adds demo students with quiz history
//   npm run seed:demo:remove   -> removes them again
// Demo accounts all use the @demo.quizloom.dev email domain.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool, initDb } from "./db.js";

const DOMAIN = "demo.quizloom.dev";
const NAMES = [
  "Lina Haddad", "Omar Khalil", "Maya Nasser", "Yousef Darwish", "Sara Ibrahim",
  "Khaled Mansour", "Noor Saleh", "Ahmad Taha", "Rana Awad", "Tariq Jaber",
  "Dina Abbas", "Hadi Qasem",
];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function remove() {
  const r = await pool.query("DELETE FROM users WHERE email LIKE $1", [`%@${DOMAIN}`]);
  console.log(`Removed ${r.rowCount} demo students.`);
}

async function add() {
  const exists = await pool.query("SELECT COUNT(*)::int n FROM users WHERE email LIKE $1", [`%@${DOMAIN}`]);
  if (exists.rows[0].n > 0) {
    console.log("Demo students already exist. Run the remove script first.");
    return;
  }
  const subs = (await pool.query("SELECT id, name FROM subcategories")).rows;
  if (!subs.length) throw new Error("No subcategories found");
  const hash = await bcrypt.hash("Demo@12345", 10);

  for (const [i, full] of NAMES.entries()) {
    const username = full.toLowerCase().replace(/\s+/g, ".");
    const u = await pool.query(
      "INSERT INTO users (username,email,password_hash,full_name) VALUES ($1,$2,$3,$4) RETURNING id",
      [username, `${username}@${DOMAIN}`, hash, full]
    );
    const skill = i % 4 === 3 ? rand(0.25, 0.45) : rand(0.55, 0.95); // a few weaker students
    const attempts = Math.floor(rand(2, 6));
    for (let a = 0; a < attempts; a++) {
      const sub = pick(subs);
      const qs = (await pool.query("SELECT id, options, correct_answer FROM questions WHERE subcategory_id=$1 ORDER BY random() LIMIT 10", [sub.id])).rows;
      if (!qs.length) continue;
      let correct = 0;
      const answered = qs.map((q) => {
        const ok = Math.random() < skill;
        const wrong = [...q.options.keys()].filter((k) => k !== q.correct_answer);
        if (ok) correct++;
        return { id: q.id, sel: ok ? q.correct_answer : pick(wrong) };
      });
      const score = Math.round((correct / qs.length) * 100);
      const started = new Date(Date.now() - rand(1, 20) * 86400000);
      const submitted = new Date(started.getTime() + rand(4, 14) * 60000);
      const z = await pool.query(
        `INSERT INTO quizzes (student_id,subcategory_id,subcategory_name,started_at,submitted_at,score,correct_count,wrong_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [u.rows[0].id, sub.id, sub.name, started, submitted, score, correct, qs.length - correct]
      );
      for (const [pos, ans] of answered.entries()) {
        await pool.query(
          "INSERT INTO quiz_questions (quiz_id,question_id,position,selected_answer) VALUES ($1,$2,$3,$4)",
          [z.rows[0].id, ans.id, pos, ans.sel]
        );
      }
    }
  }
  console.log(`Added ${NAMES.length} demo students (password: Demo@12345).`);
}

await initDb();
await (process.argv.includes("--remove") ? remove() : add());
await pool.end();
