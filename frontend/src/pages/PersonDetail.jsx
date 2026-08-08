import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { Loading, ErrorState } from "../components/States.jsx";

const PROFICIENCY_ORDER = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function PersonDetail() {
  const { id } = useParams();
  const { data: person, loading, error, reload } = useAsync(() => api.person(id), [id]);

  if (loading) return <Loading label="Loading profile" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!person) return null;

  return (
    <div>
      <Link to="/people" className="text-sm text-muted hover:text-teal transition">
        ← All people
      </Link>

      <div className="mt-4 mb-10">
        <h1 className="text-3xl font-display">{person.name}</h1>
        <p className="text-muted mt-1">
          {person.title} {person.company ? `· ${person.company}` : "· Independent"}
        </p>
        {person.bio && <p className="text-ink/80 mt-4 max-w-2xl leading-relaxed">{person.bio}</p>}
        <Link
          to={`/pathway?person=${person.id}`}
          className="btn-primary mt-6 inline-flex"
        >
          Chart a path from here
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-display mb-4">Skills</h2>
        {person.skills.length === 0 ? (
          <p className="text-muted text-sm">No skills recorded yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {person.skills
              .slice()
              .sort(
                (a, b) =>
                  PROFICIENCY_ORDER.indexOf(b.proficiency) -
                  PROFICIENCY_ORDER.indexOf(a.proficiency)
              )
              .map((s) => (
                <div key={s.id} className="panel px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-ink text-sm">{s.name}</div>
                    <div className="text-xs text-faint">{s.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-teal">{s.proficiency}</div>
                    <div className="text-xs text-faint">
                      {s.years} yr{s.years === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {person.courses.length > 0 && (
        <section>
          <h2 className="text-xl font-display mb-4">Completed courses</h2>
          <div className="space-y-2">
            {person.courses.map((c) => (
              <div key={c.id} className="panel px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-ink">{c.title}</span>
                <span className="text-xs text-faint">{c.provider}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
