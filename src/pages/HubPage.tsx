import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GatrionGlyph, WordleGlyph } from "../desktop/components/icons";
import { puzzleNumber } from "../games/wordle/engine";
import { loadGames, loadSettings, loadStats } from "../games/wordle/storage";
import { readIdleTotal } from "../games/idle/storage";
import { formatId } from "../lib/format";

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
    <main className="home-app">
      <header className="home-head">
        <div>
          <p className="home-kicker">gatrion · games</p>
          <h1 className="home-title">Game kecil, satu desktop.</h1>
          <p className="home-lead">
            Buka jendelanya seperti aplikasi biasa. Progres tetap tersimpan di browser ini, tanpa akun.
          </p>
        </div>
        <span className="home-badge" aria-hidden="true">
          <GatrionGlyph />
        </span>
      </header>

      <section className="home-apps" aria-label="Game tersedia">
        <Link to="/wordle" className="home-app-card" data-app="wordle">
          <span className="home-app-icon" data-app="wordle" aria-hidden="true">
            <WordleGlyph />
          </span>
          <span className="home-app-body">
            <strong>Wordle</strong>
            <span className="home-app-copy">Puzzle lima huruf, dua kamus, mode harian dan bebas.</span>
            <span className="home-app-meta">{summary.dailyLabel}</span>
          </span>
          <span className="home-app-open" aria-hidden="true">
            Buka
          </span>
        </Link>

        <Link to="/idle" className="home-app-card" data-app="idle">
          <span className="home-app-icon" data-app="idle" aria-hidden="true">
            <img src="/icons/idle/core.png" alt="" width={64} height={64} className="app-icon-art" />
          </span>
          <span className="home-app-body">
            <strong>Idle Tambang</strong>
            <span className="home-app-copy">Kristal terus terkumpul walau jendela ditutup.</span>
            <span className="home-app-meta">
              {summary.crystals > 0
                ? `${formatId(Math.floor(summary.crystals))} kristal`
                : "belum dimulai"}
            </span>
          </span>
          <span className="home-app-open" aria-hidden="true">
            Buka
          </span>
        </Link>
      </section>

      <section className="home-split">
        <div className="home-panel">
          <h2>Pintasan</h2>
          <dl className="home-keys">
            <div>
              <dt>
                <kbd>⌘</kbd>
                <kbd>Space</kbd>
              </dt>
              <dd>Spotlight: cari dan buka aplikasi</dd>
            </div>
            <div>
              <dt>
                <kbd>⌘</kbd>
                <kbd>Tab</kbd>
              </dt>
              <dd>Pindah antar aplikasi yang berjalan</dd>
            </div>
            <div>
              <dt>
                <kbd>⌃</kbd>
                <kbd>↑</kbd>
              </dt>
              <dd>Mission Control: lihat semua jendela</dd>
            </div>
            <div>
              <dt>
                <kbd>⌘</kbd>
                <kbd>W</kbd>
              </dt>
              <dd>Tutup jendela yang sedang aktif</dd>
            </div>
          </dl>
        </div>

        <div className="home-panel">
          <h2>Status</h2>
          <dl className="home-stats">
            <div>
              <dt>Streak wordle</dt>
              <dd>{summary.dailyStreak} hari</dd>
            </div>
            <div>
              <dt>Kristal tersimpan</dt>
              <dd>{summary.crystals > 0 ? formatId(Math.floor(summary.crystals)) : "—"}</dd>
            </div>
            <div>
              <dt>Kamus wordle</dt>
              <dd>14.170 id · 14.855 en</dd>
            </div>
          </dl>
          <p className="home-note">
            Tutup jendela kapan saja. Idle tetap menghitung 50% laju sampai delapan jam lewat jalur offline.
          </p>
        </div>
      </section>
    </main>
  );
}
