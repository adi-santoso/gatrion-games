import { useCallback, useEffect, useRef, useState } from "react";
import { chooseAiMove } from "./ai";
import type { Row } from "./cards";
import { createGame, pass, playCard } from "./engine";
import type { GwentState } from "./engine";
import { loadRecord, saveRecord } from "./storage";
import type { GwentRecord } from "./storage";

/** Jeda kecil supaya langkah lawan terasa seperti "berpikir". */
export const AI_DELAY_MS = 650;

export interface GwentController {
  game: GwentState;
  record: GwentRecord;
  playerTurn: boolean;
  over: boolean;
  /** Pesan galat, atau `null` kalau kartu berhasil dimainkan. */
  play(uid: string, target?: Row): string | null;
  pass(): void;
  restart(): void;
}

/**
 * Satu pemilik state untuk semua tampilan: kanvas Phaser maupun fallback DOM.
 * Aturan tetap di `engine.ts`; hook ini hanya menyimpan state + langkah lawan.
 */
export function useGwent(active = true): GwentController {
  const [game, setGame] = useState<GwentState>(() => createGame());
  const [record, setRecord] = useState(loadRecord);
  const recorded = useRef<string | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const commit = useCallback((next: GwentState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (game.status !== "playing" || game.turn !== "ai" || game.passed.ai) return;

    const timer = window.setTimeout(() => {
      const latest = gameRef.current;
      if (latest.status !== "playing" || latest.turn !== "ai" || latest.passed.ai) return;

      const move = chooseAiMove(latest);
      commit(
        move.kind === "pass"
          ? pass(latest, "ai")
          : playCard(latest, "ai", move.uid, move.target).state,
      );
    }, AI_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [active, commit, game]);

  useEffect(() => {
    if (game.status !== "over" || !game.winner) return;
    const stamp = [game.winner, game.round, game.wins.player, game.wins.ai].join("-");
    if (recorded.current === stamp) return;
    recorded.current = stamp;

    setRecord((current) => {
      const next = {
        wins: current.wins + (game.winner === "player" ? 1 : 0),
        losses: current.losses + (game.winner === "ai" ? 1 : 0),
        draws: current.draws + (game.winner === "draw" ? 1 : 0),
      };
      saveRecord(next);
      return next;
    });
  }, [game]);

  const play = useCallback(
    (uid: string, target?: Row) => {
      const outcome = playCard(gameRef.current, "player", uid, target);
      if (outcome.error) return outcome.error;
      commit(outcome.state);
      return null;
    },
    [commit],
  );

  const doPass = useCallback(() => {
    commit(pass(gameRef.current, "player"));
  }, [commit]);

  const restart = useCallback(() => {
    recorded.current = null;
    commit(createGame());
  }, [commit]);

  return {
    game,
    record,
    playerTurn: game.status === "playing" && game.turn === "player" && !game.passed.player,
    over: game.status === "over",
    play,
    pass: doPass,
    restart,
  };
}
