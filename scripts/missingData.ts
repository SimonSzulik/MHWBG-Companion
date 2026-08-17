/**
 * Generates docs/qa/missing-data.md and renders it to missing-data.pdf.
 *
 *   npm run report:missing
 *
 * The catalog gaps are *derived* — dangling material ids, monsters without
 * quests or loot, and break-reward rolls whose part is unknown are all computed
 * by walking the real catalog and the vendored source data. The narrative
 * sections record what simply is not available anywhere online and has to come
 * off the physical cards.
 *
 * PDF rendering uses headless Chrome, which is already required by Playwright,
 * so no new dependency is introduced.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gameData } from "../src/data/gameData";
import { quests } from "../src/data/quests";
import { BREAKABLE_PARTS, LOOT_TABLES } from "../src/data/lootTables";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = resolve(ROOT, "docs/research/data/mhwbg-quest-cards.cc0.json");
const OUT_DIR = resolve(ROOT, "docs/qa");
const OUT_MD = resolve(OUT_DIR, "missing-data.md");
const OUT_PDF = resolve(OUT_DIR, "missing-data.pdf");

type Localised = { language: string; text: string }[];
interface Quest {
  "monster-id": string;
  difficulty: number;
  physiology?: { rewards?: { number: number; "break-reward"?: unknown; "item-reward"?: Localised }[] };
}

const CATALOG_ID: Record<string, string> = { "great-jagras": "jagras" };
const catalogId = (id: string) => CATALOG_ID[id] ?? id;
const en = (v?: Localised) => v?.find((x) => x.language.startsWith("en"))?.text ?? "";

/** Monsters in the printed line that the catalog has no source data for. */
const UNSOURCED = [
  { id: "kirin", box: "Kirin (SFG exclusive)" },
  { id: "tzitzi-ya-ku", box: "Picking Bones (SFG exclusive)" },
  { id: "great-girros", box: "Picking Bones (SFG exclusive)" },
  { id: "radobaan", box: "Picking Bones (SFG exclusive)" },
];

