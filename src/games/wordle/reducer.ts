import { MAX_GUESSES, WORD_LENGTH } from "./engine";
import type { Game } from "./types";

export type WordleAction =
  | { type: "letter"; letter: string }
  | { type: "backspace" }
  | { type: "commit"; word: string }
  | { type: "start"; game: Game };

/**
 * Reducer murni: semua validasi kamus/hard mode dilakukan pemanggil sebelum
 * "commit" dikirim, sehingga state selalu bisa direproduksi di test.
 */
export function wordleReducer(state: Game, action: WordleAction): Game {
  switch (action.type) {
    case "letter": {
      if (state.status !== "playing") return state;
      if (state.current.length >= WORD_LENGTH) return state;
      if (!/^[a-z]$/.test(action.letter)) return state;
      return { ...state, current: state.current + action.letter };
    }

    case "backspace": {
      if (state.status !== "playing") return state;
      if (!state.current) return state;
      return { ...state, current: state.current.slice(0, -1) };
    }

    case "commit": {
      if (state.status !== "playing") return state;
      if (action.word.length !== WORD_LENGTH) return state;

      const guesses = [...state.guesses, action.word];
      const status =
        action.word === state.answer
          ? "won"
          : guesses.length >= MAX_GUESSES
            ? "lost"
            : "playing";

      return { ...state, guesses, current: "", status };
    }

    case "start":
      return action.game;

    default:
      return state;
  }
}
