import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState, EmptyState } from "../components/States.jsx";

export default function Pathway() {
  const [params] = useSearchParams();
  const [personId, setPersonId] = useState(params.get("person") || "");
  const [jobId, setJobId] = useState(params.get("job") || "");

  const { data: people } = useAsync(() => api.people(), []);
  const { data: jobs } = useAsync(() => api.jobs(), []);

  const canQuery = Boolean(personId && jobId);
  const {
    data: pathway,
    loading,
    error,
    reload,
  } = useAsync(
    () => (canQuery ? api.pathway(personId, jobId) : Promise.resolve(null)),
    [personId, jobId]
  );

  return (
    <div>
      <div className="mb-8">
        <div className="eyebrow mb-2">Route finder</div>
        <h1 className="text-3xl font-display">Chart a Career Path</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Pick where someone stands today and the role they're aiming for.
          SkillPath traces the skill gap, the fastest courses to close it,
          and who could mentor the jump.
        </p>
      </div>

      <div className="panel p-5 mb-8 grid sm:grid-cols-2 gap-4">
        <Field label="Starting point">
          <select className="input w-full" value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Select a person…</option>
            {people?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Target role">
          <select className="input w-full" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">Select a job…</option>
            {jobs?.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} — {j.company}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!canQuery && (
        <EmptyState
          title="Pick a person and a role"
          body="The route between them — skills held, skills missing, and how to close the gap — will chart here."
        />
      )}

      {canQuery && loading && <Loading label="Charting the route" />}
      {canQuery && error && <ErrorState message={error.message} onRetry={reload} />}

      {pathway && <PathwayResult data={pathway} />}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wide text-faint mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function PathwayResult({ data }) {
  const { person, job, readiness, heldSkills, gapSkills, recommendedCourses, learningRoutes, mentors } = data;

  return (
    <div className="space-y-10">
      <section className="panel p-6 flex flex-col sm:flex-row items-center gap-8">
        <ReadinessRing percent={readiness} />
        <div className="flex-1 text-center sm:text-left">
          <div className="text-sm text-muted">
            <Link to={`/people/${person.id}`} className="text-ink hover:text-teal">
              {person.name}
            </Link>{" "}
            → <Link to={`/jobs/${job.id}`} className="text-ink hover:text-teal">{job.title}</Link>
          </div>
          <div className="font-display text-2xl mt-1">
            {readiness === 100
              ? "Fully ready — every required skill is already held."
              : `${heldSkills.length} of ${heldSkills.length + gapSkills.length} required skills already held`}
          </div>
          <p className="text-muted text-sm mt-2">{job.company?.name} · {job.level}</p>
        </div>
      </section>

      {gapSkills.length > 0 && (
        <section>
          <h2 className="text-xl font-display mb-1">Skill gap</h2>
          <p className="text-muted text-sm mb-4">
            Required by the job but not yet on {person.name.split(" ")[0]}'s profile, ranked by importance to the role.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {gapSkills.map((s) => (
              <div key={s.id} className="panel px-4 py-3 flex items-center justify-between border-rose/20">
                <div>
                  <div className="text-ink text-sm">{s.name}</div>
                  <div className="text-xs text-faint">{s.category}</div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`w-2 h-2 rounded-full ${n <= s.importance ? "bg-rose" : "bg-panel2 border border-border"}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendedCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-display mb-1">Recommended courses</h2>
          <p className="text-muted text-sm mb-4">Courses that directly teach one or more of the missing skills.</p>
          <div className="space-y-2">
            {recommendedCourses.map((c) => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="panel px-5 py-4 flex items-center justify-between hover:border-gold/40 transition"
              >
                <div>
                  <div className="text-ink text-sm">{c.title}</div>
                  <div className="text-xs text-faint mt-0.5">
                    {c.provider} · {c.durationHours}h
                  </div>
                </div>
                <span className="chip">{c.coversSkillIds.length} gap skill{c.coversSkillIds.length === 1 ? "" : "s"}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {learningRoutes.length > 0 && (
        <section>
          <h2 className="text-xl font-display mb-1">Learning routes</h2>
          <p className="text-muted text-sm mb-4">
            No course directly teaches these yet — here's the shortest chain
            through {person.name.split(" ")[0]}'s existing skills to get there.
          </p>
          <div className="space-y-4">
            {learningRoutes.map(({ skill, route }) => (
              <div key={skill.id} className="panel px-5 py-4">
                {route ? (
                  <div className="flex items-center flex-wrap gap-2">
                    {route.map((step, i) => (
                      <span key={step.id} className="flex items-center gap-2">
                        <span
                          className={`chip ${
                            i === route.length - 1 ? "border-gold/50 text-gold" : ""
                          }`}
                        >
                          {step.name}
                        </span>
                        {i < route.length - 1 && <span className="text-faint">→</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted">
                    No related-skill bridge found to <strong className="text-ink">{skill.name}</strong> yet — it may need to be learned from scratch.
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {mentors.length > 0 && (
        <section>
          <h2 className="text-xl font-display mb-1">Potential mentors</h2>
          <p className="text-muted text-sm mb-4">People who already hold every skill this role requires.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {mentors.map((m) => (
              <Link key={m.id} to={`/people/${m.id}`} className="panel px-4 py-3 flex items-center justify-between hover:border-teal/40 transition">
                <div>
                  <div className="text-ink text-sm">{m.name}</div>
                  <div className="text-xs text-faint">{m.title}</div>
                </div>
                <span className="text-xs text-faint">{m.company}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReadinessRing({ percent }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    const t = setTimeout(() => setDisplay(percent), 50);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#22304A" strokeWidth="10" />
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        stroke="#F2B84B"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (display / 100) * c}
        transform="rotate(-90 56 56)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="56" y="62" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="24" fill="#EDEFF5">
        {percent}%
      </text>
    </svg>
  );
}
