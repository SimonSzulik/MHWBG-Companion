import { NavLink } from "react-router-dom";

type Tab = {
  to: string;
  label: string;
  end?: boolean;
  emoji?: string;
  icon?: string;
};

const TABS: Tab[] = [
  { to: "/hunters", emoji: "🧍", label: "Hunter" },
  { to: "/inventory", icon: "/icons/box-tab.png", label: "Box" },
  { to: "/", icon: "/icons/camp-tab.png", label: "Camp", end: true },
  { to: "/forge", icon: "/icons/forge-tab.png", label: "Forge" },
  { to: "/reference", emoji: "📖", label: "Info" },
];

/** Persistent bottom-tab navigation in the thumb zone. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t-[1.5px] border-line-strong bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex">
        {TABS.map((t) => (
          <li key={t.to} className="min-w-0 flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium sm:text-[11px] ${
                  isActive ? "text-accent" : "text-ink-soft"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {t.icon ? (
                    <img
                      src={t.icon}
                      alt=""
                      className={`h-6 w-6 object-contain ${
                        isActive ? "opacity-100" : "opacity-65"
                      }`}
                    />
                  ) : (
                    <span className="text-xl leading-none">{t.emoji}</span>
                  )}
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
