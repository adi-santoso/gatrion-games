import { describe, expect, it } from "vitest";
import { consumeFrame, fitGrid } from "./loop";

describe("consumeFrame", () => {
  it("menjalankan satu langkah untuk delta sebesar satu step", () => {
    expect(consumeFrame(0, 16, 16)).toEqual({ steps: 1, accumulator: 0 });
  });

  it("menyimpan sisa waktu untuk frame berikutnya", () => {
    const first = consumeFrame(0, 10, 16);
    expect(first.steps).toBe(0);
    expect(first.accumulator).toBeCloseTo(10);

    const second = consumeFrame(first.accumulator, 10, 16);
    expect(second.steps).toBe(1);
    expect(second.accumulator).toBeCloseTo(4);
  });

  it("menjalankan beberapa langkah dalam satu frame lambat", () => {
    expect(consumeFrame(0, 48, 16, 8)).toEqual({ steps: 3, accumulator: 0 });
  });

  it("membatasi delta setelah tab tidur", () => {
    // 30 detik tidak boleh menghasilkan ribuan tick: delta di-clamp ke 100 ms
    // lalu dibatasi maxSteps.
    const result = consumeFrame(0, 30_000, 10, 8);
    expect(result.steps).toBe(8);
    expect(result.accumulator).toBe(0);
  });

  it("meng-clamp delta 5 detik tanpa bergantung pada maxSteps", () => {
    // Tanpa clamp ini akan menjadi 250 langkah untuk step 20 ms.
    expect(consumeFrame(0, 5_000, 20, 100)).toEqual({ steps: 5, accumulator: 0 });
  });

  it("menjaga total waktu utuh antar frame", () => {
    const stepMs = 20;
    let accumulator = 0;
    let steps = 0;

    for (let frame = 0; frame < 60; frame += 1) {
      const result = consumeFrame(accumulator, 16.6667, stepMs);
      accumulator = result.accumulator;
      steps += result.steps;
    }

    expect(steps * stepMs + accumulator).toBeCloseTo(60 * 16.6667, 0);
  });

  it("tidak pernah menghasilkan angka negatif", () => {
    expect(consumeFrame(-50, -20, 16)).toEqual({ steps: 0, accumulator: 0 });
  });

  it("memakai step default yang aman untuk nilai aneh", () => {
    const result = consumeFrame(0, 17, 0);
    expect(result.steps).toBe(1);
    expect(result.accumulator).toBeCloseTo(17 - 1000 / 60);
  });
});

describe("fitGrid", () => {
  it("memakai sisi terpendek dan memusatkan papan", () => {
    const fit = fitGrid(340, 340, 17, 17, 10, 2);

    // (340 - 20 - 32) / 17 = 16.94 → 16
    expect(fit.cell).toBe(16);
    expect(fit.width).toBe(16 * 17 + 2 * 16);
    expect(fit.height).toBe(fit.width);
    expect(fit.x).toBe(Math.round((340 - fit.width) / 2));
    expect(fit.y).toBe(fit.x);
  });

  it("mengikuti sisi yang lebih pendek pada kanvas persegi panjang", () => {
    const wide = fitGrid(600, 200, 10, 10, 10);
    const tall = fitGrid(200, 600, 10, 10, 10);

    expect(wide.cell).toBe(18);
    expect(wide.cell).toBe(tall.cell);
    expect(wide.y).toBe(10);
    expect(tall.x).toBe(10);
    expect(wide.x).toBeGreaterThan(0);
  });

  it("menghasilkan sel persegi dan membagi sisa ruang ke dua sisi", () => {
    const fit = fitGrid(301, 201, 12, 9, 8, 3);

    expect(fit.width).toBe(fit.cell * 12 + 3 * 11);
    expect(fit.height).toBe(fit.cell * 9 + 3 * 8);
    expect(Math.abs(fit.x - (301 - fit.width) / 2)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(fit.y - (201 - fit.height) / 2)).toBeLessThanOrEqual(0.5);
  });

  it("kembalikan nol untuk kanvas yang belum punya ukuran", () => {
    expect(fitGrid(0, 0, 10, 10)).toEqual({ cell: 0, gap: 0, x: 0, y: 0, width: 0, height: 0 });
    expect(fitGrid(Number.NaN, 100, 10, 10).cell).toBe(0);
  });
});
