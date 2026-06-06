/**
 * Segmented control: a pill strip of mutually-exclusive tabs.
 * Used for the Forge weapon/armour switch, the Box categories and the
 * login/signup toggle.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex rounded-xl border-[1.5px] border-line-strong bg-paper-2 p-1 text-sm font-semibold ${className}`}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`flex-1 rounded-lg px-3 py-2 transition ${
            value === t.value ? "bg-accent text-white" : "text-ink-soft"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
