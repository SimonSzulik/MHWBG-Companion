import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../ui/Screen";
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

/** Quest board: monster boards, ordered by star tier, with completion marks. */
export function QuestScreen() {
  const { campaign, hunter } = useOwnHunter();
  const startQuest = useCampaign((s) => s.startQuest);
  const navigate = useNavigate();
  const [openMonster, setOpenMonster] = useState<string | null>(
    QUEST_MONSTERS[0]?.id ?? null,
  );

  if (!campaign || !hunter) return null;

  const hasActiveQuest = campaign.activeQuest != null;
  const completions = campaign.questCompletions;

  const handleStart = (quest: QuestDef) => {
    const res = startQuest(quest.id, hunter.id);
    if (!res.ok) {
      alert(res.reason ?? "Quest konnte nicht gestartet werden.");
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
        <p className="font-display text-3xl leading-none">Quest-Tafel</p>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft">
          Ancient Forest
        </p>
      </div>

      {pendingQuest && (
        <div className="mb-3 rounded-xl border-[1.5px] border-accent bg-accent-faint px-4 py-3 text-sm">
          <p className="font-semibold">Handler-Quest</p>
          <p className="mt-1 text-ink-soft">
            Als Nächstes: {pendingQuest.name} — andere Quests sind gesperrt.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {QUEST_MONSTERS.map((monster) => {
          const monsterQuests = questsForMonster(monster.id);
          const ordered = [...monsterQuests].sort(
            (a, b) => STAR_ORDER.indexOf(a.stars) - STAR_ORDER.indexOf(b.stars),
          );
          const open = openMonster === monster.id;

          return (
            <div key={monster.id} className="paper-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setOpenMonster((cur) =>
                    cur === monster.id ? null : monster.id,
                  )
                }
                className="flex w-full items-center gap-3 bg-paper-2 px-4 py-3 text-left active:translate-y-px"
              >
                <img
                  src={iconUrl(monster.icon)}
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <p className="min-w-0 flex-1 truncate font-display text-xl leading-tight">
                  {monster.name}
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
                    {ordered.map((q) => (
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
                          )
                        }
                        onStart={() => handleStart(q)}
                      />
                    ))}
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
        src={iconUrl(quest.type)}
        alt=""
        className="h-8 w-8 shrink-0 object-contain"
      />
      <span
        className={`shrink-0 text-sm leading-none tracking-tighter ${
          quest.stars === "four-star" ? "text-red-600" : "text-accent"
        }`}
        aria-hidden
      >
        {"★".repeat(STAR_COUNT[quest.stars])}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {quest.name}
        {isHandlerPick ? " (Handler)" : ""}
      </span>
      {locked ? (
        <span className="shrink-0 text-base" aria-label="gesperrt">
          🔒
        </span>
      ) : done ? (
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            maxed ? "bg-red-600 text-white" : "bg-ink-soft/15 text-ink-soft"
          }`}
        >
          Abgeschlossen!
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
