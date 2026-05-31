import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { ownHunter } from "../lib/hunter";
import {
  MAX_QUEST_COMPLETIONS,
  QUEST_MONSTERS,
  STAR_ORDER,
  questsForMonster,
  type QuestDef,
  type QuestStars,
} from "../data/quests";
import { canStartQuest } from "../domain/quests";
import { iconUrl } from "../domain/icons";

/** Quest picker grouped by monster and star tier. */
export function QuestScreen() {
  const campaign = useCampaign((s) => s.campaign);
  const startQuest = useCampaign((s) => s.startQuest);
  const userId = useAuth((s) => s.userId);
  const navigate = useNavigate();
  const [openMonster, setOpenMonster] = useState<string | null>(
    QUEST_MONSTERS[0]?.id ?? null,
  );

  if (!campaign) return null;
  const hunter = ownHunter(campaign, userId);
  if (!hunter) return null;

  const hasActiveQuest = campaign.activeQuest != null;

  const handleStart = (quest: QuestDef) => {
    const res = startQuest(quest.id, hunter.id);
    if (!res.ok) {
      alert(res.reason ?? "Quest konnte nicht gestartet werden.");
      return;
    }
    navigate("/campaign/quest");
  };

  return (
    <Screen title="Quests" subtitle="Ancient Forest">
      <div className="flex flex-col gap-3">
        {QUEST_MONSTERS.map((monster) => {
          const monsterQuests = questsForMonster(monster.id);
          const open = openMonster === monster.id;
          const totalDone = monsterQuests.reduce(
            (sum, q) => sum + (campaign.questCompletions[q.id] ?? 0),
            0,
          );
          const maxDone = monsterQuests.length * MAX_QUEST_COMPLETIONS;

          return (
            <div key={monster.id} className="paper-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setOpenMonster((cur) => (cur === monster.id ? null : monster.id))
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:translate-y-px"
              >
                <img
                  src={iconUrl(monster.icon)}
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{monster.name}</p>
                  <p className="text-sm text-ink-soft">
                    {totalDone}/{maxDone} Abschlüsse
                  </p>
                </div>
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
                  <div className="border-t border-line px-3 pb-3 pt-2">
                    {STAR_ORDER.map((stars) => {
                      const group = monsterQuests.filter((q) => q.stars === stars);
                      if (group.length === 0) return null;
                      return (
                        <div key={stars} className="mb-3 last:mb-0">
                          <div className="mb-1 flex items-center gap-1">
                            <img
                              src={iconUrl(stars)}
                              alt=""
                              className="h-4 w-4 object-contain"
                            />
                            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                              {starLabel(stars)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            {group.map((q) => (
                              <QuestRow
                                key={q.id}
                                quest={q}
                                count={campaign.questCompletions[q.id] ?? 0}
                                disabled={
                                  !canStartQuest(
                                    q,
                                    campaign.questCompletions,
                                    hasActiveQuest,
                                  )
                                }
                                onStart={() => handleStart(q)}
                              />
                            ))}
                          </div>
                        </div>
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
  count,
  disabled,
  onStart,
}: {
  quest: QuestDef;
  count: number;
  disabled: boolean;
  onStart: () => void;
}) {
  const full = count >= MAX_QUEST_COMPLETIONS;
  const oneStarDone = quest.stars === "one-star" && count >= 1;

  return (
    <button
      type="button"
      disabled={disabled || full || oneStarDone}
      onClick={onStart}
      className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] border-line-strong px-3 py-2 text-left active:translate-y-px ${
        disabled || full || oneStarDone ? "bg-paper-2 opacity-60" : "bg-card"
      }`}
    >
      <img
        src={iconUrl(quest.type)}
        alt=""
        className="h-8 w-8 shrink-0 object-contain"
      />
      <img
        src={iconUrl(quest.icon)}
        alt=""
        className="h-6 w-6 shrink-0 object-contain"
      />
      <span
        className={`min-w-0 flex-1 truncate text-sm font-medium ${
          full || oneStarDone ? "line-through" : ""
        }`}
      >
        {quest.name}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {full || oneStarDone ? "✓ " : ""}
        {oneStarDone ? "1/1" : `${count}/${MAX_QUEST_COMPLETIONS}`}
      </span>
    </button>
  );
}

function starLabel(stars: QuestStars): string {
  switch (stars) {
    case "one-star":
      return "1★";
    case "two-star":
      return "2★";
    case "three-star":
      return "3★";
    case "four-star":
      return "4★";
  }
}
