import { useEffect, useState } from "react";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Shell } from "../../components/Shell";
import { Toast } from "../../components/Toast";
import { Board } from "./components/Board";
import { Keyboard } from "./components/Keyboard";
import { SettingsDialog } from "./components/SettingsDialog";
import { StatsPanel } from "./components/StatsPanel";
import { useWordle } from "./useWordle";
import type { Lang, Mode } from "./types";

const LANG_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "id", label: "id" },
  { value: "en", label: "en" },
];

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
  { value: "daily", label: "harian" },
  { value: "free", label: "bebas" },
];

export function WordlePage() {
  const wordle = useWordle();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { press, game, dictionary } = wordle;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (settingsOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Enter") {
        event.preventDefault();
        press("enter");
      } else if (event.key === "Backspace") {
        event.preventDefault();
        press("back");
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        press(event.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [press, settingsOpen]);

  const finished = game ? game.status !== "playing" : false;
  const stats = wordle.stats[wordle.settings.lang];

  return (
    <Shell>
      <main className="grid gap-12 pb-20 lg:grid-cols-[minmax(0,1fr)_252px] lg:gap-14">
        <section className="mx-auto w-full max-w-[340px] sm:max-w-[356px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="display text-3xl">Wordle</h1>
              <p className="mono mt-1.5 text-[11px] text-muted">
                <span>{wordle.settings.mode === "daily" ? "harian" : "bebas"}</span>
                {" · "}
                <span data-testid="puzzle-number">
                  {game?.mode === "daily" ? `#${game.puzzle}` : "acak"}
                </span>
                {wordle.settings.hard && (
                  <span className="ml-1 rounded border border-lime/40 px-1 text-[10px] text-lime">
                    hard
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SegmentedControl
                label="Pilih kamus"
                value={wordle.settings.lang}
                options={LANG_OPTIONS}
                onChange={wordle.switchLang}
              />
              <button
                type="button"
                className="mono text-[10px] text-muted underline-offset-2 transition hover:text-ink hover:underline"
                onClick={() => setSettingsOpen(true)}
              >
                pengaturan
              </button>
            </div>
          </div>

          <div className="mt-5">
            <SegmentedControl
              label="Pilih mode"
              value={wordle.settings.mode}
              options={MODE_OPTIONS}
              onChange={wordle.switchMode}
              wide
            />
          </div>

          {wordle.loadError && (
            <p className="mono mt-6 text-[11px] leading-relaxed text-danger">{wordle.loadError}</p>
          )}

          {!game || !dictionary ? (
            <div className="mt-6 space-y-1.5" aria-busy="true">
              {Array.from({ length: 6 }, (_, row) => (
                <div key={row} className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {Array.from({ length: 5 }, (_, column) => (
                    <div key={column} className="tile aspect-square animate-pulse" />
                  ))}
                </div>
              ))}
              <p className="mono pt-3 text-[11px] text-muted">memuat kamus…</p>
            </div>
          ) : (
            <>
              <Board game={game} shakeSignal={wordle.shakeSignal} />

              {finished && (
                <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-soft px-3 py-2">
                  <span
                    className={`mono text-[11px] leading-relaxed ${
                      game.status === "won" ? "text-lime" : "text-danger"
                    }`}
                  >
                    {game.status === "won"
                      ? `Kena dalam ${game.guesses.length} tebakan${
                          game.mode === "daily" ? ` · harian #${game.puzzle}` : ""
                        }.`
                      : `Jawabannya ${game.answer.toUpperCase()}.`}
                  </span>
                  <button
                    type="button"
                    className="mono shrink-0 text-[11px] text-muted transition hover:text-ink"
                    onClick={wordle.share}
                  >
                    salin
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <span className="mono text-[10px] leading-relaxed text-muted/60">
                  {game.mode === "daily"
                    ? finished
                      ? "puzzle baru besok"
                      : "satu puzzle per hari"
                    : ""}
                </span>
                {wordle.settings.mode === "free" && (
                  <button
                    type="button"
                    className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink transition hover:border-line-strong hover:bg-soft"
                    onClick={wordle.newFreeGame}
                  >
                    Kata baru
                  </button>
                )}
              </div>

              <Keyboard
                guesses={game.guesses}
                answer={game.answer}
                onKey={press}
                disabled={game.status !== "playing"}
              />
            </>
          )}

          <p className="mono mt-5 text-[9px] leading-relaxed text-muted/70">
            <span className="text-lime">■</span> tepat
            <span className="px-1 text-muted/30">·</span>
            <span className="text-amber">■</span> salah tempat
            <span className="px-1 text-muted/30">·</span>
            keyboard fisik juga bisa
          </p>
        </section>

        <StatsPanel stats={stats} lang={wordle.settings.lang} dictionary={dictionary} />
      </main>

      <Toast message={wordle.toast} />
      <p className="sr-only" role="status" aria-live="polite">
        {wordle.announcement}
      </p>

      <SettingsDialog
        open={settingsOpen}
        hard={wordle.settings.hard}
        lang={wordle.settings.lang}
        dictionary={dictionary}
        onClose={() => setSettingsOpen(false)}
        onToggleHard={wordle.setHard}
        onResetStats={wordle.resetStats}
      />
    </Shell>
  );
}
