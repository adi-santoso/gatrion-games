import { readJSON, writeJSON } from "../../lib/storage";
import { sanitizeSave } from "./economy";
import type { IdleSave } from "./types";

export const IDLE_KEY = "gatrion.idle.save";

export function loadIdleSave(now = Date.now()): IdleSave {
  return sanitizeSave(readJSON<unknown>(IDLE_KEY, null), now);
}

export function saveIdleSave(save: IdleSave): void {
  writeJSON(IDLE_KEY, save);
}

/** Ringkasan kecil untuk hub (tanpa memuat seluruh state). */
export function readIdleTotal(): number {
  const raw = readJSON<{ total?: unknown } | null>(IDLE_KEY, null);
  const total = Number(raw?.total);
  return Number.isFinite(total) && total > 0 ? total : 0;
}
