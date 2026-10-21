import type {
  Dictionary,
  DictionaryMeta,
  HardModeResult,
  Lang,
  LetterState,
} from "./types";

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
const EPOCH_UTC = Date.UTC(2024, 0, 1);

/**
 * Skor tiap huruf dengan dua pass, supaya huruf ganda tidak dihitung dua kali.
 */
export function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = new Array(WORD_LENGTH).fill("absent");
  const pool: Array<string | null> = answer.split("");

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      pool[i] = null;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const index = pool.indexOf(guess[i]);
    if (index !== -1) {
      result[i] = "present";
      pool[index] = null;
    }
  }
  return result;
}

/** FNV-1a 32-bit, cukup untuk seed harian yang stabil. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** PRNG deterministik: seed sama -> urutan angka sama. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nomor puzzle harian berdasarkan tanggal lokal; 0 = 1 Januari 2024. */
export function puzzleNumber(date: Date): number {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - EPOCH_UTC) / 86_400_000);
}

/** Indeks jawaban harian: sama untuk semua pemain di tanggal & bahasa itu. */
export function dailyAnswerIndex(lang: Lang, puzzle: number, total: number): number {
  if (total <= 0) return 0;
  const random = mulberry32(hashString(`${lang}:${puzzle}`));
  return Math.floor(random() * total) % total;
}

/**
 * Hard mode: petunjuk yang sudah terbuka wajib dipakai lagi.
 * - hijau  -> huruf harus di posisi yang sama
 * - kuning -> huruf harus muncul lagi, minimal sebanyak kemunculan sebelumnya
 */
export function checkHardMode(
  previousGuesses: string[],
  guess: string,
  answer: string,
): HardModeResult {
  const fixed: Array<string | null> = new Array(WORD_LENGTH).fill(null);
  const required = new Map<string, number>();

  for (const previous of previousGuesses) {
    const scores = scoreGuess(previous, answer);
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (scores[i] === "correct") fixed[i] = previous[i];
    }
    const counts = new Map<string, number>();
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (scores[i] === "absent") continue;
      const letter = previous[i];
      counts.set(letter, (counts.get(letter) ?? 0) + 1);
    }
    for (const [letter, count] of counts) {
      required.set(letter, Math.max(required.get(letter) ?? 0, count));
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = fixed[i];
    if (letter && guess[i] !== letter) {
      return {
        ok: false,
        reason: `Huruf ${letter.toUpperCase()} harus di posisi ${i + 1}.`,
      };
    }
  }
  for (const [letter, count] of required) {
    let used = 0;
    for (let i = 0; i < WORD_LENGTH; i++) if (guess[i] === letter) used++;
    if (used < count) {
      return {
        ok: false,
        reason: `Tebakan harus memuat huruf ${letter.toUpperCase()}.`,
      };
    }
  }

  return { ok: true, reason: "" };
}

export interface DictionaryPayload {
  meta?: DictionaryMeta;
  answers: string[];
  guesses: string[];
}

export function buildDictionary(payload: DictionaryPayload): Dictionary {
  return {
    answers: payload.answers,
    guesses: payload.guesses,
    words: new Set(payload.guesses),
    meta: payload.meta ?? {},
  };
}

/** Status keyboard: tiap huruf memakai petunjuk terbaik yang pernah didapat. */
export function keyboardStates(
  guesses: string[],
  answer: string,
): Record<string, LetterState> {
  const rank: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };
  const states: Record<string, LetterState> = {};

  for (const guess of guesses) {
    const scores = scoreGuess(guess, answer);
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i];
      const current = states[letter];
      if (!current || rank[scores[i]] > rank[current]) states[letter] = scores[i];
    }
  }
  return states;
}

/** Ringkasan petunjuk untuk pengumuman pembaca layar. */
export function describeGuess(scores: LetterState[]): string {
  const correct = scores.filter((s) => s === "correct").length;
  const present = scores.filter((s) => s === "present").length;
  return `${correct} tepat, ${present} salah tempat`;
}
