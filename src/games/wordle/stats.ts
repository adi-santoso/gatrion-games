import type { Game, LangStats, Stats } from "./types";

function cloneLangStats(stats: LangStats): LangStats {
  return {
    ...stats,
    dist: [...stats.dist],
    daily: { ...stats.daily },
  };
}

/**
 * Perbarui statistik setelah satu permainan selesai (menang atau kalah).
 * Fungsi murni supaya aturan streak bisa dites tanpa DOM.
 */
export function applyResult(stats: Stats, game: Game): Stats {
  const lang = cloneLangStats(stats[game.lang]);

  lang.played += 1;
  if (game.status === "won") {
    lang.wins += 1;
    lang.streak += 1;
    lang.best = Math.max(lang.best, lang.streak);
    const bucket = game.guesses.length - 1;
    if (bucket >= 0 && bucket < lang.dist.length) {
      lang.dist[bucket] = (lang.dist[bucket] ?? 0) + 1;
    }
  } else {
    lang.streak = 0;
  }

  if (game.mode === "daily" && game.puzzle !== null) {
    if (game.status === "won") {
      if (lang.daily.lastPuzzle !== game.puzzle) {
        lang.daily.streak =
          lang.daily.lastPuzzle === game.puzzle - 1 ? lang.daily.streak + 1 : 1;
        lang.daily.best = Math.max(lang.daily.best, lang.daily.streak);
        lang.daily.lastPuzzle = game.puzzle;
      }
    } else {
      lang.daily.streak = 0;
      lang.daily.lastPuzzle = game.puzzle;
    }
  }

  return { ...stats, [game.lang]: lang };
}
