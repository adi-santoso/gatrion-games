import { readJSON, removeKey, writeJSON, writeString } from "../../lib/storage";
import { MAX_GUESSES, WORD_LENGTH } from "./engine";
import type { Game, Games, LangStats, Lang, Mode, Settings, Stats } from "./types";

export const WORDLE_KEYS = {
  settings: "gatrion.wordle.settings.v2",
  stats: "gatrion.wordle.stats.v2",
  games: "gatrion.wordle.games.v2",
  legacyStats: "gatrion.wordle.stats",
  legacyLang: "gatrion.wordle.lang",
  legacyGame: "gatrion.wordle.game",
} as const;

export function emptyLangStats(): LangStats {
  return {
    played: 0,
    wins: 0,
    streak: 0,
    best: 0,
    dist: [0, 0, 0, 0, 0, 0],
    daily: { streak: 0, best: 0, lastPuzzle: null },
  };
}

export function emptyStats(): Stats {
  return { id: emptyLangStats(), en: emptyLangStats() };
}

export function emptyGames(): Games {
  return {
    id: { daily: null, free: null },
    en: { daily: null, free: null },
  };
}

export function defaultSettings(): Settings {
  return { lang: "id", mode: "daily", hard: false };
}

// ---------------------------------------------------------------- guards
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeLangStats(value: unknown): LangStats | null {
  if (!isRecord(value)) return null;
  const dist = Array.isArray(value.dist)
    ? value.dist.slice(0, MAX_GUESSES).map((n) => toNumber(n, 0))
    : emptyLangStats().dist;
  while (dist.length < MAX_GUESSES) dist.push(0);

  const daily = isRecord(value.daily) ? value.daily : {};
  return {
    played: Math.max(0, toNumber(value.played, 0)),
    wins: Math.max(0, toNumber(value.wins, 0)),
    streak: Math.max(0, toNumber(value.streak, 0)),
    best: Math.max(0, toNumber(value.best, 0)),
    dist,
    daily: {
      streak: Math.max(0, toNumber(daily.streak, 0)),
      best: Math.max(0, toNumber(daily.best, 0)),
      lastPuzzle:
        typeof daily.lastPuzzle === "number" && Number.isFinite(daily.lastPuzzle)
          ? daily.lastPuzzle
          : null,
    },
  };
}

export function isValidGame(value: unknown, lang: Lang, mode: Mode): value is Game {
  if (!isRecord(value)) return false;
  const guesses = value.guesses;
  return (
    value.lang === lang &&
    value.mode === mode &&
    typeof value.answer === "string" &&
    value.answer.length === WORD_LENGTH &&
    Array.isArray(guesses) &&
    guesses.length <= MAX_GUESSES &&
    guesses.every((g) => typeof g === "string") &&
    typeof value.current === "string" &&
    (value.status === "playing" || value.status === "won" || value.status === "lost") &&
    (mode === "daily" ? typeof value.puzzle === "number" : value.puzzle === null)
  );
}

// ---------------------------------------------------------------- settings
export function loadSettings(): Settings {
  const base = defaultSettings();
  const saved = readJSON<Record<string, unknown> | null>(WORDLE_KEYS.settings, null);
  const legacyLang = readJSON<string | null>(WORDLE_KEYS.legacyLang, null);

  if (typeof legacyLang === "string") {
    if (legacyLang === "en" || legacyLang === "id") base.lang = legacyLang;
  }
  if (saved) {
    if (saved.lang === "id" || saved.lang === "en") base.lang = saved.lang;
    if (saved.mode === "daily" || saved.mode === "free") base.mode = saved.mode;
    base.hard = saved.hard === true;
  }
  return base;
}

export function saveSettings(settings: Settings): void {
  writeJSON(WORDLE_KEYS.settings, settings);
  writeString(WORDLE_KEYS.legacyLang, settings.lang);
}

// ---------------------------------------------------------------- stats
export function loadStats(): Stats {
  const fresh = emptyStats();
  const saved = readJSON<Record<string, unknown> | null>(WORDLE_KEYS.stats, null);

  if (saved) {
    for (const lang of ["id", "en"] as const) {
      const sanitized = sanitizeLangStats(saved[lang]);
      if (sanitized) fresh[lang] = sanitized;
    }
    return fresh;
  }

  // migrasi dari skema v1 (agregat per bahasa, tanpa statistik harian)
  const legacy = readJSON<Record<string, unknown> | null>(WORDLE_KEYS.legacyStats, null);
  if (legacy) {
    for (const lang of ["id", "en"] as const) {
      const sanitized = sanitizeLangStats(legacy[lang]);
      if (sanitized) fresh[lang] = sanitized;
    }
  }
  return fresh;
}

export function saveStats(stats: Stats): void {
  writeJSON(WORDLE_KEYS.stats, stats);
}

// ---------------------------------------------------------------- games
export function loadGames(): Games {
  const fresh = emptyGames();
  const saved = readJSON<Record<string, unknown> | null>(WORDLE_KEYS.games, null);
  if (!saved) return fresh;

  for (const lang of ["id", "en"] as const) {
    const perMode = saved[lang];
    if (!isRecord(perMode)) continue;
    for (const mode of ["daily", "free"] as const) {
      const candidate = perMode[mode];
      if (isValidGame(candidate, lang, mode)) fresh[lang][mode] = candidate;
    }
  }
  return fresh;
}

export function saveGames(games: Games): void {
  writeJSON(WORDLE_KEYS.games, games);
}

/** Artefak skema lama tidak dipakai lagi. */
export function dropLegacyGame(): void {
  removeKey(WORDLE_KEYS.legacyGame);
}
