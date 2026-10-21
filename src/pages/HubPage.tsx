import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { puzzleNumber } from "../games/wordle/engine";
import { loadGames, loadSettings, loadStats } from "../games/wordle/storage";
import { readIdleTotal } from "../games/idle/storage";
import { formatId } from "../lib/format";

const ORNAMENT: Array<Array<{ letter: string; state?: "correct" | "present" | "absent" }>> = [
  [
    { letter: "r", state: "absent" },
    { letter: "u", state: "present" },
    { letter: "m", state: "absent" },
    { letter: "a", state: "absent" },
    { letter: "h", state: "correct" },
  ],
  [
    { letter: "b", state: "absent" },
    { letter: "e", state: "present" },
    { letter: "s", state: "absent" },
    { letter: "a", state: "present" },
    { letter: "r", state: "correct" },
  ],
  [{ letter: "" }, { letter: "" }, { letter: "" }, { letter: "" }, { letter: "" }],
];

export function HubPage() {
  const summary = useMemo(() => {
    const settings = loadSettings();
    const stats = loadStats();
    const games = loadGames();
    const today = puzzleNumber(new Date());
    const daily = games[settings.lang].daily;

    let dailyLabel: string;
    if (!daily || daily.puzzle !== today) {
      dailyLabel = `harian #${today} · belum main`;
    } else if (daily.status === "won") {
      dailyLabel = `harian #${today} · ${daily.guesses.length}/6`;
    } else if (daily.status === "lost") {
      dailyLabel = `harian #${today} · X/6`;
    } else {
      dailyLabel = `harian #${today} · lanjut`;
    }

    return {
      dailyLabel,
      dailyStreak: stats[settings.lang].daily.streak,
      crystals: readIdleTotal(),
    };
  }, []);

  return (
    <Shell>
      <main className="pb-24">
        <section className="pt-10 sm:pt-14">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="mono flex items-center gap-2 text-[11px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                dua game · tanpa akun · progres di browser
              </p>
              <h1 className="display mt-6 max-w-[15ch] text-[clamp(2.7rem,8vw,4.6rem)] text-balance">
                Isi jeda,
                <br />
                bukan timeline.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
                Wordle dua bahasa dan tambang kristal yang jalan sendiri. Buka sebentar, tutup, lanjut
                kerja lagi.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  to="/wordle"
                  className="rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-95"
                >
                  Main wordle
                </Link>
                <Link
                  to="/idle"
                  className="group mono inline-flex items-center gap-1.5 text-[11px] text-muted transition hover:text-ink"
                >
                  buka idle tambang
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>

            <div className="hidden pb-1.5 lg:block" aria-hidden="true">
              <div className="grid w-[170px] grid-cols-5 gap-1.5">
                {ORNAMENT.flat().map((tile, index) => (
                  <span
                    key={index}
                    className="tile aspect-square text-[13px]"
                    data-state={tile.state}
                    data-filled={tile.letter ? "true" : "false"}
                  >
                    {tile.letter}
                  </span>
                ))}
              </div>
              <p className="mono mt-3 text-[10px] text-muted/60">wordle · 5 huruf, 6 coba</p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-baseline justify-between border-b border-line pb-2.5">
            <h2 className="mono text-[11px] text-muted">game</h2>
            <span className="mono text-[10px] text-muted/70">02 tersedia</span>
          </div>

          <ul className="divide-y divide-line">
            <li>
              <Link
                to="/wordle"
                className="row-link grid grid-cols-[auto_1fr_auto] items-center gap-4 px-1 py-5 sm:gap-6 sm:px-3"
              >
                <span className="mono index text-[11px] text-muted">01</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="display text-xl">Wordle</span>
                    <span className="mono rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
                      id / en
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-muted">
                    Puzzle harian lima huruf, dua kamus, plus mode bebas.
                  </span>
                </span>
                <span className="flex items-center gap-5">
                  <span className="mono hidden text-[11px] text-muted sm:block" data-testid="hub-wordle">
                    {summary.dailyLabel}
                  </span>
                  <span className="arrow text-muted">→</span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/idle"
                className="row-link grid grid-cols-[auto_1fr_auto] items-center gap-4 px-1 py-5 sm:gap-6 sm:px-3"
              >
                <span className="mono index text-[11px] text-muted">02</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="display text-xl">Idle tambang</span>
                    <span className="mono rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
                      idle
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-muted">
                    Kristal terus terkumpul walau tab ditutup.
                  </span>
                </span>
                <span className="flex items-center gap-5">
                  <span className="mono hidden text-[11px] text-muted sm:block" data-testid="hub-idle">
                    {summary.crystals > 0
                      ? `${formatId(Math.floor(summary.crystals))} kristal`
                      : "belum dimulai"}
                  </span>
                  <span className="arrow text-muted">→</span>
                </span>
              </Link>
            </li>
          </ul>

          <p className="mono mt-5 text-[10px] leading-relaxed text-muted/70">
            berikutnya · 2048 · typing sprint 60 detik
          </p>
        </section>

        <section className="mt-14 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="mono border-b border-line pb-2 text-[11px] text-muted">cara main</h2>
            <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
              <li>
                <span className="mono mr-2 text-[11px] text-lime">01</span>Pilih game, langsung jalan
                tanpa login.
              </li>
              <li>
                <span className="mono mr-2 text-[11px] text-lime">02</span>Progres tersimpan otomatis
                di browser ini.
              </li>
              <li>
                <span className="mono mr-2 text-[11px] text-lime">03</span>Tutup kapan saja, lanjut
                nanti.
              </li>
            </ol>
          </div>
          <div>
            <h2 className="mono border-b border-line pb-2 text-[11px] text-muted">catatan kecil</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Kamus Wordle: 14.170 kata Indonesia (KBBI) dan 14.855 kata English. Puzzle harian sama
              untuk semua orang, dan statistik dipisah per bahasa. Idle tetap menghitung 50% laju
              sampai delapan jam.
            </p>
          </div>
        </section>
      </main>
    </Shell>
  );
}