function main() {
  const data = JSON.parse(readFileSync(SOURCE, "utf8")) as {
    "quest-books": { quests: Quest[] }[];
  };
  const srcQuests = data["quest-books"].flatMap((b) => b.quests);

  const materialIds = new Set(gameData.materials.map((m) => m.id));
  const gearIds = new Set(gameData.gear.map((g) => g.id));
  const monsterIds = new Set(gameData.monsters.map((m) => m.id));

  const md: string[] = [];
  const p = (s = "") => md.push(s);

  p("# What is still missing from the catalog");
  p();
  p(`_Generated ${new Date().toISOString().slice(0, 10)} by \`npm run report:missing\`._`);
  p();
  p(
    "Everything below needs a photograph of a physical card, because it could not " +
      "be found in any rulebook, product page, forum thread or community dataset. " +
      "Everything **not** listed here is either already in the app or sourced in " +
      "`docs/research/mhwbg-content-dossier.md`.",
  );
  p();

  // --- 1. Structural integrity (must be empty) ---
  p("## 1. Broken references");
  p();
  const dangling: string[] = [];
  for (const [monster, rows] of Object.entries(LOOT_TABLES)) {
    for (const row of rows) {
      if (!materialIds.has(row.materialId)) {
        dangling.push(`loot table \`${monster}\` roll ${row.roll} → unknown material \`${row.materialId}\``);
      }
    }
  }
  for (const g of gameData.gear) {
    for (const c of g.cost) {
      if (!materialIds.has(c.materialId)) {
        dangling.push(`gear \`${g.id}\` → unknown material \`${c.materialId}\``);
      }
    }
  }
  for (const q of quests) {
    if (!monsterIds.has(q.monsterId)) {
      dangling.push(`quest \`${q.id}\` → unknown monster \`${q.monsterId}\``);
    }
  }
  for (const path of gameData.weaponPaths ?? []) {
    for (const id of path.gearIds) {
      if (!gearIds.has(id)) dangling.push(`forge path \`${path.id}\` → unknown gear \`${id}\``);
    }
  }
  if (dangling.length === 0) {
    p("None — every material, gear, monster and quest reference resolves.");
  } else {
    for (const d of dangling) p(`- ${d}`);
  }
  p();

  // --- 2. Break-reward rolls with an unknown part ---
  p("## 2. Break rewards: which part does each roll belong to?");
  p();
  p(
    "The reward tables are transcribed, but the source records only *that* a roll " +
      "is a break reward, not which part it requires. The Ancient Forest tables show " +
      "the part is printed per row (Anjanath repeats “head” three times), so it " +
      "cannot be inferred. Until these are filled in, **those rolls do not double**.",
  );
  p();
  p("| Monster | Rolls to check | Parts available |");
  p("|---|---|---|");
  const seen = new Set<string>();
  for (const q of srcQuests) {
    const cid = catalogId(q["monster-id"]);
    if (seen.has(cid) || !q.physiology?.rewards) continue;
    const table = LOOT_TABLES[cid];
    if (!table) continue;
    const alreadyTagged = table.some((r) => r.partBreak);
    if (alreadyTagged) continue;
    const rolls = q.physiology.rewards.filter((r) => "break-reward" in r).map((r) => r.number);
    if (!rolls.length) continue;
    seen.add(cid);
    p(`| ${cid} | ${rolls.join(", ")} | ${(BREAKABLE_PARTS[cid] ?? []).join(", ") || "—"} |`);
  }
  p();

  // --- 3. Monsters with no data at all ---
  p("## 3. Monsters with no source data anywhere");
  p();
  p(
    "These boxes were released after every community dataset stopped being " +
      "maintained. Nothing about them is available — they need the full set below.",
  );
  p();
  for (const { id, box } of UNSOURCED) {
    p(`### ${id} — ${box}`);
    p();
    p("- [ ] Quest cards: how many tiers, and the star rating of each");
    p("- [ ] Physiology card: hitpoints, elemental and status resistances, special rule");
    p("- [ ] Parts: name, armour value and break value for each");
    p("- [ ] Reward table: all 12 rolls, and which are break rewards for which part");
    p("- [ ] Part materials: exact names as printed");
    p("- [ ] Forge cards: weapon paths and costs, per weapon type");
    p("- [ ] Armour set: pieces, defence values and skills");
    p();
  }

  // --- 4. Sourced monsters still missing forge/armour ---
  p("## 4. Forge and armour for the Wildspire monsters");
  p();
  p(
    "Quests, reward tables and parts are done. Forge costs and armour sets are on " +
      "the **forge reference cards**, which no dataset covers — the quest-card set " +
      "only has quest books and physiology.",
  );
  p();
  const wildspire = ["barroth", "pukei-pukei", "jyuratodus", "diablos", "black-diablos"];
  p("| Monster | Quests | Loot table | Forge paths | Armour set |");
  p("|---|---|---|---|---|");
  for (const m of wildspire) {
    const hasPaths = (gameData.weaponPaths ?? []).some((path) => path.icon === m);
    const hasArmour = (gameData.armorSets ?? []).some((s) => s.icon === m);
    p(
      `| ${m} | ${quests.filter((q) => q.monsterId === m).length ? "yes" : "**no**"} | ` +
        `${LOOT_TABLES[m] ? "yes" : "**no**"} | ${hasPaths ? "partial" : "**no**"} | ` +
        `${hasArmour ? "yes" : "**no**"} |`,
    );
  }
  p();
  p(
    "Note: the app already ships *some* Wildspire weapon paths (Great Sword, " +
      "Sword & Shield, Bow and Dual Blades), transcribed earlier from the forge " +
      "cards. The remaining six weapon types have no Wildspire paths at all.",
  );
  p();

  // --- 5. Inferred values worth confirming ---
  p("## 5. Values inferred rather than sourced");
  p();
  p("| What | Where | Basis for the guess |");
  p("|---|---|---|");
  p(
    "| Quest-card colour (`type`) for the 5 Wildspire monsters | `src/data/quests.ts` | " +
      "Inferred from each monster's position in the box. Cosmetic only. |",
  );
  p(
    "| Barroth listed first among Wildspire monsters | `QUEST_MONSTERS` | " +
      "Ancient Forest rulebook p.38 — a combined campaign may open on Great Jagras **or** Barroth. |",
  );
  p(
    "| Jyuratodus / Diablos / Black Diablos “legs” part dropped | `BREAKABLE_PARTS` | " +
      "`MonsterPartId` has no `legs`; confirm whether legs are breakable at all. |",
  );
  p();

  // --- 6. Rules the app does not model ---
  p("## 6. Rules in the box that the app does not model");
  p();
  p("From the Ancient Forest rulebook appendix (p.38) — reported, not implemented:");
  p();
  p("- **Speed Run campaign** — Medium 20 days, Hard 15 days");
  p("- **Explorer campaign** — no campaign timer at all");
  p("- **Single-player campaign** — each player controls 2 hunters");
  p("- **Arena quests** — one-shot, pre-set weapons and armour, gathering phase skipped");
  p("- **Palicoes** — for 1–2 players, and as the 3–4 player difficulty reducer. Palico support was removed from the app (`palico_name` dropped from types, store, mappers and schema).");
  p("- **Combining boxes** — adding Wildspire Waste to an Ancient Forest campaign adds 20 days to the timer; the app has no notion of which boxes a group owns.");
  p();
  p("- **Elder dragons need a 5★ tier.** Kushala Daora, Nergigante and Teostra all have 1★/2★/**5★** quests, but `QuestStars` stops at four-star and there is no `five-star.png` icon.");
  p();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_MD, md.join("\n"));
  console.log(`wrote ${OUT_MD}`);

  renderPdf(md.join("\n"));
}

