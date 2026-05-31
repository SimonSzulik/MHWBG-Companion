import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { gameData } from "../data/gameData";
import { catalog } from "../domain/catalog";
import type { GearSlot, Hunter, WeaponType } from "../domain/types";

const ARMOUR_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: "head", label: "Kopf" },
  { slot: "chest", label: "Brust" },
  { slot: "arms", label: "Arme" },
  { slot: "waist", label: "Hüfte" },
  { slot: "legs", label: "Beine" },
];

const WEAPON_TYPES: WeaponType[] = [
  "Switch Axe",
  "Charge Blade",
  "Insect Glaive",
  "Heavy Bowgun",
];

/** Hunter sheet(s): switch between hunters, equip owned gear, see derived skills. */
export function Hunters() {
  const campaign = useCampaign((s) => s.campaign);
  const addHunter = useCampaign((s) => s.addHunter);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWeapon, setNewWeapon] = useState<WeaponType>("Switch Axe");

  if (!campaign) return null;
  const hunters = campaign.hunters;
  const active = hunters.find((h) => h.id === activeId) ?? hunters[0];

  return (
    <Screen title="Jäger" subtitle={`${hunters.length} im Team`}>
      {/* Hunter switcher */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {hunters.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setActiveId(h.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border-[1.5px] border-line-strong px-3 py-1.5 text-sm font-semibold active:translate-y-px ${
              active?.id === h.id ? "bg-accent text-white" : "bg-card"
            }`}
          >
            🧍 {h.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="shrink-0 rounded-full border-[1.5px] border-dashed border-line-strong bg-card px-3 py-1.5 text-sm font-semibold active:translate-y-px"
        >
          + Jäger
        </button>
      </div>

      {adding && (
        <div className="paper-card mb-4 flex flex-col gap-3 p-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
          />
          <select
            value={newWeapon}
            onChange={(e) => setNewWeapon(e.target.value as WeaponType)}
            className="rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 outline-none"
          >
            {WEAPON_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              addHunter({ name: newName, weaponType: newWeapon });
              setNewName("");
              setAdding(false);
            }}
            disabled={!newName.trim()}
            className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2 font-semibold text-white active:translate-y-px disabled:opacity-40"
          >
            Hinzufügen
          </button>
        </div>
      )}

      {active && <HunterSheet hunter={active} />}
    </Screen>
  );
}

function HunterSheet({ hunter }: { hunter: Hunter }) {
  const equipGear = useCampaign((s) => s.equipGear);
  const campaign = useCampaign((s) => s.campaign);
  if (!campaign) return null;

  const ownedSet = new Set(campaign.ownedGear);
  const weapon = hunter.equipped.weapon
    ? catalog.gear(hunter.equipped.weapon)
    : undefined;

  // Derived: collect effects from equipped pieces + total defense.
  const equippedDefs = Object.values(hunter.equipped)
    .map((id) => (id ? catalog.gear(id) : undefined))
    .filter(Boolean);
  const totalDef = equippedDefs.reduce((sum, g) => sum + (g?.defense ?? 0), 0);
  const skills = equippedDefs.map((g) => g?.effect).filter(Boolean) as string[];

  const ownedFor = (slot: GearSlot) =>
    gameData.gear.filter(
      (g) =>
        g.slot === slot &&
        ownedSet.has(g.id) &&
        (slot !== "weapon" || g.weaponType === hunter.weaponType),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="paper-card p-4">
        <p className="font-display text-2xl leading-tight">{hunter.name}</p>
        <p className="text-sm text-ink-soft">
          {hunter.weaponType}
          {hunter.palicoName ? ` · Palico ${hunter.palicoName}` : ""}
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <span className="font-display text-xl">{totalDef}</span> Verteidigung
          </span>
        </div>
      </div>

      {/* Weapon slot */}
      <SlotEditor
        label="Waffe"
        current={weapon?.name}
        options={ownedFor("weapon").map((g) => ({ id: g.id, name: g.name }))}
        onSelect={(id) => equipGear(hunter.id, "weapon", id)}
      />

      {/* Armour slots */}
      {ARMOUR_SLOTS.map(({ slot, label }) => {
        const cur = hunter.equipped[slot];
        return (
          <SlotEditor
            key={slot}
            label={label}
            current={cur ? catalog.gear(cur)?.name : undefined}
            options={ownedFor(slot).map((g) => ({ id: g.id, name: g.name }))}
            onSelect={(id) => equipGear(hunter.id, slot, id)}
          />
        );
      })}

      {skills.length > 0 && (
        <div className="paper-card p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-accent">
            Aktive Skills
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {skills.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SlotEditor({
  label,
  current,
  options,
  onSelect,
}: {
  label: string;
  current?: string;
  options: { id: string; name: string }[];
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="paper-card flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="truncate font-medium">{current ?? "— leer —"}</p>
      </div>
      <select
        value=""
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return; // placeholder
          onSelect(v === "__clear__" ? null : v);
        }}
        className="shrink-0 rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-2 py-1.5 text-sm outline-none"
      >
        <option value="">ändern…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
        {current && <option value="__clear__">— ablegen —</option>}
      </select>
    </div>
  );
}
