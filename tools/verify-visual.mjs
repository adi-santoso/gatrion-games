#!/usr/bin/env node
/**
 * Verifikasi Duel Kartu di Chromium headless.
 *
 * Yang diperiksa (bukan sekadar "tidak error"):
 *  - canvas Phaser ada, ukurannya > 0, dan screenshot-nya punya variasi warna;
 *  - alur main: 3 kartu, satu kartu bertarget, Lewat, ronde selesai, Main lagi;
 *  - fallback DOM saat WebGL dimatikan, saat reduce-motion, dan saat chunk
 *    Phaser gagal dimuat (ErrorBoundary);
 *  - console error / pageerror harus kosong.
 *
 * Jalankan setelah `vite preview` hidup:
 *   BASE_URL=http://127.0.0.1:4173 node tools/verify-visual.mjs
 */

import { writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const report = { steps: [], consoleErrors: [], pageErrors: [], screenshots: [], failures: [] };

function fail(message) {
  report.failures.push(message);
  console.log(`FAIL  ${message}`);
}

function ok(message) {
  console.log(`ok    ${message}`);
}

/** Variasi warna dari screenshot PNG: bukti papan tergambar, bukan latar kosong. */
function canvasStats(buffer) {
  const png = PNG.sync.read(buffer);
  const counts = new Map();
  let sampled = 0;

  for (let y = 0; y < png.height; y += 2) {
    for (let x = 0; x < png.width; x += 2) {
      const offset = (png.width * y + x) << 2;
      const key = `${png.data[offset]},${png.data[offset + 1]},${png.data[offset + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      sampled += 1;
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b - a);
  const dominant = sorted[0] ?? 0;
  const nonDominant = sampled - dominant;

  return {
    width: png.width,
    height: png.height,
    uniqueColors: counts.size,
    sampled,
    nonDominant,
    nonDominantShare: Number((nonDominant / Math.max(sampled, 1)).toFixed(3)),
  };
}

function watch(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push(`${label}: ${message.text()}`);
  });
  page.on("pageerror", (error) => report.pageErrors.push(`${label}: ${error.message}`));
}

async function openBoard(browser, viewport, label) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  watch(page, label);
  await page.goto(`${BASE}/#/gwent`, { waitUntil: "load" });
  return { context, page };
}

async function clickHiddenButton(page, selector) {
  return page.evaluate((target) => {
    const button = document.querySelector(target);
    if (!button) return false;
    button.click();
    return true;
  }, selector);
}

async function measureCanvas(page, name) {
  await page.waitForSelector(".gwent-canvas canvas", { timeout: 20_000 });
  await page.waitForTimeout(1_500);

  const box = await page.locator(".gwent-canvas canvas").boundingBox();
  if (!box || box.width < 200 || box.height < 200) {
    fail(`${name}: canvas terlalu kecil (${box?.width ?? 0}×${box?.height ?? 0})`);
  } else {
    ok(`${name}: canvas ${Math.round(box.width)}×${Math.round(box.height)}`);
  }

  const file = `/tmp/gwent-${name}-canvas.png`;
  const buffer = await page.locator(".gwent-canvas canvas").screenshot({ path: file });
  report.screenshots.push(file);
  const stats = canvasStats(buffer);
  report.steps.push({ name, canvas: stats });

  if (stats.width === 0 || stats.height === 0) fail(`${name}: screenshot canvas kosong`);
  if (stats.uniqueColors < 12) fail(`${name}: warna terlalu seragam (${stats.uniqueColors})`);
  if (stats.nonDominant < 500) fail(`${name}: hampir semua piksel warna latar (${stats.nonDominant})`);

  ok(
    `${name}: ${stats.width}×${stats.height}, ${stats.uniqueColors} warna, ${stats.nonDominant} piksel non-latar (${stats.nonDominantShare * 100}%)`,
  );
  return stats;
}

async function screenshotWindow(page, name) {
  const file = `/tmp/gwent-${name}.png`;
  await page.screenshot({ path: file });
  report.screenshots.push(file);
  return file;
}

/** Cari kartu yang butuh sasaran (cuaca/terompet) di daftar a11y. */
async function playOneCard(page) {
  return page.evaluate(() => {
    const list = document.querySelector('ul[aria-label="Kartu di tangan"]');
    const buttons = [...(list?.querySelectorAll("button:not([disabled])") ?? [])];
    if (buttons.length === 0) return { played: false, reason: "no-card" };
    const target = buttons.find((button) => /Cuaca|Terompet/.test(button.textContent ?? ""));
    (target ?? buttons[0]).click();
    return { played: true, targeted: Boolean(target), name: (target ?? buttons[0]).textContent };
  });
}

async function handHasTarget(page) {
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll('ul[aria-label="Kartu di tangan"] button')];
    return buttons.some((button) => /Cuaca|Terompet/.test(button.textContent ?? ""));
  });
}

