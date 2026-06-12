import type { ReactNode } from "react";
import { Button } from "./Button";
import { clamp } from "../lib/math";

function CompactDie({ face }: { face: number }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-line-strong bg-card font-display text-xl shadow-sm">
      {face}
    </div>
  );
}

/** Compact two-dice block with reroll and manual face entry. */
export function DiceRollCard({
  dice,
  onDiceChange,
  onReroll,
  footer,
}: {
  dice: [number, number];
  onDiceChange: (next: [number, number]) => void;
  onReroll: () => void;
  footer?: ReactNode;
}) {
  const [x, y] = dice;
  const sum = x + y;

  const setDieFace = (index: 0 | 1, raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    const nextFace = Number.isNaN(parsed) ? 1 : clamp(parsed, 1, 6);
    onDiceChange(index === 0 ? [nextFace, y] : [x, nextFace]);
  };

  return (
    <div className="paper-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompactDie face={x} />
          <CompactDie face={y} />
          <span className="text-sm text-ink-soft">
            Sum: <strong className="text-ink">{sum}</strong>
          </span>
        </div>
        <Button
          variant="secondary"
          onClick={onReroll}
          className="shrink-0 bg-paper-2 px-3 py-2 text-sm font-semibold"
        >
          Reroll
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Die 1
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={6}
            step={1}
            value={x}
            onChange={(e) => setDieFace(0, e.target.value)}
            onBlur={(e) => setDieFace(0, e.target.value)}
            className="rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-base font-semibold text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Die 2
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={6}
            step={1}
            value={y}
            onChange={(e) => setDieFace(1, e.target.value)}
            onBlur={(e) => setDieFace(1, e.target.value)}
            className="rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-base font-semibold text-ink"
          />
        </label>
      </div>

      {footer}
    </div>
  );
}
