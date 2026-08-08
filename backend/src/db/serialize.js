import neo4j from "neo4j-driver";

// Recursively unwrap Neo4j driver types (Node, Relationship, Integer, Path)
// into plain JSON-friendly values. The driver returns its own wrapper
// classes for nodes/relationships/64-bit ints, which don't serialize
// sensibly with JSON.stringify on their own.
export function toPlain(value) {
  if (value === null || value === undefined) return value;

  if (neo4j.isInt(value)) {
    return value.inSafeRange() ? value.toNumber() : value.toString();
  }

  if (Array.isArray(value)) return value.map(toPlain);

  if (neo4j.isNode(value)) {
    return {
      _id: value.elementId,
      _labels: value.labels,
      ...toPlain(value.properties),
    };
  }

  if (neo4j.isRelationship(value)) {
    return {
      _id: value.elementId,
      _type: value.type,
      _start: value.startNodeElementId,
      _end: value.endNodeElementId,
      ...toPlain(value.properties),
    };
  }

  if (neo4j.isPath(value)) {
    return {
      segments: value.segments.map((seg) => ({
        start: toPlain(seg.start),
        relationship: toPlain(seg.relationship),
        end: toPlain(seg.end),
      })),
      length: value.length,
    };
  }

  if (value instanceof Object && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out;
  }

  return value;
}

// Turn a full array of driver Records into an array of plain row-objects,
// keyed by the RETURN aliases.
export function recordsToRows(records) {
  return records.map((record) => {
    const row = {};
    for (const key of record.keys) {
      row[key] = toPlain(record.get(key));
    }
    return row;
  });
}
