/**
 * Local backup bridge: export/import the whole campaign as a JSON file.
 * Works without any backend — the offline-friendly way to move a save between
 * devices or share with the group until cloud sync is wired up.
 */
import type { Campaign } from "../domain/types";
import { useCampaign } from "../store/campaign";

const FILE_VERSION = 1;

interface BackupFile {
  app: "mhwbg-companion";
  version: number;
  exportedAt: string;
  campaign: Campaign;
}

/** Trigger a download of the current campaign as JSON. */
export function exportCampaign(): void {
  const campaign = useCampaign.getState().campaign;
  if (!campaign) return;
  const payload: BackupFile = {
    app: "mhwbg-companion",
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    campaign,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = campaign.name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  a.href = url;
  a.download = `mhw-${safeName || "kampagne"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse + validate a backup file and load it into the store. */
export async function importCampaign(file: File): Promise<{ ok: boolean; reason?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as Partial<BackupFile>;
    if (data.app !== "mhwbg-companion" || !data.campaign) {
      return { ok: false, reason: "Keine gültige Companion-Datei." };
    }
    useCampaign.getState().applyRemoteCampaign(data.campaign);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Lesefehler" };
  }
}
