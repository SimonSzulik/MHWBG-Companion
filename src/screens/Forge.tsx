import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { gameData } from "../data/gameData";
import { FORGE_WEAPON_TYPES } from "../data/forge/ancientForestWeapons";
import {
  armorSets,
  catalog,
  craftState,
  pathsForWeapon,
  pathHasCraftable,
  pathProgressName,
  setProgressLabel,
  isEquipped,
  type CraftState,
  type ForgePathLike,
} from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { DeckChanges, GearDef } from "../domain/types";

type Tab = "weapons" | "armour";

/**
 * Forge drill-in. Weapon tab shows collapsible forge paths; armour tab shows
 * collapsible armour sets from the reference cards.
 */
export function Forge() {
  const [tab, setTab] = useState<Tab>("weapons");
  const campaign = useCampaign((s) => s.campaign);
  const craft = useCampaign((s) => s.craftGear);
  if (!campaign) return null;

  const mainWeapon = campaign.hunters[0]?.weaponType;
  const usePathForge =
    tab === "weapons" &&
    mainWeapon != null &&
    FORGE_WEAPON_TYPES.includes(mainWeapon);

  const onCraft = (id: string) => {
    const res = craft(id);
    if (!res.ok && res.reason) alert(res.reason);
  };

  return (
    <Screen
      title="Forge"
      subtitle={tab === "weapons" ? `${mainWeapon} only` : "Rüstung"}
    >
      <div className="mb-4 flex rounded-xl border-[1.5px] border-line-strong bg-paper-2 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setTab("weapons")}
          className={`flex-1 rounded-lg px-3 py-2 ${
            tab === "weapons" ? "bg-accent text-white" : "text-ink-soft"
          }`}
        >
          Waffen
        </button>
        <button
          type="button"
          onClick={() => setTab("armour")}
          className={`flex-1 rounded-lg px-3 py-2 ${
            tab === "armour" ? "bg-accent text-white" : "text-ink-soft"
          }`}
        >
          Rüstung
        </button>
      </div>

      {usePathForge && mainWeapon ? (
        <PathForgeList
          paths={pathsForWeapon(mainWeapon)}
          progressLabel={(path) => pathProgressName(path, campaign)}
          sequential
          onCraft={onCraft}
        />
      ) : tab === "weapons" ? (
        <FlatGearList
          items={gameData.gear.filter(
            (g) => g.slot === "weapon" && g.weaponType === mainWeapon,
          )}
          onCraft={onCraft}
        />
      ) : (
        <PathForgeList
          paths={armorSets()}
          progressLabel={(path) => setProgressLabel(path, campaign)}
          sequential={false}
          onCraft={onCraft}
        />
      )}
    </Screen>
  );
}

function PathForgeList({
  paths,
  progressLabel,
  sequential,
  onCraft,
}: {
  paths: ForgePathLike[];
  progressLabel: (path: ForgePathLike) => string;
  sequential: boolean;
  onCraft: (id: string) => void;
}) {
  const campaign = useCampaign((s) => s.campaign);
  const [openId, setOpenId] = useState<string | null>(
    paths.find((p) => campaign && pathHasCraftable(p, campaign))?.id ??
      paths[0]?.id ??
      null,
  );

  if (!campaign) return null;

  return (
    <div className="flex flex-col gap-3">
      {paths.map((path) => (
        <ForgePathTile
          key={path.id}
          path={path}
          progress={progressLabel(path)}
          open={openId === path.id}
          sequential={sequential}
          onToggle={() =>
            setOpenId((cur) => (cur === path.id ? null : path.id))
          }
          onCraft={onCraft}
        />
      ))}
    </div>
  );
}

