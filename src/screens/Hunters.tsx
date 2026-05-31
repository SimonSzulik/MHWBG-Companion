import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { gameData } from "../data/gameData";
import { catalog } from "../domain/catalog";
import { iconUrl } from "../domain/icons";
import type { GearDef, GearSlot, Hunter, WeaponType } from "../domain/types";

const ARMOUR_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: "head", label: "Helm" },
  { slot: "chest", label: "Mail" },
  { slot: "legs", label: "Greaves" },
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
  const [openSlot, setOpenSlot] = useState<GearSlot | null>(null);
  if (!campaign) return null;

  const ownedSet = new Set(campaign.ownedGear);
  const weapon = hunter.equipped.weapon
    ? catalog.gear(hunter.equipped.weapon)
    : undefined;

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

      <SlotEditor
        label="Waffe"
        slot="weapon"
        current={weapon}
        open={openSlot === "weapon"}
        onToggle={() =>
          setOpenSlot((s) => (s === "weapon" ? null : "weapon"))
        }
        options={ownedFor("weapon")}
        onSelect={(id) => {
          equipGear(hunter.id, "weapon", id);
          setOpenSlot(null);
        }}
      />

      {ARMOUR_SLOTS.map(({ slot, label }) => {
        const curId = hunter.equipped[slot];
        const cur = curId ? catalog.gear(curId) : undefined;
        return (
          <SlotEditor
            key={slot}
            label={label}
            slot={slot}
            current={cur}
            open={openSlot === slot}
            onToggle={() => setOpenSlot((s) => (s === slot ? null : slot))}
            options={ownedFor(slot)}
            onSelect={(id) => {
              equipGear(hunter.id, slot, id);
              setOpenSlot(null);
            }}
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
  slot,
  current,
  open,
  onToggle,
  options,
  onSelect,
}: {
  label: string;
  slot: GearSlot;
  current?: GearDef;
  open: boolean;
  onToggle: () => void;
  options: GearDef[];
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="paper-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:translate-y-px"
      >
        <GearIcon gear={current} slot={slot} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
          <p className="truncate font-medium">{current?.name ?? "— leer —"}</p>
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
            {options.length === 0 && (
              <p className="py-2 text-sm text-ink-soft">Noch nichts geschmiedet.</p>
            )}
            <div className="flex flex-col gap-1">
              {options.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelect(g.id)}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2 text-left active:translate-y-px ${
                    current?.id === g.id ? "bg-accent-faint ring-1 ring-accent" : "hover:bg-paper-2"
                  }`}
                >
                  <GearIcon gear={g} slot={slot} />
                  <span className="truncate text-sm font-medium">{g.name}</span>
                </button>
              ))}
            </div>
            {current && (
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="mt-2 w-full rounded-lg border-[1.5px] border-dashed border-line-strong py-2 text-sm text-ink-soft active:translate-y-px"
              >
                — ablegen —
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GearIcon({ gear, slot }: { gear?: GearDef; slot: GearSlot }) {
  if (gear?.tierIcon) {
    return (
      <img
        src={iconUrl(gear.tierIcon)}
        alt=""
        className="h-10 w-10 shrink-0 object-contain"
      />
    );
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-[1.5px] border-dashed border-line bg-paper-2 text-[10px] text-ink-soft">
      {slot === "weapon" ? "⚔" : slot === "head" ? "H" : slot === "chest" ? "M" : "G"}
    </span>
  );
}
