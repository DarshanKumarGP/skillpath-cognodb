import { Router } from "express";
import { runQuery } from "../db/driver.js";
import { recordsToRows } from "../db/serialize.js";

const router = Router();

// GET /api/courses
router.get("/", async (req, res, next) => {
  try {
    const rows = recordsToRows(
      await runQuery(`
        MATCH (c:Course)
        OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
        RETURN c.id AS id, c.title AS title, c.provider AS provider,
               c.url AS url, c.duration_hours AS durationHours,
               collect(DISTINCT {id: s.id, name: s.name}) AS skillsTaught
        ORDER BY c.title
      `)
    );
    res.json(rows.map((r) => ({ ...r, skillsTaught: r.skillsTaught.filter((s) => s.id) })));
  } catch (err) {
    next(err);
  }
});

export default router;
