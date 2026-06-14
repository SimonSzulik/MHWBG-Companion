import { Button } from "../Button";
import { LootMaterialPreviewList } from "../LootMaterialRow";

/** Success overlay after accepting a party trade. */
export function TradeCompleteDialog({
  partnerName,
  received,
  gave,
  onClose,
}: {
  partnerName: string;
  received: Record<string, number>;
  gave: Record<string, number>;
  onClose: () => void;
}) {
  const hasReceived = Object.values(received).some((q) => q > 0);
  const hasGave = Object.values(gave).some((q) => q > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-4 sm:items-center">
      <div className="trade-complete-card paper-card w-full max-w-sm border-[1.5px] border-ok p-5 shadow-lg ring-2 ring-ok/30">
        <div className="trade-complete-badge mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok text-2xl font-bold text-white">
          ✓
        </div>
        <p className="mt-3 text-center font-display text-xl">Trade complete</p>
        <p className="mt-1 text-center text-sm text-ink-soft">
          Swapped items with {partnerName}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {hasReceived && (
            <div className="rounded-lg border border-line-strong bg-paper-2 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-ok">
                You received
              </p>
              <LootMaterialPreviewList quantities={received} readOnly compact />
            </div>
          )}
          {hasGave && (
            <div className="rounded-lg border border-line-strong bg-paper-2 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                You gave
              </p>
              <LootMaterialPreviewList quantities={gave} readOnly compact />
            </div>
          )}
        </div>

        <Button onClick={onClose} className="mt-5 w-full py-3 text-sm font-bold">
          OK
        </Button>
      </div>
    </div>
  );
}
