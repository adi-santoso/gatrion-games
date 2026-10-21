import { describe, expect, it } from "vitest";
import {
  MAX_GUESSES,
  buildDictionary,
  checkHardMode,
  dailyAnswerIndex,
  keyboardStates,
  puzzleNumber,
  scoreGuess,
  type DictionaryPayload,
} from "./engine";
import idData from "../../data/wordle-id.json";
import enData from "../../data/wordle-en.json";

const idDictionary = buildDictionary(idData as unknown as DictionaryPayload);
const enDictionary = buildDictionary(enData as unknown as DictionaryPayload);

describe("scoreGuess", () => {
  it.each([
    ["eagle", "level", ["present", "absent", "absent", "present", "present"]],
    ["cacao", "civic", ["correct", "absent", "present", "absent", "absent"]],
    ["apple", "apple", ["correct", "correct", "correct", "correct", "correct"]],
    ["kebab", "abbey", ["absent", "present", "correct", "present", "present"]],
    ["nacre", "crane", ["present", "present", "present", "present", "correct"]],
  ])("%s vs %s", (guess, answer, expected) => {
    expect(scoreGuess(guess, answer)).toEqual(expected);
  });

  it("menghitung huruf ganda sesuai jumlah di jawaban", () => {
    // jawaban "abbey" punya dua 'b'; tebakan "bobby" punya tiga
    const scores = scoreGuess("bobby", "abbey");
    expect(scores).toEqual(["present", "absent", "correct", "absent", "correct"]);
  });
});

describe("checkHardMode", () => {
  it("meloloskan tebakan pertama", () => {
    expect(checkHardMode([], "kabar", "kamar").ok).toBe(true);
  });

  it("mewajibkan huruf hijau tetap di posisinya", () => {
    const result = checkHardMode(["kabar"], "bakar", "kamar");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("K");
  });

  it("mewajibkan huruf kuning dipakai lagi", () => {
    const result = checkHardMode(["murah"], "kurah", "rumah");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("M");
  });

  it("meloloskan tebakan yang memakai semua petunjuk", () => {
    expect(checkHardMode(["murah"], "rumah", "rumah").ok).toBe(true);
    expect(checkHardMode(["kabar"], "kadar", "kamar").ok).toBe(true);
  });
});

describe("seed puzzle harian", () => {
  it("naik satu per hari dan stabil dalam hari yang sama", () => {
    const today = puzzleNumber(new Date(2026, 9, 21, 9, 0));
    const later = puzzleNumber(new Date(2026, 9, 21, 23, 59));
    const tomorrow = puzzleNumber(new Date(2026, 9, 22, 0, 1));
    expect(later).toBe(today);
    expect(tomorrow).toBe(today + 1);
  });

  it("deterministik untuk tanggal, bahasa, dan ukuran kamus yang sama", () => {
    const first = dailyAnswerIndex("id", 747, idDictionary.answers.length);
    const second = dailyAnswerIndex("id", 747, idDictionary.answers.length);
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(idDictionary.answers.length);
  });

  it("menyebar ke banyak jawaban berbeda", () => {
    const seen = new Set<number>();
    for (let puzzle = 700; puzzle < 760; puzzle++) {
      seen.add(dailyAnswerIndex("id", puzzle, idDictionary.answers.length));
    }
    expect(seen.size).toBeGreaterThanOrEqual(55);
  });

  it("memisahkan bahasa", () => {
    expect(dailyAnswerIndex("id", 747, 1000)).not.toBe(dailyAnswerIndex("en", 747, 1000));
  });
});

describe("keyboardStates", () => {
  it("memakai petunjuk terbaik per huruf", () => {
    const states = keyboardStates(["kabar", "kadar"], "kamar");
    expect(states.k).toBe("correct");
    expect(states.a).toBe("correct");
    expect(states.b).toBe("absent");
    expect(states.d).toBe("absent");
    expect(states.r).toBe("correct");
  });
});

describe("kamus", () => {
  const cases = [
    { lang: "id", dictionary: idDictionary, answers: 2549, guesses: 14170 },
    { lang: "en", dictionary: enDictionary, answers: 2315, guesses: 14855 },
  ];

  it.each(cases)("$lang lengkap dan konsisten", ({ dictionary, answers, guesses }) => {
    expect(dictionary.answers).toHaveLength(answers);
    expect(dictionary.guesses).toHaveLength(guesses);
    expect(dictionary.answers.every((word) => /^[a-z]{5}$/.test(word))).toBe(true);
    expect(dictionary.guesses.every((word) => /^[a-z]{5}$/.test(word))).toBe(true);
    expect(new Set(dictionary.guesses).size).toBe(dictionary.guesses.length);
    expect(dictionary.answers.every((word) => dictionary.words.has(word))).toBe(true);
    expect(dictionary.meta.answers).toBe(answers);
    expect(dictionary.meta.guesses).toBe(guesses);
    expect(MAX_GUESSES).toBe(6);
  });
});
