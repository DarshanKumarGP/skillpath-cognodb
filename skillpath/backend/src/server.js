import "dotenv/config";
import express from "express";
import cors from "cors";

import { initDriver, closeDriver } from "./db/driver.js";
import healthRoutes from "./routes/health.js";
import statsRoutes from "./routes/stats.js";
import peopleRoutes from "./routes/people.js";
import jobsRoutes from "./routes/jobs.js";
import skillsRoutes from "./routes/skills.js";
import coursesRoutes from "./routes/courses.js";
import pathwayRoutes from "./routes/pathway.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/people", peopleRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/pathway", pathwayRoutes);

// Central error handler: every route's catch(next(err)) lands here so the
// client always gets a clean JSON error instead of an HTML stack trace,
// and a dead database reads as 503 rather than a generic 500.
app.use((err, req, res, next) => {
  console.error("[error]", err);
  if (err.code === "DB_UNAVAILABLE") {
    return res.status(503).json({
      error: "The database is unreachable right now. Please try again shortly.",
      detail: err.message,
    });
  }
  res.status(500).json({
    error: "Something went wrong processing that request.",
    detail: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

async function start() {
  await initDriver(); // logged, non-fatal — the API stays up and reports 503s
  app.listen(PORT, () => {
    console.log(`[server] SkillPath API listening on port ${PORT}`);
  });
}

start();

process.on("SIGINT", async () => {
  await closeDriver();
  process.exit(0);
});
