/** A compact −/value/+ stepper for adjusting counts with big tap targets. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => {
    const next = value + 1;
    onChange(max != null ? Math.min(max, next) : next);
  };
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={dec}
        aria-label="weniger"
        className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-line-strong bg-paper-2 text-lg font-bold text-ink active:translate-y-px disabled:opacity-40"
        disabled={value <= min}
      >
        −
      </button>
      <span className="w-7 text-center text-lg font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        aria-label="mehr"
        className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-line-strong bg-accent text-lg font-bold text-white active:translate-y-px disabled:opacity-40"
        disabled={max != null && value >= max}
      >
        +
      </button>
    </div>
  );
}
