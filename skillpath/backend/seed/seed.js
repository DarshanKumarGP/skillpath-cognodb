import "dotenv/config";
import { initDriver, closeDriver, runQuery } from "../src/db/driver.js";
import { skills, skillRelations, companies, jobs, people, courses } from "./data.js";

async function main() {
  const driver = await initDriver();
  if (!driver) {
    console.error(
      "\nCould not connect to CognoDB. Check backend/.env has COGNODB_URI " +
      "and COGNODB_PASSWORD set correctly, then try again.\n"
    );
    process.exit(1);
  }

  console.log("Wiping existing data...");
  await runQuery("MATCH (n) DETACH DELETE n", {}, { write: true });

  console.log("Creating constraints...");
  const constraints = [
    "CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE",
    "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT job_id IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE",
    "CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT course_id IF NOT EXISTS FOR (c:Course) REQUIRE c.id IS UNIQUE",
  ];
  for (const c of constraints) {
    try {
      await runQuery(c, {}, { write: true });
    } catch (err) {
      console.warn(`  (skipped constraint: ${err.message})`);
    }
  }

  // --- Skills & the skill graph -------------------------------------------
  console.log(`Loading ${skills.length} skills...`);
  await runQuery(
    `UNWIND $rows AS row CREATE (s:Skill {id: row.id, name: row.name, category: row.category})`,
    { rows: skills },
    { write: true }
  );

  console.log(`Loading ${skillRelations.length} skill relations...`);
  await runQuery(
    `
    UNWIND $rows AS row
    MATCH (a:Skill {id: row[0]}), (b:Skill {id: row[1]})
    CREATE (a)-[:RELATED_TO {strength: row[2]}]->(b)
    `,
    { rows: skillRelations },
    { write: true }
  );

  // --- Companies & jobs ----------------------------------------------------
  console.log(`Loading ${companies.length} companies...`);
  await runQuery(
    `UNWIND $rows AS row CREATE (c:Company {id: row.id, name: row.name, industry: row.industry})`,
    { rows: companies },
    { write: true }
  );

  console.log(`Loading ${jobs.length} jobs...`);
  await runQuery(
    `
    UNWIND $rows AS row
    MATCH (co:Company {id: row.company})
    CREATE (j:Job {id: row.id, title: row.title, level: row.level, description: row.description})
    CREATE (j)-[:OFFERED_BY]->(co)
    `,
    { rows: jobs },
    { write: true }
  );
  await runQuery(
    `
    UNWIND $rows AS row
    UNWIND row.skills AS pair
    MATCH (j:Job {id: row.id}), (s:Skill {id: pair[0]})
    CREATE (j)-[:REQUIRES_SKILL {importance: pair[1]}]->(s)
    `,
    { rows: jobs },
    { write: true }
  );

  // --- Courses (must exist before people's COMPLETED edges below) ---------
  console.log(`Loading ${courses.length} courses...`);
  await runQuery(
    `UNWIND $rows AS row CREATE (c:Course {id: row.id, title: row.title, provider: row.provider, url: row.url, duration_hours: row.duration_hours})`,
    { rows: courses },
    { write: true }
  );
  await runQuery(
    `
    UNWIND $rows AS row
    UNWIND row.teaches AS skillId
    MATCH (c:Course {id: row.id}), (s:Skill {id: skillId})
    CREATE (c)-[:TEACHES]->(s)
    `,
    { rows: courses },
    { write: true }
  );

  // --- People ---------------------------------------------------------------
  console.log(`Loading ${people.length} people...`);
  await runQuery(
    `UNWIND $rows AS row CREATE (p:Person {id: row.id, name: row.name, title: row.title, bio: row.bio})`,
    { rows: people },
    { write: true }
  );
  await runQuery(
    `
    UNWIND $rows AS row
    MATCH (p:Person {id: row.id}), (co:Company {id: row.company})
    CREATE (p)-[:WORKS_AT]->(co)
    `,
    { rows: people.filter((p) => p.company) },
    { write: true }
  );
  await runQuery(
    `
    UNWIND $rows AS row
    UNWIND row.skills AS triple
    MATCH (p:Person {id: row.id}), (s:Skill {id: triple[0]})
    CREATE (p)-[:HAS_SKILL {proficiency: triple[1], years: triple[2]}]->(s)
    `,
    { rows: people },
    { write: true }
  );
  await runQuery(
    `
    UNWIND $rows AS row
    UNWIND row.courses AS courseId
    MATCH (p:Person {id: row.id}), (c:Course {id: courseId})
    CREATE (p)-[:COMPLETED]->(c)
    `,
    { rows: people.filter((p) => p.courses?.length) },
    { write: true }
  );

  console.log("\nSeed complete! Loaded:");
  console.log(`  ${skills.length} skills, ${skillRelations.length} skill relations`);
  console.log(`  ${companies.length} companies, ${jobs.length} jobs`);
  console.log(`  ${people.length} people, ${courses.length} courses`);

  await closeDriver();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await closeDriver();
  process.exit(1);
});
