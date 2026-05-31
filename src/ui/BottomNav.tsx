import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", emoji: "🏕️", label: "Camp", end: true },
  { to: "/hunters", emoji: "🧍", label: "Jäger" },
  { to: "/inventory", emoji: "🎒", label: "Lager" },
  { to: "/forge", emoji: "🔨", label: "Forge" },
  { to: "/reference", emoji: "📖", label: "Info" },
];

/** Persistent bottom-tab navigation in the thumb zone. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t-[1.5px] border-line-strong bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? "text-accent" : "text-ink-soft"
                }`
              }
            >
              <span className="text-xl leading-none">{t.emoji}</span>
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
