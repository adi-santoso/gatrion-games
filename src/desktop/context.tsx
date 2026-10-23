import { createContext, useContext } from "react";
import type { AppId, DockSize } from "./types";

export interface DesktopPrefs {
  dockSize: DockSize;
  reduceMotion: boolean;
}

export interface DesktopApi {
  prefs: DesktopPrefs;
  setDockSize: (size: DockSize) => void;
  setReduceMotion: (value: boolean) => void;
  resetLayout: () => void;
  closeAllWindows: () => void;
  minimizeAll: () => void;
  openApp: (appId: AppId) => void;
  openSpotlight: () => void;
  openMissionControl: () => void;
  windowCount: number;
}

export const DesktopContext = createContext<DesktopApi | null>(null);

export function useDesktop(): DesktopApi {
  const api = useContext(DesktopContext);
  if (!api) throw new Error("useDesktop hanya boleh dipakai di dalam <Desktop>");
  return api;
}
