import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../ui/Screen";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { ownHunter } from "../lib/hunter";
import { questById } from "../domain/quests";
import { buildLootPreview, rollDice } from "../domain/loot";
import {
  BREAKABLE_PARTS,
  PART_LABELS,
  lootTableForMonster,
} from "../data/lootTables";
import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import { clamp } from "../lib/math";
import {
  LootMaterialPreviewList,
  LootMaterialRow,
} from "../ui/LootMaterialRow";
import { QuestInvestigationPanel } from "../ui/quest/QuestInvestigationPanel";
import { QuestSummaryPanel } from "../ui/quest/QuestSummaryPanel";
import { QuestFailureChoiceDialog } from "../ui/quest/QuestFailureChoiceDialog";

/** Full-screen quest flow: lobby, investigation, active hunt, looting, summary. */
export function QuestFlowScreen() {
  const campaign = useCampaign((s) => s.campaign);
  const userId = useAuth((s) => s.userId);
  const navigate = useNavigate();
  const [showFailureChoice, setShowFailureChoice] = useState(false);
  const [showHighTierFailureConfirm, setShowHighTierFailureConfirm] =
    useState(false);

  const leaveQuestLobby = useCampaign((s) => s.leaveQuestLobby);
  const forceStartQuest = useCampaign((s) => s.forceStartQuest);
  const joinQuest = useCampaign((s) => s.joinQuest);
  const setInvestigationLoot = useCampaign((s) => s.setInvestigationLoot);
  const finishInvestigation = useCampaign((s) => s.finishInvestigation);
  const completeQuestFailure = useCampaign((s) => s.completeQuestFailure);
  const completeQuestSuccess = useCampaign((s) => s.completeQuestSuccess);
  const setLootDice = useCampaign((s) => s.setLootDice);
  const setLootChoice = useCampaign((s) => s.setLootChoice);
  const togglePartBreak = useCampaign((s) => s.togglePartBreak);
  const setLootQuantity = useCampaign((s) => s.setLootQuantity);
  const confirmLoot = useCampaign((s) => s.confirmLoot);
  const confirmQuestSummary = useCampaign((s) => s.confirmQuestSummary);

  const aq = campaign?.activeQuest;

  useEffect(() => {
    if (!campaign?.activeQuest) {
      navigate("/", { replace: true });
    }
  }, [campaign?.activeQuest, navigate]);

  useEffect(() => {
    if (!campaign?.activeQuest || campaign.activeQuest.phase !== "lobby") return;
    const h = ownHunter(campaign, userId);
    if (!h || campaign.activeQuest.readyHunterIds.includes(h.id)) return;
    joinQuest(h.id);
  }, [campaign, userId, joinQuest]);

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
      <Screen title="Start Quest" subtitle={quest.name} back={false}>
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
      </Screen>
    );
  }

  if (aq!.phase === "investigation") {
    return (
      <Screen title="Investigation" subtitle={quest.name} back={false}>
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
      </Screen>
    );
  }

  if (aq!.phase === "summary") {
    return (
      <Screen title="Quest summary" subtitle={quest.name} back={false}>
        <QuestSummaryPanel
          activeQuest={aq!}
          hunters={campaign.hunters}
          onConfirm={() => confirmQuestSummary()}
        />
      </Screen>
    );
  }

  if (aq!.phase === "active") {
    return (
      <Screen title="Quest" subtitle={monster?.name ?? quest.name} back={false}>
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
      </Screen>
    );
  }

  if (aq!.phase !== "looting") return null;

  const progress = aq!.lootProgress[hunter.id];
  if (!progress || !table) return null;

  if (progress.confirmed) {
    return (
      <Screen title="Loot" subtitle={hunter.name} back={false}>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="font-display text-2xl">Loot secured!</p>
          <p className="text-sm text-ink-soft">Waiting for other hunters…</p>
          <ul className="w-full paper-card p-4 text-left text-sm">
            {campaign.hunters.map((h) => (
              <li key={h.id} className="flex justify-between py-1">
                <span>{h.name}</span>
                <span>{aq!.lootProgress[h.id]?.confirmed ? "✓" : "…"}</span>
              </li>
            ))}
          </ul>
        </div>
      </Screen>
    );
  }

  const [x, y] = progress.dice;
  const sum = x + y;
  const canSum = sum <= 12;
  const parts = BREAKABLE_PARTS[quest.monsterId] ?? [];

  const splitPreview = buildLootPreview(
    table,
    progress.dice,
    "split",
    progress.brokenParts,
  );
  const sumPreview = canSum
    ? buildLootPreview(table, progress.dice, "sum", progress.brokenParts)
    : null;

  const lootPreview = progress.choice
    ? buildLootPreview(table, progress.dice, progress.choice, progress.brokenParts)
    : null;

  const materialIds = Object.keys(progress.lootQuantities).sort();
  const setDieFace = (index: 0 | 1, raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    const nextFace = Number.isNaN(parsed) ? 1 : clamp(parsed, 1, 6);
    const nextDice: [number, number] = index === 0 ? [nextFace, y] : [x, nextFace];
    setLootDice(hunter.id, nextDice);
  };

  return (
    <Screen title="Loot" subtitle={hunter.name} back={false}>
      <div className="flex flex-col gap-4">
        <div className="paper-card flex items-center justify-center gap-6 p-6">
          <Die face={x} />
          <Die face={y} />
        </div>

        <div className="paper-card p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-accent">
            Enter manually
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              Die 1
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={6}
                step={1}
                value={x}
                onChange={(e) => setDieFace(0, e.target.value)}
                onBlur={(e) => setDieFace(0, e.target.value)}
                className="rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-base font-semibold text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              Die 2
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={6}
                step={1}
                value={y}
                onChange={(e) => setDieFace(1, e.target.value)}
                onBlur={(e) => setDieFace(1, e.target.value)}
                className="rounded-lg border-[1.5px] border-line-strong bg-card px-3 py-2 text-base font-semibold text-ink"
              />
            </label>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => setLootDice(hunter.id, rollDice())}
          className="w-full bg-paper-2 py-2 text-sm font-semibold"
        >
          Reroll
        </Button>

        <div className="flex flex-col gap-2">
          <LootOption
            label={`Row ${x} + ${y}`}
            active={progress.choice === "split"}
            onSelect={() => setLootChoice(hunter.id, "split")}
            preview={splitPreview.materials}
          />
          <LootOption
            label={`Row ${sum}`}
            disabled={!canSum}
            active={progress.choice === "sum"}
            onSelect={() => setLootChoice(hunter.id, "sum")}
            preview={sumPreview?.materials}
          />
        </div>

        {parts.length > 0 && (
          <div className="paper-card p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-accent">
              Part broken
            </p>
            <div className="flex flex-wrap gap-2">
              {parts.map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => togglePartBreak(hunter.id, part)}
                  className={`rounded-lg border-[1.5px] px-3 py-1.5 text-sm font-semibold active:translate-y-px ${
                    progress.brokenParts.includes(part)
                      ? "border-ok bg-ok-soft text-ok"
                      : "border-line-strong bg-paper-2"
                  }`}
                >
                  {PART_LABELS[part]}
                </button>
              ))}
            </div>
          </div>
        )}

        {lootPreview && progress.choice && (
          <div className="paper-card p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-accent">
              Preview
            </p>

            {lootPreview.brokenParts.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft">
                  Part break
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lootPreview.brokenParts.map((part) => (
                    <span
                      key={part}
                      className="rounded-md border border-ok bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok"
                    >
                      {PART_LABELS[part]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(lootPreview.partBreakMaterials).length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft">
                  Part-break bonus
                </p>
                <LootMaterialPreviewList
                  quantities={lootPreview.partBreakMaterials}
                  readOnly
                  compact
                />
              </div>
            )}

            <LootMaterialPreviewList
              quantities={lootPreview.materials}
              readOnly
              compact
            />
          </div>
        )}

        {progress.choice && materialIds.length > 0 && (
          <div className="paper-card p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-accent">
              Loot (adjust manually)
            </p>
            <ul className="flex flex-col gap-1">
              {materialIds.map((id) => (
                <li key={id}>
                  <LootMaterialRow
                    materialId={id}
                    qty={progress.lootQuantities[id] ?? 0}
                    onSet={(next) => setLootQuantity(hunter.id, id, next)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          disabled={!progress.choice}
          onClick={() => confirmLoot(hunter.id)}
          className="w-full py-3 text-sm font-bold"
        >
          Confirm loot
        </Button>
      </div>
    </Screen>
  );
}

function Die({ face }: { face: number }) {
  return (
    <div className="grid h-16 w-16 place-items-center rounded-xl border-[3px] border-line-strong bg-card font-display text-3xl shadow-sm">
      {face}
    </div>
  );
}

function LootOption({
  label,
  active,
  disabled,
  onSelect,
  preview,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
  preview?: Record<string, number>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`rounded-xl border-[1.5px] p-3 text-left active:translate-y-px disabled:opacity-40 ${
        active
          ? "border-accent bg-accent-faint ring-1 ring-accent"
          : "border-line-strong bg-card"
      }`}
    >
      <p className="font-semibold">{label}</p>
      {preview && Object.keys(preview).length > 0 && (
        <div className="mt-2">
          <LootMaterialPreviewList quantities={preview} readOnly compact />
        </div>
      )}
    </button>
  );
}
