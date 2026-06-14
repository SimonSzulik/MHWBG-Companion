import { buildQuestSummaryFromReport } from "../domain/questRewards";
import { questById } from "../domain/quests";
import type { CalendarDayEntry, Hunter } from "../domain/types";
import { iconUrl } from "../domain/icons";
import { BottomSheet } from "./BottomSheet";
import { QuestSummaryContent } from "./quest/QuestSummaryContent";

/** Calendar day quest report (loot history). */
export function QuestDayReportSheet({
  day,
  entry,
  hunters,
  onClose,
}: {
  day: number;
  entry: Extract<CalendarDayEntry, { kind: "quest" }>;
  hunters: Hunter[];
  onClose: () => void;
}) {
  const quest = entry.report ? questById(entry.report.questId) : undefined;
  const hunterNames = hunters.map((h) => ({ id: h.id, name: h.name }));
  const summary = entry.report
    ? buildQuestSummaryFromReport(entry.report, hunterNames, entry.result)
    : null;

  return (
    <BottomSheet onClose={onClose} className="max-h-[85vh] overflow-y-auto bg-paper">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
      <p className="font-display text-xl leading-tight">
        Day {day}
        {quest ? ` · ${quest.name}` : ""}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <img
          src={iconUrl(entry.monsterId)}
          alt=""
          className="h-8 w-8 object-contain"
        />
        <p className="text-sm text-ink-soft">
          {entry.result === "success" ? "Success" : "Failure"}
          {entry.handler ? " · Handler" : ""}
        </p>
      </div>

      {summary ? (
        <div className="mt-4">
          <QuestSummaryContent summary={summary} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          No detailed loot recorded for this day.
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-lg border-[1.5px] border-line-strong bg-paper-2 py-2 text-sm font-semibold"
      >
        Close
      </button>
    </BottomSheet>
  );
}
