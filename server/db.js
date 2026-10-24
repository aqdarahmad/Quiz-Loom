import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

// Neon (and most hosted Postgres) needs SSL; local Postgres does not.
const url = process.env.DATABASE_URL || "";
const needsSsl = /sslmode=require|neon\.tech/.test(url);

export const pool = new Pool({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  main_category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  subcategory_id INT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple-choice','true-false')),
  options JSONB NOT NULL,
  correct_answer INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory_id INT REFERENCES subcategories(id) ON DELETE SET NULL,
  subcategory_name TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,
  correct_count INT,
  wrong_count INT
);
CREATE TABLE IF NOT EXISTS quiz_questions (
  quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  selected_answer INT,
  PRIMARY KEY (quiz_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_sub_main ON subcategories(main_category_id);
CREATE INDEX IF NOT EXISTS idx_q_sub ON questions(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_quiz_student ON quizzes(student_id);
`;

const tf = (question, correct) => ({
  question,
  type: "true-false",
  options: ["True", "False"],
  correct_answer: correct ? 0 : 1,
});
const mc = (question, options, correct) => ({
  question,
  type: "multiple-choice",
  options,
  correct_answer: correct,
});

const SEED = [
  {
    name: "Programming",
    description: "Test your coding knowledge",
    image: "/assets/categoriesImage/Programmer-cuate.png",
    subs: [
      {
        name: "JavaScript Basics",
        description: "Variables, functions and types",
        questions: [
          mc("Which keyword declares a block-scoped variable?", ["var", "let", "def", "dim"], 1),
          mc("What does typeof null return?", ["null", "undefined", "object", "number"], 2),
          tf("JavaScript and Java are the same language.", false),
          mc("Which method adds an item to the end of an array?", ["push", "pop", "shift", "concat"], 0),
          tf("=== compares both value and type.", true),
        ],
      },
    ],
  },
  {
    name: "Math",
    description: "Numbers, algebra and geometry",
    image: "/assets/categoriesImage/Mathematics-bro.png",
    subs: [
      {
        name: "Algebra",
        description: "Equations and expressions",
        questions: [
          mc("Solve: 2x + 6 = 14", ["x = 3", "x = 4", "x = 5", "x = 10"], 1),
          mc("What is 7 x 8?", ["54", "56", "58", "64"], 1),
          tf("The square root of 81 is 9.", true),
          mc("What is the value of 2^5?", ["10", "16", "25", "32"], 3),
          tf("A triangle's angles always add up to 90 degrees.", false),
        ],
      },
    ],
  },
  {
    name: "Chemistry",
    description: "Elements, reactions and the lab",
    image: "/assets/categoriesImage/beaker%20chemistry-pana.png",
    subs: [
      {
        name: "Basics",
        description: "Elements and compounds",
        questions: [
          mc("What is the chemical symbol for water?", ["O2", "H2O", "CO2", "HO"], 1),
          mc("Which gas do plants absorb?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], 2),
          tf("Gold's symbol is Au.", true),
          mc("What is the pH of a neutral solution?", ["0", "7", "10", "14"], 1),
          tf("Sodium is a noble gas.", false),
        ],
      },
    ],
  },
];

async function seedCatalog() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM categories");
  if (rows[0].n > 0) return;
  for (const cat of SEED) {
    const c = await pool.query(
      "INSERT INTO categories (name, description, image) VALUES ($1,$2,$3) RETURNING id",
      [cat.name, cat.description, cat.image]
    );
    for (const sub of cat.subs) {
      const s = await pool.query(
        "INSERT INTO subcategories (main_category_id, name, description) VALUES ($1,$2,$3) RETURNING id",
        [c.rows[0].id, sub.name, sub.description]
      );
      for (const q of sub.questions) {
        await pool.query(
          "INSERT INTO questions (subcategory_id, question, type, options, correct_answer) VALUES ($1,$2,$3,$4,$5)",
          [s.rows[0].id, q.question, q.type, JSON.stringify(q.options), q.correct_answer]
        );
      }
    }
  }
}

async function seedAdmin() {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return;
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1,$2,$3,'admin')
     ON CONFLICT (username) DO UPDATE SET password_hash = $3, role = 'admin'`,
    [ADMIN_USERNAME, ADMIN_EMAIL || `${ADMIN_USERNAME}@quizloom.local`, hash]
  );
}

export async function initDb() {
  await pool.query(SCHEMA);
  await seedCatalog();
  await seedAdmin();
}
