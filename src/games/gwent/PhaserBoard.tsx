import { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { CREDITS_LINE } from "./artCredits";
import { ROWS, ROW_LABEL, needsTarget } from "./cards";
import { GwentScene } from "./scene/GwentScene";
import type { SceneHandlers } from "./scene/GwentScene";
import { frameFor, orientationFor } from "./scene/layout";
import type { Orientation } from "./scene/layout";
import { useGwent } from "./useGwent";

interface PhaserBoardProps {
  /** Jendela desktop yang tidak fokus: scene dipause, langkah lawan berhenti. */
  active: boolean;
}

/**
 * Papan berbasis Phaser. Modul ini di-`import()` secara dinamis dari
 * `GwentApp`, jadi `phaser` hanya masuk unduhan saat jendela kartu dibuka.
 */
export default function PhaserBoard({ active }: PhaserBoardProps) {
  const gwent = useGwent(active);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("landscape");

  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GwentScene | null>(null);

  const handlers = useRef<SceneHandlers>({
    onPlay: () => {},
    onSelect: () => {},
    onPickTarget: () => {},
    onCancel: () => {},
    onPass: () => {},
    onRestart: () => {},
    onReady: () => {},
  });

  handlers.current = {
    onPlay: (uid) => {
      const message = gwent.play(uid);
      setError(message);
      setPending(null);
    },
    onSelect: (uid) => {
      setPending(uid);
      setError(null);
    },
    onPickTarget: (row) => {
      if (!pending) return;
      const message = gwent.play(pending, row);
      setError(message);
      if (!message) setPending(null);
    },
    onCancel: () => setPending(null),
    onPass: () => {
      setPending(null);
      setError(null);
      gwent.pass();
    },
    onRestart: () => {
      setPending(null);
      setError(null);
      gwent.restart();
    },
    onReady: () => setReady(true),
  };

  // Layar sempit memakai tata letak potret supaya papan tidak menyusut jadi
  // garis tipis di tengah jendela. Perubahan orientasi membangun ulang game.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sync = () => {
      const next = orientationFor(host.clientWidth, host.clientHeight);
      setOrientation((current) => (current === next ? current : next));
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const frame = frameFor(orientation);
    const scene = new GwentScene(handlers, orientation);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: frame.width,
      height: frame.height,
      backgroundColor: "#0b1512",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [scene],
      render: { antialias: true },
    });

    gameRef.current = game;
    sceneRef.current = scene;

    // Jendela desktop bisa di-resize tanpa memicu `window.resize`.
    const observer = new ResizeObserver(() => game.scale.refresh());
    observer.observe(host);

    return () => {
      observer.disconnect();
      sceneRef.current = null;
      gameRef.current = null;
      game.destroy(true);
    };
  }, [orientation]);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    if (active) {
      game.loop.wake();
      game.scene.resume("gwent");
    } else {
      game.scene.pause("gwent");
      game.loop.sleep();
    }
  }, [active, ready]);

  useEffect(() => {
    sceneRef.current?.setView({
      game: gwent.game,
      pending,
      playerTurn: gwent.playerTurn,
    });
  }, [gwent.game, gwent.playerTurn, pending, ready, orientation]);

  const pendingCard = pending
    ? gwent.game.boards.player.hand.find((item) => item.uid === pending)
    : undefined;

  return (
    <div className="gwent-phaser">
      <div className="gwent-canvas" ref={hostRef} />

      <div className="gwent-bar">
        <span className="gwent-status">
          {gwent.over ? "selesai" : gwent.playerTurn ? "giliranmu" : "lawan berpikir…"}
        </span>

        {pendingCard && (
          <span className="gwent-target-inline">
            <span>{pendingCard.card.name}:</span>
            {ROWS.map((row) => (
              <button
                key={row}
                type="button"
                onClick={() => handlers.current.onPickTarget(row)}
              >
                {ROW_LABEL[row]}
              </button>
            ))}
            <button type="button" onClick={() => handlers.current.onCancel()}>
              batal
            </button>
          </span>
        )}

        <span className="gwent-spacer" />
        <span className="gwent-record">
          rekor {gwent.record.wins}–{gwent.record.losses}
        </span>
        <button type="button" onClick={() => handlers.current.onPass()} disabled={!gwent.playerTurn}>
          Lewat
        </button>
        <button type="button" onClick={() => handlers.current.onRestart()}>
          Main lagi
        </button>
      </div>

      {error && (
        <p className="gwent-error" role="alert">
          {error}
        </p>
      )}

      <p className="gwent-credits">{CREDITS_LINE}</p>

      {/* Cermin DOM: pembaca layar tidak bisa membaca canvas Phaser. */}
      <ul className="sr-only" aria-label="Kartu di tangan">
        {gwent.game.boards.player.hand.map((inst) => (
          <li key={inst.uid}>
            <button
              type="button"
              disabled={!gwent.playerTurn}
              onClick={() => {
                if (needsTarget(inst.card)) setPending(inst.uid);
                else handlers.current.onPlay(inst.uid);
              }}
            >
              {inst.card.name}
              {inst.card.strength ? ` (${inst.card.strength})` : ""}
            </button>
          </li>
        ))}
      </ul>

      <p className="sr-only" role="status" aria-live="polite">
        {gwent.game.log[gwent.game.log.length - 1] ?? ""}
      </p>
    </div>
  );
}
