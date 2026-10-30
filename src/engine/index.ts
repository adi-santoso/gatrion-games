/**
 * Harness game 2D bersama — fondasi untuk game arcade berikutnya.
 *
 * Resep menambah game baru:
 * 1. Logika murni (tanpa DOM) di `src/games/<nama>/logic.ts`, plus tesnya.
 * 2. Tampilan di `src/games/<nama>/<Nama>Page.tsx`:
 *    `const canvasRef = useRef<HTMLCanvasElement>(null)`
 *    `const input = useGameInput({ active })`
 *    `useGameLoop(canvasRef, { active, stepMs, update, render })`
 * 3. Daftarkan di dua tempat: union `AppId` di `src/desktop/types.ts` dan satu
 *    entri `APPS` di `src/desktop/apps.tsx` (`fill: true`, ikon SVG, `render`).
 *    Dock, Launchpad, Spotlight, menu bar, Mission Control, ⌘Tab, dan
 *    penyimpanan tata letak mengikuti otomatis.
 *
 * Aturan:
 * - Jangan menaruh engine 3D (Three/Babylon) di root aplikasi. Kalau suatu saat
 *   ada game 3D, `import()` engine itu di dalam `render()` satu aplikasi saja
 *   supaya hanya pemain game tersebut yang mengunduhnya.
 * - Update state React cukup dari `update()`, jangan dari `render()`.
 */

export { MAX_FRAME_MS, consumeFrame, fitGrid } from "./loop";
export type { GridFit, StepResult } from "./loop";

export { MAX_DPR, clearCanvas, drawLabel, fillRoundRect, fitCanvas } from "./canvas";
export type { CanvasSize, LabelOptions } from "./canvas";

export { ARROW_BINDINGS, actionForCode, bindGameKeys, createInputState } from "./input";
export type { Bindings, BindOptions, GameAction, InputState } from "./input";

export { useGameInput } from "./useGameInput";
export { useGameLoop } from "./useGameLoop";
export type { GameInputOptions } from "./useGameInput";
export type { GameLoopOptions } from "./useGameLoop";
