import { useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import {
  armorForgeGraph,
  weaponForgeGraph,
  type ForgeArmorSetRow,
  type ForgeBranch,
  type ForgeNode,
  type ForgeRootGroup,
} from "../domain/catalog";
import { ownHunter } from "../lib/hunter";
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
