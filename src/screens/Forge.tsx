import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import {
  armorPartGroups,
  armorSetForPiece,
  catalog,
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
import type { Campaign, DeckChanges, GearDef, GearSlot, Hunter } from "../domain/types";

type Tab = "weapons" | "armour";

/**
 * Forge. Weapon tab renders a branching forge tree (paths off shared root
 * weapons, chosen paths highlighted, locked branches dimmed); armour tab lists
 * forgeable pieces grouped by body part.
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

/* ---------- Weapon forge graph ---------- */

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
  if (groups.length === 0) {
    return <p className="text-sm text-ink-soft">Keine Schmiedepfade.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Wähle einen Pfad. Geschmiedete Stufen sind <span className="text-ok">grün</span>{" "}
        markiert. Aufwerten verbraucht die Basiswaffe – bei der Startwaffe
        sperren sich die übrigen Pfade.
      </p>
      {groups.map((group) => (
        <RootGroupCard
          key={group.rootId}
          group={group}
          hunter={hunter}
          onCraft={onCraft}
        />
      ))}
    </div>
  );
}

function RootGroupCard({
  group,
  hunter,
  onCraft,
}: {
  group: ForgeRootGroup;
  hunter: Hunter;
  onCraft: (id: string) => void;
}) {
  const multi = group.branches.length > 1;

  return (
    <div className="paper-card overflow-hidden">
      <RootHeader
        node={group.root}
        recraftable={group.recraftable}
        multiPath={multi}
        hunter={hunter}
        onCraft={onCraft}
      />

      <div className="space-y-3 border-t border-line px-3 pb-3 pt-3">
        {multi ? (
          group.branches.map((branch) => (
            <BranchBlock
              key={branch.id}
              branch={branch}
              hunter={hunter}
              onCraft={onCraft}
            />
          ))
        ) : (
          <NodeChain
            nodes={group.branches[0]?.nodes ?? []}
            hunter={hunter}
            onCraft={onCraft}
          />
        )}
      </div>
    </div>
  );
}

function RootHeader({
  node,
  recraftable,
  multiPath,
  hunter,
  onCraft,
}: {
  node: ForgeNode;
  recraftable: boolean;
  multiPath: boolean;
  hunter: Hunter;
  onCraft: (id: string) => void;
}) {
  const gear = node.gear;
  return (
    <div className="px-4 pt-3">
      <div className="flex items-start gap-3">
        <img
          src={iconUrl(gear.tierIcon ?? gear.pathIcon ?? "")}
          alt=""
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-lg leading-tight">{gear.name}</p>
            <NodeBadge node={node} />
          </div>
          {recraftable ? (
            <p className="text-xs text-ink-soft">
              Basiswaffe{node.held > 0 ? ` · ${node.held}× vorrätig` : ""}
            </p>
          ) : (
            <p className="text-xs text-ink-soft">Startwaffe</p>
          )}
        </div>
      </div>

      {recraftable && (
        <>
          <MaterialCostList gear={gear} hunter={hunter} />
          {multiPath && (
            <p className="mt-1 text-[11px] text-ink-soft">
              Für jeden Pfad erneut schmieden.
            </p>
          )}
          <CraftButton
            disabled={node.state !== "craftable"}
            onClick={() => onCraft(gear.id)}
            label={node.held > 0 ? "Erneut schmieden" : "Schmieden"}
          />
        </>
      )}
    </div>
  );
}

