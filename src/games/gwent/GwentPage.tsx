import { useCallback, useEffect, useRef, useState } from "react";
import { chooseAiMove } from "./ai";
import { FACTION_LABEL, ROWS, ROW_LABEL, needsTarget } from "./cards";
import type { Row, Side } from "./cards";
import { createGame, pass, playCard, rowScore, totalScore, unitValue } from "./engine";
import type { CardInstance, GwentState } from "./engine";
import { loadRecord, saveRecord } from "./storage";

/** Jeda kecil supaya langkah lawan terasa seperti "berpikir", bukan melompat. */
const AI_DELAY_MS = 650;

function RowStrip({ state, side, row }: { state: GwentState; side: Side; row: Row }) {
  const cards = state.boards[side].rows[row];

  return (
    <div className="gw-row" data-row={row}>
      <span className="gw-row-label">{ROW_LABEL[row]}</span>
      <div className="gw-row-cards">
        {cards.map((inst) => (
          <span key={inst.uid} className="gw-mini" data-kind={inst.card.kind}>
            <b>{unitValue(state, side, row, inst.card)}</b>
            <span>{inst.card.name}</span>
          </span>
        ))}
      </div>
      <span className="gw-row-score">{rowScore(state, side, row)}</span>
    </div>
  );
}

function BoardSide({ state, side }: { state: GwentState; side: Side }) {
  const board = state.boards[side];
  // Baris dekat selalu di tengah papan, jadi urutan lawan dicerminkan.
  const order = side === "ai" ? [...ROWS].reverse() : ROWS;

  return (
    <section
      className="gw-side"
      data-side={side}
      aria-label={side === "player" ? "Papan kamu" : "Papan lawan"}
    >
      <header className="gw-side-head">
        <span>
          {FACTION_LABEL[board.faction]} · {board.hand.length} kartu
          {state.passed[side] && <em className="gw-passed"> · lewat</em>}
        </span>
        <strong className="gw-total" data-testid={`gw-total-${side}`}>
          {totalScore(state, side)}
        </strong>
      </header>
      {order.map((row) => (
        <RowStrip key={row} state={state} side={side} row={row} />
      ))}
    </section>
  );
}

interface GwentPageProps {
  /** Jendela desktop yang tidak aktif tidak menjalankan langkah lawan. */
  active?: boolean;
}

