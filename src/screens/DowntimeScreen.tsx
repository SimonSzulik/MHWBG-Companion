import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameData } from "../data/gameData";
import {
  commonTradeableMaterialIds,
  DOWNTIME_ACTIVITIES,
  ELEMENT_TYPES,
  HANDLER_ACTIVITY,
  MAX_DOWNTIME_PICKS,
  MAX_POTIONS,
  PROVISIONS_TRADE_COST,
  RESOURCE_CENTER_TABLE,
  handlerQuestPool,
  isHunterDowntimeReady,
} from "../domain/downtime";
import type {
  ActiveDowntime,
  DowntimeActivityId,
  ElementType,
  ProvisionsTrade,
} from "../domain/types";
import { rollDice } from "../domain/loot";
import { DiceRollCard } from "../ui/DiceRollCard";
import type { QuestDef } from "../data/quests";
import { iconUrl } from "../domain/icons";
import { useCampaign } from "../store/campaign";
import { useOwnHunter } from "../store/hooks";
import { Stepper } from "../ui/Stepper";
import { Screen } from "../ui/Screen";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";

function isActivityResolved(
  id: DowntimeActivityId,
  hunterId: string,
  dt: ActiveDowntime,
): boolean {
  switch (id) {
    case "provisions":
      return Boolean(dt.provisions[hunterId]);
    case "resource-center":
      return dt.resourceRoll[hunterId] != null;
    case "chef":
      return Boolean(dt.chefElement[hunterId]);
    case "poogie":
      return Boolean(dt.poogieDone[hunterId]);
    case "handler":
      // The Handler is no longer a staged pick — it starts a quest directly.
      return false;
  }
}

