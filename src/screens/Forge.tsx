import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import {
  armorPartGroups,
  armorSetForPiece,
  craftState,
  isEquipped,
  weaponForgeGraph,
  type ArmorPartGroup,
  type CraftState,
  type ForgeBranch,
  type ForgeNode,
  type ForgeRootGroup,
} from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import { ownHunter } from "../lib/hunter";
import { ForgeTreeCanvas } from "../ui/forge/ForgeTreeCanvas";
import { ForgeNodeSheet } from "../ui/forge/ForgeNodeSheet";
import {
  CraftButton,
  DeckChangesBlock,
  MaterialCostList,
} from "../ui/forge/ForgeDetails";
import type { Campaign, GearDef, GearSlot, Hunter } from "../domain/types";

type Tab = "weapons" | "armour";

type SheetTarget = {
  node: ForgeNode;
  branch?: ForgeBranch;
  group: ForgeRootGroup;
};

/**
 * Forge. Weapon tab: left-to-right forge tree with tap-for-details sheet;
 * armour tab lists forgeable pieces grouped by body part.
 */
export function Forge() {
  const [tab, setTab] = useState<Tab>("weapons");
  const campaign = useCampaign((s) => s.campaign);
  const craft = useCampaign((s) => s.craftGear);
  const userId = useAuth((s) => s.userId);
  if (!campaign) return null;

  const hunter = ownHunter(campaign, userId);
  if (!hunter) return null;

  const onCraft = (id: string) => {
    const res = craft(hunter.id, id);
    if (!res.ok && res.reason) alert(res.reason);
  };

  return (
    <Screen
      title="Forge"
      subtitle={tab === "weapons" ? `${hunter.weaponType}` : "Rüstung"}
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

      {tab === "weapons" ? (
        <WeaponForgeGraph hunter={hunter} campaign={campaign} onCraft={onCraft} />
      ) : (
        <ArmorByPart hunter={hunter} campaign={campaign} onCraft={onCraft} />
      )}
    </Screen>
  );
}

function WeaponForgeGraph({
  hunter,
  campaign,
  onCraft,
}: {
  hunter: Hunter;
  campaign: Campaign;
  onCraft: (id: string) => void;
}) {
  const groups = weaponForgeGraph(hunter.weaponType, hunter, campaign);
  const [sheet, setSheet] = useState<SheetTarget | null>(null);

  if (groups.length === 0) {
    return <p className="text-sm text-ink-soft">Keine Schmiedepfade.</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <ForgeTreeCanvas
          groups={groups}
          onNodeClick={(node, branch, group) => {
            if (!group) return;
            setSheet({ node, branch, group });
          }}
        />
      </div>
      {sheet && (
        <ForgeNodeSheet
          node={sheet.node}
          branch={sheet.branch}
          hunter={hunter}
          recraftable={sheet.group.recraftable}
          onCraft={onCraft}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

/* ---------- Armour by part ---------- */

function ArmorByPart({
  hunter,
  campaign,
  onCraft,
}: {
  hunter: Hunter;
  campaign: Campaign;
  onCraft: (id: string) => void;
}) {
  const groups = armorPartGroups();
  const [slot, setSlot] = useState<GearSlot>(groups[0]?.slot ?? "head");
  const active = groups.find((g) => g.slot === slot) ?? groups[0];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {groups.map((g) => (
          <PartTab
            key={g.slot}
            group={g}
            active={g.slot === slot}
            onClick={() => setSlot(g.slot)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {active?.pieces.map((gear) => (
          <ArmorPieceCard
            key={gear.id}
            gear={gear}
            hunter={hunter}
            campaign={campaign}
            onCraft={onCraft}
          />
        ))}
        {(!active || active.pieces.length === 0) && (
          <p className="text-sm text-ink-soft">Keine Einträge.</p>
        )}
      </div>
    </div>
  );
}

function PartTab({
  group,
  active,
  onClick,
}: {
  group: ArmorPartGroup;
  active: boolean;
  onClick: () => void;
}) {
  const icon = group.pieces[0]?.tierIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2 text-sm font-semibold active:translate-y-px ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line-strong bg-paper-2 text-ink-soft"
      }`}
    >
      {icon && (
        <img
          src={iconUrl(icon)}
          alt=""
          className={`h-5 w-5 object-contain ${active ? "" : "opacity-80"}`}
        />
      )}
      {group.label}
    </button>
  );
}

function ArmorPieceCard({
  gear,
  hunter,
  campaign,
  onCraft,
}: {
  gear: GearDef;
  hunter: Hunter;
  campaign: Campaign;
  onCraft: (id: string) => void;
}) {
  const state = craftState(gear, hunter);
  const set = armorSetForPiece(gear.id);
  const badge = armorBadge(state, isEquipped(gear.id, campaign));

  return (
    <div
      className={`paper-card p-4 ${state === "craftable" ? "ring-1 ring-ok" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {gear.tierIcon && (
            <img
              src={iconUrl(gear.tierIcon)}
              alt=""
              className="h-6 w-6 shrink-0 object-contain"
            />
          )}
          <div>
            <p className="font-semibold leading-tight">{gear.name}</p>
            {set && (
              <p className="flex items-center gap-1 text-[11px] text-ink-soft">
                <img
                  src={iconUrl(set.icon)}
                  alt=""
                  className="h-3.5 w-3.5 object-contain"
                />
                {set.label}
              </p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {gear.defense != null && (
        <p className="mt-2 text-xs text-ink-soft">Verteidigung {gear.defense}</p>
      )}
      {gear.effect && (
        <p className="mt-0.5 text-xs text-ink-soft">{gear.effect}</p>
      )}

      {state !== "owned" && gear.cost.length > 0 && (
        <MaterialCostList gear={gear} hunter={hunter} />
      )}

      {gear.deckChanges && <DeckChangesBlock changes={gear.deckChanges} />}

      {state === "craftable" && (
        <CraftButton onClick={() => onCraft(gear.id)} label="Schmieden" />
      )}
    </div>
  );
}

function armorBadge(state: CraftState, equipped: boolean) {
  if (state === "owned") {
    return equipped
      ? { label: "AUSGERÜSTET", cls: "bg-accent-faint text-accent" }
      : { label: "BESITZ", cls: "bg-paper-2 text-ink-soft" };
  }
  if (state === "craftable") return { label: "BAUBAR", cls: "bg-ok-soft text-ok" };
  return { label: "TEILE FEHLEN", cls: "bg-paper-2 text-ink-soft" };
}
