import { Router } from "express";
import { runQuery } from "../db/driver.js";
import { recordsToRows } from "../db/serialize.js";

const router = Router();

// GET /api/people?search=&skill=
router.get("/", async (req, res, next) => {
  try {
    const { search = "", skill = "" } = req.query;
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (p:Person)
        WHERE ($search = "" OR toLower(p.name) CONTAINS toLower($search))
        WITH p
        OPTIONAL MATCH (p)-[:HAS_SKILL]->(s:Skill)
        WHERE $skill = "" OR s.id = $skill
        WITH p, collect(DISTINCT s.id) AS matchedSkillIds
        WHERE $skill = "" OR size(matchedSkillIds) > 0
        OPTIONAL MATCH (p)-[:HAS_SKILL]->(allSkills:Skill)
        OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
        RETURN p.id AS id, p.name AS name, p.title AS title, p.bio AS bio,
               co.name AS company,
               count(DISTINCT allSkills) AS skillCount
        ORDER BY p.name
        `,
        { search, skill }
      )
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/people/:id — full profile with skills, employer, courses taken
router.get("/:id", async (req, res, next) => {
  try {
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (p:Person {id: $id})
        OPTIONAL MATCH (p)-[hs:HAS_SKILL]->(s:Skill)
        OPTIONAL MATCH (p)-[:WORKS_AT]->(co:Company)
        OPTIONAL MATCH (p)-[:COMPLETED]->(c:Course)
        RETURN p,
               co.name AS company,
               collect(DISTINCT {id: s.id, name: s.name, category: s.category,
                                  proficiency: hs.proficiency, years: hs.years}) AS skills,
               collect(DISTINCT {id: c.id, title: c.title, provider: c.provider}) AS courses
        `,
        { id: req.params.id }
      )
    );

    if (!rows.length || !rows[0].p) {
      return res.status(404).json({ error: "Person not found" });
    }

    const row = rows[0];
    res.json({
      ...row.p,
      company: row.company,
      skills: row.skills.filter((s) => s.id),
      courses: row.courses.filter((c) => c.id),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
