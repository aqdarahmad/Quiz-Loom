import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { initDb } from "./db.js";
import router from "./routes.js";

const app = express();
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", router);
app.use("/api", (_req, res) => res.status(404).json({ message: "Not found" }));

// Serve the built React app (single deployment on Render).
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT || 5000;
initDb()
  .then(() => app.listen(port, () => console.log(`QuizLoom server on :${port}`)))
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
