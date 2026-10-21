import { scoreGuess } from "./engine";
import type { Game } from "./types";

const EMOJI = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
} as const;

export function buildShareText(game: Game, hard: boolean): string {
  const scoreLabel =
    game.status === "won" ? `${game.guesses.length}/6` : game.status === "lost" ? "X/6" : "-/6";
  const modeLabel = game.mode === "daily" ? `harian #${game.puzzle}` : "bebas";
  const header = [
    "gatrion wordle",
    modeLabel,
    game.lang,
    hard ? "hard" : null,
    scoreLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  const grid = game.guesses
    .map((guess) =>
      scoreGuess(guess, game.answer)
        .map((state) => EMOJI[state])
        .join(""),
    )
    .join("\n");

  return grid ? `${header}\n${grid}` : header;
}
