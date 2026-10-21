import { describe, expect, it } from "vitest";
import { wordleReducer } from "./reducer";
import type { Game } from "./types";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    lang: "id",
    mode: "free",
    puzzle: null,
    answer: "rumah",
    guesses: [],
    current: "",
    status: "playing",
    startedAt: 0,
    ...overrides,
  };
}

describe("wordleReducer", () => {
  it("menambah huruf sampai lima", () => {
    let game = makeGame();
    for (const letter of "ruma") {
      game = wordleReducer(game, { type: "letter", letter });
    }
    expect(game.current).toBe("ruma");

    game = wordleReducer(game, { type: "letter", letter: "h" });
    game = wordleReducer(game, { type: "letter", letter: "x" });
    expect(game.current).toBe("rumah");
  });

  it("mengabaikan karakter selain huruf", () => {
    const game = wordleReducer(makeGame(), { type: "letter", letter: "1" });
    expect(game.current).toBe("");
  });

  it("menghapus huruf terakhir", () => {
    const game = wordleReducer(makeGame({ current: "rum" }), { type: "backspace" });
    expect(game.current).toBe("ru");
  });

  it("menang saat tebakan sama dengan jawaban", () => {
    const game = wordleReducer(makeGame({ current: "rumah" }), {
      type: "commit",
      word: "rumah",
    });
    expect(game.status).toBe("won");
    expect(game.guesses).toEqual(["rumah"]);
    expect(game.current).toBe("");
  });

  it("kalah setelah enam tebakan salah", () => {
    let game = makeGame({ guesses: ["a", "b", "c", "d", "e"] });
    game = wordleReducer(game, { type: "commit", word: "kabar" });
    expect(game.status).toBe("lost");
    expect(game.guesses).toHaveLength(6);
  });

  it("tidak menerima input setelah selesai", () => {
    const finished = makeGame({ status: "won", guesses: ["rumah"] });
    expect(wordleReducer(finished, { type: "letter", letter: "a" }).current).toBe("");
    expect(wordleReducer(finished, { type: "commit", word: "besar" }).guesses).toEqual(["rumah"]);
  });

  it("mengabaikan commit dengan panjang salah", () => {
    const game = wordleReducer(makeGame({ current: "ruma" }), {
      type: "commit",
      word: "ruma",
    });
    expect(game.guesses).toEqual([]);
    expect(game.current).toBe("ruma");
  });

  it("memulai game baru", () => {
    const next = makeGame({ answer: "besar", current: "ru" });
    const game = wordleReducer(makeGame(), { type: "start", game: next });
    expect(game).toEqual(next);
  });
});
