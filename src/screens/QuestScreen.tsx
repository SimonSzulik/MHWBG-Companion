import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../ui/Screen";
import { Button } from "../ui/Button";
import { useCampaign } from "../store/campaign";
import { useOwnHunter } from "../store/hooks";
import {
  MAX_QUEST_COMPLETIONS,
  QUEST_MONSTERS,
  STAR_ORDER,
  questsForMonster,
  type QuestDef,
  type QuestStars,
} from "../data/quests";
import {
  canStartQuest,
  isQuestFullyCompleted,
  isQuestUnlocked,
  maxCompletionsForQuest,
  questById,
  questLockReason,
} from "../domain/quests";
import { iconUrl } from "../domain/icons";

const STAR_COUNT: Record<QuestStars, number> = {
  "one-star": 1,
  "two-star": 2,
  "three-star": 3,
  "four-star": 4,
};

/**
 * Quest-type label per star tier, matching the printed quest books: 1★ is an
 * "Assigned Quest", 2★ an "Investigation Quest", and 3★ upwards are all
 * "Tempered Investigation Quest" — the star count is what separates them.
 * (3★ was previously mislabelled here as a plain Investigation.)
 */
const STAR_TYPE_LABEL: Record<QuestStars, string> = {
  "one-star": "Assigned",
  "two-star": "Investigation",
  "three-star": "Tempered",
  "four-star": "Tempered",
};

