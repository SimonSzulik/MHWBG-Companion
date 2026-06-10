import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameData } from "../data/gameData";
import {
  allHuntersPickedHandler,
  commonTradeableMaterialIds,
  DOWNTIME_ACTIVITIES,
  ELEMENT_TYPES,
  HANDLER_ACTIVITY,
  MAX_DOWNTIME_PICKS,
  MAX_POTIONS,
  PROVISIONS_TRADE_COST,
  RESOURCE_CENTER_TABLE,
  handlerQuestPool,
  roll2d6,
} from "../domain/downtime";
import type {
  ActiveDowntime,
  DowntimeActivityId,
  ElementType,
  ProvisionsTrade,
} from "../domain/types";
import { questById } from "../domain/quests";
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
  hunterIds: string[],
): boolean {
  switch (id) {
    case "provisions":
      return Boolean(dt.provisions[hunterId]);
    case "resource-center":
      return dt.resourceRoll[hunterId] != null;
    case "chef":
      return Boolean(dt.chefElement[hunterId]);
    case "poogie":
      return true;
    case "handler":
      return (
        allHuntersPickedHandler(hunterIds, dt.picks) &&
        Boolean(dt.handlerProposals[hunterId]) &&
        Boolean(dt.handlerQuestId)
      );
  }
}

