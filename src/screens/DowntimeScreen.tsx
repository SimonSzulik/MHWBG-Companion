import { useEffect, useMemo, useState } from "react";
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
  DowntimeActivityId,
  ElementType,
  ProvisionsTrade,
} from "../domain/types";
import { questById } from "../domain/quests";
import type { QuestDef } from "../data/quests";
import { iconUrl } from "../domain/icons";
import { ownHunter } from "../lib/hunter";
import { useAuth } from "../store/auth";
import { useCampaign } from "../store/campaign";
import { Stepper } from "../ui/Stepper";
import { Screen } from "../ui/Screen";
import { ConfirmDialog } from "./CampaignScreen";

const ALL_ACTIVITIES: {
  id: DowntimeActivityId;
  label: string;
  description: string;
}[] = [...DOWNTIME_ACTIVITIES, HANDLER_ACTIVITY];

/** Downtime day: pick 3 activities, resolve each, confirm with party. */
export function DowntimeScreen() {
  const campaign = useCampaign((s) => s.campaign);
  const beginDowntime = useCampaign((s) => s.beginDowntime);
  const setDowntimePicks = useCampaign((s) => s.setDowntimePicks);
  const resolveProvisions = useCampaign((s) => s.resolveProvisions);
  const resolveResourceCenter = useCampaign((s) => s.resolveResourceCenter);
  const resolveChef = useCampaign((s) => s.resolveChef);
  const setHandlerQuest = useCampaign((s) => s.setHandlerQuest);
  const confirmDowntime = useCampaign((s) => s.confirmDowntime);
  const cancelDowntime = useCampaign((s) => s.cancelDowntime);
  const userId = useAuth((s) => s.userId);
  const navigate = useNavigate();
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    beginDowntime();
  }, [beginDowntime]);

  if (!campaign) return null;
  const hunter = ownHunter(campaign, userId);
  if (!hunter) return null;

  if (campaign.activeQuest) {
    return (
      <Screen title="Downtime" subtitle="Nicht verfügbar">
        <div className="paper-card p-5 text-center text-sm text-ink-soft">
          Während einer laufenden Quest kein Downtime möglich.
        </div>
      </Screen>
    );
  }

  const dt = campaign.activeDowntime;
  if (!dt) {
    return (
      <Screen title="Downtime" subtitle="Lädt…">
        <div className="paper-card p-5 text-center text-sm text-ink-soft">
          Downtime wird vorbereitet…
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

  const togglePick = (id: DowntimeActivityId) => {
    const cur = [...myPicks];
    const idx = cur.indexOf(id);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else if (cur.length < MAX_DOWNTIME_PICKS) {
      cur.push(id);
    } else {
      return;
    }
    const res = setDowntimePicks(hunter.id, cur);
    if (!res.ok) alert(res.reason);
  };

  const savePicks = () => {
    if (myPicks.length !== MAX_DOWNTIME_PICKS) {
      alert(`Wähle genau ${MAX_DOWNTIME_PICKS} Aktivitäten.`);
      return;
    }
    if (myPicks.includes("handler") && !handlerActive) {
      alert("Handler: Alle Jäger müssen Handler wählen.");
    }
  };

  const finishDay = () => {
    const res = confirmDowntime(hunter.id);
    if (!res.ok) {
      alert(res.reason);
      return;
    }
    setConfirmEnd(false);
    navigate("/campaign");
  };

  return (
    <Screen title="Downtime" subtitle={`Tag ${campaign.day} · 3 Aktivitäten`}>
      <PartyStatus
        hunters={campaign.hunters}
        confirmedIds={dt.confirmedHunterIds}
        picks={dt.picks}
      />

      {!myConfirmed && (
        <>
          <section className="paper-card p-4">
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Aktivitäten wählen ({myPicks.length}/{MAX_DOWNTIME_PICKS})
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {ALL_ACTIVITIES.map((a) => {
                const selected = myPicks.includes(a.id);
                const handlerBlocked =
                  a.id === "handler" &&
                  myPicks.includes("handler") &&
                  !handlerActive &&
                  selected;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => togglePick(a.id)}
                    className={`rounded-xl border-[1.5px] px-3 py-2.5 text-left active:translate-y-px ${
                      selected
                        ? "border-accent bg-accent-faint ring-1 ring-accent"
                        : "border-line-strong bg-card"
                    } ${myPicks.length >= MAX_DOWNTIME_PICKS && !selected ? "opacity-50" : ""}`}
                  >
                    <p className="font-semibold">{a.label}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{a.description}</p>
                    {handlerBlocked && (
                      <p className="mt-1 text-[11px] text-accent">
                        Warte auf alle Jäger…
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {myPicks.length === MAX_DOWNTIME_PICKS && (
            <div className="mt-4 flex flex-col gap-3">
              {myPicks.includes("provisions") && (
                <ProvisionsPanel
                  hunterId={hunter.id}
                  materials={hunter.materials}
                  potions={campaign.items.potion ?? 0}
                  saved={dt.provisions[hunter.id]}
                  onSave={(trade) => {
                    const res = resolveProvisions(hunter.id, trade);
                    if (!res.ok) alert(res.reason);
                  }}
                />
              )}
              {myPicks.includes("resource-center") && (
                <ResourceCenterPanel
                  savedRoll={dt.resourceRoll[hunter.id]}
                  onRoll={(sum) => {
                    const res = resolveResourceCenter(hunter.id, sum);
                    if (!res.ok) alert(res.reason);
                  }}
                />
              )}
              {myPicks.includes("chef") && (
                <ChefPanel
                  selected={dt.chefElement[hunter.id]}
                  onSelect={(el) => {
                    const res = resolveChef(hunter.id, el);
                    if (!res.ok) alert(res.reason);
                  }}
                />
              )}
              {myPicks.includes("poogie") && (
                <div className="paper-card p-4 text-center">
                  <p className="text-3xl">🐷</p>
                  <p className="mt-2 font-semibold">Poogie streicheln</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    *glückliches Grunzen* – vielleicht bringt&apos;s Glück!
                  </p>
                </div>
              )}
              {myPicks.includes("handler") && handlerActive && (
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
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                cancelDowntime();
                navigate("/campaign");
              }}
              className="flex-1 rounded-xl border-[1.5px] border-line-strong py-3 text-sm font-semibold active:translate-y-px"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => {
                savePicks();
                setConfirmEnd(true);
              }}
              disabled={myPicks.length !== MAX_DOWNTIME_PICKS}
              className="flex-1 rounded-xl border-[1.5px] border-line-strong bg-accent py-3 text-sm font-semibold text-white active:translate-y-px disabled:opacity-40"
            >
              Tag abschließen
            </button>
          </div>
        </>
      )}

      {myConfirmed && (
        <div className="paper-card p-5 text-center">
          <p className="font-semibold">Bereit!</p>
          <p className="mt-2 text-sm text-ink-soft">
            Warte auf {hunterIds.length - dt.confirmedHunterIds.length} weitere
            Jäger…
          </p>
        </div>
      )}

      {confirmEnd && (
        <ConfirmDialog
          title="Downtime abschließen?"
          message="Der Kampagnentag wird verbraucht. Alle gewählten Aktivitäten sind erledigt?"
          onConfirm={finishDay}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </Screen>
  );
}

function PartyStatus({
  hunters,
  confirmedIds,
  picks,
}: {
  hunters: { id: string; name: string }[];
  confirmedIds: string[];
  picks: Record<string, DowntimeActivityId[]>;
}) {
  return (
    <div className="mb-4 paper-card p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Gruppe</p>
      <div className="flex flex-col gap-1">
        {hunters.map((h) => {
          const p = picks[h.id] ?? [];
          const done = confirmedIds.includes(h.id);
          return (
            <div key={h.id} className="flex items-center justify-between text-sm">
              <span>{h.name}</span>
              <span className="text-ink-soft">
                {done ? "✓ bestätigt" : `${p.length}/3 gewählt`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProvisionsPanel({
  hunterId: _hunterId,
  materials,
  potions,
  saved,
  onSave,
}: {
  hunterId: string;
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
      <p className="font-semibold">Vorratslager</p>
      <p className="mt-1 text-xs text-ink-soft">
        {total}/{PROVISIONS_TRADE_COST} Materialien abgeben
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {commons.map((id) => {
          const mat = gameData.materials.find((m) => m.id === id);
          if (!mat) return null;
          const have = materials[id] ?? 0;
          if (have <= 0 && !(offered[id] ?? 0)) return null;
          return (
            <div key={id} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1">
              <img src={iconUrl(mat.iconType)} alt="" className="h-6 w-6 object-contain" />
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
        Belohnung
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
          Trank ({potions}/{MAX_POTIONS})
        </button>
      </div>
      <button
        type="button"
        disabled={saved != null}
        onClick={() => onSave({ offered, rewardId })}
        className="mt-3 w-full rounded-xl border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {saved ? "Getauscht ✓" : "Tausch bestätigen"}
      </button>
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

  const tableRows = useMemo(() => {
    return Object.entries(RESOURCE_CENTER_TABLE).map(([roll, matId]) => {
      const mat = gameData.materials.find((m) => m.id === matId);
      return { roll: Number(roll), name: mat?.name ?? matId };
    });
  }, []);

  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Ressourcenzentrum</p>
      <p className="mt-1 text-xs text-ink-soft">2 Würfel (Summe 2–12)</p>
      {savedRoll != null ? (
        <p className="mt-3 text-sm">
          Gewürfelt: <strong>{savedRoll}</strong> →{" "}
          {gameData.materials.find((m) => m.id === RESOURCE_CENTER_TABLE[savedRoll])
            ?.name ?? "?"}{" "}
          ✓
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onRoll(roll2d6())}
            className="rounded-xl border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white"
          >
            Würfeln
          </button>
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
            <button
              type="button"
              onClick={() => {
                const n = parseInt(manual, 10);
                if (n >= 2 && n <= 12) onRoll(n);
              }}
              className="rounded-xl border-[1.5px] border-line-strong px-4 py-2 text-sm font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-soft">Tabelle</summary>
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
      <p className="mt-1 text-xs text-ink-soft">+1 Widerstand für die nächste Quest</p>
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
        <p className="mt-2 text-xs text-ok">Gewählt: {ELEMENT_TYPES.find((e) => e.id === selected)?.label} ✓</p>
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
        Keine erschöpften Untersuchungs-Quests verfügbar.
      </div>
    );
  }

  return (
    <div className="paper-card p-4">
      <p className="font-semibold">Handler</p>
      <p className="mt-1 text-xs text-ink-soft">
        Alle Jäger müssen dieselbe Quest wählen.
      </p>
      {unanimousQuest ? (
        <p className="mt-2 text-sm text-ok">
          Einigung: {unanimousQuest.name} ✓
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-soft">
          Übereinstimmung: {matchCount}/{hunterIds.length}
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
