import type { AppId, PersistedState } from "./types";

export const WINDOWS_KEY = "gatrion.desktop.windows.v1";

const APP_IDS: AppId[] = ["gatrion", "wordle", "idle", "settings"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRect(value: unknown): { x: number; y: number; w: number; h: number } | null {
  if (!isRecord(value)) return null;
  const x = num(value.x);
  const y = num(value.y);
  const w = num(value.w);
  const h = num(value.h);
  if (x === null || y === null || w === null || h === null) return null;
  return { x, y, w, h };
}

export function parseWindows(raw: string | null): PersistedState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || !Array.isArray(data.windows)) return null;

  const windows: PersistedState["windows"] = [];
  for (const entry of data.windows) {
    if (!isRecord(entry)) continue;
    const rect = readRect(entry);
    const appId = entry.appId;
    if (!rect || typeof appId !== "string" || !APP_IDS.includes(appId as AppId)) continue;
    if (typeof entry.id !== "string") continue;

    windows.push({
      ...rect,
      id: entry.id,
      appId: appId as AppId,
      zoomed: entry.zoomed === true,
      minimized: entry.minimized === true,
      restore: readRect(entry.restore),
      z: num(entry.z) ?? 1,
    });
  }

  const focusedId =
    typeof data.focusedId === "string" && windows.some((win) => win.id === data.focusedId)
      ? data.focusedId
      : null;
  const zTop = num(data.zTop) ?? windows.reduce((max, win) => Math.max(max, win.z), 0);

  return { windows, focusedId, zTop };
}

export function loadWindows(): PersistedState | null {
  try {
    return parseWindows(localStorage.getItem(WINDOWS_KEY));
  } catch {
    return null;
  }
}

export function saveWindows(state: PersistedState): void {
  try {
    localStorage.setItem(WINDOWS_KEY, JSON.stringify(state));
  } catch {
    // mode privat / kuota penuh: tata letak hanya berlaku untuk sesi ini
  }
}

export function clearWindows(): void {
  try {
    localStorage.removeItem(WINDOWS_KEY);
  } catch {
    // abaikan
  }
}