function ForgePathTile({
  path,
  progress,
  open,
  sequential,
  onToggle,
  onCraft,
}: {
  path: ForgePathLike;
  progress: string;
  open: boolean;
  sequential: boolean;
  onToggle: () => void;
  onCraft: (id: string) => void;
}) {
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  const highlight = pathHasCraftable(path, campaign);

  return (
    <div
      className={`paper-card overflow-hidden ${
        highlight ? "ring-1 ring-ok" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:translate-y-px"
      >
        <img
          src={iconUrl(path.icon)}
          alt=""
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{path.label}</p>
          {!open && (
            <p className="truncate text-sm text-ink-soft">{progress}</p>
          )}
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
            {path.gearIds.map((gearId, i) => {
              const gear = catalog.gear(gearId);
              if (!gear) return null;
              return (
                <ForgeGearNode
                  key={`${path.id}-${gearId}`}
                  gear={gear}
                  showTreeLine={sequential && i < path.gearIds.length - 1}
                  onCraft={() => onCraft(gearId)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgeGearNode({
  gear,
  showTreeLine,
  onCraft,
}: {
  gear: GearDef;
  showTreeLine: boolean;
  onCraft: () => void;
}) {
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  const state = craftState(gear, campaign);
  const equipped = isEquipped(gear.id, campaign);
  const badge = badgeFor(state, equipped);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <TreeDot state={state} />
        {showTreeLine && (
          <div className="mt-1 w-0.5 flex-1 bg-line-strong" />
        )}
      </div>

      <div
        className={`mb-3 flex-1 rounded-xl border-[1.5px] border-line-strong bg-card p-3 ${
          state === "craftable" ? "bg-ok-soft/30 ring-1 ring-ok" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {gear.tierIcon && (
              <img
                src={iconUrl(gear.tierIcon)}
                alt=""
                className="h-5 w-5 object-contain"
              />
            )}
            <p className="font-semibold leading-tight">{gear.name}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>

        {gear.defense != null && (
          <p className="mt-1 text-xs text-ink-soft">Verteidigung {gear.defense}</p>
        )}

        {gear.effect && (
          <p className="mt-0.5 text-xs text-ink-soft">{gear.effect}</p>
        )}

        {gear.cost.length > 0 && state !== "owned" && (
          <MaterialCostList gear={gear} />
        )}

        {gear.cost.length === 0 && state !== "owned" && gear.slot === "weapon" && (
          <p className="mt-2 text-xs text-ink-soft">Startwaffe</p>
        )}

        {gear.deckChanges && <DeckChangesBlock changes={gear.deckChanges} />}

        {state === "craftable" && (
          <button
            type="button"
            onClick={onCraft}
            className="mt-3 w-full rounded-lg border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white active:translate-y-px"
          >
            Schmieden
          </button>
        )}
      </div>
    </div>
  );
}

function DeckChangesBlock({ changes }: { changes: DeckChanges }) {
  const hasRemove = (changes.remove?.length ?? 0) > 0;
  const hasAdd = (changes.add?.length ?? 0) > 0;
  if (!hasRemove && !hasAdd) return null;

  return (
    <div className="mt-3 border-t border-line pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {hasRemove && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
              Entfernen
            </p>
            <ul className="flex flex-col gap-0.5 text-[11px] leading-snug">
              {changes.remove!.map((card) => (
                <li key={card}>− {card}</li>
              ))}
            </ul>
          </div>
        )}
        {hasAdd && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
              Hinzufügen
            </p>
            <ul className="flex flex-col gap-0.5 text-[11px] leading-snug">
              {changes.add!.map((card) => (
                <li key={card}>+ {card}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialCostList({ gear }: { gear: GearDef }) {
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  return (
    <ul className="mt-2 flex flex-col gap-1 text-xs">
      {gear.cost.map((c) => {
        const have = campaign.materials[c.materialId] ?? 0;
        const enough = have >= c.qty;
        const name =
          catalog.material(c.materialId)?.name ?? c.materialId;
        return (
          <li
            key={c.materialId}
            className={enough ? "text-ok" : "text-ink-soft"}
          >
            {enough ? "✓" : "○"} {name} {have}/{c.qty}
          </li>
        );
      })}
    </ul>
  );
}

function TreeDot({ state }: { state: CraftState }) {
  if (state === "owned" || state === "craftable") {
    return (
      <span
        className={`h-3 w-3 rounded-full ${
          state === "craftable" ? "bg-ok" : "bg-ink"
        }`}
      />
    );
  }
  return (
    <span className="h-3 w-3 rounded-full border-2 border-line-strong bg-paper" />
  );
}

function badgeFor(state: CraftState, equipped: boolean) {
  if (state === "owned") {
    return equipped
      ? { label: "AUSGERÜSTET", cls: "bg-paper-2 text-ink-soft" }
      : { label: "BESITZ", cls: "bg-paper-2 text-ink-soft" };
  }
  if (state === "craftable") {
    return { label: "BAUBAR", cls: "bg-ok-soft text-ok" };
  }
  return { label: "TEILE FEHLEN", cls: "bg-paper-2 text-ink-soft" };
}

function FlatGearList({
  items,
  onCraft,
}: {
  items: GearDef[];
  onCraft: (id: string) => void;
}) {
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((g) => (
        <GearCard
          key={g.id}
          gear={g}
          state={craftState(g, campaign)}
          onCraft={() => onCraft(g.id)}
        />
      ))}
      {items.length === 0 && (
        <p className="text-sm text-ink-soft">Keine Einträge.</p>
      )}
    </div>
  );
}

function GearCard({
  gear,
  state,
  onCraft,
}: {
  gear: GearDef;
  state: CraftState;
  onCraft: () => void;
}) {
  const campaign = useCampaign((s) => s.campaign);
  const badge = badgeFor(state, isEquipped(gear.id, campaign!));

  return (
    <div
      className={`paper-card p-4 ${state === "craftable" ? "ring-1 ring-ok" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{gear.name}</p>
          {gear.effect && (
            <p className="text-xs text-ink-soft">{gear.effect}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {gear.cost.length > 0 && state !== "owned" && (
        <div className="mt-3">
          <MaterialCostList gear={gear} />
        </div>
      )}

      {state === "craftable" && (
        <button
          type="button"
          onClick={onCraft}
          className="mt-3 w-full rounded-lg border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white active:translate-y-px"
        >
          Schmieden
        </button>
      )}
    </div>
  );
}
