import { useCallback, useEffect, useRef, useState } from "react";
import { loadDictionary } from "./dictionary";
import {
  WORD_LENGTH,
  checkHardMode,
  dailyAnswerIndex,
  describeGuess,
  puzzleNumber,
  scoreGuess,
} from "./engine";
import { wordleReducer } from "./reducer";
import { buildShareText } from "./share";
import { applyResult } from "./stats";
import {
  dropLegacyGame,
  emptyStats,
  loadGames,
  loadSettings,
  loadStats,
  saveGames,
  saveSettings,
  saveStats,
} from "./storage";
import type { Dictionary, Game, Games, Lang, Mode, Settings, Stats } from "./types";

export interface ToastMessage {
  id: number;
  text: string;
}

function makeGame(lang: Lang, mode: Mode, puzzle: number | null, answer: string): Game {
  return {
    lang,
    mode,
    puzzle,
    answer,
    guesses: [],
    current: "",
    status: "playing",
    startedAt: Date.now(),
  };
}

function pickFreeAnswer(dictionary: Dictionary, previous?: string): string {
  const { answers } = dictionary;
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = answers[Math.floor(Math.random() * answers.length)];
    if (candidate !== previous) return candidate;
  }
  return answers[0];
}

/** Pastikan game untuk bahasa+mode aktif ada dan puzzle harian tidak basi. */
function withEnsuredGame(
  source: Games,
  lang: Lang,
  mode: Mode,
  dictionary: Dictionary,
): Games {
  const existing = source[lang][mode];

  if (mode === "daily") {
    const puzzle = puzzleNumber(new Date());
    if (existing && existing.puzzle === puzzle) return source;
    const answer =
      dictionary.answers[dailyAnswerIndex(lang, puzzle, dictionary.answers.length)];
    return {
      ...source,
      [lang]: { ...source[lang], daily: makeGame(lang, "daily", puzzle, answer) },
    };
  }

  if (existing) return source;
  return {
    ...source,
    [lang]: { ...source[lang], free: makeGame(lang, "free", null, pickFreeAnswer(dictionary)) },
  };
}

export function useWordle() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [games, setGames] = useState<Games>(loadGames);
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [shakeSignal, setShakeSignal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const dictionaryRef = useRef<Dictionary | null>(null);
  const toastId = useRef(0);

  const notify = useCallback((text: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text });
  }, []);

  const reject = useCallback(
    (text: string) => {
      notify(text);
      setShakeSignal((value) => value + 1);
    },
    [notify],
  );

  // ------------------------------------------------------------ boot & persist
  useEffect(() => {
    dropLegacyGame();
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    dictionaryRef.current = dictionary;
  }, [dictionary]);

  // ------------------------------------------------------------ dictionary
  useEffect(() => {
    let cancelled = false;
    setDictionary(null);
    setLoadError(null);
    loadDictionary(settings.lang)
      .then((loaded) => {
        if (!cancelled) setDictionary(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Kamus gagal dimuat. Muat ulang halaman.");
      });
    return () => {
      cancelled = true;
    };
  }, [settings.lang]);

  // ------------------------------------------------------------ game presence
  useEffect(() => {
    if (!dictionary) return;
    setGames((previous) => {
      const next = withEnsuredGame(previous, settings.lang, settings.mode, dictionary);
      if (next === previous) return previous;
      saveGames(next);
      return next;
    });
  }, [dictionary, settings.lang, settings.mode]);

  // ------------------------------------------------------------ daily rollover
  useEffect(() => {
    const check = () => {
      const dict = dictionaryRef.current;
      if (!dict || settings.mode !== "daily") return;
      setGames((previous) => {
        const next = withEnsuredGame(previous, settings.lang, "daily", dict);
        if (next === previous) return previous;
        saveGames(next);
        setAnnouncement("Puzzle harian baru tersedia.");
        return next;
      });
    };
    const timer = window.setInterval(check, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [settings.mode, settings.lang]);

  // ------------------------------------------------------------ toast timer
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const game = games[settings.lang][settings.mode];

  const commitGame = useCallback((next: Game) => {
    setGames((previous) => {
      const updated: Games = {
        ...previous,
        [next.lang]: { ...previous[next.lang], [next.mode]: next },
      };
      saveGames(updated);
      return updated;
    });
  }, []);

  const press = useCallback(
    (key: string) => {
      if (!game || !dictionary || game.status !== "playing") return;
      const normalized = key.toLowerCase();

      if (normalized === "enter") {
        const word = game.current;
        if (word.length < WORD_LENGTH) {
          reject("Hurufnya belum lima");
          return;
        }
        if (!dictionary.words.has(word)) {
          reject("Kata itu belum ada di kamus");
          return;
        }
        if (settings.hard && game.guesses.length > 0) {
          const check = checkHardMode(game.guesses, word, game.answer);
          if (!check.ok) {
            reject(check.reason);
            return;
          }
        }

        const next = wordleReducer(game, { type: "commit", word });
        commitGame(next);
        setAnnouncement(
          `Tebakan ${next.guesses.length}: ${word.split("").join(" ")}. ` +
            describeGuess(scoreGuess(word, game.answer)) +
            (next.status === "won"
              ? " Menang."
              : next.status === "lost"
                ? ` Kesempatan habis, jawabannya ${game.answer}.`
                : ""),
        );

        if (next.status !== "playing") {
          const updatedStats = applyResult(stats, next);
          setStats(updatedStats);
          saveStats(updatedStats);
        }
        return;
      }

      if (normalized === "back") {
        commitGame(wordleReducer(game, { type: "backspace" }));
        return;
      }
      commitGame(wordleReducer(game, { type: "letter", letter: normalized }));
    },
    [game, dictionary, settings.hard, stats, commitGame, reject],
  );

  const switchLang = useCallback((lang: Lang) => {
    setSettings((previous) => (previous.lang === lang ? previous : { ...previous, lang }));
  }, []);

  const switchMode = useCallback((mode: Mode) => {
    setSettings((previous) => (previous.mode === mode ? previous : { ...previous, mode }));
    notify(mode === "daily" ? "Mode harian" : "Mode bebas");
  }, [notify]);

  const newFreeGame = useCallback(() => {
    if (!dictionary) return;
    const previous = games[settings.lang].free?.answer;
    const next = makeGame(
      settings.lang,
      "free",
      null,
      pickFreeAnswer(dictionary, previous),
    );
    commitGame(next);
    setAnnouncement("Kata baru siap.");
    notify("Kata baru");
  }, [dictionary, games, settings.lang, commitGame, notify]);

  const setHard = useCallback((hard: boolean) => {
    setSettings((previous) => ({ ...previous, hard }));
  }, []);

  const resetStats = useCallback(() => {
    const fresh = emptyStats();
    setStats(fresh);
    saveStats(fresh);
    notify("Statistik dihapus");
  }, [notify]);

  const share = useCallback(() => {
    if (!game || game.guesses.length === 0) {
      notify("Belum ada tebakan untuk dibagikan");
      return;
    }
    const text = buildShareText(game, settings.hard);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => notify("Hasil disalin"),
        () => notify("Gagal menyalin"),
      );
    } else {
      notify("Clipboard tidak tersedia di browser ini");
    }
  }, [game, settings.hard, notify]);

  return {
    settings,
    stats,
    game,
    dictionary,
    toast,
    announcement,
    shakeSignal,
    loadError,
    press,
    switchLang,
    switchMode,
    newFreeGame,
    setHard,
    resetStats,
    share,
    notify,
  };
}
