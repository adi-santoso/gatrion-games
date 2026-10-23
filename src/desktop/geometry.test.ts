import { describe, expect, it } from "vitest";
import {
  DOCK_RESERVE,
  EDGE_INSET,
  MENU_BAR_HEIGHT,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  cascadeRect,
  clampRect,
  resizeRect,
  zoomRect,
} from "./geometry";

const bounds = { width: 1440, height: 900, top: MENU_BAR_HEIGHT };

describe("clampRect", () => {
  it("menjaga judul jendela tetap terlihat saat digeser ke kiri", () => {
    const rect = clampRect({ x: -5000, y: 100, w: 900, h: 600 }, bounds);
    expect(rect.x).toBe(-(900 - 148));
  });

  it("tidak mengizinkan jendela naik melewati menu bar", () => {
    const rect = clampRect({ x: 100, y: -200, w: 900, h: 600 }, bounds);
    expect(rect.y).toBe(MENU_BAR_HEIGHT);
  });

  it("menyusutkan jendela agar muat di layar kecil", () => {
    const rect = clampRect({ x: 0, y: 40, w: 2000, h: 2000 }, { width: 600, height: 500, top: 28 });
    expect(rect.w).toBe(600);
    expect(rect.h).toBe(472);
  });

  it("mempertahankan ukuran minimum", () => {
    const rect = clampRect({ x: 10, y: 40, w: 50, h: 50 }, bounds);
    expect(rect.w).toBe(MIN_WINDOW_WIDTH);
    expect(rect.h).toBe(MIN_WINDOW_HEIGHT);
  });
});

describe("cascadeRect", () => {
  it("menempatkan jendela pertama di tengah area kerja", () => {
    const rect = cascadeRect({ w: 900, h: 620 }, bounds, 0);
    expect(rect.w).toBe(900);
    expect(rect.h).toBe(620);
    expect(rect.x).toBe(218);
    expect(rect.y).toBeGreaterThan(MENU_BAR_HEIGHT);
  });

  it("menggeser jendela berikutnya supaya bertingkat", () => {
    const first = cascadeRect({ w: 900, h: 620 }, bounds, 0);
    const second = cascadeRect({ w: 900, h: 620 }, bounds, 1);
    expect(second.x - first.x).toBe(26);
    expect(second.y - first.y).toBe(26);
  });

  it("mengulang pola setelah lima jendela", () => {
    const first = cascadeRect({ w: 900, h: 620 }, bounds, 0);
    const sixth = cascadeRect({ w: 900, h: 620 }, bounds, 5);
    expect(sixth.x).toBe(first.x);
  });
});

describe("zoomRect", () => {
  it("memenuhi area kerja tapi menyisakan ruang dock dan menu bar", () => {
    const rect = zoomRect(bounds);
    expect(rect.x).toBe(EDGE_INSET);
    expect(rect.y).toBe(MENU_BAR_HEIGHT + EDGE_INSET);
    expect(rect.w).toBe(1440 - EDGE_INSET * 2);
    expect(rect.h).toBe(900 - MENU_BAR_HEIGHT - DOCK_RESERVE);
  });
});

describe("resizeRect", () => {
  const start = { x: 300, y: 200, w: 800, h: 500 };

  it("menarik tepi timur hanya mengubah lebar", () => {
    const rect = resizeRect({ dir: "e", start, dx: 60, dy: 90 }, bounds);
    expect(rect).toMatchObject({ x: 300, y: 200, w: 860, h: 500 });
  });

  it("menarik tepi barat menggeser x dan menyusutkan lebar", () => {
    const rect = resizeRect({ dir: "w", start, dx: 80, dy: 0 }, bounds);
    expect(rect).toMatchObject({ x: 380, w: 720 });
    expect(rect.x + rect.w).toBe(start.x + start.w);
  });

  it("menarik sudut tenggara mengubah lebar dan tinggi", () => {
    const rect = resizeRect({ dir: "se", start, dx: 40, dy: 30 }, bounds);
    expect(rect).toMatchObject({ w: 840, h: 530 });
  });

  it("berhenti di ukuran minimum walau ditarik terlalu jauh", () => {
    const rect = resizeRect({ dir: "w", start, dx: 2000, dy: 0 }, bounds);
    expect(rect.w).toBe(MIN_WINDOW_WIDTH);
    expect(rect.x + rect.w).toBe(start.x + start.w);

    const shrink = resizeRect({ dir: "n", start, dx: 0, dy: 2000 }, bounds);
    expect(shrink.h).toBe(MIN_WINDOW_HEIGHT);
    expect(shrink.y + shrink.h).toBe(start.y + start.h);
  });
});
