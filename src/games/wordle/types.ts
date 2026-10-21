export type Lang = "id" | "en";
export type Mode = "daily" | "free";
export type GameStatus = "playing" | "won" | "lost";
export type LetterState = "correct" | "present" | "absent";

export interface Game {
  lang: Lang;
  mode: Mode;
  /** nomor puzzle harian, null untuk mode bebas */
  puzzle: number | null;
  answer: string;
  guesses: string[];
  current: string;
  status: GameStatus;
  startedAt: number;
}

export interface DictionaryMeta {
  generatedAt?: string;
  answers?: number;
  guesses?: number;
  answerSource?: string;
  guessSource?: string;
}

export interface Dictionary {
  answers: string[];
  guesses: string[];
  words: Set<string>;
  meta: DictionaryMeta;
}

export interface DailyStats {
  streak: number;
  best: number;
  lastPuzzle: number | null;
}

export interface LangStats {
  played: number;
  wins: number;
  streak: number;
  best: number;
  /** distribusi menang: index 0 = menang di tebakan ke-1 */
  dist: number[];
  daily: DailyStats;
}

export type Stats = Record<Lang, LangStats>;

export type Games = Record<Lang, Record<Mode, Game | null>>;

export interface Settings {
  lang: Lang;
  mode: Mode;
  hard: boolean;
}

export interface HardModeResult {
  ok: boolean;
  reason: string;
}
