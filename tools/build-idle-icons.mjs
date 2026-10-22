#!/usr/bin/env node
// Generator aset ikon untuk game idle.
//
//   node tools/build-idle-icons.mjs            # tulis SVG + PNG (kalau resvg terpasang)
//   node tools/build-idle-icons.mjs --svg-only # hanya SVG
//   node tools/build-idle-icons.mjs --sheet    # tulis contact sheet ke .cache untuk cek visual
//
// PNG dibuat dengan @resvg/resvg-js (dev-only, tidak masuk dependency proyek):
//   npm install --prefix .cache/render @resvg/resvg-js
//   NODE_PATH=.cache/render/node_modules node tools/build-idle-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/icons/idle");
const CACHE = path.join(ROOT, ".cache/idle-icons");

const CREAM = "#ece9df";
const LIME = "#cdf94b";
const AMBER = "#e0bf7a";
const VOID = "#101109";

/** Plat gelap bergaya slot item: terbaca di tema terang maupun gelap. */
function plate(gradId) {
  return `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2e2f24"/>
        <stop offset="1" stop-color="#14150e"/>
      </linearGradient>
    </defs>
    <rect x="1.75" y="1.75" width="60.5" height="60.5" rx="14" fill="url(#${gradId})" stroke="#4b4d37" stroke-width="1.5"/>
    <path d="M13 9 Q32 3 51 9" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="3"/>`;
}

const ART = {
  pick: `
    <path d="M15 34 Q35 5 55 34" stroke="${LIME}" stroke-width="7"/>
    <path d="M15 34 l-4 7 M55 34 l4 7" stroke="${LIME}" stroke-width="5"/>
    <path d="M35 22 L26 54" stroke="${CREAM}" stroke-width="5"/>
    <path d="M27 46 l7 4" stroke="${AMBER}" stroke-width="4"/>
    <circle cx="35" cy="22" r="2.6" fill="${CREAM}"/>
  `,
  drill: `
    <rect x="18" y="18" width="21" height="17" rx="5" stroke="${CREAM}" stroke-width="3.4"/>
    <rect x="22" y="23" width="8" height="7" rx="1.5" fill="${LIME}"/>
    <path d="M39 21 h7 v8 h-7" stroke="${CREAM}" stroke-width="3.2"/>
    <path d="M22 35 h13 v5 h-9" stroke="${CREAM}" stroke-width="3"/>
    <path d="M28 40 v11" stroke="${CREAM}" stroke-width="4"/>
    <path d="M23 44 l9 3 M23 49 l9 3" stroke="${LIME}" stroke-width="2.2"/>
    <path d="M18 29 h-4" stroke="${AMBER}" stroke-width="3.4"/>
  `,
  rig: `
    <path d="M14 52 L32 12 L50 52" stroke="${CREAM}" stroke-width="3.5"/>
    <path d="M21 36 h22" stroke="${CREAM}" stroke-width="2.6"/>
    <path d="M26 45 h12" stroke="${CREAM}" stroke-width="2.6"/>
    <path d="M32 17 v20" stroke="${LIME}" stroke-width="2.4" stroke-dasharray="3 3"/>
    <circle cx="32" cy="12" r="3.4" fill="${LIME}"/>
    <rect x="12" y="52" width="40" height="4" rx="2" fill="${CREAM}"/>
  `,
  plant: `
    <path d="M12 52 V34 L24 40 V34 L36 40 V26 H52 V52 Z" stroke="${CREAM}" stroke-width="3.4"/>
    <path d="M42 26 V15 h6 v11" stroke="${CREAM}" stroke-width="3"/>
    <path d="M45 11 c3 -3 7 -1 6 3" stroke="${LIME}" stroke-width="2.4"/>
    <rect x="17" y="44" width="5" height="5" fill="${LIME}"/>
    <rect x="27" y="44" width="5" height="5" fill="${LIME}"/>
    <rect x="38" y="42" width="5" height="5" fill="${LIME}"/>
    <rect x="45" y="42" width="4" height="5" fill="${AMBER}"/>
  `,
  reactor: `
    <circle cx="32" cy="32" r="14" stroke="${CREAM}" stroke-width="3.4"/>
    <circle cx="32" cy="32" r="6.5" stroke="${LIME}" stroke-width="2.6"/>
    <circle cx="32" cy="32" r="2.6" fill="${LIME}"/>
    <path d="M32 18 a14 14 0 0 1 12 7" stroke="${AMBER}" stroke-width="3.6"/>
    <path d="M32 46 a14 14 0 0 1 -12 -7" stroke="${AMBER}" stroke-width="3.6"/>
    <path d="M13 32 h4 M47 32 h4" stroke="${CREAM}" stroke-width="3"/>
  `,
  singularity: `
    <circle cx="32" cy="32" r="9.5" fill="${VOID}" stroke="${LIME}" stroke-width="2.4"/>
    <circle cx="32" cy="32" r="3" fill="${LIME}"/>
    <ellipse cx="32" cy="32" rx="20" ry="7" stroke="${CREAM}" stroke-width="3" transform="rotate(-20 32 32)"/>
    <ellipse cx="32" cy="32" rx="13.5" ry="4.5" stroke="${AMBER}" stroke-width="2.2" transform="rotate(-20 32 32)"/>
    <path d="M50 18 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4 z" fill="${CREAM}" fill-opacity="0.9"/>
  `,
  gate: `
    <path d="M16 52 V30 a16 16 0 0 1 32 0 V52" stroke="${CREAM}" stroke-width="3.4"/>
    <path d="M23 52 V30 a9 9 0 0 1 18 0 V52" stroke="${LIME}" stroke-width="2.6"/>
    <path d="M12 52 h40" stroke="${CREAM}" stroke-width="3.4"/>
    <path d="M32 25 a6 6 0 1 1 -6 6" stroke="${AMBER}" stroke-width="2.4"/>
    <circle cx="32" cy="25" r="2.4" fill="${AMBER}"/>
    <circle cx="14" cy="18" r="1.8" fill="${LIME}"/>
    <circle cx="50" cy="18" r="1.8" fill="${LIME}"/>
  `,
  dyson: `
    <circle cx="32" cy="32" r="8.5" fill="${LIME}"/>
    <path d="M32 19 v-6 M32 45 v6 M19 32 h-6 M45 32 h6 M23 23 l-4 -4 M41 41 l4 4 M41 23 l4 -4 M23 41 l-4 4" stroke="${AMBER}" stroke-width="2.6"/>
    <ellipse cx="32" cy="32" rx="24" ry="8.5" stroke="${CREAM}" stroke-width="3" transform="rotate(-18 32 32)"/>
    <circle cx="51" cy="39" r="2.2" fill="${CREAM}"/>
  `,
  city: `
    <path d="M13 52 h38" stroke="${CREAM}" stroke-width="3.4"/>
    <path d="M16 52 V30 l6 -7 l6 7 V52" stroke="${CREAM}" stroke-width="2.8"/>
    <path d="M30 52 V22 l7 -6 l7 6 V52" stroke="${LIME}" stroke-width="2.8"/>
    <path d="M46 52 V36 l5 -4 l5 4 V52" stroke="${CREAM}" stroke-width="2.8"/>
    <circle cx="37" cy="32" r="1.6" fill="${CREAM}"/>
    <circle cx="37" cy="40" r="1.6" fill="${CREAM}"/>
  `,
  core: `
    <path d="M32 32 C41 29 47 21 41 14 C36 9 27 12 25 19" stroke="${CREAM}" stroke-width="3.2"/>
    <path d="M32 32 C23 35 17 43 23 50 C28 55 37 52 39 45" stroke="${LIME}" stroke-width="2.8"/>
    <circle cx="32" cy="32" r="5" fill="${CREAM}"/>
    <circle cx="32" cy="32" r="2" fill="${LIME}"/>
    <circle cx="49" cy="31" r="1.4" fill="${LIME}"/>
    <circle cx="15" cy="33" r="1.4" fill="${LIME}"/>
    <circle cx="45" cy="52" r="1.2" fill="${CREAM}"/>
    <circle cx="19" cy="14" r="1.2" fill="${CREAM}"/>
  `,
};

