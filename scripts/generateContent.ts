/**
 * Emits catalog source for monsters that are present in the CC0 quest-card
 * dataset but missing (or incomplete) in `src/data/`.
 *
 *   npx tsx scripts/generateContent.ts <monster-id> [...]
 *
 * Prints TypeScript blocks for `src/data/quests.ts` and `src/data/lootTables.ts`
 * and reports any reward item that has no matching material in the catalog, so
 * transcription errors surface instead of silently producing dangling ids.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gameData } from "../src/data/gameData";

const SOURCE = resolve(
  import.meta.dirname,
  "../docs/research/data/mhwbg-quest-cards.cc0.json",
);

type Localised = { language: string; text: string }[];
const en = (v?: Localised): string =>
  v?.find((x) => x.language.startsWith("en"))?.text ?? v?.[0]?.text ?? "";

interface Reward {
  number: number;
  "item-reward"?: Localised;
  "break-reward"?: unknown;
}
interface Quest {
  "monster-id": string;
  "quest-id": string;
  difficulty: number;
  physiology?: {
    parts?: { part: string }[];
    rewards?: Reward[];
  };
}

const STARS: Record<number, string> = {
  1: "one-star",
  2: "two-star",
  3: "three-star",
  4: "four-star",
  5: "five-star",
};

/** Catalog ids differ from dataset ids for Great Jagras only. */
const CATALOG_ID: Record<string, string> = { "great-jagras": "jagras" };
const catalogId = (id: string) => CATALOG_ID[id] ?? id;

/** Material name -> catalog id, resolved against the real catalog. */
function buildMaterialIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const m of gameData.materials) index.set(m.name.toLowerCase(), m.id);
  return index;
}

function main() {
  const wanted = process.argv.slice(2);
  if (!wanted.length) {
    console.error("usage: generateContent.ts <monster-id> [...]");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(SOURCE, "utf8")) as {
    "quest-books": { quests: Quest[] }[];
  };
  const quests = data["quest-books"].flatMap((b) => b.quests);
  const materials = buildMaterialIndex();
  const unmapped = new Set<string>();

  for (const monster of wanted) {
    const mine = quests.filter((q) => q["monster-id"] === monster);
    if (!mine.length) {
      console.error(`\n!! no source data for ${monster}\n`);
      continue;
    }
    const cid = catalogId(monster);
    const label = en(
      // Quest name is not localised in this dataset; derive from the id.
      undefined,
    ) || monster.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");

    console.log(`\n// ===== ${monster} =====`);
    console.log("// --- src/data/quests.ts ---");
    for (const q of mine) {
      console.log(`  {
    id: "${q["quest-id"]}",
    name: "${label}",
    monsterId: "${cid}",
    stars: "${STARS[q.difficulty]}",
    icon: "${cid}",
  },`);
    }

    const phys = mine.find((q) => q.physiology?.rewards)?.physiology;
    if (phys?.rewards) {
      console.log("// --- src/data/lootTables.ts ---");
      console.log(`  "${cid}": [`);
      for (const r of phys.rewards) {
        const name = en(r["item-reward"]);
        const id = materials.get(name.toLowerCase());
        if (!id) unmapped.add(name);
        const brk = "break-reward" in r ? `, partBreak: "?"` : "";
        console.log(
          `    { roll: ${r.number}, materialId: "${id ?? `TODO:${name}`}"${brk} },`,
        );
      }
      console.log("  ],");
    }
    if (phys?.parts) {
      console.log(
        `// BREAKABLE_PARTS: "${cid}": [${phys.parts
          .map((p) => `"${p.part}"`)
          .join(", ")}],`,
      );
    }
  }

  if (unmapped.size) {
    console.log(`\n// !! ${unmapped.size} reward item(s) have no material in the catalog:`);
    for (const name of [...unmapped].sort()) {
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      console.log(`//   ${name}  ->  suggested id "${id}"`);
    }
  }
}

main();