/** Downtime day: hub with activity cards, drill-in panels, confirm with party. */
export function DowntimeScreen() {
  const { campaign, hunter } = useOwnHunter();
  const beginDowntime = useCampaign((s) => s.beginDowntime);
  const setDowntimePicks = useCampaign((s) => s.setDowntimePicks);
  const resolveProvisions = useCampaign((s) => s.resolveProvisions);
  const resolveResourceCenter = useCampaign((s) => s.resolveResourceCenter);
  const resolveChef = useCampaign((s) => s.resolveChef);
  const setHandlerQuest = useCampaign((s) => s.setHandlerQuest);
  const confirmDowntime = useCampaign((s) => s.confirmDowntime);
  const cancelDowntime = useCampaign((s) => s.cancelDowntime);
  const navigate = useNavigate();
  const [openActivity, setOpenActivity] = useState<DowntimeActivityId | null>(
    null,
  );
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    beginDowntime();
  }, [beginDowntime]);

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

  const hunterIds = campaign.hunters.map((h) => h.id);
  const myPicks = dt.picks[hunter.id] ?? [];
  const handlerActive = allHuntersPickedHandler(hunterIds, dt.picks);
  const handlerPool = handlerQuestPool(campaign.questCompletions);
  const myConfirmed = dt.confirmedHunterIds.includes(hunter.id);
  const unanimousQuest = dt.handlerQuestId
    ? questById(dt.handlerQuestId)
    : undefined;

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
    navigate("/");
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
              }}
            />
          )}
          {openActivity === "resource-center" && (
            <ResourceCenterPanel
              savedRoll={dt.resourceRoll[hunter.id]}
              onRoll={(sum) => {
                const res = resolveResourceCenter(hunter.id, sum);
                if (!res.ok) alert(res.reason);
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
            </div>
          )}
          {openActivity === "handler" && handlerActive && (
            <HandlerPanel
              pool={handlerPool}
              myProposal={dt.handlerProposals[hunter.id]}
              unanimousQuest={unanimousQuest}
              proposals={dt.handlerProposals}
              hunterIds={hunterIds}
              onPropose={(questId) => {
                const res = setHandlerQuest(hunter.id, questId);
                if (!res.ok) alert(res.reason);
              }}
            />
          )}
          {openActivity === "handler" && !handlerActive && (
            <div className="paper-card p-4 text-sm text-ink-soft">
              All hunters must pick Visit the Handler before choosing a quest.
            </div>
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
              const resolved = selected && isActivityResolved(a.id, hunter.id, dt, hunterIds);
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
            onClick={() => openActivityCard("handler")}
            className={`paper-card mt-3 w-full border-[1.5px] p-3 text-left active:translate-y-px ${
              myPicks.includes("handler")
                ? "border-accent bg-accent-faint ring-1 ring-accent"
                : "border-line-strong"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{HANDLER_ACTIVITY.label}</p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  {HANDLER_ACTIVITY.description}
                </p>
                {myPicks.includes("handler") && !handlerActive && (
                  <p className="mt-1 text-[11px] text-accent">
                    Waiting for all hunters…
                  </p>
                )}
              </div>
              {myPicks.includes("handler") &&
                isActivityResolved("handler", hunter.id, dt, hunterIds) && (
                  <span className="text-sm text-ok">✓</span>
                )}
            </div>
          </button>

          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                cancelDowntime();
                navigate("/");
              }}
              className="flex-1 py-3 text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (myPicks.length !== MAX_DOWNTIME_PICKS) {
                  alert(`Choose exactly ${MAX_DOWNTIME_PICKS} activities.`);
                  return;
                }
                if (myPicks.includes("handler") && !handlerActive) {
                  alert("Handler: all hunters must pick Visit the Handler.");
                  return;
                }
                setConfirmEnd(true);
              }}
              disabled={myPicks.length !== MAX_DOWNTIME_PICKS}
              className="flex-1 py-3 text-sm font-semibold"
            >
              Finish day
            </Button>
          </div>
        </>
      )}

      {myConfirmed && (
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
        disabled={saved != null}
        onClick={() => onSave({ offered, rewardId })}
        className="mt-3 w-full py-2 text-sm font-semibold"
      >
        {saved ? "Trade saved ✓" : "Confirm trade"}
      </Button>
    </div>
  );
}

function ResourceCenterPanel({
  savedRoll,
  onRoll,
}: {
  savedRoll?: number;
  onRoll: (sum: number) => void;
}) {
  const [manual, setManual] = useState("");

  const tableRows = Object.entries(RESOURCE_CENTER_TABLE).map(([roll, matId]) => {
    const mat = gameData.materials.find((m) => m.id === matId);
    return { roll: Number(roll), name: mat?.name ?? matId };
  });

  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Resource Center</p>
      <p className="mt-1 text-xs text-ink-soft">Roll 2 dice (sum 2–12)</p>
      {savedRoll != null ? (
        <p className="mt-3 text-sm">
          Rolled: <strong>{savedRoll}</strong> →{" "}
          {gameData.materials.find((m) => m.id === RESOURCE_CENTER_TABLE[savedRoll])
            ?.name ?? "?"}{" "}
          ✓
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={() => onRoll(roll2d6())} className="py-2 text-sm font-semibold">
            Roll dice
          </Button>
          <div className="flex gap-2">
            <input
              type="number"
              min={2}
              max={12}
              placeholder="2–12"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="flex-1 rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => {
                const n = parseInt(manual, 10);
                if (n >= 2 && n <= 12) onRoll(n);
              }}
              className="px-4 py-2 text-sm font-semibold"
            >
              OK
            </Button>
          </div>
        </div>
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
  myProposal,
  unanimousQuest,
  proposals,
  hunterIds,
  onPropose,
}: {
  pool: QuestDef[];
  myProposal?: string;
  unanimousQuest: QuestDef | undefined;
  proposals: Record<string, string>;
  hunterIds: string[];
  onPropose: (questId: string) => void;
}) {
  const matchCount = hunterIds.filter(
    (id) => proposals[id] && proposals[id] === myProposal,
  ).length;

  if (pool.length === 0) {
    return (
      <div className="paper-card p-4 text-sm text-ink-soft">
        No exhausted investigation or tempered quests available.
      </div>
    );
  }

  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Handler</p>
      <p className="mt-1 text-xs text-ink-soft">
        All hunters must pick the same quest.
      </p>
      {unanimousQuest ? (
        <p className="mt-2 text-sm text-ok">Agreed: {unanimousQuest.name} ✓</p>
      ) : (
        <p className="mt-2 text-xs text-ink-soft">
          Agreement: {matchCount}/{hunterIds.length}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-1">
        {pool.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onPropose(q.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
              myProposal === q.id ? "border-accent bg-accent-faint" : "border-line"
            }`}
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
