import type { Hunter } from "../../domain/types";
import { BottomSheet } from "../BottomSheet";
import { HunterEquipPanel } from "./HunterEquipPanel";

/** Full-height equipment overlay opened from Camp. */
export function HunterEquipSheet({
  hunter,
  onClose,
}: {
  hunter: Hunter;
  onClose: () => void;
}) {
  return (
    <BottomSheet onClose={onClose} className="max-h-[85dvh] overflow-y-auto bg-paper">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
      <p className="mb-3 font-display text-xl">Equipment</p>
      <HunterEquipPanel hunter={hunter} />
    </BottomSheet>
  );
}
