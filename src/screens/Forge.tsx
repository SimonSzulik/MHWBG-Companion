import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { wildspireWaste } from "../data/wildspireWaste";
import { catalog, craftState, type CraftState } from "../domain/catalog";
import type { GearDef } from "../domain/types";

type Tab = "weapons" | "armour";

/**
 * Forge drill-in. Weapon list is locked to the (first) hunter's weapon type,
 * mirroring the mockup's "Switch Axe only". Shows craft state + costs and a
 * one-tap craft that spends materials.
 */
export function Forge() {
  const [tab, setTab] = useState<Tab>("weapons");
  const campaign = useCampaign((s) => s.campaign);
  const craft = useCampaign((s) => s.craftGear);
  if (!campaign) return null;

  const mainWeapon = campaign.hunters[0]?.weaponType;

  const weapons = wildspireWaste.gear.filter(
    (g) => g.slot === "weapon" && g.weaponType === mainWeapon,
  );
  const armour = wildspireWaste.gear.filter((g) => g.slot !== "weapon");
  const list = tab === "weapons" ? weapons : armour;

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

      <div className="flex flex-col gap-3">
        {list.map((g) => (
          <GearCard
            key={g.id}
            gear={g}
            state={craftState(g, campaign)}
            onCraft={() => {
              const res = craft(g.id);
              if (!res.ok && res.reason) alert(res.reason);
            }}
          />
        ))}
        {list.length === 0 && (
          <p className="text-sm text-ink-soft">Keine Einträge.</p>
        )}
      </div>
    </Screen>
  );
}

const STATE_BADGE: Record<CraftState, { label: string; cls: string }> = {
  owned: { label: "AUSGERÜSTET", cls: "bg-paper-2 text-ink-soft" },
  craftable: { label: "BAUBAR", cls: "bg-ok-soft text-ok" },
  missing: { label: "TEILE FEHLEN", cls: "bg-paper-2 text-ink-soft" },
};

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
  const badge = STATE_BADGE[state];
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

      {gear.cost.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {gear.cost.map((c) => {
            const have = campaign?.materials[c.materialId] ?? 0;
            const enough = have >= c.qty;
            return (
              <li
                key={c.materialId}
                className={enough ? "text-ok" : "text-ink-soft"}
              >
                {enough ? "✓" : "○"} {catalog.material(c.materialId)?.name ?? c.materialId}{" "}
                {have}/{c.qty}
              </li>
            );
          })}
          {gear.zenny ? (
            <li
              className={
                (campaign?.zenny ?? 0) >= gear.zenny ? "text-ok" : "text-ink-soft"
              }
            >
              ◇ {gear.zenny}z
            </li>
          ) : null}
        </ul>
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
