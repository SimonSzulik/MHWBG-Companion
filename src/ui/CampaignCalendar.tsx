import type { ReactNode } from "react";
import { useState } from "react";
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
          return (
            <CalendarDay
              key={d}
              day={d}
              isCurrent={d === day}
              isPast={d < day}
              entry={dayLog[d]}
            />
          );
        })}
      </div>
    </div>
  );
}

function CalendarDay({
  day,
  isCurrent,
  isPast,
  entry,
}: {
  day: number;
  isCurrent: boolean;
  isPast: boolean;
  entry?: CalendarDayEntry;
}) {
  // Track failed icon loads so a missing asset falls back to the day number
  // instead of leaving an empty cell.
  const [iconFailed, setIconFailed] = useState(false);

  const isDowntime = entry?.kind === "downtime";
  const questEntry = entry?.kind === "quest" ? entry : null;
  const failed = questEntry?.result === "failure";

  const title = isDowntime
    ? `Day ${day} · Downtime`
    : questEntry
      ? `Day ${day} · ${questEntry.result === "success" ? "Success" : "Failure"}`
      : `Day ${day}`;

  return (
    <span
      title={title}
      className={`relative flex min-h-[26px] items-center justify-center overflow-hidden rounded-sm border p-px ${
        isCurrent
          ? "border-accent bg-accent"
          : isPast
            ? "border-line bg-paper-2"
            : "border-line bg-paper"
      }`}
    >
      {/* Day number always present so each day stays trackable. */}
      <span
        className={`absolute right-0.5 top-0 text-[8px] font-semibold leading-none ${
          isCurrent ? "text-white/90" : "text-ink-soft"
        }`}
      >
        {day}
      </span>

      {isDowntime ? (
        <span className="text-sm leading-none">🏠</span>
      ) : questEntry && !iconFailed ? (
        <img
          src={iconUrl(questEntry.monsterId)}
          alt=""
          onError={() => setIconFailed(true)}
          className={`h-5 w-5 object-contain ${
            failed ? "opacity-50 grayscale" : ""
          }`}
        />
      ) : null}
    </span>
  );
}