function BranchBlock({
  branch,
  hunter,
  onCraft,
}: {
  branch: ForgeBranch;
  hunter: Hunter;
  onCraft: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border-[1.5px] p-3 ${
        branch.chosen
          ? "border-ok bg-ok-soft/15 ring-1 ring-ok"
          : branch.locked
            ? "border-line bg-paper-2/40 opacity-60"
            : "border-line-strong"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <img
          src={iconUrl(branch.icon)}
          alt=""
          className="h-6 w-6 shrink-0 object-contain"
        />
        <p className="min-w-0 flex-1 truncate font-semibold">{branch.label}</p>
        <BranchChip branch={branch} />
      </div>
      <NodeChain nodes={branch.nodes} hunter={hunter} onCraft={onCraft} />
    </div>
  );
}

function BranchChip({ branch }: { branch: ForgeBranch }) {
  if (branch.chosen) {
    return (
      <span className="shrink-0 rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-ok">
        PFAD GEWÄHLT
      </span>
    );
  }
  if (branch.locked) {
    return (
      <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink-soft">
        🔒 GESPERRT
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink-soft">
      OFFEN
    </span>
  );
}

function NodeChain({
  nodes,
  hunter,
  onCraft,
}: {
  nodes: ForgeNode[];
  hunter: Hunter;
  onCraft: (id: string) => void;
}) {
  if (nodes.length === 0) {
    return <p className="text-xs text-ink-soft">Keine Aufwertungen.</p>;
  }
  return (
    <div>
      {nodes.map((node, i) => (
        <div key={node.gear.id} className="flex gap-3">
          <div className="flex flex-col items-center pt-1.5">
            <NodeDot node={node} />
            {i < nodes.length - 1 && (
              <div className="mt-1 w-0.5 flex-1 bg-line-strong" />
            )}
          </div>
          <WeaponNodeCard node={node} hunter={hunter} onCraft={onCraft} />
        </div>
      ))}
    </div>
  );
}

function NodeDot({ node }: { node: ForgeNode }) {
  if (node.forged) return <span className="h-3 w-3 rounded-full bg-ok" />;
  if (node.state === "craftable")
    return <span className="h-3 w-3 rounded-full bg-accent" />;
  return (
    <span className="h-3 w-3 rounded-full border-2 border-line-strong bg-paper" />
  );
}

function WeaponNodeCard({
  node,
  hunter,
  onCraft,
}: {
  node: ForgeNode;
  hunter: Hunter;
  onCraft: (id: string) => void;
}) {
  const gear = node.gear;
  return (
    <div
      className={`mb-3 flex-1 rounded-xl border-[1.5px] border-line-strong bg-card p-3 ${
        node.state === "craftable" ? "bg-ok-soft/25 ring-1 ring-ok" : ""
      } ${node.state === "locked" ? "opacity-60" : ""}`}
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
        <NodeBadge node={node} />
      </div>

      {gear.effect && (
        <p className="mt-0.5 text-xs text-ink-soft">{gear.effect}</p>
      )}

      {!node.forged && gear.cost.length > 0 && (
        <MaterialCostList gear={gear} hunter={hunter} />
      )}

      {!node.forged && node.state === "pending" && node.enoughMats && (
        <p className="mt-2 text-[11px] text-ink-soft">
          Erst die Vorstufe schmieden.
        </p>
      )}

      {gear.deckChanges && <DeckChangesBlock changes={gear.deckChanges} />}

      {node.state === "craftable" && (
        <CraftButton onClick={() => onCraft(gear.id)} label="Schmieden" />
      )}
    </div>
  );
}

function NodeBadge({ node }: { node: ForgeNode }) {
  const { label, cls } = nodeBadge(node);
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function nodeBadge(node: ForgeNode): { label: string; cls: string } {
  if (node.forged) {
    return node.equipped
      ? { label: "AUSGERÜSTET", cls: "bg-accent-faint text-accent" }
      : { label: "GESCHMIEDET", cls: "bg-ok-soft text-ok" };
  }
  switch (node.state) {
    case "craftable":
      return { label: "BAUBAR", cls: "bg-ok-soft text-ok" };
    case "locked":
      return { label: "🔒 GESPERRT", cls: "bg-paper-2 text-ink-soft" };
    default:
      return {
        label: node.enoughMats ? "BASIS FEHLT" : "TEILE FEHLEN",
        cls: "bg-paper-2 text-ink-soft",
      };
  }
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

/* ---------- Shared bits ---------- */

function CraftButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 w-full rounded-lg border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white active:translate-y-px disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function MaterialCostList({ gear, hunter }: { gear: GearDef; hunter: Hunter }) {
  if (gear.cost.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1 text-xs">
      {gear.cost.map((c) => {
        const have = hunter.materials[c.materialId] ?? 0;
        const enough = have >= c.qty;
        const name = catalog.material(c.materialId)?.name ?? c.materialId;
        return (
          <li key={c.materialId} className={enough ? "text-ok" : "text-ink-soft"}>
            {enough ? "✓" : "○"} {name} {have}/{c.qty}
          </li>
        );
      })}
    </ul>
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
