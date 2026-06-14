import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { clamp } from "../lib/math";

function CompactDie({ face }: { face: number }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-line-strong bg-card font-display text-xl shadow-sm">
      {face}
    </div>
  );
}

function parseDieFace(raw: string): number | null {
  if (raw.trim() === "") return null;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return null;
  return clamp(parsed, 1, 6);
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
  footer?:
    | ReactNode
    | ((ctx: {
        dice: [number, number];
        commit: () => [number, number];
      }) => ReactNode);
}) {
  const [x, y] = dice;
  const sum = x + y;
  const diceRef = useRef(dice);
  diceRef.current = dice;
  const draftRef = useRef<[string, string]>([String(x), String(y)]);
  const [draft, setDraft] = useState<[string, string]>([String(x), String(y)]);
  draftRef.current = draft;

  useEffect(() => {
    setDraft([String(x), String(y)]);
  }, [x, y]);

  const commitAllDrafts = (): [number, number] => {
    const left = parseDieFace(draftRef.current[0]) ?? 1;
    const right = parseDieFace(draftRef.current[1]) ?? 1;
    const next: [number, number] = [left, right];
    onDiceChange(next);
    setDraft([String(left), String(right)]);
    return next;
  };

  const updateDraft = (index: 0 | 1, raw: string) => {
    setDraft((prev) => {
      const next: [string, string] = [prev[0], prev[1]];
      next[index] = raw;
      return next;
    });

    const face = parseDieFace(raw);
    if (face == null) return;
    const [left, right] = diceRef.current;
    onDiceChange(index === 0 ? [face, right] : [left, face]);
  };

  const commitDraft = (index: 0 | 1) => {
    const face = parseDieFace(draft[index]) ?? 1;
    const [left, right] = diceRef.current;
    onDiceChange(index === 0 ? [face, right] : [left, face]);
    setDraft((prev) => {
      const next: [string, string] = [prev[0], prev[1]];
      next[index] = String(face);
      return next;
    });
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
            value={draft[0]}
            onChange={(e) => updateDraft(0, e.target.value)}
            onBlur={() => commitDraft(0)}
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
            value={draft[1]}
            onChange={(e) => updateDraft(1, e.target.value)}
            onBlur={() => commitDraft(1)}
            className="rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-base font-semibold text-ink"
          />
        </label>
      </div>

      {typeof footer === "function"
        ? footer({ dice, commit: commitAllDrafts })
        : footer}
    </div>
  );
}
