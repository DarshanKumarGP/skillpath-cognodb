import { Router } from "express";
import { runQuery } from "../db/driver.js";
import { recordsToRows } from "../db/serialize.js";

const router = Router();

// GET /api/pathway?personId=&jobId=
//
// This is the app's centerpiece: given where someone stands today and a
// job they want, chart the graph route between the two. It combines four
// traversals that would each be their own multi-join SQL query, and one
// (the learning route) that's a recursive query relational engines don't
// do comfortably at all.
router.get("/", async (req, res, next) => {
  try {
    const { personId, jobId } = req.query;
    if (!personId || !jobId) {
      return res.status(400).json({ error: "personId and jobId query params are required" });
    }

    const [person] = recordsToRows(
      await runQuery(`MATCH (p:Person {id: $personId}) RETURN p`, { personId })
    );
    const [job] = recordsToRows(
      await runQuery(
        `MATCH (j:Job {id: $jobId}) OPTIONAL MATCH (j)-[:OFFERED_BY]->(co:Company) RETURN j, co`,
        { jobId }
      )
    );
    if (!person?.p) return res.status(404).json({ error: "Person not found" });
    if (!job?.j) return res.status(404).json({ error: "Job not found" });

    // 1. Skills already held vs. required (2-hop: Person->Skill, Job->Skill)
    const gapRows = recordsToRows(
      await runQuery(
        `
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[:HAS_SKILL]->(known:Skill)
        WITH p, collect(known.id) AS knownIds
        MATCH (j:Job {id: $jobId})-[r:REQUIRES_SKILL]->(req:Skill)
        RETURN req.id AS id, req.name AS name, req.category AS category,
               r.importance AS importance,
               req.id IN knownIds AS alreadyHeld
        ORDER BY r.importance DESC
        `,
        { personId, jobId }
      )
    );
    const gapSkills = gapRows.filter((s) => !s.alreadyHeld);
    const heldSkills = gapRows.filter((s) => s.alreadyHeld);
    const readiness = gapRows.length
      ? Math.round((heldSkills.length / gapRows.length) * 100)
      : 0;

    // 2. Courses that directly teach a gap skill
    const gapIds = gapSkills.map((s) => s.id);
    const courseRows = gapIds.length
      ? recordsToRows(
          await runQuery(
            `
            MATCH (c:Course)-[:TEACHES]->(s:Skill)
            WHERE s.id IN $gapIds
            RETURN c.id AS id, c.title AS title, c.provider AS provider,
                   c.url AS url, c.duration_hours AS durationHours,
                   collect(DISTINCT s.id) AS coversSkillIds
            `,
            { gapIds }
          )
        )
      : [];

    // 3. For any gap skill with no direct course, find the shortest bridge
    // through skills the person already knows — a variable-length
    // traversal over RELATED_TO, capped at 4 hops so it stays cheap on
    // the free tier.
    const coveredIds = new Set(courseRows.flatMap((c) => c.coversSkillIds));
    const uncovered = gapSkills.filter((s) => !coveredIds.has(s.id));
    const learningRoutes = [];
    for (const skill of uncovered) {
      const rows = recordsToRows(
        await runQuery(
          `
          MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(known:Skill)
          MATCH (target:Skill {id: $targetId})
          MATCH path = shortestPath((known)-[:RELATED_TO*1..4]-(target))
          WITH path, length(path) AS hops
          ORDER BY hops ASC
          LIMIT 1
          RETURN [n IN nodes(path) | {id: n.id, name: n.name}] AS steps, hops
          `,
          { personId, targetId: skill.id }
        )
      );
      learningRoutes.push({
        skill,
        route: rows[0]?.steps || null,
      });
    }

    // 4. Potential mentors — people already strong in this job's required
    // skills, excluding the person themselves.
    const mentorRows = recordsToRows(
      await runQuery(
        `
        MATCH (j:Job {id: $jobId})-[:REQUIRES_SKILL]->(allReq:Skill)
        WITH j, count(DISTINCT allReq) AS total
        MATCH (j)-[:REQUIRES_SKILL]->(req:Skill)<-[:HAS_SKILL]-(mentor:Person)
        WHERE mentor.id <> $personId
        WITH mentor, total, count(DISTINCT req) AS matched
        WHERE matched = total
        OPTIONAL MATCH (mentor)-[:WORKS_AT]->(co:Company)
        RETURN mentor.id AS id, mentor.name AS name, mentor.title AS title,
               co.name AS company
        LIMIT 5
        `,
        { personId, jobId }
      )
    );

    res.json({
      person: person.p,
      job: { ...job.j, company: job.co },
      readiness,
      heldSkills,
      gapSkills,
      recommendedCourses: courseRows,
      learningRoutes,
      mentors: mentorRows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