function svg(id, art) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Ikon ${id}">
  <title>${id}</title>${plate(`plate-${id}`)}
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">${art}
  </g>
</svg>
`;
}

function sheet(ids) {
  const cell = 96;
  const cols = 5;
  const rows = Math.ceil(ids.length / cols);
  const body = ids
    .map((id, index) => {
      const x = (index % cols) * cell + 16;
      const y = Math.floor(index / cols) * cell + 16;
      return `<g transform="translate(${x} ${y}) scale(1)">${plate(`plate-sheet-${id}`)}${ART[id]}</g>`;
    })
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cell} ${rows * cell}" width="${cols * cell}" height="${rows * cell}">
  <rect width="100%" height="100%" fill="#0f100c"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</g>
</svg>
`;
}

async function loadResvg() {
  const local = path.join(ROOT, ".cache/render/node_modules/@resvg/resvg-js/index.js");
  for (const target of ["@resvg/resvg-js", pathToFileURL(local).href]) {
    try {
      const mod = await import(target);
      const Resvg = mod.Resvg ?? mod.default?.Resvg;
      if (Resvg) return Resvg;
    } catch {
      // coba sumber berikutnya
    }
  }
  return null;
}

const ids = Object.keys(ART);
const svgOnly = process.argv.includes("--svg-only");
const wantSheet = process.argv.includes("--sheet");

await mkdir(OUT, { recursive: true });
for (const id of ids) {
  await writeFile(path.join(OUT, `${id}.svg`), svg(id, ART[id]), "utf8");
}
console.log(`svg  ${ids.length} file -> public/icons/idle/`);

const Resvg = svgOnly ? null : await loadResvg();
if (!Resvg) {
  console.log(
    "png  dilewati (resvg tidak ada). Pasang: npm install --prefix .cache/render @resvg/resvg-js",
  );
} else {
  for (const id of ids) {
    const png = new Resvg(svg(id, ART[id]), { fitTo: { mode: "width", value: 192 } }).render().asPng();
    await writeFile(path.join(OUT, `${id}.png`), png);
  }
  console.log(`png  ${ids.length} file (192px) -> public/icons/idle/`);

  if (wantSheet) {
    await mkdir(CACHE, { recursive: true });
    const png = new Resvg(sheet(ids), { fitTo: { mode: "width", value: 960 } }).render().asPng();
    await writeFile(path.join(CACHE, "sheet.png"), png);
    console.log("sheet -> .cache/idle-icons/sheet.png");
  }
}
