import { useState } from "react";
import { Screen } from "../ui/Screen";
import { SegmentedTabs } from "../ui/SegmentedTabs";
import { useCampaign } from "../store/campaign";
import { useOwnHunter } from "../store/hooks";
import {
  armorForgeGraph,
  weaponForgeGraph,
  type ForgeArmorSetRow,
  type ForgeBranch,
  type ForgeNode,
  type ForgeRootGroup,
} from "../domain/catalog";
import { ForgeTreeCanvas } from "../ui/forge/ForgeTreeCanvas";
import { ForgeArmorCanvas } from "../ui/forge/ForgeArmorCanvas";
import { ForgeNodeSheet } from "../ui/forge/ForgeNodeSheet";
import type { Campaign, Hunter } from "../domain/types";

type Tab = "weapons" | "armour";

type WeaponSheetTarget = {
  node: ForgeNode;
  branch?: ForgeBranch;
  group: ForgeRootGroup;
};

type ArmorSheetTarget = {
  node: ForgeNode;
  row: ForgeArmorSetRow;
};

/**
 * Forge. Weapon tab: left-to-right forge tree with tap-for-details sheet;
 * armour tab: set rows with helm/mail/greaves circles.
 */
export function Forge() {
  const [tab, setTab] = useState<Tab>("weapons");
  const { campaign, hunter } = useOwnHunter();
  const craft = useCampaign((s) => s.craftGear);
  if (!campaign || !hunter) return null;

  const onCraft = (id: string) => {
    const res = craft(hunter.id, id);
    if (!res.ok && res.reason) alert(res.reason);
  };

  return (
    <Screen
      title="Forge"
      background="/backgrounds/forge.jpg"
      backgroundFallback="/backgrounds/forge.svg"
    >
      <SegmentedTabs<Tab>
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "weapons", label: "Waffen" },
          { value: "armour", label: "Rüstung" },
        ]}
      />

      {tab === "weapons" ? (
        <WeaponForgeGraph hunter={hunter} campaign={campaign} onCraft={onCraft} />
      ) : (
        <ArmorForgeGraph hunter={hunter} campaign={campaign} onCraft={onCraft} />
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
  const [sheet, setSheet] = useState<WeaponSheetTarget | null>(null);

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

function ArmorForgeGraph({
  hunter,
  campaign,
  onCraft,
}: {
  hunter: Hunter;
  campaign: Campaign;
  onCraft: (id: string) => void;
}) {
  const rows = armorForgeGraph(hunter, campaign);
  const [sheet, setSheet] = useState<ArmorSheetTarget | null>(null);

  if (rows.length === 0) {
    return <p className="text-sm text-ink-soft">Keine Rüstungssets.</p>;
  }

  return (
    <>
      <ForgeArmorCanvas
        rows={rows}
        onNodeClick={(node, row) => setSheet({ node, row })}
      />
      {sheet && (
        <ForgeNodeSheet
          node={sheet.node}
          hunter={hunter}
          recraftable={false}
          onCraft={onCraft}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
