import { useEffect, useState, type CSSProperties } from "react";
import { MAX_GUESSES, WORD_LENGTH, scoreGuess } from "../engine";
import type { Game } from "../types";

interface Props {
  game: Game;
  shakeSignal: number;
}

export function Board({ game, shakeSignal }: Props) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (shakeSignal === 0) return;
    setShaking(true);
    const timer = window.setTimeout(() => setShaking(false), 420);
    return () => window.clearTimeout(timer);
  }, [shakeSignal]);

  const activeRow = game.status === "playing" ? game.guesses.length : -1;

  return (
    <div
      id="board"
      role="grid"
      aria-label="Papan tebakan"
      className="mt-6 grid w-full grid-cols-1 gap-1.5"
    >
      {Array.from({ length: MAX_GUESSES }, (_, row) => {
        const guess = game.guesses[row];
        const scores = guess ? scoreGuess(guess, game.answer) : null;
        const letters = guess ?? (row === activeRow ? game.current : "");
        const isShaking = shaking && row === activeRow;

        return (
          <div
            key={guess ? `${row}-${guess}` : `row-${row}`}
            role="row"
            aria-label={guess ? `Tebakan ${row + 1}` : undefined}
            className={`grid grid-cols-5 gap-1.5 sm:gap-2 ${isShaking ? "shake" : ""}`}
          >
            {Array.from({ length: WORD_LENGTH }, (_, column) => {
              const letter = letters[column] ?? "";
              const state = scores?.[column];
              return (
                <div
                  key={column}
                  role="gridcell"
                  aria-label={letter ? `${letter.toUpperCase()} ${state ?? "belum dinilai"}` : "kosong"}
                  className={`tile aspect-square text-2xl sm:text-3xl ${guess ? "tile-reveal" : ""}`}
                  data-filled={letter ? "true" : "false"}
                  data-state={state}
                  style={guess ? ({ "--i": column } as CSSProperties) : undefined}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