/** Downtime day: hub with activity cards, drill-in panels, confirm with party. */
export function DowntimeScreen() {
  const { campaign, hunter } = useOwnHunter();
  const setDowntimePicks = useCampaign((s) => s.setDowntimePicks);
  const resolveProvisions = useCampaign((s) => s.resolveProvisions);
  const resolveResourceCenter = useCampaign((s) => s.resolveResourceCenter);
  const resolveChef = useCampaign((s) => s.resolveChef);
  const resolvePoogie = useCampaign((s) => s.resolvePoogie);
  const startHandlerQuest = useCampaign((s) => s.startHandlerQuest);
  const confirmDowntime = useCampaign((s) => s.confirmDowntime);
  const cancelDowntime = useCampaign((s) => s.cancelDowntime);
  const navigate = useNavigate();
  const [openActivity, setOpenActivity] = useState<DowntimeActivityId | null>(
    null,
  );
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [awaitingPartyFinish, setAwaitingPartyFinish] = useState(false);

  useEffect(() => {
    useCampaign.getState().beginDowntime();
  }, []);

  const hunterIds = campaign?.hunters.map((h) => h.id) ?? [];
  const myConfirmed = Boolean(
    hunter?.id &&
      campaign?.activeDowntime?.confirmedHunterIds?.includes(hunter.id),
  );

  useEffect(() => {
    if (awaitingPartyFinish && !campaign?.activeDowntime) {
      navigate("/", { replace: true });
    }
  }, [awaitingPartyFinish, campaign?.activeDowntime, navigate]);

  if (!campaign || !hunter) return null;

  if (campaign.activeQuest) {
    return (
      <Screen
        title="Downtime"
        hideHeader
        background="/backgrounds/Downtime.png"
      >
        <div className="paper-card p-5 text-center text-sm text-ink-soft">
          Downtime is unavailable while a quest is in progress.
        </div>
      </Screen>
    );
  }

  const dt = campaign.activeDowntime;
  if (!dt) {
    return (
      <Screen
        title="Downtime"
        hideHeader
        background="/backgrounds/Downtime.png"
      >
        <div className="paper-card p-5 text-center text-sm text-ink-soft">
          Preparing downtime…
        </div>
      </Screen>
    );
  }

  const myPicks = dt.picks[hunter.id] ?? [];
  const handlerPool = handlerQuestPool(campaign.questCompletions);
  const downtimeReady = isHunterDowntimeReady(hunter.id, dt, hunterIds);
  const isLeader = hunter.id === campaign.leaderId;

  const openActivityCard = (id: DowntimeActivityId) => {
    const cur = [...myPicks];
    const idx = cur.indexOf(id);
    if (idx < 0) {
      if (cur.length >= MAX_DOWNTIME_PICKS) {
        alert(`Choose exactly ${MAX_DOWNTIME_PICKS} activities first.`);
        return;
      }
      cur.push(id);
      const res = setDowntimePicks(hunter.id, cur);
      if (!res.ok) {
        alert(res.reason);
        return;
      }
    }
    setOpenActivity(id);
  };

  const finishDay = () => {
    const res = confirmDowntime(hunter.id);
    if (!res.ok) {
      alert(res.reason);
      return;
    }
    setConfirmEnd(false);
    if (!useCampaign.getState().campaign?.activeDowntime) {
      navigate("/", { replace: true });
    } else {
      setAwaitingPartyFinish(true);
    }
  };

  const activityMeta = (id: DowntimeActivityId) => {
    if (id === "handler") return HANDLER_ACTIVITY;
    return DOWNTIME_ACTIVITIES.find((a) => a.id === id)!;
  };

  if (openActivity && !myConfirmed) {
    const meta = activityMeta(openActivity);
    return (
      <Screen
        title="Downtime"
        hideHeader
        background="/backgrounds/Downtime.png"
      >
        <button
          type="button"
          onClick={() => setOpenActivity(null)}
          aria-label="Back"
          className="mb-3 grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-line-strong bg-card text-lg active:translate-y-px"
        >
          ‹
        </button>
        <p className="font-display text-2xl leading-tight">{meta.label}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{meta.description}</p>

        <div className="mt-4">
          {openActivity === "provisions" && (
            <ProvisionsPanel
              materials={hunter.materials}
              potions={campaign.items.potion ?? 0}
              saved={dt.provisions[hunter.id]}
              onSave={(trade) => {
                const res = resolveProvisions(hunter.id, trade);
                if (!res.ok) alert(res.reason);
                else setOpenActivity(null);
              }}
            />
          )}
          {openActivity === "resource-center" && (
            <ResourceCenterPanel
              savedRoll={dt.resourceRoll[hunter.id]}
              onRoll={(sum) => {
                const res = resolveResourceCenter(hunter.id, sum);
                if (!res.ok) alert(res.reason);
                else setOpenActivity(null);
              }}
            />
          )}
          {openActivity === "chef" && (
            <ChefPanel
              selected={dt.chefElement[hunter.id]}
              onSelect={(el) => {
                const res = resolveChef(hunter.id, el);
                if (!res.ok) alert(res.reason);
              }}
            />
          )}
          {openActivity === "poogie" && (
            <div className="paper-card p-4 text-center">
              <p className="text-3xl">🐷</p>
              <p className="mt-2 font-semibold">Pet Poogie</p>
              <p className="mt-1 text-sm text-ink-soft">
                *happy oink* — maybe it brings luck!
              </p>
              <Button
                disabled={Boolean(dt.poogieDone[hunter.id])}
                onClick={() => {
                  const res = resolvePoogie(hunter.id);
                  if (!res.ok) alert(res.reason);
                  else setOpenActivity(null);
                }}
                className="mt-4 w-full py-2 text-sm font-semibold"
              >
                {dt.poogieDone[hunter.id] ? "Poogie petted ✓" : "Done"}
              </Button>
            </div>
          )}
          {openActivity === "handler" && (
            <HandlerPanel
              pool={handlerPool}
              onStart={(questId) => {
                const res = startHandlerQuest(questId, hunter.id);
                if (!res.ok) {
                  alert(res.reason ?? "Quest could not be started.");
                  return;
                }
                navigate("/campaign/quest");
              }}
            />
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Downtime" hideHeader background="/backgrounds/Downtime.png">
      <div className="mb-4 text-center">
        <p className="font-display text-3xl leading-none">Downtime</p>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft">
          Day {campaign.day} · {myPicks.length}/{MAX_DOWNTIME_PICKS} activities
        </p>
      </div>

      {!myConfirmed && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {DOWNTIME_ACTIVITIES.map((a) => {
              const selected = myPicks.includes(a.id);
              const resolved = selected && isActivityResolved(a.id, hunter.id, dt);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openActivityCard(a.id)}
                  className={`paper-card relative p-3 text-left active:translate-y-px ${
                    selected ? "ring-1 ring-accent" : ""
                  }`}
                >
                  {resolved && (
                    <span className="absolute right-2 top-2 text-sm text-ok">✓</span>
                  )}
                  <p className="pr-5 font-semibold leading-tight">{a.label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-ink-soft">
                    {a.description}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpenActivity("handler")}
            className="paper-card mt-3 w-full border-[1.5px] border-line-strong p-3 text-left active:translate-y-px"
          >
            <p className="font-semibold">{HANDLER_ACTIVITY.label}</p>
            <p className="mt-1 text-[11px] text-ink-soft">
              {HANDLER_ACTIVITY.description}
            </p>
            <p className="mt-1 text-[11px] text-accent">
              Starts a quest right away — invites the party to join.
            </p>
          </button>

          <div className="mt-4 flex gap-2">
            {/* Cancelling scraps the day for the whole party, so it is the
                leader's call — everyone else just finishes their own day. */}
            {isLeader && (
              <Button
                variant="secondary"
                onClick={() => {
                  const res = cancelDowntime(hunter.id);
                  if (!res.ok && res.reason) alert(res.reason);
                  else navigate("/");
                }}
                className="flex-1 py-3 text-sm font-semibold"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => {
                if (!downtimeReady) {
                  alert("Complete all chosen activities first.");
                  return;
                }
                setConfirmEnd(true);
              }}
              disabled={!downtimeReady}
              className="flex-1 py-3 text-sm font-semibold"
            >
              Finish day
            </Button>
          </div>
        </>
      )}

      {myConfirmed && campaign.activeDowntime && (
        <div className="paper-card p-5 text-center">
          <p className="font-semibold">Ready!</p>
          <p className="mt-2 text-sm text-ink-soft">
            Waiting for {hunterIds.length - dt.confirmedHunterIds.length} more
            hunter{hunterIds.length - dt.confirmedHunterIds.length === 1 ? "" : "s"}…
          </p>
        </div>
      )}

      {confirmEnd && (
        <ConfirmDialog
          title="Finish downtime?"
          message="This consumes a campaign day. Have you completed all chosen activities?"
          onConfirm={finishDay}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </Screen>
  );
}

function ProvisionsPanel({
  materials,
  potions,
  saved,
  onSave,
}: {
  materials: Record<string, number>;
  potions: number;
  saved?: ProvisionsTrade;
  onSave: (trade: ProvisionsTrade) => void;
}) {
  const commons = commonTradeableMaterialIds();
  const [offered, setOffered] = useState<Record<string, number>>(
    saved?.offered ?? {},
  );
  const [rewardId, setRewardId] = useState(saved?.rewardId ?? commons[0] ?? "");

  const total = Object.values(offered).reduce((s, q) => s + q, 0);

  const setOfferQty = (id: string, qty: number) => {
    const next = { ...offered };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    setOffered(next);
  };

  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Provisions Stockpile</p>
      <p className="mt-1 text-xs text-ink-soft">
        Trade {total}/{PROVISIONS_TRADE_COST} common materials
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {commons.map((id) => {
          const mat = gameData.materials.find((m) => m.id === id);
          if (!mat) return null;
          const have = materials[id] ?? 0;
          if (have <= 0 && !(offered[id] ?? 0)) return null;
          return (
            <div
              key={id}
              className="flex items-center gap-2 rounded-lg border border-line px-2 py-1"
            >
              <img
                src={iconUrl(mat.iconType)}
                alt=""
                className="h-6 w-6 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium">{mat.name}</p>
                <Stepper
                  value={offered[id] ?? 0}
                  onChange={(v) => setOfferQty(id, Math.min(v, have))}
                  min={0}
                  max={have}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Reward
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {commons.map((id) => {
          const mat = gameData.materials.find((m) => m.id === id);
          if (!mat) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setRewardId(id)}
              className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                rewardId === id ? "border-accent bg-accent-faint" : "border-line"
              }`}
            >
              {mat.name}
            </button>
          );
        })}
        <button
          type="button"
          disabled={potions >= MAX_POTIONS}
          onClick={() => setRewardId("potion")}
          className={`rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-40 ${
            rewardId === "potion" ? "border-accent bg-accent-faint" : "border-line"
          }`}
        >
          Potion ({potions}/{MAX_POTIONS})
        </button>
      </div>
      <Button
        disabled={saved != null || total !== PROVISIONS_TRADE_COST}
        onClick={() => onSave({ offered, rewardId })}
        className="mt-3 w-full py-2 text-sm font-semibold"
      >
        {saved ? "Trade saved ✓" : "Confirm trade"}
      </Button>
    </div>
  );
}

function sumToDice(sum: number): [number, number] {
  const a = Math.min(6, Math.max(1, sum - 1));
  const b = sum - a;
  if (b >= 1 && b <= 6) return [a, b];
  const fallback = Math.min(6, sum);
  return [fallback, Math.max(1, sum - fallback)];
}

function ResourceCenterPanel({
  savedRoll,
  onRoll,
}: {
  savedRoll?: number;
  onRoll: (sum: number) => void;
}) {
  const [dice, setDice] = useState<[number, number]>(() =>
    savedRoll != null ? sumToDice(savedRoll) : rollDice(),
  );

  useEffect(() => {
    if (savedRoll != null) setDice(sumToDice(savedRoll));
  }, [savedRoll]);

  const tableRows = Object.entries(RESOURCE_CENTER_TABLE).map(([roll, matId]) => {
    const mat = gameData.materials.find((m) => m.id === matId);
    return { roll: Number(roll), name: mat?.name ?? matId };
  });

  const applyRoll = (sum: number) => {
    if (sum >= 2 && sum <= 12) onRoll(sum);
  };

  return (
    <div>
      <p className="mb-2 font-semibold">Resource Center</p>
      <p className="mb-3 text-xs text-ink-soft">Roll 2 dice (sum 2–12)</p>
      {savedRoll != null && (
        <p className="mb-2 text-xs text-ink-soft">
          Roll saved — change and confirm again to update.
        </p>
      )}
      <DiceRollCard
        dice={dice}
        onDiceChange={setDice}
        onReroll={() => setDice(rollDice())}
        footer={({ dice, commit }) => (
          <Button
            onClick={() => {
              const [a, b] = commit();
              applyRoll(a + b);
            }}
            className="mt-3 w-full py-2 text-sm font-semibold"
          >
            {savedRoll != null
              ? `Update roll (${dice[0] + dice[1]})`
              : `Confirm roll (${dice[0] + dice[1]})`}
          </Button>
        )}
      />
      {savedRoll != null && (
        <p className="mt-2 text-xs text-ink-soft">
          Saved: <strong>{savedRoll}</strong> →{" "}
          {gameData.materials.find((m) => m.id === RESOURCE_CENTER_TABLE[savedRoll])
            ?.name ?? "?"}
        </p>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-soft">Table</summary>
        <ul className="mt-2 space-y-0.5 text-xs">
          {tableRows.map((r) => (
            <li key={r.roll}>
              {r.roll}: {r.name}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function ChefPanel({
  selected,
  onSelect,
}: {
  selected?: ElementType;
  onSelect: (el: ElementType) => void;
}) {
  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Meowscular Chef</p>
      <p className="mt-1 text-xs text-ink-soft">+1 resistance for the next quest</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ELEMENT_TYPES.map((el) => (
          <button
            key={el.id}
            type="button"
            onClick={() => onSelect(el.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              selected === el.id ? "border-accent bg-accent-faint" : "border-line"
            }`}
          >
            {el.label}
          </button>
        ))}
      </div>
      {selected && (
        <p className="mt-2 text-xs text-ok">
          Selected: {ELEMENT_TYPES.find((e) => e.id === selected)?.label} ✓
        </p>
      )}
    </div>
  );
}

function HandlerPanel({
  pool,
  onStart,
}: {
  pool: QuestDef[];
  onStart: (questId: string) => void;
}) {
  if (pool.length === 0) {
    return (
      <div className="paper-card p-4 text-sm text-ink-soft">
        No exhausted investigation or tempered quests available yet. Finish an
        investigation or tempered hunt 4× to replay it here.
      </div>
    );
  }

  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Handler</p>
      <p className="mt-1 text-xs text-ink-soft">
        Pick a quest to replay — it starts right away and invites the party.
      </p>
      <div className="mt-3 flex flex-col gap-1">
        {pool.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onStart(q.id)}
            className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-left text-sm active:translate-y-px"
          >
            <img src={iconUrl(q.icon)} alt="" className="h-6 w-6 object-contain" />
            <span className="flex-1">{q.name}</span>
            <img src={iconUrl(q.stars)} alt="" className="h-4 w-4 object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
}
