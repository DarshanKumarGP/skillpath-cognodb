import { Router } from "express";
import { runQuery } from "../db/driver.js";
import { recordsToRows } from "../db/serialize.js";

const router = Router();

// GET /api/stats — headline counts + the most in-demand skills across all
// jobs. The second half is a 2-hop aggregation (Skill <- REQUIRES_SKILL -
// Job -> OFFERED_BY -> Company) that would need two joins and a GROUP BY
// in SQL; here it's one pattern match.
router.get("/", async (req, res, next) => {
  try {
    const [counts] = recordsToRows(
      await runQuery(`
        MATCH (p:Person) WITH count(p) AS people
        MATCH (j:Job) WITH people, count(j) AS jobs
        MATCH (s:Skill) WITH people, jobs, count(s) AS skills
        MATCH (c:Course) WITH people, jobs, skills, count(c) AS courses
        MATCH (co:Company)
        RETURN people, jobs, skills, courses, count(co) AS companies
      `)
    );

    const topSkills = recordsToRows(
      await runQuery(`
        MATCH (j:Job)-[:REQUIRES_SKILL]->(s:Skill)
        RETURN s.id AS id, s.name AS name, s.category AS category,
               count(DISTINCT j) AS demand
        ORDER BY demand DESC
        LIMIT 8
      `)
    );

    res.json({ counts: counts || {}, topSkills });
  } catch (err) {
    next(err);
  }
});

export default router;
