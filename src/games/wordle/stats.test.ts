import { describe, expect, it } from "vitest";
import { emptyStats } from "./storage";
import { applyResult } from "./stats";
import type { Game } from "./types";

function game(overrides: Partial<Game> = {}): Game {
  return {
    lang: "id",
    mode: "daily",
    puzzle: 100,
    answer: "rumah",
    guesses: ["besar", "rumah"],
    current: "",
    status: "won",
    startedAt: 0,
    ...overrides,
  };
}

describe("applyResult", () => {
  it("mencatat kemenangan, streak, dan distribusi", () => {
    const stats = applyResult(emptyStats(), game());
    expect(stats.id.played).toBe(1);
    expect(stats.id.wins).toBe(1);
    expect(stats.id.streak).toBe(1);
    expect(stats.id.best).toBe(1);
    expect(stats.id.dist[1]).toBe(1);
    expect(stats.en.played).toBe(0);
  });

  it("mengakhiri streak saat kalah", () => {
    const base = applyResult(emptyStats(), game());
    const lost = applyResult(base, game({ status: "lost", guesses: ["a", "b", "c", "d", "e", "f"], puzzle: 101 }));
    expect(lost.id.streak).toBe(0);
    expect(lost.id.best).toBe(1);
    expect(lost.id.played).toBe(2);
  });

  it("menyambung streak harian kalau puzzle berurutan", () => {
    const day1 = applyResult(emptyStats(), game({ puzzle: 100 }));
    const day2 = applyResult(day1, game({ puzzle: 101 }));
    const day3 = applyResult(day2, game({ puzzle: 102 }));
    expect(day3.id.daily.streak).toBe(3);
    expect(day3.id.daily.best).toBe(3);
  });

  it("memulai ulang streak harian kalau ada hari terlewat", () => {
    const day1 = applyResult(emptyStats(), game({ puzzle: 100 }));
    const skipped = applyResult(day1, game({ puzzle: 105 }));
    expect(skipped.id.daily.streak).toBe(1);
    expect(skipped.id.daily.lastPuzzle).toBe(105);
  });

  it("tidak menyentuh streak harian pada mode bebas", () => {
    const base = applyResult(emptyStats(), game({ puzzle: 100 }));
    const free = applyResult(base, game({ mode: "free", puzzle: null }));
    expect(free.id.daily.streak).toBe(1);
    expect(free.id.played).toBe(2);
  });

  it("kalah harian mereset streak", () => {
    const base = applyResult(emptyStats(), game({ puzzle: 100 }));
    const lost = applyResult(
      base,
      game({ status: "lost", puzzle: 101, guesses: ["a", "b", "c", "d", "e", "f"] }),
    );
    expect(lost.id.daily.streak).toBe(0);
    expect(lost.id.daily.lastPuzzle).toBe(101);
  });
});
