import { useState } from "react";
import { Link } from "react-router-dom";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { otherHunters } from "../lib/hunter";
import { HunterSummaryCard } from "../ui/HunterSummaryCard";

/** Campaign hub: day tracker, potion use, calendar, quest/downtime entry. */
export function CampaignScreen() {
  const campaign = useCampaign((s) => s.campaign);
  const adjustItem = useCampaign((s) => s.adjustItem);
  const userId = useAuth((s) => s.userId);
  const [confirmPotion, setConfirmPotion] = useState(false);
  if (!campaign) return null;

  const potions = campaign.items["potion"] ?? 0;
  const teammates = otherHunters(campaign, userId);

  // #region agent log
  fetch("http://127.0.0.1:7881/ingest/a7cdc541-ed7c-4afe-87a4-662a27c5f95a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "5a8220",
    },
    body: JSON.stringify({
      sessionId: "5a8220",
      runId: "post-fix",
      hypothesisId: "UI",
      location: "CampaignScreen.tsx:render",
      message: "campaign teammate list",
      data: {
        authUserId: userId,
        totalHunters: campaign.hunters.length,
        teammateIds: teammates.map((h) => ({ id: h.id, name: h.name })),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const usePotion = () => {
    adjustItem("potion", -1);
    setConfirmPotion(false);
  };

  return (
    <Screen title="Kampagne" subtitle={campaign.name}>
      <div className="paper-card px-4 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">Aktueller Tag</p>
            <p className="font-display text-4xl leading-none">{campaign.day}</p>
          </div>
          <button
            type="button"
            disabled={potions <= 0}
            onClick={() => setConfirmPotion(true)}
            className="flex flex-col items-end rounded-lg px-2 py-1 active:translate-y-px disabled:opacity-40"
          >
            <p className="text-xs uppercase tracking-wide text-ink-soft">Tränke</p>
            <p className="font-display text-4xl leading-none">{potions}</p>
          </button>
        </div>

        <CampaignCalendar day={campaign.day} maxDay={campaign.maxDay} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
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
    </Screen>
  );
}

function CampaignCalendar({ day, maxDay }: { day: number; maxDay: number }) {
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
          return (
            <span
              key={d}
              title={`Tag ${d}`}
              className={`aspect-square rounded-sm border ${
                isCurrent
                  ? "border-accent bg-accent text-white"
                  : isPast
                    ? "border-line bg-paper-2"
                    : "border-line bg-paper"
              }`}
            />
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
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border-[1.5px] border-line-strong py-2 text-sm font-semibold active:translate-y-px"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white active:translate-y-px"
          >
            Ja
          </button>
        </div>
      </div>
    </div>
  );
}
