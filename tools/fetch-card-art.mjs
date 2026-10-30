#!/usr/bin/env node
/**
 * Ambil art kartu dari game-icons.net (CC BY 3.0).
 *
 * Kenapa bukan Google Images: hasil pencarian gambar tidak membawa lisensi.
 * game-icons.net memberi 4.000+ ikon fantasi yang bisa dipakai komersial
 * selama penulisnya dikreditkan, dan tiap ikon benar-benar menggambarkan
 * karakter kartunya.
 *
 * Pemakaian:
 *   node tools/fetch-card-art.mjs --dry
 *   node tools/fetch-card-art.mjs [--force]
 *
 * Hasil:
 *   public/art/kartu/<id>.svg
 *   ART-CREDITS.csv
 *   src/games/gwent/artCredits.ts
 */

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "public/art/kartu";
const CREDITS_CSV = "ART-CREDITS.csv";
const CREDITS_TS = "src/games/gwent/artCredits.ts";
const TREE_API = "https://api.github.com/repos/game-icons/icons/git/trees/master?recursive=1";
const RAW = "https://raw.githubusercontent.com/game-icons/icons/master";
const SITE = "https://game-icons.net/1x1";
const LICENSE = "CC BY 3.0";

/** Urutan nama ikon (tanpa .svg) yang dicoba untuk tiap kartu. */
const MANIFEST = [
  { id: "b-prajurit", picks: ["shield", "round-shield", "checked-shield", "bordered-shield"] },
  { id: "b-ksatria", picks: ["mounted-knight", "knight-banner", "black-knight-helm"] },
  { id: "b-penjaga", picks: ["castle", "portcullis", "gate", "tower-guard"] },
  { id: "b-panji", picks: ["knight-banner", "vertical-banner", "tattered-banner"] },
  { id: "b-pemanah", picks: ["bow-arrow", "high-shot", "arrow-flights"] },
  { id: "b-silang", picks: ["crossbow", "crossbowman"] },
  { id: "b-tabib", picks: ["healing", "medical-pack", "herbs-bundle", "health-normal"] },
  { id: "b-balista", picks: ["ballista", "crossbow", "arrow-cluster"] },
  { id: "b-katapel", picks: ["catapult", "onager"] },
  { id: "b-dentum", picks: ["siege-tower", "siege-ram", "castle"] },
  { id: "b-jenderal", picks: ["swordman", "cavalry", "commander"] },
  { id: "b-penjaga-agung", picks: ["halberd", "guard", "spartan-helmet"] },
  { id: "b-pengepung", picks: ["cannon", "artillery-shell", "mortar"] },
  { id: "b-kavaleri", picks: ["cavalry", "mounted-knight", "horse-head"] },
  { id: "b-tabur", picks: ["fire", "flame", "fire-ring"] },
  { id: "b-menara-panah", picks: ["watchtower", "archery-target", "arrow-scope", "castle"] },
  { id: "b-panglima", picks: ["warlord-helmet", "commander", "crowned-skull", "swordman"] },
  { id: "b-obor", picks: ["torch", "primitive-torch", "flame"] },

  { id: "r-serigala", picks: ["wolf-head", "direwolf", "wolf-howl"] },
  { id: "r-raksasa", picks: ["giant", "troll", "ogre"] },
  { id: "r-gigit", picks: ["snake-bite", "fangs", "snake-tongue", "rattlesnake"] },
  { id: "r-kelelawar", picks: ["bat-wing", "bat", "swamp-bat"] },
  { id: "r-dengung", picks: ["fly", "wasp-sting", "insect-jaws", "beetle"] },
  { id: "r-lontar", picks: ["falling-boulder", "boulder-dash", "rock"] },
  { id: "r-pohon", picks: ["tree-face", "willow-tree", "dead-tree"] },
  { id: "r-ratu", picks: ["queen-crown", "card-queen-hearts", "chess-queen"] },
  { id: "r-mata", picks: ["all-seeing-eye", "eye", "eye-of-horus"] },
  { id: "r-ular-rawa", picks: ["snake-spiral", "sand-snake", "rattlesnake"] },
  { id: "r-katak", picks: ["frog", "frog-prince", "leapfrog"] },
  { id: "r-laba", picks: ["spider-alt", "angular-spider", "spider-face"] },
  { id: "r-burung", picks: ["vulture", "crow-dive", "bird-claw"] },
  { id: "r-akar", picks: ["tree-roots", "plant-roots", "root-tip"] },
  { id: "r-kabut", picks: ["fog", "fog-light", "cloudy-fork"] },
  { id: "r-iblis", picks: ["devil-mask", "imp", "horned-skull", "demon-skull"] },
  { id: "r-tengkorak", picks: ["skull", "animal-skull", "skull-staff"] },
  { id: "r-raja", picks: ["old-king", "card-king-hearts", "chess-king"] },

  { id: "s-cuaca", picks: ["lightning-storm", "storm", "sandstorm"] },
  { id: "s-terompet", picks: ["trumpet", "trumpet-flag", "horn"] },
  { id: "s-bakar", picks: ["burning-embers", "fire-zone", "flame", "fire"] },
  { id: "s-moral", picks: ["vertical-banner", "trumpet-flag", "battle-standard"] },
];

