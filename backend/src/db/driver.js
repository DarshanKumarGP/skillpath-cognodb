import neo4j from "neo4j-driver";

// CognoDB speaks openCypher over Bolt and is wire-compatible with the
// official Neo4j drivers — no custom SDK needed, just point the standard
// driver at the bolt+s:// URI CognoDB Cloud gives you.
const URI = process.env.COGNODB_URI;
const USER = process.env.COGNODB_USER || "cognodb";
const PASSWORD = process.env.COGNODB_PASSWORD;

let driver = null;
let connectionError = null;

export async function initDriver() {
  if (!URI || !PASSWORD) {
    connectionError =
      "Missing COGNODB_URI or COGNODB_PASSWORD environment variables. " +
      "Copy backend/.env.example to backend/.env and fill in the values " +
      "from your CognoDB Cloud console.";
    console.error("[db] " + connectionError);
    return null;
  }

  try {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
      maxConnectionPoolSize: 20,
      connectionAcquisitionTimeout: 10_000,
    });
    await driver.verifyConnectivity();
    connectionError = null;
    console.log(`[db] Connected to CognoDB at ${URI}`);
    return driver;
  } catch (err) {
    connectionError = err.message || String(err);
    console.error("[db] Failed to connect to CognoDB:", connectionError);
    driver = null;
    return null;
  }
}

export function getDriver() {
  return driver;
}

export function getConnectionError() {
  return connectionError;
}

/**
 * Run a read/write Cypher query with parameters, inside a managed session.
 * Throws a normalized error the route layer can turn into a clean HTTP response
 * rather than leaking driver internals to the client.
 */
export async function runQuery(cypher, params = {}, { write = false } = {}) {
  if (!driver) {
    const err = new Error(
      connectionError || "Database is not connected."
    );
    err.code = "DB_UNAVAILABLE";
    throw err;
  }

  const session = driver.session({
    defaultAccessMode: write ? neo4j.session.WRITE : neo4j.session.READ,
  });

  try {
    const result = await session.run(cypher, params);
    return result.records;
  } catch (err) {
    err.code = err.code || "DB_QUERY_FAILED";
    throw err;
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  if (driver) await driver.close();
}
