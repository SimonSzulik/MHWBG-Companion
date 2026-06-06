import { useState } from "react";
import { Link } from "react-router-dom";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { otherHunters } from "../lib/hunter";
import { Button } from "./Button";
import { HunterSummaryCard } from "./HunterSummaryCard";
import type { CalendarDayEntry } from "../domain/types";
import { iconUrl } from "../domain/icons";

/** Campaign status: day, potions, calendar, quest/downtime, teammates. */
export function CampaignPanel() {
  const campaign = useCampaign((s) => s.campaign);
  const adjustItem = useCampaign((s) => s.adjustItem);
  const userId = useAuth((s) => s.userId);
  const [confirmPotion, setConfirmPotion] = useState(false);
  if (!campaign) return null;

  const potions = campaign.items["potion"] ?? 0;
  const teammates = otherHunters(campaign, userId);

  const usePotion = () => {
    adjustItem("potion", -1);
    setConfirmPotion(false);
  };

  return (
    <>
      <div className="paper-card mt-3 px-4 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Aktueller Tag
            </p>
            <p className="font-display text-4xl leading-none">{campaign.day}</p>
          </div>
          <button
            type="button"
            disabled={potions <= 0}
            onClick={() => setConfirmPotion(true)}
            className="flex flex-col items-end rounded-lg px-2 py-1 active:translate-y-px disabled:opacity-40"
          >
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Tränke
            </p>
            <p className="font-display text-4xl leading-none">{potions}</p>
          </button>
        </div>

        <CampaignCalendar
          day={campaign.day}
          maxDay={campaign.maxDay}
          dayLog={campaign.dayLog ?? {}}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/campaign/quests"
          className="paper-card flex flex-col items-center gap-2 px-4 py-6 text-center active:translate-y-px"
        >
          <span className="text-3xl">⚔</span>
          <span className="font-semibold">Quest</span>
        </Link>
        <Link
          to="/campaign/downtime"
          className="paper-card flex flex-col items-center gap-2 px-4 py-6 text-center active:translate-y-px"
        >
          <span className="text-3xl">🏠</span>
          <span className="font-semibold">Downtime</span>
        </Link>
      </div>

      {teammates.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 px-1 text-xs uppercase tracking-wide text-accent">
            Mitjäger · {teammates.length}
          </p>
          <div className="flex flex-col gap-2">
            {teammates.map((hunter) => (
              <HunterSummaryCard key={hunter.id} hunter={hunter} />
            ))}
          </div>
        </div>
      )}

      {confirmPotion && (
        <ConfirmDialog
          title="Trank verbrauchen?"
          message="Einen Trank aus dem Vorrat entfernen?"
          onConfirm={usePotion}
          onCancel={() => setConfirmPotion(false)}
        />
      )}
    </>
  );
}

function CampaignCalendar({
  day,
  maxDay,
  dayLog,
}: {
  day: number;
  maxDay: number;
  dayLog: Record<number, CalendarDayEntry>;
}) {
  const cols = 10;
  const rows = Math.ceil(maxDay / cols);

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">
        Kalender · {maxDay} Tage
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const d = i + 1;
          if (d > maxDay) {
            return <span key={d} className="aspect-square" />;
          }
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
              className={`relative flex min-h-[28px] flex-col items-center justify-center rounded-sm border p-0.5 ${
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

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="paper-card w-full max-w-sm p-5">
        <p className="font-display text-xl">{title}</p>
        <p className="mt-2 text-sm text-ink-soft">{message}</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            rounded="lg"
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-semibold"
          >
            Abbrechen
          </Button>
          <Button
            rounded="lg"
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-semibold"
          >
            Ja
          </Button>
        </div>
      </div>
    </div>
  );
}
