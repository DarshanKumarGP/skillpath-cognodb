import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState, EmptyState } from "../components/States.jsx";

const LEVEL_COLOR = {
  Junior: "text-teal",
  Mid: "text-gold",
  Senior: "text-rose",
};

export default function Jobs() {
  const [search, setSearch] = useState("");
  const { data, loading, error, reload } = useAsync(() => api.jobs({ search }), [search]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Job nodes</div>
          <h1 className="text-3xl font-display">Open Roles</h1>
        </div>
        <input
          className="input w-64"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <Loading label="Scanning listings" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No roles match" body="Try a different search." />}

      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((j) => (
            <Link key={j.id} to={`/jobs/${j.id}`} className="panel p-5 hover:border-gold/40 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="font-display text-lg text-ink group-hover:text-gold transition">
                  {j.title}
                </div>
                <span className={`text-xs font-mono ${LEVEL_COLOR[j.level] || "text-muted"}`}>
                  {j.level}
                </span>
              </div>
              <div className="text-sm text-muted mt-0.5">
                {j.company} {j.industry && `· ${j.industry}`}
              </div>
              <p className="text-sm text-ink/70 mt-3 line-clamp-2">{j.description}</p>
              <div className="mt-4">
                <span className="chip">{j.skillCount} required skills</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
