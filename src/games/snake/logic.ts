/**
 * Logika Ular — murni, tanpa DOM, tanpa canvas.
 *
 * Papan adalah grid `cols × rows` dengan (0,0) di kiri atas. Ular menabrak
 * dinding dan tubuhnya sendiri = game over (tidak membungkus ke sisi lain).
 */

export type Direction = "up" | "down" | "left" | "right";

export type SnakeStatus = "ready" | "running" | "paused" | "over" | "won";

export interface Cell {
  x: number;
  y: number;
}

export interface SnakeState {
  cols: number;
  rows: number;
  /** kepala di indeks 0 */
  body: Cell[];
  direction: Direction;
  /** belokan yang menunggu tick berikutnya, maksimal 2 */
  queued: Direction[];
  food: Cell | null;
  score: number;
  status: SnakeStatus;
  /** jeda antar langkah; turun saat skor naik */
  stepMs: number;
}

export type Random = () => number;

export const SNAKE_COLS = 17;
export const SNAKE_ROWS = 17;

export const BASE_STEP_MS = 150;
export const MIN_STEP_MS = 65;
export const STEP_GAIN_MS = 6;

export const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

export const OPPOSITE: Readonly<Record<Direction, Direction>> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Readonly<Record<Direction, Cell>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isDirection(value: string): value is Direction {
  return (DIRECTIONS as readonly string[]).includes(value);
}

/** Makin banyak makan makin cepat, tapi tidak pernah lebih cepat dari batas. */
export function speedFor(score: number): number {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  return Math.max(MIN_STEP_MS, BASE_STEP_MS - safeScore * STEP_GAIN_MS);
}

export function sameCell(a: Cell | null, b: Cell | null): boolean {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

/** Sel bebas acak; `null` kalau papan sudah penuh. */
export function spawnFood(
  random: Random,
  body: readonly Cell[],
  cols: number,
  rows: number,
): Cell | null {
  const occupied = new Set(body.map((cell) => `${cell.x},${cell.y}`));
  const free: Cell[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }

  if (free.length === 0) return null;

  const raw = random();
  const index = Math.min(free.length - 1, Math.max(0, Math.floor(raw * free.length)));
  return free[index];
}

export function createSnake(
  random: Random = Math.random,
  cols = SNAKE_COLS,
  rows = SNAKE_ROWS,
): SnakeState {
  const safeCols = Math.max(5, Math.floor(cols));
  const safeRows = Math.max(5, Math.floor(rows));
  const middle = Math.floor(safeRows / 2);

  // Ekor di kiri, kepala di kanan: arah awal ke kanan.
  const body: Cell[] = [
    { x: 3, y: middle },
    { x: 2, y: middle },
    { x: 1, y: middle },
  ];

  return {
    cols: safeCols,
    rows: safeRows,
    body,
    direction: "right",
    queued: [],
    food: spawnFood(random, body, safeCols, safeRows),
    score: 0,
    status: "ready",
    stepMs: speedFor(0),
  };
}

/** Belok; arah sebaliknya dan arah yang sama diabaikan. */
export function turn(state: SnakeState, direction: Direction): SnakeState {
  if (state.status !== "running" && state.status !== "ready") return state;

  const last = state.queued.length > 0 ? state.queued[state.queued.length - 1] : state.direction;
  if (direction === last || direction === OPPOSITE[last]) return state;

  return { ...state, queued: [...state.queued, direction].slice(-2) };
}

export function togglePause(state: SnakeState): SnakeState {
  if (state.status === "running") return { ...state, status: "paused" };
  if (state.status === "paused" || state.status === "ready") {
    return { ...state, status: "running" };
  }
  return state;
}

/**
 * Satu langkah. Kepala maju, ekor memendek kecuali saat makan. Tabrakan
 * dinding/tubuh mengakhiri permainan; papan penuh berarti menang.
 */
export function step(state: SnakeState, random: Random = Math.random): SnakeState {
  if (state.status !== "running") return state;

  const direction = state.queued[0] ?? state.direction;
  const queued = state.queued.slice(1);
  const head = state.body[0];
  const delta = DELTA[direction];
  const next: Cell = { x: head.x + delta.x, y: head.y + delta.y };

  if (next.x < 0 || next.y < 0 || next.x >= state.cols || next.y >= state.rows) {
    return { ...state, direction, queued, status: "over" };
  }

  const eating = sameCell(next, state.food);
  // Ekor yang akan pindah boleh ditempati; saat makan, ekor tetap di tempat.
  const kept = eating ? state.body : state.body.slice(0, -1);

  if (kept.some((cell) => sameCell(cell, next))) {
    return { ...state, direction, queued, status: "over" };
  }

  const body = [next, ...kept];
  const score = eating ? state.score + 1 : state.score;
  const food = eating ? spawnFood(random, body, state.cols, state.rows) : state.food;
  const status = eating && food === null ? "won" : "running";

  return {
    ...state,
    body,
    direction,
    queued,
    food,
    score,
    status,
    stepMs: speedFor(score),
  };
}
