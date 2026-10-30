export type AppId = "gatrion" | "wordle" | "idle" | "snake" | "gwent" | "settings";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Area kerja desktop: di bawah menu bar, setinggi viewport. */
export interface Bounds {
  width: number;
  height: number;
  /** tinggi menu bar; jendela tidak boleh naik melewati garis ini */
  top: number;
}

export interface WindowState extends Rect {
  id: string;
  appId: AppId;
  zoomed: boolean;
  minimized: boolean;
  /** rect sebelum tombol hijau ditekan; null bila tidak sedang di-zoom */
  restore: Rect | null;
  /** urutan tumpukan; makin besar makin depan */
  z: number;
}

export interface WindowSize {
  w: number;
  h: number;
}

export interface PersistedState {
  windows: WindowState[];
  focusedId: string | null;
  zTop: number;
}

export type OverlayKind = "none" | "launchpad" | "spotlight" | "mission" | "about";

export type DockSize = "sm" | "md" | "lg";
