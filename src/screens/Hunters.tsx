import { useState } from "react";
import { Screen } from "../ui/Screen";
import { SegmentedTabs } from "../ui/SegmentedTabs";
import { useCampaign } from "../store/campaign";
import { useOwnHunter } from "../store/hooks";
import { gameData } from "../data/gameData";
import { equippableArmor, equippableWeapons } from "../domain/loadout";
import { EquipLoadoutBar } from "../ui/hunter/EquipLoadoutBar";
import { LoadoutStats } from "../ui/hunter/LoadoutStats";
import { OwnedGearGrid } from "../ui/hunter/OwnedGearGrid";
import type { GearSlot } from "../domain/types";

type Tab = "weapons" | "armour";

/** Hunter loadout editor: equip bar + owned gear grid (Box/Forge style). */
export function Hunters() {
  const [tab, setTab] = useState<Tab>("weapons");
  const { campaign, hunter } = useOwnHunter();
  const equipGear = useCampaign((s) => s.equipGear);
  if (!campaign || !hunter) return null;

  const weapons = equippableWeapons(hunter, gameData.gear);
  const armor = equippableArmor(hunter, gameData.gear);

  const onEquip = (slot: GearSlot, gearId: string) => {
    equipGear(hunter.id, slot, gearId);
  };

  const onUnequip = (slot: GearSlot) => {
    equipGear(hunter.id, slot, null);
  };

  return (
    <Screen
      title="Jäger"
      hideHeader
      background="/backgrounds/camp.webp"
      backgroundFallback="/backgrounds/camp.svg"
    >
      <EquipLoadoutBar hunter={hunter} tab={tab} onUnequip={onUnequip} />

      <LoadoutStats hunter={hunter} />

      <SegmentedTabs<Tab>
        className="mb-4 mt-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "weapons", label: "Waffen" },
          { value: "armour", label: "Rüstung" },
        ]}
      />

      {tab === "weapons" ? (
        <OwnedGearGrid
          items={weapons}
          isEquipped={(g) => hunter.equipped.weapon === g.id}
          emptyLabel="Noch keine Waffe geschmiedet."
          onEquip={(id) => onEquip("weapon", id)}
        />
      ) : (
        <OwnedGearGrid
          items={armor}
          isEquipped={(g) => hunter.equipped[g.slot] === g.id}
          emptyLabel="Noch keine Rüstung geschmiedet."
          onEquip={(id) => {
            const gear = gameData.gear.find((g) => g.id === id);
            if (gear) onEquip(gear.slot, id);
          }}
        />
      )}
    </Screen>
  );
}
