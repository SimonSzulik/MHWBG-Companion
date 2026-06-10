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
        <p className="min-w-0 flex-1 truncate text-xs uppercase tracking-wide text-ink-soft">
          Calendar · {maxDay} days
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
          const showDayNumber = !isDowntime && !questEntry;

          return (
            <span
              key={d}
              title={
                isDowntime
                  ? `Day ${d} · Downtime`
                  : questEntry
                    ? `Day ${d} · ${questEntry.result === "success" ? "Success" : "Failure"}`
                    : `Day ${d}`
              }
              className={`relative flex min-h-[26px] items-center justify-center overflow-hidden rounded-sm border p-px ${
                isCurrent
                  ? "border-accent bg-accent"
                  : isPast
                    ? "border-line bg-paper-2"
                    : "border-line bg-paper"
              }`}
            >
              {showDayNumber && (
                <span
                  className={`absolute right-0.5 top-0 text-[8px] font-semibold leading-none ${
                    isCurrent ? "text-white/90" : "text-ink-soft"
                  }`}
                >
                  {d}
                </span>
              )}
              {isDowntime ? (
                <span className="text-sm">🏠</span>
              ) : questEntry ? (
                <img
                  src={iconUrl(questEntry.monsterId)}
                  alt=""
                  title={`Day ${d} · ${questEntry.result === "success" ? "Success" : "Failure"}`}
                  className={`h-5 w-5 min-h-[1.25rem] min-w-[1.25rem] object-contain ${
                    failed ? "opacity-50 grayscale" : ""
                  }`}
                />
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
