import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearCanvas,
  drawLabel,
  fillRoundRect,
  fitGrid,
  useGameInput,
  useGameLoop,
} from "../../engine";
import type { GameAction } from "../../engine";
import { useTheme } from "../../lib/theme";
import { OPPOSITE, createSnake, isDirection, step, togglePause, turn } from "./logic";
import type { Direction, SnakeState, SnakeStatus } from "./logic";

const BEST_KEY = "gatrion.snake.best.v1";

const STATUS_LABEL: Record<SnakeStatus, string> = {
  ready: "siap",
  running: "jalan",
  paused: "jeda",
  over: "selesai",
  won: "papan penuh",
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Palette {
  board: string;
  grid: string;
  body: string;
  bodyAlt: string;
  head: string;
  eye: string;
  food: string;
  leaf: string;
  veilText: string;
}

const LIGHT: Palette = {
  board: "#f4f2e8",
  grid: "rgba(27, 28, 23, 0.09)",
  body: "#5c8a24",
  bodyAlt: "#6f9f2e",
  head: "#c8f36a",
  eye: "#1b1c17",
  food: "#d9503f",
  leaf: "#5c8a24",
  veilText: "rgba(27, 28, 23, 0.62)",
};

const DARK: Palette = {
  board: "#14160f",
  grid: "rgba(236, 233, 223, 0.08)",
  body: "#5f9130",
  bodyAlt: "#4e7a26",
  head: "#c8f36a",
  eye: "#10140c",
  food: "#ff7a5c",
  leaf: "#8fbe2f",
  veilText: "rgba(236, 233, 223, 0.66)",
};

const EYES: Readonly<Record<Direction, { x: number; y: number }>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function readBest(): number {
  try {
    const value = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // mode privat: rekor hanya berlaku untuk sesi ini
  }
}

/** Semua aksi pemain lewat satu pintu supaya restart/pause konsisten. */
function applyAction(game: SnakeState, action: GameAction): SnakeState {
  if (action === "restart") return createSnake();

  if (game.status === "over" || game.status === "won") {
    return action === "pause" ? createSnake() : game;
  }

  if (action === "pause") return togglePause(game);
  if (!isDirection(action)) return game;

  if (game.status === "ready") {
    // Menekan arah memulai permainan; arah sebaliknya dari badan diabaikan
    // supaya kepala tidak langsung menabrak lehernya sendiri.
    if (action === OPPOSITE[game.direction]) return { ...game, status: "running" };
    return { ...game, status: "running", direction: action, queued: [] };
  }

  if (game.status === "paused") return turn({ ...game, status: "running" }, action);
  return turn(game, action);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  game: SnakeState,
  palette: Palette,
): void {
  clearCanvas(ctx, width, height, palette.board);

  const fit = fitGrid(width, height, game.cols, game.rows, 14, 2);
  if (fit.cell === 0) return;

  // Kisi halus sebagai penanda langkah.
  ctx.save();
  ctx.fillStyle = palette.grid;
  for (let y = 0; y < game.rows; y += 1) {
    for (let x = 0; x < game.cols; x += 1) {
      ctx.fillRect(fit.x + x * (fit.cell + fit.gap) + fit.cell / 2 - 1, fit.y + y * (fit.cell + fit.gap) + fit.cell / 2 - 1, 2, 2);
    }
  }
  ctx.restore();

  if (game.food) {
    const cx = fit.x + game.food.x * (fit.cell + fit.gap) + fit.cell / 2;
    const cy = fit.y + game.food.y * (fit.cell + fit.gap) + fit.cell / 2;
    ctx.save();
    ctx.fillStyle = palette.food;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(3, fit.cell * 0.34), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.leaf;
    ctx.beginPath();
    ctx.ellipse(cx + fit.cell * 0.16, cy - fit.cell * 0.3, fit.cell * 0.17, fit.cell * 0.08, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  game.body.forEach((cell, index) => {
    const x = fit.x + cell.x * (fit.cell + fit.gap);
    const y = fit.y + cell.y * (fit.cell + fit.gap);
    const head = index === 0;
    const color = head ? palette.head : index % 2 === 0 ? palette.body : palette.bodyAlt;
    fillRoundRect(ctx, x, y, fit.cell, fit.cell, Math.max(2, fit.cell * 0.3), color);
  });

  const head = game.body[0];
  if (head) {
    const direction = EYES[game.direction];
    const cx = fit.x + head.x * (fit.cell + fit.gap) + fit.cell / 2;
    const cy = fit.y + head.y * (fit.cell + fit.gap) + fit.cell / 2;
    const forward = fit.cell * 0.17;
    const side = fit.cell * 0.2;
    const radius = Math.max(1.2, fit.cell * 0.09);

    ctx.save();
    ctx.fillStyle = palette.eye;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        cx + direction.x * forward + (direction.y === 0 ? 0 : sign * side),
        cy + direction.y * forward + (direction.x === 0 ? 0 : sign * side),
        radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  // Petunjuk di kanvas hanya untuk keadaan yang belum punya panel DOM.
  if (game.status === "ready" || game.status === "paused") {
    const text = game.status === "ready" ? "TEKAN PANAH / WASD" : "JEDA";
    drawLabel(ctx, text, width / 2, fit.y + fit.height / 2, {
      font: `600 ${Math.max(11, Math.round(fit.cell * 0.62))}px ${MONO}`,
      color: palette.veilText,
      shadow: palette.board,
    });
  }
}

interface SnakePageProps {
  /** Jendela desktop yang tidak aktif tidak boleh menangkap tombol. */
  active?: boolean;
}

export function SnakePage({ active = true }: SnakePageProps = {}) {
  const theme = useTheme();
  const palette = useMemo(() => (theme === "dark" ? DARK : LIGHT), [theme]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [game, setGame] = useState<SnakeState>(() => createSnake());
  const [best, setBest] = useState(readBest);

  // Sumber kebenaran untuk loop, supaya aksi tidak dobel saat React memanggil
  // updater dua kali di StrictMode.
  const gameRef = useRef(game);
  const commit = useCallback((next: SnakeState) => {
    if (next === gameRef.current) return;
    gameRef.current = next;
    setGame(next);
  }, []);

  const input = useGameInput({ active });

  const update = useCallback(() => {
    let next = gameRef.current;
    for (const action of input.drain()) next = applyAction(next, action);
    if (next.status === "running") next = step(next);
    commit(next);
  }, [commit, input]);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      drawBoard(ctx, width, height, game, palette);
    },
    [game, palette],
  );

  useGameLoop(canvasRef, { active, stepMs: game.stepMs, update, render });

  useEffect(() => {
    if (game.score <= best) return;
    setBest(game.score);
    writeBest(game.score);
  }, [best, game.score]);

  const restart = useCallback(() => commit(createSnake()), [commit]);
  const pauseOrStart = useCallback(() => commit(applyAction(gameRef.current, "pause")), [commit]);

  const stepsPerSecond = Math.round(1000 / game.stepMs);

  return (
    <div className="snake-app" data-status={game.status}>
      <header className="snake-head">
        <div className="snake-title">
          <h1>Ular</h1>
          <p>Panah atau WASD · spasi jeda · R mulai ulang</p>
        </div>
        <dl className="snake-stats">
          <div>
            <dt>skor</dt>
            <dd data-testid="snake-score">{game.score}</dd>
          </div>
          <div>
            <dt>rekor</dt>
            <dd data-testid="snake-best">{best}</dd>
          </div>
          <div>
            <dt>status</dt>
            <dd data-testid="snake-status">{STATUS_LABEL[game.status]}</dd>
          </div>
        </dl>
      </header>

      <div className="snake-board">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Papan ular ${game.cols}×${game.rows}, skor ${game.score}`}
        />

        {(game.status === "over" || game.status === "won") && (
          <div className="snake-veil">
            <p>{game.status === "won" ? "Papan penuh." : "Tabrakan."}</p>
            <span>
              skor {game.score} · rekor {best}
            </span>
            <button type="button" onClick={restart}>
              Main lagi
            </button>
          </div>
        )}
      </div>

      <footer className="snake-foot">
        <p className="mono">
          papan {game.cols}×{game.rows} · {stepsPerSecond} langkah/detik ·{" "}
          {game.status === "running" ? "berjalan" : STATUS_LABEL[game.status]}
        </p>
        <div className="snake-actions">
          <button type="button" onClick={pauseOrStart}>
            {game.status === "running"
              ? "Jeda"
              : game.status === "over" || game.status === "won"
                ? "Mulai lagi"
                : "Mulai"}
          </button>
          <button type="button" onClick={restart}>
            Mulai ulang
          </button>
        </div>
      </footer>

      <p className="sr-only" role="status" aria-live="polite">
        {game.status === "over"
          ? `Tabrakan. Skor ${game.score}. Tekan spasi atau R untuk main lagi.`
          : game.status === "won"
            ? `Papan penuh dengan skor ${game.score}.`
            : game.status === "paused"
              ? "Permainan dijeda."
              : ""}
      </p>
    </div>
  );
}