/** Minimal markdown -> HTML, good enough for this report's subset. */
function toHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inTable = false;
  let inList = false;

  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      html.push("</tbody></table>");
      inTable = false;
    }
  };

  for (const line of lines) {
    if (/^\|[\s-:|]+\|$/.test(line)) continue; // table separator
    if (line.startsWith("|")) {
      const cells = line.slice(1, -1).split("|").map((c) => inline(c.trim()));
      if (!inTable) {
        closeList();
        html.push("<table><thead><tr>");
        for (const c of cells) html.push(`<th>${c}</th>`);
        html.push("</tr></thead><tbody>");
        inTable = true;
      } else {
        html.push("<tr>");
        for (const c of cells) html.push(`<td>${c}</td>`);
        html.push("</tr>");
      }
      continue;
    }
    closeTable();

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      const item = line.slice(2).replace(/^\[ \]\s*/, "☐ ");
      html.push(`<li>${inline(item)}</li>`);
      continue;
    }
    closeList();
    if (line.trim()) html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  closeTable();

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font: 11pt/1.5 -apple-system, "Segoe UI", Roboto, sans-serif; color: #23201c; }
    h1 { font-size: 20pt; border-bottom: 2px solid #c47a2c; padding-bottom: 6px; }
    h2 { font-size: 14pt; margin-top: 22px; color: #8a5418; page-break-after: avoid; }
    h3 { font-size: 12pt; margin-top: 16px; page-break-after: avoid; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; page-break-inside: avoid; }
    th, td { border: 1px solid #d8d0c4; padding: 5px 7px; text-align: left; vertical-align: top; }
    th { background: #f4ece0; }
    code { background: #f4ece0; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
    ul { margin: 6px 0; padding-left: 20px; }
    li { margin: 2px 0; }
  </style></head><body>${html.join("\n")}</body></html>`;
}

function renderPdf(markdown: string) {
  const htmlPath = resolve(OUT_DIR, ".missing-data.html");
  writeFileSync(htmlPath, toHtml(markdown));
  const chrome = ["google-chrome-stable", "chromium", "google-chrome"].find((bin) => {
    try {
      execFileSync("which", [bin], { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  });
  if (!chrome) {
    console.warn("No Chrome found — wrote markdown only.");
    return;
  }
  execFileSync(chrome, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${OUT_PDF}`,
    `file://${htmlPath}`,
  ], { stdio: "pipe" });
  if (existsSync(OUT_PDF)) console.log(`wrote ${OUT_PDF}`);
}

main();
