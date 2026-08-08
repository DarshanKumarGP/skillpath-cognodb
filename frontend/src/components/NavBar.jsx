import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/people", label: "People" },
  { to: "/jobs", label: "Jobs" },
  { to: "/skills", label: "Skill Map" },
  { to: "/pathway", label: "Chart a Path" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-void/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <svg width="20" height="20" viewBox="0 0 32 32" className="text-gold">
            <path
              d="M16 3 L18.7 12.4 L28 12.4 L20.6 18.2 L23.3 27.6 L16 21.8 L8.7 27.6 L11.4 18.2 L4 12.4 L13.3 12.4 Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-display text-lg tracking-wide">SkillPath</span>
        </NavLink>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? "text-void bg-gold"
                    : "text-muted hover:text-ink hover:bg-panel2"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
