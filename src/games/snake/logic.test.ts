import { describe, expect, it } from "vitest";
import {
  MIN_STEP_MS,
  OPPOSITE,
  createSnake,
  sameCell,
  spawnFood,
  speedFor,
  step,
  togglePause,
  turn,
} from "./logic";
import type { Cell, SnakeState } from "./logic";

/** Deterministik: selalu memilih sel bebas pertama. */
const first = () => 0;

/** Papan 5×5 diisi penuh, berguna untuk kasus "tidak ada tempat". */
const fullBoard: Cell[] = Array.from({ length: 25 }, (_, index) => ({
  x: index % 5,
  y: Math.floor(index / 5),
}));

function running(overrides: Partial<SnakeState> = {}): SnakeState {
  const base = createSnake(first);
  return { ...base, status: "running", food: { x: 0, y: 0 }, ...overrides };
}

describe("createSnake", () => {
  it("mulai dengan tiga segmen, skor nol, dan makanan di luar tubuh", () => {
    const game = createSnake(first);

    expect(game.status).toBe("ready");
    expect(game.score).toBe(0);
    expect(game.body).toHaveLength(3);
    expect(game.body.some((cell) => sameCell(cell, game.food))).toBe(false);
    expect(game.stepMs).toBe(speedFor(0));
  });
});

describe("turn", () => {
  it("menerima belokan tegak lurus, menolak arah sebaliknya", () => {
    const game = createSnake(first);

    expect(turn(game, "left")).toBe(game);
    expect(turn(game, "right")).toBe(game);
    expect(turn(game, "up").queued).toEqual(["up"]);
  });

  it("membandingkan dengan antrean terakhir, bukan arah sekarang", () => {
    const game = createSnake(first);
    const up = turn(game, "up");
    const queued = turn(up, "down");

    expect(queued).toBe(up);
    expect(turn(up, "left").queued).toEqual(["up", "left"]);
  });

  it("menyimpan paling banyak dua belokan", () => {
    const game = createSnake(first);
    const queued = turn(turn(turn(game, "up"), "left"), "down");

    expect(queued.queued).toHaveLength(2);
    expect(queued.queued).toEqual(["left", "down"]);
  });
});

describe("togglePause", () => {
  it("bolak-balik antara jalan dan jeda", () => {
    const game = createSnake(first);
    const paused = togglePause(game);

    expect(paused.status).toBe("running");
    expect(togglePause(paused).status).toBe("paused");
  });

  it("tidak menghidupkan lagi permainan yang sudah selesai", () => {
    const over = running({ status: "over" });
    expect(togglePause(over)).toBe(over);
  });
});

describe("step", () => {
  it("menggeser kepala satu sel dan membuang ekor", () => {
    const game = running();
    const head = game.body[0];
    const next = step(game, first);

    expect(next.body[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(next.body).toHaveLength(3);
    expect(next.score).toBe(0);
    expect(next.status).toBe("running");
  });

  it("memanjang, menambah skor, dan mempercepat saat makan", () => {
    const game = running();
    const head = game.body[0];
    const fed = step({ ...game, food: { x: head.x + 1, y: head.y } }, first);
    const eaten = { x: head.x + 1, y: head.y };

    expect(fed.score).toBe(1);
    expect(fed.body).toHaveLength(4);
    expect(sameCell(fed.body[0], eaten)).toBe(true);
    expect(fed.stepMs).toBe(speedFor(1));
    expect(sameCell(fed.food, eaten)).toBe(false);
    expect(fed.body.some((cell) => sameCell(cell, fed.food))).toBe(false);
  });

  it("kalah saat menabrak dinding", () => {
    const edge = running({
      body: [
        { x: 16, y: 5 },
        { x: 15, y: 5 },
        { x: 14, y: 5 },
      ],
    });

    expect(step(edge, first).status).toBe("over");
  });

  it("kalah saat menabrak tubuhnya sendiri", () => {
    const coiled = running({
      direction: "down",
      body: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
      ],
    });

    expect(step(coiled, first).status).toBe("over");
  });

  it("membolehkan kepala menempati sel ekor yang akan pindah", () => {
    const frame = running({
      direction: "left",
      body: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
      ],
    });

    const next = step(frame, first);
    expect(next.status).toBe("running");
    expect(next.body[0]).toEqual({ x: 4, y: 5 });
  });

  it("mengabaikan langkah saat permainan belum jalan", () => {
    const game = createSnake(first);
    expect(step(game, first)).toBe(game);
  });

  it("menang saat papan penuh setelah makan terakhir", () => {
    // Papan 2×2 dengan tiga sel terisi: kepala (0,0) makan di (1,0)
    // dan tidak ada sel bebas lagi untuk makanan berikutnya.
    const tight: SnakeState = {
      ...createSnake(first),
      cols: 2,
      rows: 2,
      status: "running",
      direction: "right",
      body: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      food: { x: 1, y: 0 },
    };

    const next = step(tight, first);
    expect(next.score).toBe(1);
    expect(next.body).toHaveLength(4);
    expect(next.food).toBeNull();
    expect(next.status).toBe("won");
  });
});

describe("speedFor", () => {
  it("naik seiring skor lalu berhenti di batas cepat", () => {
    expect(speedFor(0)).toBe(150);
    expect(speedFor(5)).toBe(120);
    expect(speedFor(50)).toBe(MIN_STEP_MS);
  });
});

describe("spawnFood", () => {
  it("mengembalikan null kalau papan penuh", () => {
    expect(spawnFood(first, fullBoard, 5, 5)).toBeNull();
  });

  it("tidak pernah menaruh makanan di tubuh ular", () => {
    const body = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    expect(sameCell(spawnFood(first, body, 3, 3), { x: 0, y: 0 })).toBe(false);
  });
});

describe("OPPOSITE", () => {
  it("simetris", () => {
    expect(OPPOSITE[OPPOSITE.up]).toBe("up");
    expect(OPPOSITE[OPPOSITE.left]).toBe("left");
  });
});
