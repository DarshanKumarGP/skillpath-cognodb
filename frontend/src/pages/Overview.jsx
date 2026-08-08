import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState } from "../components/States.jsx";
import { CATEGORY_COLORS } from "../components/ConstellationGraph.jsx";

export default function Overview() {
  const { data, loading, error, reload } = useAsync(() => api.stats(), []);

  return (
    <div>
      <section className="mb-14">
        <div className="eyebrow mb-3">Graph-backed career navigator</div>
        <h1 className="text-4xl md:text-5xl font-display font-medium leading-tight max-w-2xl">
          Chart the route from who you are to who you're becoming.
        </h1>
        <p className="text-muted max-w-xl mt-4 leading-relaxed">
          SkillPath maps people, skills, jobs, and courses as one connected
          graph, then traces the shortest path between where someone stands
          today and the role they want next.
        </p>
        <div className="flex flex-wrap gap-3 mt-7">
          <Link to="/pathway" className="btn-primary">
            Chart a career path
          </Link>
          <Link to="/skills" className="btn-secondary">
            Explore the skill map
          </Link>
        </div>
      </section>

      {loading && <Loading label="Reading the graph" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}

      {data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-14">
            <Stat label="People" value={data.counts.people} />
            <Stat label="Jobs" value={data.counts.jobs} />
            <Stat label="Skills" value={data.counts.skills} />
            <Stat label="Courses" value={data.counts.courses} />
            <Stat label="Companies" value={data.counts.companies} />
          </section>

          <section>
            <h2 className="text-xl font-display mb-1">Most in-demand skills</h2>
            <p className="text-muted text-sm mb-6">
              Ranked by how many open jobs require them — a two-hop traversal
              from Skill through REQUIRES_SKILL to Job.
            </p>
            <div className="panel p-6 space-y-3">
              {data.topSkills.map((s) => {
                const max = data.topSkills[0]?.demand || 1;
                return (
                  <div key={s.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0 text-sm text-ink truncate">{s.name}</div>
                    <div className="flex-1 h-2 bg-panel2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.demand / max) * 100}%`,
                          background: CATEGORY_COLORS[s.category] || "#F2B84B",
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-xs font-mono text-faint">
                      {s.demand} job{s.demand === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel p-5">
      <div className="text-3xl font-display text-gold">{value ?? "–"}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}