/** Quest board, grouped by star difficulty; expand a tier to pick a hunt. */
export function QuestScreen() {
  const { campaign, hunter } = useOwnHunter();
  const startQuest = useCampaign((s) => s.startQuest);
  const joinQuest = useCampaign((s) => s.joinQuest);
  const forceStartQuest = useCampaign((s) => s.forceStartQuest);
  const navigate = useNavigate();
  const [openStar, setOpenStar] = useState<QuestStars | null>(
    STAR_ORDER[0] ?? null,
  );

  if (!campaign || !hunter) return null;

  const hasActiveQuest = campaign.activeQuest != null;
  const hasActiveDowntime = campaign.activeDowntime != null;
  const completions = campaign.questCompletions;
  const allQuests = QUEST_MONSTERS.flatMap((m) => questsForMonster(m.id));

  const handleStart = (quest: QuestDef) => {
    const res = startQuest(quest.id, hunter.id);
    if (!res.ok) {
      alert(res.reason ?? "Quest could not be started.");
      return;
    }
    navigate("/campaign/quest");
  };

  const pendingQuest = campaign.pendingHandlerQuestId
    ? questById(campaign.pendingHandlerQuestId)
    : undefined;

  return (
    <Screen title="Quests" hideHeader background="/backgrounds/Wald.png">
      <div className="mb-4 text-center">
        <p className="font-display text-3xl leading-none">Quest Board</p>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft">
          Ancient Forest
        </p>
      </div>

      {hasActiveDowntime && (
        <div className="mb-3 rounded-xl border-[1.5px] border-warn bg-paper-2 px-4 py-3">
          <p className="text-sm font-semibold">Downtime in progress</p>
          <p className="mt-1 text-xs text-ink-soft">
            All hunters must finish downtime before a new quest can start.
          </p>
        </div>
      )}

      {campaign.activeQuest && campaign.activeQuest.phase !== "lobby" && (
        <div className="mb-3 rounded-xl border-[1.5px] border-accent bg-accent-faint px-4 py-3">
          <p className="text-sm font-semibold">Quest in progress</p>
          <p className="mt-1 text-xs text-ink-soft">
            Resume the active hunt to finish or abandon it.
          </p>
          <Button
            onClick={() => navigate("/campaign/quest")}
            className="mt-3 w-full py-2 text-sm font-semibold"
          >
            Resume quest
          </Button>
        </div>
      )}

      {campaign.activeQuest?.phase === "lobby" && (
        <div className="mb-3 rounded-xl border-[1.5px] border-warn bg-paper-2 px-4 py-3">
          <p className="text-sm font-semibold">Quest lobby open</p>
          <p className="mt-1 text-xs text-ink-soft">
            Not everyone has joined yet.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const res = joinQuest(hunter.id);
                if (!res.ok) {
                  alert(res.reason ?? "Could not join quest.");
                  return;
                }
                navigate("/campaign/quest");
              }}
              className="flex-1 py-2 text-sm font-semibold"
            >
              Open lobby
            </Button>
            <Button
              onClick={() => {
                forceStartQuest();
                navigate("/campaign/quest");
              }}
              className="flex-1 py-2 text-sm font-semibold"
            >
              Start now (test)
            </Button>
          </div>
        </div>
      )}

      {pendingQuest && (
        <div className="mb-3 rounded-xl border-[1.5px] border-accent bg-accent-faint px-4 py-3 text-sm">
          <p className="font-semibold">Handler quest</p>
          <p className="mt-1 text-ink-soft">
            Next up: {pendingQuest.name} — other quests are locked.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {STAR_ORDER.map((stars) => {
          const quests = allQuests.filter((q) => q.stars === stars);
          if (quests.length === 0) return null;
          const open = openStar === stars;
          const tempered = stars === "four-star";

          return (
            <div key={stars} className="paper-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setOpenStar((cur) => (cur === stars ? null : stars))
                }
                className="flex w-full items-center gap-3 bg-paper-2 px-4 py-3 text-left active:translate-y-px"
              >
                <span
                  className={`shrink-0 text-base leading-none tracking-tighter ${
                    tempered ? "text-red-600" : "text-accent"
                  }`}
                  aria-hidden
                >
                  {"★".repeat(STAR_COUNT[stars])}
                </span>
                <p className="min-w-0 flex-1 truncate font-display text-xl leading-tight">
                  {STAR_TYPE_LABEL[stars]}
                </p>
                <span
                  className={`shrink-0 text-lg text-ink-soft transition-transform duration-200 ${
                    open ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-250 ease-in-out"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="divide-y divide-line border-t border-line-strong">
                    {quests.map((q) => {
                      const monsterQuests = questsForMonster(q.monsterId);
                      return (
                        <QuestRow
                          key={q.id}
                          quest={q}
                          completions={completions}
                          count={completions[q.id] ?? 0}
                          monsterQuests={monsterQuests}
                          pendingHandlerQuestId={campaign.pendingHandlerQuestId}
                          locked={!isQuestUnlocked(q, completions, monsterQuests)}
                          disabled={
                            !canStartQuest(
                              q,
                              completions,
                              hasActiveQuest,
                              monsterQuests,
                              campaign.pendingHandlerQuestId,
                              hasActiveDowntime,
                            )
                          }
                          onStart={() => handleStart(q)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function QuestRow({
  quest,
  completions,
  count,
  monsterQuests,
  pendingHandlerQuestId,
  locked,
  disabled,
  onStart,
}: {
  quest: QuestDef;
  completions: Record<string, number>;
  count: number;
  monsterQuests: QuestDef[];
  pendingHandlerQuestId?: string | null;
  locked: boolean;
  disabled: boolean;
  onStart: () => void;
}) {
  const max = maxCompletionsForQuest(quest);
  const isHandlerPick = pendingHandlerQuestId === quest.id;
  const done = isQuestFullyCompleted(quest, count);
  const maxed = count >= MAX_QUEST_COMPLETIONS;
  const inactive = locked || disabled || (done && !isHandlerPick);
  const lockHint = locked
    ? questLockReason(quest, completions, monsterQuests)
    : undefined;

  return (
    <button
      type="button"
      disabled={inactive}
      onClick={onStart}
      title={lockHint}
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition enabled:active:bg-accent-faint ${
        inactive ? "opacity-55" : ""
      }`}
    >
      <img
        src={iconUrl(quest.icon)}
        alt=""
        className="h-8 w-8 shrink-0 object-contain"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {quest.name}
        {isHandlerPick ? " (Handler)" : ""}
      </span>
      {locked ? (
        <span className="shrink-0 text-base" aria-label="locked">
          🔒
        </span>
      ) : done ? (
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            maxed ? "bg-red-600 text-white" : "bg-ink-soft/15 text-ink-soft"
          }`}
        >
          Completed!
        </span>
      ) : count >= 1 ? (
        <span className="flex shrink-0 items-center gap-1 text-ink-soft">
          <span className="text-base font-black leading-none">✓</span>
          <span className="text-[11px] font-semibold tabular-nums">
            {count}/{max}
          </span>
        </span>
      ) : (
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-soft/60">
          0/{max}
        </span>
      )}
    </button>
  );
}
