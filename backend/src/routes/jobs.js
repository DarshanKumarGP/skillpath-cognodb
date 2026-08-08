import { Router } from "express";
import { runQuery } from "../db/driver.js";
import { recordsToRows } from "../db/serialize.js";

const router = Router();

// GET /api/jobs?search=
router.get("/", async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (j:Job)
        WHERE $search = "" OR toLower(j.title) CONTAINS toLower($search)
        OPTIONAL MATCH (j)-[:OFFERED_BY]->(co:Company)
        OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
        RETURN j.id AS id, j.title AS title, j.level AS level,
               j.description AS description, co.name AS company,
               co.industry AS industry, count(DISTINCT s) AS skillCount
        ORDER BY j.title
        `,
        { search }
      )
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id — job detail with required skills
router.get("/:id", async (req, res, next) => {
  try {
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (j:Job {id: $id})
        OPTIONAL MATCH (j)-[:OFFERED_BY]->(co:Company)
        OPTIONAL MATCH (j)-[r:REQUIRES_SKILL]->(s:Skill)
        RETURN j, co,
               collect(DISTINCT {id: s.id, name: s.name, category: s.category,
                                  importance: r.importance})
                 AS requiredSkills
        ORDER BY j.title
        `,
        { id: req.params.id }
      )
    );

    if (!rows.length || !rows[0].j) {
      return res.status(404).json({ error: "Job not found" });
    }

    const row = rows[0];
    res.json({
      ...row.j,
      company: row.co,
      requiredSkills: row.requiredSkills
        .filter((s) => s.id)
        .sort((a, b) => (b.importance || 0) - (a.importance || 0)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id/candidates — multi-hop match: people who already hold
// at least one required skill, ranked by fraction of required skills held.
// This kind of "best partial match, ranked" query needs a self-join +
// aggregate + division in SQL; here it's a single traversal.
router.get("/:id/candidates", async (req, res, next) => {
  try {
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (j:Job {id: $id})-[:REQUIRES_SKILL]->(allReq:Skill)
        WITH j, count(DISTINCT allReq) AS totalRequired
        MATCH (j)-[:REQUIRES_SKILL]->(req:Skill)<-[:HAS_SKILL]-(p:Person)
        WITH p, totalRequired, count(DISTINCT req) AS matched,
             collect(DISTINCT req.name) AS matchedSkills
        OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
        RETURN p.id AS id, p.name AS name, p.title AS title,
               co.name AS company, matched, totalRequired,
               matchedSkills,
               round(100.0 * matched / totalRequired) AS matchPercent
        ORDER BY matchPercent DESC, matched DESC
        LIMIT 10
        `,
        { id: req.params.id }
      )
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
