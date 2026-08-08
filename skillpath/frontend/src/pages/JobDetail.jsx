import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState } from "../components/States.jsx";

export default function JobDetail() {
  const { id } = useParams();
  const { data: job, loading, error, reload } = useAsync(() => api.job(id), [id]);
  const { data: candidates, loading: loadingCandidates } = useAsync(
    () => api.jobCandidates(id),
    [id]
  );

  if (loading) return <Loading label="Loading role" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!job) return null;

  return (
    <div>
      <Link to="/jobs" className="text-sm text-muted hover:text-teal transition">
        ← All roles
      </Link>

      <div className="mt-4 mb-10">
        <div className="eyebrow mb-2">{job.level} · {job.company?.name}</div>
        <h1 className="text-3xl font-display">{job.title}</h1>
        <p className="text-ink/80 mt-4 max-w-2xl leading-relaxed">{job.description}</p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-display mb-4">Required skills</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {job.requiredSkills.map((s) => (
            <div key={s.id} className="panel px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-ink text-sm">{s.name}</div>
                <div className="text-xs text-faint">{s.category}</div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`w-2 h-2 rounded-full ${
                      n <= s.importance ? "bg-gold" : "bg-panel2 border border-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display mb-1">Closest-matching people</h2>
        <p className="text-muted text-sm mb-4">
          Ranked by the share of required skills each person already holds — a
          multi-hop traversal from Job through the skills it requires to
          everyone who has them.
        </p>
        {loadingCandidates && <Loading label="Matching candidates" />}
        {candidates && candidates.length === 0 && (
          <p className="text-muted text-sm">No one in the graph holds any of these skills yet.</p>
        )}
        {candidates && candidates.length > 0 && (
          <div className="space-y-2">
            {candidates.map((c) => (
              <Link
                key={c.id}
                to={`/people/${c.id}`}
                className="panel px-5 py-4 flex items-center justify-between hover:border-teal/40 transition"
              >
                <div>
                  <div className="text-ink">{c.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {c.title} {c.company && `· ${c.company}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-teal font-mono text-sm">{c.matchPercent}%</div>
                  <div className="text-xs text-faint">
                    {c.matched}/{c.totalRequired} skills
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
