import { useMemo } from "react";
import { keyboardStates } from "../engine";

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "back"],
] as const;

interface Props {
  guesses: string[];
  answer: string;
  onKey: (key: string) => void;
  disabled?: boolean;
}

const LABELS: Record<string, string> = {
  enter: "kirim tebakan",
  back: "hapus huruf",
};

export function Keyboard({ guesses, answer, onKey, disabled = false }: Props) {
  const states = useMemo(() => keyboardStates(guesses, answer), [guesses, answer]);

  return (
    <div id="keyboard" className="mt-6 space-y-1.5">
      {KEY_ROWS.map((row) => (
        <div key={row[0]} className="flex justify-center gap-1.5">
          {row.map((key) => {
            const wide = key === "enter" || key === "back";
            return (
              <button
                key={key}
                type="button"
                className="key"
                data-wide={wide ? "true" : undefined}
                data-state={states[key]}
                aria-label={LABELS[key] ?? `huruf ${key}`}
                disabled={disabled}
                onClick={() => onKey(key)}
              >
                {key === "back" ? "del" : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
