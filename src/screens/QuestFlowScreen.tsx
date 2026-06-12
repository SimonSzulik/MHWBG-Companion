import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { ownHunter } from "../lib/hunter";
import { questById } from "../domain/quests";
import { rollDice } from "../domain/loot";
import { lootTableForMonster } from "../data/lootTables";
import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import { DiceRollCard } from "../ui/DiceRollCard";
import { buildPersonalLootSummary } from "../domain/questRewards";
import { QuestInvestigationPanel } from "../ui/quest/QuestInvestigationPanel";
import { QuestSummaryPanel } from "../ui/quest/QuestSummaryPanel";
import { QuestFailureChoiceDialog } from "../ui/quest/QuestFailureChoiceDialog";
import { QuestPhaseScreen } from "../ui/quest/QuestPhaseScreen";
import { LootSack } from "../ui/quest/LootSack";
import { QuestPersonalLootDialog } from "../ui/quest/QuestPersonalLootDialog";

/** Full-screen quest flow: lobby, investigation, active hunt, looting, summary. */
export function QuestFlowScreen() {
  const campaign = useCampaign((s) => s.campaign);
  const userId = useAuth((s) => s.userId);
  const navigate = useNavigate();
  const [showFailureChoice, setShowFailureChoice] = useState(false);
  const [showHighTierFailureConfirm, setShowHighTierFailureConfirm] =
    useState(false);
  const [showPersonalLoot, setShowPersonalLoot] = useState(false);

  const leaveQuestLobby = useCampaign((s) => s.leaveQuestLobby);
  const forceStartQuest = useCampaign((s) => s.forceStartQuest);
  const joinQuest = useCampaign((s) => s.joinQuest);
  const setInvestigationLoot = useCampaign((s) => s.setInvestigationLoot);
  const finishInvestigation = useCampaign((s) => s.finishInvestigation);
  const completeQuestFailure = useCampaign((s) => s.completeQuestFailure);
  const completeQuestSuccess = useCampaign((s) => s.completeQuestSuccess);
  const setLootDice = useCampaign((s) => s.setLootDice);
  const setLootChoice = useCampaign((s) => s.setLootChoice);
  const setLootQuantity = useCampaign((s) => s.setLootQuantity);
  const confirmPersonalLoot = useCampaign((s) => s.confirmPersonalLoot);
  const confirmQuestSummary = useCampaign((s) => s.confirmQuestSummary);

  const aq = campaign?.activeQuest;

  useEffect(() => {
    if (!campaign?.activeQuest) {
      navigate("/", { replace: true });
    }
  }, [campaign?.activeQuest, navigate]);

  useEffect(() => {
    if (!campaign?.activeQuest || campaign.activeQuest.phase !== "lobby") return;
    if (campaign.activeDowntime) return;
    const h = ownHunter(campaign, userId);
    if (!h || campaign.activeQuest.readyHunterIds.includes(h.id)) return;
    joinQuest(h.id);
  }, [campaign, userId, joinQuest]);

  useEffect(() => {
    if (!campaign?.activeQuest || campaign.activeQuest.phase !== "looting") return;
    const h = ownHunter(campaign, userId);
    if (!h) return;
    if (campaign.activeQuest.lootProgress[h.id]?.confirmed) {
      navigate("/", { replace: true });
    }
  }, [campaign, userId, navigate]);

  if (!campaign?.activeQuest) return null;

  const hunter = ownHunter(campaign, userId);
  if (!hunter) return null;

  const quest = questById(aq!.questId);
  if (!quest) return null;

  const monster = catalog.monster(quest.monsterId);
  const table = lootTableForMonster(quest.monsterId);
  const starter = campaign.hunters.find((h) => h.id === aq!.startedByHunterId);
  const isStarter = hunter.id === aq!.startedByHunterId;

  if (aq!.phase === "lobby") {
    const ready = aq!.readyHunterIds.includes(hunter.id);
    return (
      <QuestPhaseScreen title="Start Quest" subtitle={quest.name}>
        <div className="flex flex-col items-center gap-6 py-8">
          <img
            src={iconUrl(quest.icon)}
            alt=""
            className="h-32 w-32 object-contain"
          />
          <div className="text-center">
            <p className="font-display text-2xl">{quest.name}</p>
            <p className="mt-1 text-sm text-ink-soft">
              Waiting for all hunters…
            </p>
          </div>

          <div className="w-full paper-card p-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-accent">
              Ready ({aq!.readyHunterIds.length}/{campaign.hunters.length})
            </p>
            <ul className="flex flex-col gap-2">
              {campaign.hunters.map((h) => {
                const isReady = aq!.readyHunterIds.includes(h.id);
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{h.name}</span>
                    <span className={isReady ? "text-ok" : "text-ink-soft"}>
                      {isReady ? "✓ Ready" : "Waiting…"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={() => forceStartQuest()}
              className="w-full py-3 text-sm font-semibold"
            >
              Start now (test)
            </Button>
            {ready && (
              <Button
                variant="secondary"
                onClick={() => {
                  leaveQuestLobby(hunter.id);
                  navigate("/campaign/quests");
                }}
                className="w-full bg-paper-2 py-3 text-sm font-semibold"
              >
                Leave
              </Button>
            )}
          </div>
        </div>
      </QuestPhaseScreen>
    );
  }

  if (aq!.phase === "investigation") {
    return (
      <QuestPhaseScreen title="Investigation" subtitle={quest.name}>
        <QuestInvestigationPanel
          investigationLoot={aq!.investigationLoot ?? {}}
          canEdit={isStarter}
          starterName={starter?.name ?? "Quest starter"}
          onSetQty={(materialId, qty) => {
            const res = setInvestigationLoot(hunter.id, materialId, qty);
            if (!res.ok && res.reason) alert(res.reason);
          }}
          onFinish={
            isStarter
              ? () => {
                  const res = finishInvestigation(hunter.id);
                  if (!res.ok && res.reason) alert(res.reason);
                }
              : undefined
          }
        />
      </QuestPhaseScreen>
    );
  }

  if (aq!.phase === "summary") {
    return (
      <QuestPhaseScreen title="Quest summary" subtitle={quest.name}>
        <QuestSummaryPanel
          activeQuest={aq!}
          hunters={campaign.hunters}
          onConfirm={() => {
            confirmQuestSummary();
            navigate("/", { replace: true });
          }}
        />
      </QuestPhaseScreen>
    );
  }

  if (aq!.phase === "active") {
    return (
      <QuestPhaseScreen title="Quest" subtitle={monster?.name ?? quest.name}>
        <div className="flex flex-col items-center gap-6 py-6">
          <img
            src={iconUrl(quest.icon)}
            alt=""
            className="h-40 w-40 object-contain"
          />
          <div className="text-center">
            <img
              src={iconUrl(quest.stars)}
              alt=""
              className="mx-auto mb-2 h-8 w-8 object-contain"
            />
            <p className="font-display text-3xl leading-tight">{quest.name}</p>
            <p className="mt-2 text-sm text-ink-soft">
              {monster?.kind ?? "Investigation"}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => completeQuestSuccess()}
              className="bg-ok py-4 text-sm font-bold text-white"
            >
              Completed
            </Button>
            <Button
              onClick={() => {
                if (quest.stars === "one-star") {
                  setShowFailureChoice(true);
                } else {
                  setShowHighTierFailureConfirm(true);
                }
              }}
              className="py-4 text-sm font-bold"
            >
              Failure
            </Button>
          </div>
        </div>

        {showFailureChoice && (
          <QuestFailureChoiceDialog
            onKeepLoot={() => {
              completeQuestFailure(true);
              setShowFailureChoice(false);
            }}
            onDiscardLoot={() => {
              completeQuestFailure(false);
              setShowFailureChoice(false);
            }}
            onCancel={() => setShowFailureChoice(false)}
          />
        )}

        {showHighTierFailureConfirm && (
          <ConfirmDialog
            title="Quest failed?"
            message="All investigation loot and progress are lost. One campaign day will pass."
            onConfirm={() => {
              completeQuestFailure(false);
              setShowHighTierFailureConfirm(false);
            }}
            onCancel={() => setShowHighTierFailureConfirm(false)}
          />
        )}
      </QuestPhaseScreen>
    );
  }

  if (aq!.phase !== "looting") return null;

  const progress = aq!.lootProgress[hunter.id];
  if (!progress || !table) return null;

  if (progress.confirmed) return null;

  const [x, y] = progress.dice;
  const sum = x + y;
  const canSum = sum <= 12;

  const personalSummary = buildPersonalLootSummary(aq!, hunter.id);

  return (
    <QuestPhaseScreen title="Loot" subtitle={hunter.name}>
      <div className="flex flex-col gap-4">
        <DiceRollCard
          dice={progress.dice}
          onDiceChange={(d) => setLootDice(hunter.id, d)}
          onReroll={() => setLootDice(hunter.id, rollDice())}
          footer={
            <div className="mt-3 flex gap-2">
              <LootChoiceButton
                label="Both dice"
                active={progress.choice === "split"}
                onSelect={() => setLootChoice(hunter.id, "split")}
              />
              {canSum && (
                <LootChoiceButton
                  label={`Sum (${sum})`}
                  active={progress.choice === "sum"}
                  onSelect={() => setLootChoice(hunter.id, "sum")}
                />
              )}
            </div>
          }
        />

        {progress.choice && (
          <LootSack
            quantities={progress.lootQuantities}
            onSetQty={(id, next) => setLootQuantity(hunter.id, id, next)}
          />
        )}

        <Button
          disabled={!progress.choice}
          onClick={() => setShowPersonalLoot(true)}
          className="w-full py-3 text-sm font-bold"
        >
          Confirm loot
        </Button>
      </div>

      {showPersonalLoot && progress.choice && (
        <QuestPersonalLootDialog
          hunterName={hunter.name}
          summary={personalSummary}
          onConfirm={() => {
            confirmPersonalLoot(hunter.id);
            setShowPersonalLoot(false);
            navigate("/", { replace: true });
          }}
        />
      )}
    </QuestPhaseScreen>
  );
}

function LootChoiceButton({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 rounded-lg border-[1.5px] px-3 py-2 text-sm font-semibold active:translate-y-px ${
        active
          ? "border-accent bg-accent-faint text-accent ring-1 ring-accent"
          : "border-line-strong bg-paper-2"
      }`}
    >
      {label}
    </button>
  );
}
