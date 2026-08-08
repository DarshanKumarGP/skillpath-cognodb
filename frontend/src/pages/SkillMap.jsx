import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState } from "../components/States.jsx";
import ConstellationGraph, { CATEGORY_COLORS } from "../components/ConstellationGraph.jsx";

export default function SkillMap() {
  const { data: graph, loading, error, reload } = useAsync(() => api.skillGraph(), []);
  const [selectedId, setSelectedId] = useState(null);
  const { data: detail } = useAsync(
    () => (selectedId ? api.skill(selectedId) : Promise.resolve(null)),
    [selectedId]
  );

  return (
    <div>
      <div className="mb-8">
        <div className="eyebrow mb-2">The skill graph</div>
        <h1 className="text-3xl font-display">Skill Map</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Every skill in the graph, connected to the skills it's commonly
          learned alongside. Star size reflects how many open jobs require
          it. Click a star for detail.
        </p>
      </div>

      {loading && <Loading label="Charting the constellation" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}

      {graph && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="panel p-4">
            <ConstellationGraph
              nodes={graph.nodes}
              edges={graph.edges}
              onSelect={(n) => setSelectedId(n.id)}
              selectedId={selectedId}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5 text-xs text-faint">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {cat}
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5 h-fit sticky top-24">
            {!detail && (
              <p className="text-muted text-sm">Select a skill from the map to see who has it, which jobs need it, and what teaches it.</p>
            )}
            {detail && (
              <div>
                <div className="eyebrow mb-1">{detail.category}</div>
                <h2 className="font-display text-xl mb-4">{detail.name}</h2>

                <DetailGroup title="Held by" empty="No one yet">
                  {detail.people.map((p) => (
                    <Link key={p.id} to={`/people/${p.id}`} className="block text-sm text-ink hover:text-teal">
                      {p.name} <span className="text-faint text-xs">({p.proficiency})</span>
                    </Link>
                  ))}
                </DetailGroup>

                <DetailGroup title="Required by" empty="No jobs yet">
                  {detail.jobs.map((j) => (
                    <Link key={j.id} to={`/jobs/${j.id}`} className="block text-sm text-ink hover:text-teal">
                      {j.title}
                    </Link>
                  ))}
                </DetailGroup>

                <DetailGroup title="Taught by" empty="No courses yet">
                  {detail.courses.map((c) => (
                    <div key={c.id} className="text-sm text-ink">
                      {c.title} <span className="text-faint text-xs">· {c.provider}</span>
                    </div>
                  ))}
                </DetailGroup>

                <DetailGroup title="Related skills" empty="No direct links">
                  {detail.related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className="chip hover:border-gold/50 hover:text-gold"
                    >
                      {r.name}
                    </button>
                  ))}
                </DetailGroup>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailGroup({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="mb-5">
      <div className="text-xs uppercase tracking-wide text-faint mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-faint">{empty}</div>
      ) : title === "Related skills" ? (
        <div className="flex flex-wrap gap-1.5">{items}</div>
      ) : (
        <div className="space-y-1.5">{items}</div>
      )}
    </div>
  );
}
