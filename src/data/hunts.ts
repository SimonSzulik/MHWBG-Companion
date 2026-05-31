/**
 * Campaign hunts for Ancient Forest.
 * A linear-ish quest list the party works through. Completing a hunt is the
 * trigger to log loot into the stash. The assigned starting investigation is
 * Great Jagras (per the rulebook); later quest order/rewards come from the
 * campaign cards — verify against the printed material.
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

export const hunts: HuntDef[] = [
  { id: "h1-jagras", name: "Great Jagras", monsterId: "jagras", order: 1, objective: "Zugewiesene Erstuntersuchung." },
  { id: "h2-kadachi", name: "Tobi-Kadachi", monsterId: "tobi-kadachi", order: 2, objective: "Vorsicht vor Blitz." },
  { id: "h3-anjanath", name: "Anjanath", monsterId: "anjanath", order: 3, objective: "Feuriger Brute Wyvern." },
  { id: "h4-rathalos", name: "Rathalos", monsterId: "rathalos", order: 4, objective: "König der Lüfte." },
  { id: "h5-azure", name: "Azure Rathalos", monsterId: "azure-rathalos", order: 5, objective: "Endkampf." },
];