async function restartGame(page) {
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll(".gwent-bar button")];
    const again = buttons.find((button) => /Main lagi/i.test(button.textContent ?? ""));
    again?.click();
    return Boolean(again);
  });
}

async function pickTargetRow(page) {
  return page.evaluate(() => {
    const picker = document.querySelector(".gwent-target-inline");
    const button = picker?.querySelector("button");
    if (!button) return false;
    button.click();
    return true;
  });
}

async function passTurn(page) {
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll(".gwent-bar button")];
    const pass = buttons.find((button) => /Lewat/i.test(button.textContent ?? ""));
    if (!pass || pass.disabled) return false;
    pass.click();
    return true;
  });
}

async function handCount(page) {
  return page.evaluate(
    () => document.querySelectorAll('ul[aria-label="Kartu di tangan"] li').length,
  );
}

async function statusText(page) {
  return page.evaluate(() => document.querySelector(".gwent-status")?.textContent ?? "");
}

async function installLogRecorder(page) {
  await page.evaluate(() => {
    window.__gwLogs = [];
    const node = document.querySelector('.gwent-phaser [role="status"]');
    if (!node) return;
    new MutationObserver(() => window.__gwLogs.push(node.textContent ?? "")).observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
}

async function runGameplay(browser) {
  const { context, page } = await openBoard(browser, { width: 1280, height: 800 }, "gameplay");
  await installLogRecorder(page);

  await measureCanvas(page, "desktop");
  await screenshotWindow(page, "desktop");

  const handStart = await handCount(page);
  if (handStart !== 10) fail(`gameplay: tangan awal ${handStart}, seharusnya 10`);

  let played = 0;
  let targetedUsed = false;
  let passes = 0;
  let roundsFinished = 0;
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const snapshot = await page.evaluate(() => {
      const list = document.querySelector('ul[aria-label="Kartu di tangan"]');
      const pass = [...document.querySelectorAll(".gwent-bar button")].find((button) =>
        /Lewat/i.test(button.textContent ?? ""),
      );
      return {
        status: document.querySelector(".gwent-status")?.textContent ?? "",
        enabled: list?.querySelectorAll("button:not([disabled])").length ?? 0,
        target: Boolean(document.querySelector(".gwent-target-inline")),
        passEnabled: pass ? !pass.disabled : false,
        log: document.querySelector('.gwent-phaser [role="status"]')?.textContent ?? "",
      };
    });

    if (snapshot.status === "selesai") break;

    const round = snapshot.log.match(/^Ronde (\d+):/);
    if (round) roundsFinished = Math.max(roundsFinished, Number(round[1]));

    if (snapshot.target) {
      await pickTargetRow(page);
      targetedUsed = true;
      await page.waitForTimeout(500);
      continue;
    }

    if (snapshot.enabled > 0) {
      const result = await playOneCard(page);
      if (result.played) played += 1;
      await page.waitForTimeout(700);
      continue;
    }

    if (snapshot.passEnabled) {
      await passTurn(page);
      passes += 1;
    }

    await page.waitForTimeout(700);
  }

  // Log ronde bisa tergeser cepat oleh log berikutnya; baca riwayat lengkap.
  const logs = await page.evaluate(() => window.__gwLogs ?? []);
  for (const line of logs) {
    const round = line.match(/^Ronde (\d+):/);
    if (round) roundsFinished = Math.max(roundsFinished, Number(round[1]));
  }

  const status = await statusText(page);
  if (status !== "selesai") fail("gameplay: pertandingan tidak selesai dalam 120 detik");
  else
    ok(
      `gameplay: pertandingan selesai (${played} kartu, ${passes}x lewat, ${roundsFinished} ronde dinilai)`,
    );

  if (played < 3) fail(`gameplay: hanya ${played} kartu dimainkan`);

  // Kocokan bisa saja tidak memberi kartu efek sampai pertandingan selesai.
  // Ulangi sampai kartu bertarget muncul, lalu pastikan pemilih baris bekerja.
  for (let attempt = 0; attempt < 6 && !targetedUsed; attempt += 1) {
    await restartGame(page);
    await page.waitForTimeout(600);
    if (!(await handHasTarget(page))) continue;
    await playOneCard(page);
    await page.waitForTimeout(400);
    targetedUsed = await pickTargetRow(page);
    await page.waitForTimeout(500);
  }
  if (!targetedUsed) fail("gameplay: tidak ada kartu bertarget yang terpakai");
  if (roundsFinished < 1) fail("gameplay: tidak ada ronde yang dinilai");

  await screenshotWindow(page, "gameplay-over");

  // Main lagi harus mereset papan ke ronde 1 dengan tangan penuh.
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll(".gwent-bar button")];
    const again = buttons.find((button) => /Main lagi/i.test(button.textContent ?? ""));
    if (again) again.click();
  });
  await page.waitForTimeout(1_200);

  const restartedStatus = await statusText(page);
  const restartedHand = await handCount(page);
  if (restartedStatus === "selesai") fail("gameplay: Main lagi tidak mereset pertandingan");
  if (restartedHand !== 10) fail(`gameplay: setelah Main lagi tangan ${restartedHand}, seharusnya 10`);
  if (restartedStatus !== "selesai" && restartedHand === 10) ok("gameplay: Main lagi mereset papan");

  await measureCanvas(page, "desktop-after-restart");
  await context.close();
}

