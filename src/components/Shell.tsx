import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

const NAV = [
  { to: "/wordle", label: "wordle" },
  { to: "/idle", label: "idle" },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 mx-auto max-w-4xl px-6">
      <header className="flex items-center justify-between py-7">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="display text-lg">gatrion</span>
          <span className="mono text-[10px] text-muted">/games</span>
        </Link>
        <nav className="mono flex items-center gap-5 text-[11px] text-muted">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "text-ink" : "transition hover:text-ink"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {children}

      <footer className="flex flex-col gap-2 border-t border-line py-6 text-[11px] text-muted/70 sm:flex-row sm:items-center sm:justify-between">
        <span className="mono">© {new Date().getFullYear()} gatrion games</span>
        <span className="mono">vite · react · typescript</span>
      </footer>
    </div>
  );
}
