import { Screen } from "../ui/Screen";

/** Placeholder for future downtime activities. */
export function DowntimeScreen() {
  return (
    <Screen title="Downtime" subtitle="Demnächst">
      <div className="paper-card p-6 text-center">
        <p className="text-4xl">🏠</p>
        <p className="mt-3 font-semibold">Downtime-Aktivitäten</p>
        <p className="mt-2 text-sm text-ink-soft">
          Dieser Bereich wird in einer späteren Version ergänzt.
        </p>
      </div>
    </Screen>
  );
}