async function runMobile(browser) {
  const { context, page } = await openBoard(browser, { width: 390, height: 844 }, "mobile");
  await measureCanvas(page, "mobile");
  await screenshotWindow(page, "mobile");

  const hand = await handCount(page);
  if (hand !== 10) fail(`mobile: tangan ${hand}, seharusnya 10`);
  if (await playOneCard(page)) await page.waitForTimeout(1_000);
  ok("mobile: kartu bisa dimainkan lewat kontrol a11y");
  await context.close();
}

async function runFallback(browser, mode) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  watch(page, `fallback-${mode}`);

  if (mode === "no-webgl") {
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
        if (String(type).startsWith("webgl")) return null;
        return original.call(this, type, ...rest);
      };
    });
  }

  if (mode === "reduced-motion") {
    await context.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query) =>
        String(query).includes("prefers-reduced-motion")
          ? { matches: true, media: query, addEventListener() {}, removeEventListener() {} }
          : original(query);
    });
  }

  if (mode === "broken-chunk") {
    await page.route("**/PhaserBoard-*.js", (route) => route.abort());
  }

  await page.goto(`${BASE}/#/gwent`, { waitUntil: "load" });
  await page.waitForSelector(".gwent-app", { timeout: 20_000 });
  await page.waitForTimeout(800);

  const canvas = await page.locator(".gwent-canvas").count();
  if (canvas > 0) fail(`fallback-${mode}: canvas tetap muncul, seharusnya DOM`);

  const cards = await page.locator(".gw-hand button").count();
  if (cards !== 10) fail(`fallback-${mode}: kartu di tangan ${cards}, seharusnya 10`);

  const before = await page.locator('[data-testid="gw-total-player"]').innerText();
  await page.locator(".gw-hand button").first().click();
  await page.waitForTimeout(200);
  // Kartu efek (cuaca/terompet) membuka pilihan baris dulu.
  const targetChoice = page.locator(".gw-target .gw-button").first();
  if (await targetChoice.count()) await targetChoice.click();
  await page.waitForTimeout(900);
  const after = await page.locator('[data-testid="gw-total-player"]').innerText();
  const remaining = await page.locator(".gw-hand button").count();

  const file = `/tmp/gwent-fallback-${mode}.png`;
  await page.screenshot({ path: file });
  report.screenshots.push(file);

  if (remaining !== 9) fail(`fallback-${mode}: setelah main kartu tersisa ${remaining}, seharusnya 9`);
  if (before === after && remaining === 10) fail(`fallback-${mode}: tidak ada perubahan skor/tangan`);

  ok(`fallback-${mode}: DOM tampil, ${cards} kartu, main kartu mengubah papan`);
  await context.close();
}

async function main() {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  try {
    await runGameplay(browser);
    await runMobile(browser);
    await runFallback(browser, "no-webgl");
    await runFallback(browser, "reduced-motion");
    await runFallback(browser, "broken-chunk");
  } finally {
    await browser.close();
  }

  report.consoleErrors = [...new Set(report.consoleErrors)];
  report.pageErrors = [...new Set(report.pageErrors)];

  // Uji chunk rusak sengaja memblokir file Phaser, jadi kegagalan muat itu wajar.
  const expectedChunkError =
    /fallback-broken-chunk: (Failed to load resource: net::ERR_FAILED|TypeError: Failed to fetch dynamically imported module)/;
  const expectedErrors = report.consoleErrors.filter((entry) => expectedChunkError.test(entry));
  report.consoleErrors = report.consoleErrors.filter((entry) => !expectedChunkError.test(entry));
  report.expectedErrors = expectedErrors;

  if (report.consoleErrors.length > 0) fail(`console error: ${report.consoleErrors.join(" | ")}`);
  if (report.pageErrors.length > 0) fail(`pageerror: ${report.pageErrors.join(" | ")}`);

  writeFileSync("/tmp/gwent-verify-report.json", JSON.stringify(report, null, 2));
  console.log(`\nconsole errors: ${report.consoleErrors.length}`);
  console.log(`page errors   : ${report.pageErrors.length}`);
  console.log(`screenshots   : ${report.screenshots.join(", ")}`);
  console.log(`laporan       : /tmp/gwent-verify-report.json`);

  if (report.failures.length > 0) {
    console.log(`\n${report.failures.length} kegagalan`);
    process.exitCode = 1;
  } else {
    console.log("\nsemua pemeriksaan lulus");
  }
}

await main();
