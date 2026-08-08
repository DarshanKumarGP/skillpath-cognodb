import { Router } from "express";
import { runQuery } from "../db/driver.js";
import { recordsToRows } from "../db/serialize.js";

const router = Router();

// GET /api/skills
router.get("/", async (req, res, next) => {
  try {
    const rows = recordsToRows(
      await runQuery(`
        MATCH (s:Skill)
        OPTIONAL MATCH (s)<-[:HAS_SKILL]-(p:Person)
        OPTIONAL MATCH (s)<-[:REQUIRES_SKILL]-(j:Job)
        RETURN s.id AS id, s.name AS name, s.category AS category,
               count(DISTINCT p) AS peopleCount, count(DISTINCT j) AS jobCount
        ORDER BY s.category, s.name
      `)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/graph — the full skill constellation: every Skill node
// plus every RELATED_TO edge, for the force-directed visualization.
router.get("/graph", async (req, res, next) => {
  try {
    const nodeRows = recordsToRows(
      await runQuery(`
        MATCH (s:Skill)
        OPTIONAL MATCH (s)<-[:REQUIRES_SKILL]-(j:Job)
        RETURN s.id AS id, s.name AS name, s.category AS category,
               count(DISTINCT j) AS demand
      `)
    );
    const edgeRows = recordsToRows(
      await runQuery(`
        MATCH (a:Skill)-[r:RELATED_TO]->(b:Skill)
        RETURN a.id AS source, b.id AS target, r.strength AS strength
      `)
    );
    res.json({ nodes: nodeRows, edges: edgeRows });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/:id — detail: who has it, which jobs need it, which
// courses teach it, and its direct neighbors in the skill graph.
router.get("/:id", async (req, res, next) => {
  try {
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (s:Skill {id: $id})
        OPTIONAL MATCH (s)<-[hs:HAS_SKILL]-(p:Person)
        OPTIONAL MATCH (s)<-[req:REQUIRES_SKILL]-(j:Job)
        OPTIONAL MATCH (s)<-[:TEACHES]-(c:Course)
        OPTIONAL MATCH (s)-[:RELATED_TO]-(rel:Skill)
        RETURN s,
               collect(DISTINCT {id: p.id, name: p.name, proficiency: hs.proficiency}) AS people,
               collect(DISTINCT {id: j.id, title: j.title, importance: req.importance}) AS jobs,
               collect(DISTINCT {id: c.id, title: c.title, provider: c.provider}) AS courses,
               collect(DISTINCT {id: rel.id, name: rel.name}) AS related
        `,
        { id: req.params.id }
      )
    );

    if (!rows.length || !rows[0].s) {
      return res.status(404).json({ error: "Skill not found" });
    }
    const row = rows[0];
    res.json({
      ...row.s,
      people: row.people.filter((p) => p.id),
      jobs: row.jobs.filter((j) => j.id),
      courses: row.courses.filter((c) => c.id),
      related: row.related.filter((r) => r.id),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/path?from=&to= — shortest chain of related skills
// connecting two skills. A variable-length pattern match; the relational
// equivalent is a recursive CTE that most teams avoid writing by hand.
router.get("/path/between", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "from and to query params are required" });
    }
    const rows = recordsToRows(
      await runQuery(
        `
        MATCH (a:Skill {id: $from}), (b:Skill {id: $to})
        MATCH path = shortestPath((a)-[:RELATED_TO*1..6]-(b))
        RETURN [n IN nodes(path) | {id: n.id, name: n.name, category: n.category}] AS steps,
               length(path) AS hops
        `,
        { from, to }
      )
    );
    if (!rows.length) {
      return res.json({ steps: [], hops: null, connected: false });
    }
    res.json({ ...rows[0], connected: true });
  } catch (err) {
    next(err);
  }
});

export default router;