const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");
const force = args.has("--force");

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function loadTree() {
  const cache = "/tmp/game-icons-tree.json";
  if (await exists(cache)) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(cache, "utf8"));
  }
  const response = await fetch(TREE_API, { signal: AbortSignal.timeout(40_000) });
  if (!response.ok) throw new Error(`tree HTTP ${response.status}`);
  const payload = await response.json();
  await writeFile(cache, JSON.stringify(payload));
  return payload;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/\s+/g, " ").replace(/"/g, '""').trim()}"`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const tree = await loadTree();
  const files = tree.tree
    .filter((item) => item.path.endsWith(".svg"))
    .map((item) => {
      const parts = item.path.split("/");
      const author = parts[0];
      const name = parts[parts.length - 1].replace(/\.svg$/, "");
      return { path: item.path, author, name };
    });

  const byName = new Map();
  for (const file of files) {
    if (!byName.has(file.name)) byName.set(file.name, file);
  }

  const credits = [];
  const missing = [];

  for (const entry of MANIFEST) {
    const match =
      entry.picks.map((pick) => byName.get(pick)).find(Boolean) ??
      files.find((file) => entry.picks.some((pick) => file.name.includes(pick)));

    if (!match) {
      missing.push(entry.id);
      console.log(`tidak ada ikon untuk ${entry.id} (${entry.picks.join(", ")})`);
      continue;
    }

    const file = path.join(OUT_DIR, `${entry.id}.svg`);
    if (dry) {
      console.log(`${entry.id.padEnd(18)} -> ${match.author}/${match.name}`);
      continue;
    }

    if (force || !(await exists(file))) {
      const response = await fetch(`${RAW}/${match.path}`, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${entry.id}: HTTP ${response.status}`);
      const svg = await response.text();
      if (!svg.includes("<svg")) throw new Error(`${entry.id}: bukan SVG`);
      await writeFile(file, svg);
    }

    credits.push({
      id: entry.id,
      icon: match.name,
      author: match.author,
      source: `${SITE}/${match.author}/${match.name}.html`,
      license: LICENSE,
    });
    console.log(`ok ${entry.id.padEnd(18)} ${match.author}/${match.name}`);
  }

  if (dry) return;

  const csv = [
    "id,icon,author,source,license",
    ...credits.map((item) =>
      [item.id, item.icon, item.author, item.source, item.license].map(csvCell).join(","),
    ),
  ].join("\n");
  await writeFile(CREDITS_CSV, `${csv}\n`);

  const authors = [...new Set(credits.map((item) => item.author))].sort();
  const ts = `/**
 * Kredit art kartu — dihasilkan oleh tools/fetch-card-art.mjs.
 * Semua ikon: game-icons.net, lisensi CC BY 3.0.
 */

export interface ArtCredit {
  id: string;
  icon: string;
  author: string;
  source: string;
  license: string;
}

export const ART_CREDITS: ArtCredit[] = ${JSON.stringify(credits, null, 2)};

export const CREDITS_BY_ID: Record<string, ArtCredit> = Object.fromEntries(
  ART_CREDITS.map((credit) => [credit.id, credit]),
);

/** Baris siap tempel di layar kredit aplikasi. */
export const CREDITS_LINE = "Ikon kartu oleh ${authors.join(", ")} — game-icons.net (CC BY 3.0)";
`;
  await writeFile(CREDITS_TS, ts);

  console.log(`\nselesai: ${credits.length} ikon, ${missing.length} tanpa ikon`);
  if (missing.length > 0) process.exitCode = 1;
}

await main();