export function GwentPage({ active = true }: GwentPageProps = {}) {
  const [game, setGame] = useState<GwentState>(() => createGame());
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState(loadRecord);
  const recorded = useRef<string | null>(null);

  const playerTurn = game.status === "playing" && game.turn === "player" && !game.passed.player;
  const over = game.status === "over";

  // Langkah lawan. Pemeriksaan di dalam updater membuat timer basi tidak bisa
  // memainkan kartu untuk state yang sudah berubah.
  useEffect(() => {
    if (!active) return;
    if (game.status !== "playing" || game.turn !== "ai" || game.passed.ai) return;

    const timer = window.setTimeout(() => {
      setGame((current) => {
        if (current.status !== "playing" || current.turn !== "ai" || current.passed.ai) {
          return current;
        }
        const move = chooseAiMove(current);
        if (move.kind === "pass") return pass(current, "ai");
        return playCard(current, "ai", move.uid, move.target).state;
      });
    }, AI_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [active, game]);

  // Rekor dicatat sekali per pertandingan selesai.
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

  const commit = useCallback((outcome: ReturnType<typeof playCard>) => {
    if (outcome.error) {
      setError(outcome.error);
      return;
    }
    setError(null);
    setPending(null);
    setGame(outcome.state);
  }, []);

  const chooseCard = (card: CardInstance) => {
    if (!playerTurn) return;
    if (needsTarget(card.card)) {
      setPending((current) => (current === card.uid ? null : card.uid));
      setError(null);
      return;
    }
    commit(playCard(game, "player", card.uid));
  };

  const chooseTarget = (row: Row) => {
    if (!pending) return;
    commit(playCard(game, "player", pending, row));
  };

  const doPass = () => {
    if (!playerTurn) return;
    setPending(null);
    setError(null);
    setGame((current) => pass(current, "player"));
  };

  const restart = () => {
    setPending(null);
    setError(null);
    recorded.current = null;
    setGame(createGame());
  };

  const pendingCard = pending
    ? game.boards.player.hand.find((item) => item.uid === pending)
    : undefined;
  const lastLog = game.log[game.log.length - 1] ?? "";

  return (
    <div className="gwent-app" data-turn={game.turn} data-status={game.status}>
      <header className="gw-head">
        <div>
          <h1>Duel Kartu</h1>
          <p>ala Gwent · tiga baris, dua ronde untuk menang</p>
        </div>
        <dl className="gw-tally">
          <div>
            <dt>ronde</dt>
            <dd data-testid="gw-round">{game.round}/3</dd>
          </div>
          <div>
            <dt>kamu</dt>
            <dd data-testid="gw-wins-player">{game.wins.player}</dd>
          </div>
          <div>
            <dt>lawan</dt>
            <dd data-testid="gw-wins-ai">{game.wins.ai}</dd>
          </div>
          <div>
            <dt>rekor</dt>
            <dd>
              {record.wins}–{record.losses}
            </dd>
          </div>
        </dl>
      </header>

      <div className="gw-board">
        <BoardSide state={game} side="ai" />

        <div className="gw-middle">
          <span className="gw-weather">
            {game.weather.length === 0
              ? "cuaca cerah"
              : `cuaca: ${game.weather.map((row) => ROW_LABEL[row]).join(" · ")}`}
          </span>
          <span className="gw-turn" data-testid="gw-turn">
            {over ? "selesai" : game.turn === "player" ? "giliranmu" : "lawan berpikir…"}
          </span>
          <button
            type="button"
            className="gw-button"
            onClick={doPass}
            disabled={!playerTurn}
            data-testid="gw-pass"
          >
            Lewat
          </button>
        </div>

        <BoardSide state={game} side="player" />
      </div>

      {pendingCard && (
        <div className="gw-target">
          <span>{pendingCard.card.name}: pilih baris</span>
          {ROWS.map((row) => (
            <button
              key={row}
              type="button"
              className="gw-button"
              onClick={() => chooseTarget(row)}
            >
              {ROW_LABEL[row]}
            </button>
          ))}
          <button type="button" className="gw-button gw-cancel" onClick={() => setPending(null)}>
            Batal
          </button>
        </div>
      )}

      <div className="gw-hand" data-testid="gw-hand">
        {game.boards.player.hand.map((card) => (
          <button
            key={card.uid}
            type="button"
            className="gw-card"
            data-kind={card.card.kind}
            data-selected={pending === card.uid ? "true" : "false"}
            title={card.card.text}
            onClick={() => chooseCard(card)}
            disabled={!playerTurn}
          >
            <span className="gw-card-str">{card.card.strength ?? "✦"}</span>
            <span className="gw-card-name">{card.card.name}</span>
            <span className="gw-card-row">
              {card.card.row ? ROW_LABEL[card.card.row] : "efek"}
            </span>
          </button>
        ))}
        {game.boards.player.hand.length === 0 && <p className="gw-empty">Tangan kosong.</p>}
      </div>

      <footer className="gw-foot">
        {error ? (
          <p className="gw-error" role="alert">
            {error}
          </p>
        ) : (
          <ol className="gw-log">
            {game.log.slice(-3).map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ol>
        )}
        <div className="gw-actions">
          <button type="button" className="gw-button" onClick={restart}>
            Main lagi
          </button>
        </div>
      </footer>

      <p className="sr-only" role="status" aria-live="polite">
        {lastLog}
      </p>

      {over && (
        <div className="gw-result" role="dialog" aria-label="Hasil pertandingan">
          <p className="gw-result-title">
            {game.winner === "player"
              ? "Kamu menang."
              : game.winner === "ai"
                ? "Lawan menang."
                : "Seri."}
          </p>
          <span>
            ronde {game.wins.player}–{game.wins.ai}
            {game.roundResult ? ` · terakhir ${game.roundResult.player}–${game.roundResult.ai}` : ""}
          </span>
          <button type="button" className="gw-button" onClick={restart}>
            Main lagi
          </button>
        </div>
      )}
    </div>
  );
}
