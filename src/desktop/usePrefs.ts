import { useCallback, useEffect, useState } from "react";
import type { DesktopPrefs } from "./context";
import type { DockSize } from "./types";

export const PREFS_KEY = "gatrion.desktop.prefs.v1";

const DOCK_SIZES: DockSize[] = ["sm", "md", "lg"];

function isDockSize(value: unknown): value is DockSize {
  return DOCK_SIZES.includes(value as DockSize);
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function loadPrefs(): DesktopPrefs {
  const fallback: DesktopPrefs = {
    dockSize: "md",
    reduceMotion: prefersReducedMotion(),
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return fallback;
    const record = data as Record<string, unknown>;
    const dockSize = isDockSize(record.dockSize) ? record.dockSize : fallback.dockSize;
    return {
      dockSize,
      reduceMotion: typeof record.reduceMotion === "boolean" ? record.reduceMotion : fallback.reduceMotion,
    };
  } catch {
    return fallback;
  }
}

export function useDesktopPrefs() {
  const [prefs, setPrefs] = useState<DesktopPrefs>(loadPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // preferensi hanya berlaku untuk sesi ini
    }
  }, [prefs]);

  const setDockSize = useCallback((dockSize: DockSize) => {
    setPrefs((previous) => ({ ...previous, dockSize }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    setPrefs((previous) => ({ ...previous, reduceMotion }));
  }, []);

  return { prefs, setDockSize, setReduceMotion };
}
