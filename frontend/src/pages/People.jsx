import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState, EmptyState } from "../components/States.jsx";

export default function People() {
  const [search, setSearch] = useState("");
  const { data, loading, error, reload } = useAsync(
    () => api.people({ search }),
    [search]
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Person nodes</div>
          <h1 className="text-3xl font-display">People</h1>
        </div>
        <input
          className="input w-64"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <Loading label="Searching the graph" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState title="No one matches" body="Try a different search term." />
      )}

      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => (
            <Link
              key={p.id}
              to={`/people/${p.id}`}
              className="panel p-5 hover:border-gold/40 transition group"
            >
              <div className="font-display text-lg text-ink group-hover:text-gold transition">
                {p.name}
              </div>
              <div className="text-sm text-muted mt-0.5">{p.title}</div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-faint">{p.company || "Independent"}</span>
                <span className="chip">{p.skillCount} skills</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
