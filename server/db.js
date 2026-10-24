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
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
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
          mc("Which of these is NOT a JavaScript data type?", ["String", "Boolean", "Float", "Symbol"], 2),
          mc("What does Array.isArray([]) return?", ["true", "false", "undefined", "null"], 0),
          tf("Variables declared with const can be reassigned.", false),
          mc("Which method converts a JSON string into an object?", ["JSON.stringify", "JSON.parse", "JSON.object", "JSON.convert"], 1),
          mc("What is the result of 2 + '2' in JavaScript?", ["4", "22", "NaN", "Error"], 1),
        ],
      },
      {
        name: "Data Structures",
        description: "Stacks, queues, trees and hash tables",
        questions: [
          mc("Which data structure follows LIFO order?", ["Queue", "Stack", "Array", "Tree"], 1),
          mc("Which data structure follows FIFO order?", ["Stack", "Queue", "Tree", "Graph"], 1),
          tf("Binary search requires a sorted array.", true),
          mc("What is the time complexity of binary search?", ["O(n)", "O(log n)", "O(n^2)", "O(1)"], 1),
          mc("Which structure stores data as key-value pairs?", ["Stack", "Queue", "Hash table", "Linked list"], 2),
          tf("A linked list gives O(1) access by index.", false),
          mc("Which tree traversal visits root, then left, then right?", ["Inorder", "Preorder", "Postorder", "Level-order"], 1),
          mc("What is the average lookup time in a hash table?", ["O(1)", "O(n)", "O(log n)", "O(n log n)"], 0),
          tf("A tree can contain cycles.", false),
          mc("Which data structure is typically used for breadth-first search?", ["Stack", "Queue", "Heap", "Set"], 1),
        ],
      },
      {
        name: "Databases & SQL",
        description: "Queries, joins and keys",
        questions: [
          mc("Which SQL statement retrieves data from a table?", ["GET", "SELECT", "FETCH", "PULL"], 1),
          mc("Which clause filters rows?", ["ORDER BY", "GROUP BY", "WHERE", "LIMIT"], 2),
          tf("A primary key can contain duplicate values.", false),
          mc("Which JOIN returns only rows that match in both tables?", ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN"], 2),
          mc("Which clause sorts the result set?", ["SORT BY", "ORDER BY", "ARRANGE", "GROUP BY"], 1),
          tf("A foreign key references a primary key in another table.", true),
          mc("Which command removes all rows but keeps the table structure?", ["DROP TABLE", "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE"], 2),
          mc("What does COUNT(*) return?", ["Sum of values", "Number of rows", "Maximum value", "Average value"], 1),
          tf("PostgreSQL is a relational database.", true),
          mc("Which function returns the average of a column?", ["AVG", "MEAN", "MID", "AVERAGE"], 0),
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
          mc("Simplify: 3(x + 4)", ["3x + 4", "3x + 12", "x + 12", "3x + 7"], 1),
          mc("If x^2 = 49 and x > 0, what is x?", ["6", "7", "8", "9"], 1),
          tf("(a + b)^2 equals a^2 + b^2.", false),
          mc("Solve: 5x - 10 = 20", ["x = 4", "x = 5", "x = 6", "x = 7"], 2),
          mc("What is the slope of the line y = 3x + 2?", ["2", "3", "5", "1"], 1),
        ],
      },
      {
        name: "Geometry",
        description: "Shapes, angles and areas",
        questions: [
          mc("What is the area of a rectangle with sides 5 and 8?", ["13", "26", "40", "45"], 2),
          mc("What is the sum of the angles in a triangle?", ["90 degrees", "180 degrees", "270 degrees", "360 degrees"], 1),
          tf("Every square is also a rectangle.", true),
          mc("Which formula gives the circumference of a circle?", ["pi r^2", "2 pi r", "pi d^2", "2 pi r^2"], 1),
          mc("What is the area of a circle with radius 3?", ["6 pi", "9 pi", "3 pi", "12 pi"], 1),
          tf("A triangle with sides 3, 4 and 5 is a right triangle.", true),
          mc("How many sides does a hexagon have?", ["5", "6", "7", "8"], 1),
          mc("What is the hypotenuse of a right triangle with legs 6 and 8?", ["9", "10", "12", "14"], 1),
          tf("Two parallel lines intersect at one point.", false),
          mc("What is the sum of interior angles of a quadrilateral?", ["180 degrees", "270 degrees", "360 degrees", "540 degrees"], 2),
        ],
      },
      {
        name: "Probability & Statistics",
        description: "Averages, chance and counting",
        questions: [
          mc("What is the mean of 2, 4, 6, 8?", ["4", "5", "6", "7"], 1),
          mc("What is the median of 3, 7, 9?", ["3", "7", "9", "6"], 1),
          mc("What is the mode of 2, 3, 3, 5, 7?", ["2", "3", "5", "7"], 1),
          tf("A probability can be greater than 1.", false),
          mc("What is the probability of heads on a fair coin?", ["1/4", "1/3", "1/2", "1"], 2),
          mc("What is the probability of rolling a 6 on a fair die?", ["1/2", "1/3", "1/6", "1/12"], 2),
          tf("The probabilities of all outcomes add up to 1.", true),
          mc("What is the range of 4, 9, 15, 20?", ["11", "16", "20", "5"], 1),
          mc("In how many ways can 3 different letters be arranged?", ["3", "6", "9", "12"], 1),
          mc("A bag has 10 balls and 2 are red. What is P(red)?", ["0.1", "0.2", "0.5", "0.8"], 1),
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
          mc("What is the chemical formula of water?", ["O2", "H2O", "CO2", "HO"], 1),
          mc("Which gas do plants absorb from the air?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], 2),
          tf("Gold's chemical symbol is Au.", true),
          mc("What is the pH of a neutral solution?", ["0", "7", "10", "14"], 1),
          tf("Sodium is a noble gas.", false),
          mc("What is the atomic number of carbon?", ["4", "6", "8", "12"], 1),
          mc("What is the chemical symbol for sodium?", ["S", "So", "Na", "N"], 2),
          tf("Water boils at 100 degrees Celsius at sea level.", true),
          mc("Which gas is the most abundant in Earth's atmosphere?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], 1),
          mc("Which particle has a negative charge?", ["Proton", "Neutron", "Electron", "Nucleus"], 2),
        ],
      },
      {
        name: "Periodic Table",
        description: "Groups, periods and symbols",
        questions: [
          mc("Who created the first widely accepted periodic table?", ["Dalton", "Mendeleev", "Bohr", "Curie"], 1),
          mc("Elements in the same group share similar...", ["Mass", "Chemical properties", "Color", "Density"], 1),
          tf("Noble gases are very reactive.", false),
          mc("What is the chemical symbol for iron?", ["Ir", "Fe", "In", "I"], 1),
          mc("Which of these is a halogen?", ["Neon", "Chlorine", "Sodium", "Calcium"], 1),
          mc("Which element is the lightest?", ["Helium", "Hydrogen", "Lithium", "Oxygen"], 1),
          tf("Metals are generally good conductors of electricity.", true),
          mc("Group 1 elements are known as...", ["Alkali metals", "Alkaline earth metals", "Halogens", "Noble gases"], 0),
          mc("The atomic number equals the number of...", ["Neutrons", "Protons", "Electrons plus neutrons", "Nucleons"], 1),
          mc("The symbol K stands for which element?", ["Krypton", "Potassium", "Calcium", "Carbon"], 1),
        ],
      },
      {
        name: "Reactions & Acids",
        description: "Acids, bases and chemical change",
        questions: [
          mc("A solution with a pH below 7 is...", ["Basic", "Neutral", "Acidic", "Salty"], 2),
          mc("An acid reacting with a base produces a salt and...", ["Hydrogen", "Water", "Oxygen", "Carbon"], 1),
          tf("Rusting of iron is a chemical change.", true),
          mc("What is the chemical formula of table salt?", ["NaCl", "KCl", "NaOH", "HCl"], 0),
          mc("Which gas is released when a metal reacts with an acid?", ["Oxygen", "Hydrogen", "Nitrogen", "Carbon dioxide"], 1),
          mc("What is the chemical formula of carbon dioxide?", ["CO", "CO2", "C2O", "O2C"], 1),
          tf("Melting ice is a chemical change.", false),
          mc("Blue litmus paper turns red in...", ["A base", "An acid", "Pure water", "A salt solution"], 1),
          mc("What do we call a substance that speeds up a reaction without being used up?", ["Reactant", "Product", "Catalyst", "Solvent"], 2),
          mc("The law of conservation of mass says that mass is...", ["Created", "Destroyed", "Conserved", "Doubled"], 2),
        ],
      },
    ],
  },
];

