import type { ReactNode } from "react";
import type { CalendarDayEntry } from "../domain/types";
import { iconUrl } from "../domain/icons";

/**
 * Campaign day grid: current day, past days, and per-day quest/downtime marks.
 * `cols` controls the grid width (10 = wide strip, 5 = taller square block).
 * Fills its container's height, so the caller can size it via the parent card.
 * `right` renders an optional control in the header (e.g. a potion counter).
 */
export function CampaignCalendar({
  day,
  maxDay,
  dayLog,
  cols = 10,
  right,
}: {
  day: number;
  maxDay: number;
  dayLog: Record<number, CalendarDayEntry>;
  cols?: number;
  right?: ReactNode;
}) {
  const rows = Math.ceil(maxDay / cols);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-ink-soft">
          Kalender · {maxDay} Tage
        </p>
        {right}
      </div>
      <div
        className="grid flex-1 gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: "1fr",
        }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const d = i + 1;
          if (d > maxDay) return <span key={d} />;
          const isCurrent = d === day;
          const isPast = d < day;
          const entry = dayLog[d];
          const isDowntime = entry?.kind === "downtime";
          const questEntry = entry?.kind === "quest" ? entry : null;
          const failed = questEntry?.result === "failure";

          return (
            <span
              key={d}
              title={
                isDowntime
                  ? `Tag ${d} · Downtime`
                  : questEntry
                    ? `Tag ${d} · ${questEntry.result === "success" ? "Erfolg" : "Fehlschlag"}`
                    : `Tag ${d}`
              }
              className={`relative flex min-h-[26px] flex-col items-center justify-center rounded-sm border p-0.5 ${
                isCurrent
                  ? "border-accent bg-accent"
                  : isPast
                    ? "border-line bg-paper-2"
                    : "border-line bg-paper"
              }`}
            >
              {isDowntime ? (
                <span className="text-sm">🏠</span>
              ) : questEntry ? (
                <span
                  className={`flex flex-col items-center gap-0 ${
                    failed ? "opacity-50 grayscale" : ""
                  }`}
                >
                  <img
                    src={iconUrl(questEntry.monsterId)}
                    alt=""
                    className="h-3.5 w-3.5 object-contain"
                  />
                  <img
                    src={iconUrl(questEntry.stars)}
                    alt=""
                    className="h-2.5 w-2.5 object-contain"
                  />
                </span>
              ) : isCurrent ? (
                <span className="text-[9px] font-semibold text-white">{d}</span>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
