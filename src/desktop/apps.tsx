import type { ReactNode } from "react";
import { HubPage } from "../pages/HubPage";
import { IdlePage } from "../games/idle/IdlePage";
import { SnakePage } from "../games/snake/SnakePage";
import { WordlePage } from "../games/wordle/WordlePage";
import { SettingsApp } from "./components/SettingsApp";
import { GatrionGlyph, SettingsGlyph, SnakeGlyph, WordleGlyph } from "./components/icons";
import type { AppId, WindowSize } from "./types";

export interface AppDefinition {
  id: AppId;
  name: string;
  /** Label pendek untuk dock dan menu bar. */
  shortName: string;
  tagline: string;
  keywords: string[];
  size: WindowSize;
  /** Jendela tanpa padding: game mengatur scroll-nya sendiri. */
  fill: boolean;
  icon: ReactNode;
  render: (context: { focused: boolean }) => ReactNode;
}

export const APPS: AppDefinition[] = [
  {
    id: "gatrion",
    name: "Gatrion",
    shortName: "Gatrion",
    tagline: "Game kecil untuk mengisi jeda kerja.",
    keywords: ["beranda", "home", "hub", "game", "start"],
    size: { w: 900, h: 660 },
    fill: false,
    icon: <GatrionGlyph />,
    render: () => <HubPage />,
  },
  {
    id: "wordle",
    name: "Wordle",
    shortName: "Wordle",
    tagline: "Puzzle lima huruf, kamus Indonesia dan English.",
    keywords: ["wordle", "kata", "tebak", "puzzle", "harian"],
    size: { w: 980, h: 730 },
    fill: false,
    icon: <WordleGlyph />,
    render: ({ focused }) => <WordlePage active={focused} />,
  },
  {
    id: "idle",
    name: "Idle Tambang",
    shortName: "Tambang",
    tagline: "Tambang kristal yang jalan sendiri.",
    keywords: ["idle", "tambang", "kristal", "mine", "clicker"],
    size: { w: 1200, h: 780 },
    fill: true,
    icon: <img src="/icons/idle/core.png" alt="" width={64} height={64} className="app-icon-art" />,
    render: () => <IdlePage />,
  },
  {
    id: "snake",
    name: "Ular",
    shortName: "Ular",
    tagline: "Ular klasik di papan 17×17, makin cepat tiap makan.",
    keywords: ["ular", "snake", "arcade", "refleks", "klasik"],
    size: { w: 720, h: 700 },
    fill: true,
    icon: <SnakeGlyph />,
    render: ({ focused }) => <SnakePage active={focused} />,
  },
  {
    id: "settings",
    name: "Pengaturan Sistem",
    shortName: "Pengaturan",
    tagline: "Tema, dock, animasi, dan tata letak jendela.",
    keywords: ["pengaturan", "settings", "tema", "dock", "animasi"],
    size: { w: 680, h: 560 },
    fill: false,
    icon: <SettingsGlyph />,
    render: () => <SettingsApp />,
  },
];

export const APP_MAP = new Map(APPS.map((app) => [app.id, app]));

export function getApp(appId: AppId): AppDefinition {
  const app = APP_MAP.get(appId);
  if (!app) throw new Error(`Aplikasi tidak dikenal: ${appId}`);
  return app;
}

/** Deep link lama tetap jalan: /wordle dan /idle membuka jendelanya. */
export function appFromPath(pathname: string): AppId | null {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/wordle") return "wordle";
  if (clean === "/idle") return "idle";
  if (clean === "/snake") return "snake";
  if (clean === "/settings") return "settings";
  return null;
}
