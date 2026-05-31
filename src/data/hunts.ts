/**
 * Campaign hunts (SEED / PROVISIONAL) for Wildspire Waste.
 * A linear-ish quest list the party works through. Completing a hunt is the
 * trigger to log loot into the stash. Verify order/rewards against the
 * campaign book later.
 */
export interface HuntDef {
  id: string;
  name: string;
  monsterId: string;
  /** Display order in the campaign list. */
  order: number;
  /** Short flavor / objective. */
  objective?: string;
}

export const wildspireHunts: HuntDef[] = [
  { id: "h1-jagras", name: "Großer Jagra", monsterId: "great-jagras", order: 1, objective: "Erste Jagd — Grundlagen." },
  { id: "h2-pukei", name: "Pukei-Pukei", monsterId: "pukei-pukei", order: 2, objective: "Vorsicht vor Gift." },
  { id: "h3-barroth", name: "Barroth", monsterId: "barroth", order: 3, objective: "Schlammpanzer aufbrechen." },
  { id: "h4-diablos", name: "Diablos", monsterId: "diablos", order: 4, objective: "Wüstentyrann — Endkampf." },
];