// Idempotent: only adds what is missing, so it is safe to run on every start.
// A meta flag makes it run once per SEED_VERSION, so questions an admin later
// deletes are not brought back.
const SEED_VERSION = "2";

async function seedCatalog() {
  const done = await pool.query("SELECT value FROM app_meta WHERE key='seed_version'");
  if (done.rows[0]?.value === SEED_VERSION) return;

  for (const cat of SEED) {
    let c = await pool.query("SELECT id FROM categories WHERE name=$1", [cat.name]);
    if (!c.rowCount) {
      c = await pool.query(
        "INSERT INTO categories (name, description, image) VALUES ($1,$2,$3) RETURNING id",
        [cat.name, cat.description, cat.image]
      );
    }
    for (const sub of cat.subs) {
      let s = await pool.query(
        "SELECT id FROM subcategories WHERE main_category_id=$1 AND name=$2",
        [c.rows[0].id, sub.name]
      );
      if (!s.rowCount) {
        s = await pool.query(
          "INSERT INTO subcategories (main_category_id, name, description) VALUES ($1,$2,$3) RETURNING id",
          [c.rows[0].id, sub.name, sub.description]
        );
      }
      for (const qu of sub.questions) {
        await pool.query(
          `INSERT INTO questions (subcategory_id, question, type, options, correct_answer)
           SELECT $1,$2,$3,$4,$5
           WHERE NOT EXISTS (SELECT 1 FROM questions WHERE subcategory_id=$1 AND question=$2)`,
          [s.rows[0].id, qu.question, qu.type, JSON.stringify(qu.options), qu.correct_answer]
        );
      }
    }
  }
  await pool.query(
    `INSERT INTO app_meta (key, value) VALUES ('seed_version', $1)
     ON CONFLICT (key) DO UPDATE SET value=$1`,
    [SEED_VERSION]
  );
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
