import { useState } from "react";
import { Screen } from "../ui/Screen";
import { SegmentedTabs } from "../ui/SegmentedTabs";
import { useCampaign } from "../store/campaign";
import { useOwnHunter } from "../store/hooks";
import { gameData } from "../data/gameData";
import { equippableArmor, equippableWeapons } from "../domain/loadout";
import { EquipLoadoutBar } from "../ui/hunter/EquipLoadoutBar";
import { EquipGearSheet } from "../ui/hunter/EquipGearSheet";
import { OwnedGearGrid } from "../ui/hunter/OwnedGearGrid";
import type { GearDef, GearSlot } from "../domain/types";

type Tab = "weapons" | "armour";

/** Hunter loadout editor: equip bar + owned gear grid (Box/Forge style). */
export function Hunters() {
  const [tab, setTab] = useState<Tab>("weapons");
  const [selectedGear, setSelectedGear] = useState<GearDef | null>(null);
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

      <SegmentedTabs<Tab>
        className="mb-4 mt-4"
        value={tab}
        onChange={(next) => {
          setTab(next);
          setSelectedGear(null);
        }}
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
          onSelect={setSelectedGear}
        />
      ) : (
        <OwnedGearGrid
          items={armor}
          isEquipped={(g) => hunter.equipped[g.slot] === g.id}
          emptyLabel="Noch keine Rüstung geschmiedet."
          onSelect={setSelectedGear}
        />
      )}

      {selectedGear && (
        <EquipGearSheet
          gear={selectedGear}
          hunter={hunter}
          onEquip={() => onEquip(selectedGear.slot, selectedGear.id)}
          onUnequip={() => onUnequip(selectedGear.slot)}
          onClose={() => setSelectedGear(null)}
        />
      )}
    </Screen>
  );
}
