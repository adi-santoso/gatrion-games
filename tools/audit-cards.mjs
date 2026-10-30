#!/usr/bin/env node
/**
 * Audit aset 40 kartu Duel Kartu.
 *
 * Membuktikan (bukan mengasumsikan):
 *  - katalog berisi tepat 40 kartu dan 40 file SVG;
 *  - setiap kartu punya file art, path gambar, dan kredit CC BY 3.0;
 *  - tidak ada art duplikat / placeholder / file yatim;
 *  - semua ikon termuat di browser, lalu membuat galeri screenshot.
 *
 * Hasil:
 *   artifacts/card-audit.txt   tabel yang bisa dibaca manusia
 *   artifacts/card-audit.json  data mentah untuk diperiksa ulang
 *   artifacts/card-gallery.html + card-gallery.png
 *
 * Pemakaian: node tools/audit-cards.mjs [--no-gallery]
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CARDS, CARD_COUNT, DECKS, FACTION_LABEL, ROW_LABEL } from "../src/games/gwent/cards.ts";
import { ART_CREDITS, CREDITS_BY_ID } from "../src/games/gwent/artCredits.ts";

const ART_DIR = "public/art/kartu";
const OUT_DIR = "artifacts";
const EXPECTED = 40;

const KIND_LABEL = {
  unit: "Unit",
  hero: "Hero",
  weather: "Cuaca",
  horn: "Terompet",
  scorch: "Bakar",
  morale: "Morale",
};

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

function factionOf(id) {
  if (id.startsWith("b-")) return FACTION_LABEL.benteng;
  if (id.startsWith("r-")) return FACTION_LABEL.rawa;
  return "Netral";
}

function statsOf(card) {
  const kind = KIND_LABEL[card.kind] ?? card.kind;
  if (card.row && card.strength !== undefined) {
    return `${kind} · ${ROW_LABEL[card.row]} · ${card.strength}`;
  }
  return kind;
}

const cards = Object.values(CARDS).sort((a, b) => a.id.localeCompare(b.id));

check(CARD_COUNT === EXPECTED, `CARD_COUNT ${CARD_COUNT}, seharusnya ${EXPECTED}`);
check(cards.length === EXPECTED, `katalog berisi ${cards.length} kartu, seharusnya ${EXPECTED}`);
check(
  new Set(cards.map((card) => card.name)).size === cards.length,
  "ada nama kartu yang dipakai dua kali",
);
check(ART_CREDITS.length === EXPECTED, `kredit art ${ART_CREDITS.length}, seharusnya ${EXPECTED}`);

const files = existsSync(ART_DIR)
  ? readdirSync(ART_DIR)
      .filter((file) => file.endsWith(".svg"))
      .sort()
  : [];
check(files.length === EXPECTED, `folder art berisi ${files.length} SVG, seharusnya ${EXPECTED}`);

const knownIds = new Set(cards.map((card) => card.id));
for (const file of files) {
  if (!knownIds.has(file.replace(/\.svg$/, ""))) problems.push(`file yatim: ${file}`);
}

const seenHash = new Map();
const rows = [];

for (const card of cards) {
  const file = path.join(ART_DIR, `${card.id}.svg`);
  const credit = CREDITS_BY_ID[card.id];
  const exists = existsSync(file);
  const svg = exists ? readFileSync(file, "utf8") : "";
  const hash = svg ? createHash("sha256").update(svg).digest("hex") : "";
  const pathCount = (svg.match(/<path/g) ?? []).length;
  const hasDrawing = /<path[^>]*\sd="/.test(svg) || /<(circle|rect|polygon|ellipse)/.test(svg);

  check(exists, `${card.id}: file art tidak ada`);
  check(card.art === `/art/kartu/${card.id}.svg`, `${card.id}: path art tidak sesuai (${card.art})`);
  check(svg.includes("<svg"), `${card.id}: bukan SVG`);
  check(hasDrawing && pathCount > 0, `${card.id}: SVG tanpa gambar`);
  check(svg.length >= 200, `${card.id}: SVG terlalu kecil (${svg.length} byte), curiga placeholder`);
  check(!/placeholder|lorem ipsum/i.test(svg), `${card.id}: SVG berisi teks placeholder`);
  check(Boolean(credit), `${card.id}: tidak ada kredit art`);
  check(credit?.license === "CC BY 3.0", `${card.id}: lisensi ${credit?.license}, seharusnya CC BY 3.0`);
  check(
    Boolean(credit?.source?.includes("game-icons.net")),
    `${card.id}: sumber bukan game-icons.net`,
  );
  check(Boolean(credit?.author), `${card.id}: penulis ikon kosong`);

  if (hash) {
    if (seenHash.has(hash)) {
      problems.push(`${card.id}: art identik dengan ${seenHash.get(hash)} (duplikat)`);
    } else {
      seenHash.set(hash, card.id);
    }
  }

  rows.push({
    id: card.id,
    name: card.name,
    kind: card.kind,
    stats: statsOf(card),
    faction: factionOf(card.id),
    icon: credit?.icon ?? "-",
    author: credit?.author ?? "-",
    license: credit?.license ?? "-",
    source: credit?.source ?? "-",
    bytes: svg.length,
    sha256: hash,
  });
}

for (const [faction, deck] of Object.entries(DECKS)) {
  check(deck.cards.length === 24, `dek ${faction} berisi ${deck.cards.length} kartu, seharusnya 24`);
  for (const id of deck.cards) {
    check(Boolean(CARDS[id]), `dek ${faction}: id tidak dikenal ${id}`);
  }
}

if (rows.length > 0) {
  const widths = {
    id: Math.max(4, ...rows.map((row) => row.id.length)),
    name: Math.max(4, ...rows.map((row) => row.name.length)),
    stats: Math.max(5, ...rows.map((row) => row.stats.length)),
    icon: Math.max(4, ...rows.map((row) => row.icon.length)),
    author: Math.max(6, ...rows.map((row) => row.author.length)),
  };
  const line = (row) =>
    [
      row.id.padEnd(widths.id),
      row.name.padEnd(widths.name),
      row.stats.padEnd(widths.stats),
      row.icon.padEnd(widths.icon),
      row.author.padEnd(widths.author),
      row.license.padEnd(9),
      String(row.bytes).padStart(5),
      row.sha256.slice(0, 10),
    ].join("  ");

  const header = line({
    id: "id",
    name: "nama",
    stats: "jenis",
    icon: "ikon",
    author: "penulis",
    license: "lisensi",
    bytes: "byte",
    sha256: "sha256",
  });

  const table = [header, "-".repeat(header.length), ...rows.map(line)].join("\n");
  const summary = [
    "",
    `Ringkasan: ${rows.length} kartu, ${files.length} file SVG, ${seenHash.size} art unik, ${problems.length} masalah.`,
    problems.length === 0 ? "STATUS: LULUS — tidak ada duplikat atau placeholder." : "STATUS: GAGAL",
    ...problems.map((problem) => `  - ${problem}`),
  ].join("\n");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "card-audit.txt"), `${table}\n${summary}\n`);
  writeFileSync(
    path.join(OUT_DIR, "card-audit.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        cardCount: rows.length,
        artFiles: files.length,
        uniqueArt: seenHash.size,
        duplicateIconNames: rows
          .map((row) => row.icon)
          .filter((icon, index, list) => list.indexOf(icon) !== index),
        problems,
        cards: rows,
      },
      null,
      2,
    )}\n`,
  );

  console.log(table);
  console.log(summary);
}

const skipGallery = process.argv.includes("--no-gallery");

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
  });
}

function galleryHtml() {
  const groups = [
    ["Benteng Utara", rows.filter((row) => row.id.startsWith("b-"))],
    ["Kawanan Rawa", rows.filter((row) => row.id.startsWith("r-"))],
    ["Kartu Efek", rows.filter((row) => row.id.startsWith("s-"))],
  ];
  const total = rows.length;

  const card = (row, index) => `
      <figure class="card" data-id="${escapeHtml(row.id)}">
        <span class="num">${String(index + 1).padStart(2, "0")}</span>
        <img src="../${ART_DIR}/${escapeHtml(row.id)}.svg" alt="${escapeHtml(row.name)}" width="96" height="96" />
        <figcaption>
          <strong>${escapeHtml(row.name)}</strong>
          <span>${escapeHtml(row.stats)}</span>
          <small>${escapeHtml(row.icon)} · ${escapeHtml(row.author)} · CC BY 3.0</small>
        </figcaption>
      </figure>`;

  let counter = 0;
  const sections = groups
    .map(
      ([title, list]) => `
    <section>
      <h2>${escapeHtml(title)} <em>${list.length} kartu</em></h2>
      <div class="grid">${list.map((row) => card(row, counter++)).join("")}</div>
    </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Galeri 40 kartu — Duel Kartu</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px 32px 40px;
    background: #0b1512;
    color: #ece9df;
    font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
  h1 { margin: 0; font-size: 26px; letter-spacing: -0.02em; }
  header p { margin: 0; color: #9db299; font: 11px/1.4 ui-monospace, monospace; }
  section { margin-top: 24px; }
  h2 {
    margin: 0 0 10px;
    color: #c8f36a;
    font: 600 13px/1.2 ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h2 em { color: #9db299; font-style: normal; letter-spacing: 0; text-transform: none; }
  .grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 10px; }
  .card {
    position: relative;
    display: flex;
    margin: 0;
    padding: 12px 10px 10px;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border: 1px solid #2b3f31;
    border-radius: 10px;
    background: #121f18;
  }
  .num {
    position: absolute;
    top: 5px;
    left: 7px;
    color: #6f8269;
    font: 9px/1 ui-monospace, monospace;
  }
  .card img { width: 64px; height: 64px; margin-top: 4px; }
  figcaption { display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
  figcaption strong { font-size: 12px; line-height: 1.2; }
  figcaption span { color: #9db299; font: 8.5px/1.3 ui-monospace, monospace; }
  figcaption small { color: #6f8269; font: 7.5px/1.3 ui-monospace, monospace; }
</style>
</head>
<body>
  <header>
    <h1>Duel Kartu — galeri ${total} kartu</h1>
    <p>art: game-icons.net (CC BY 3.0) · setiap kartu satu ikon unik</p>
  </header>
  ${sections}
</body>
</html>`;
}

if (!skipGallery) {
  mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = path.join(OUT_DIR, "card-gallery.html");
  writeFileSync(htmlPath, galleryHtml());

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: "load" });
    const broken = await page.evaluate(async () => {
      await Promise.all(
        [...document.images].map((image) =>
          image.complete
            ? null
            : new Promise((resolve) => {
                image.onload = resolve;
                image.onerror = resolve;
              }),
        ),
      );
      return [...document.images]
        .filter((image) => image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"));
    });

    const count = await page.locator("figure.card").count();
    if (count !== rows.length) problems.push(`galeri: ${count} kartu tampil, seharusnya ${rows.length}`);
    if (broken.length > 0) problems.push(`galeri: ${broken.length} gambar gagal dimuat`);

    await page.screenshot({ path: path.join(OUT_DIR, "card-gallery.png"), fullPage: true });
    console.log(
      `\ngaleri: ${count} kartu, ${broken.length} gambar rusak -> ${OUT_DIR}/card-gallery.png`,
    );
  } finally {
    await browser.close();
  }
}

process.exitCode = problems.length === 0 ? 0 : 1;
