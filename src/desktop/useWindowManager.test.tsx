import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MENU_BAR_HEIGHT, MIN_WINDOW_WIDTH } from "./geometry";
import { WINDOWS_KEY } from "./storage";
import type { Bounds } from "./types";
import { useWindowManager } from "./useWindowManager";

const bounds: Bounds = { width: 1440, height: 900, top: MENU_BAR_HEIGHT };

const sizes = {
  gatrion: { w: 900, h: 620 },
  wordle: { w: 980, h: 720 },
};

function setup(initialBounds: Bounds = bounds) {
  return renderHook(({ area }) => useWindowManager({ bounds: area }), {
    initialProps: { area: initialBounds },
  });
}

function stored() {
  return JSON.parse(localStorage.getItem(WINDOWS_KEY) ?? "null");
}

describe("useWindowManager", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("membuka jendela baru terfokus di area kerja", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));

    expect(result.current.windows).toHaveLength(1);
    const win = result.current.windows[0];
    expect(win.appId).toBe("gatrion");
    expect(win.w).toBe(900);
    expect(win.minimized).toBe(false);
    expect(result.current.focusedId).toBe(win.id);
  });

  it("membuka aplikasi yang sama hanya memfokuskan jendelanya", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    act(() => result.current.open("wordle", sizes.wordle));
    const gatrionId = result.current.windows[0].id;

    act(() => result.current.open("gatrion", sizes.gatrion));

    expect(result.current.windows).toHaveLength(2);
    expect(result.current.focusedId).toBe(gatrionId);
  });

  it("⌘N menambah jendela kedua untuk aplikasi yang sama", () => {
    const { result } = setup();
    act(() => result.current.open("wordle", sizes.wordle));
    act(() => result.current.newWindow("wordle", sizes.wordle));

    expect(result.current.windows.filter((win) => win.appId === "wordle")).toHaveLength(2);
    expect(new Set(result.current.windows.map((win) => win.id)).size).toBe(2);
  });

  it("menutup jendela memindahkan fokus ke jendela teratas berikutnya", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    act(() => result.current.open("wordle", sizes.wordle));
    const [first, second] = result.current.windows;

    act(() => result.current.close(second.id));

    expect(result.current.windows).toHaveLength(1);
    expect(result.current.focusedId).toBe(first.id);
  });

  it("minimize menyembunyikan jendela dan restore mengembalikannya", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    const id = result.current.windows[0].id;

    act(() => result.current.minimize(id));
    expect(result.current.windows[0].minimized).toBe(true);
    expect(result.current.minimizedWindows).toHaveLength(1);
    expect(result.current.focusedId).toBeNull();

    act(() => result.current.restore(id));
    expect(result.current.windows[0].minimized).toBe(false);
    expect(result.current.focusedId).toBe(id);
  });

  it("tombol hijau menyimpan ukuran lama lalu memulihkannya", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    const before = result.current.windows[0];

    act(() => result.current.toggleZoom(before.id));
    const zoomed = result.current.windows[0];
    expect(zoomed.zoomed).toBe(true);
    expect(zoomed.w).toBe(1420);
    expect(zoomed.restore).toMatchObject({ w: before.w, h: before.h });

    act(() => result.current.toggleZoom(before.id));
    const restored = result.current.windows[0];
    expect(restored.zoomed).toBe(false);
    expect(restored).toMatchObject({ x: before.x, y: before.y, w: before.w, h: before.h });
  });

  it("menarik jendela keluar layar tetap menyisakan judul", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    const id = result.current.windows[0].id;

    act(() => result.current.move(id, 5000, -5000));

    const win = result.current.windows[0];
    expect(win.x).toBe(1440 - 148);
    expect(win.y).toBe(MENU_BAR_HEIGHT);
  });

  it("resize tidak pernah lebih kecil dari ukuran minimum", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    const id = result.current.windows[0].id;

    act(() => result.current.resize(id, { x: 100, y: 100, w: 10, h: 10 }));

    expect(result.current.windows[0].w).toBe(MIN_WINDOW_WIDTH);
  });

  it("menyimpan tata letak ke localStorage", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    act(() => vi.advanceTimersByTime(300));

    const saved = stored();
    expect(saved.windows).toHaveLength(1);
    expect(saved.windows[0].appId).toBe("gatrion");
    expect(saved.focusedId).toBe(result.current.windows[0].id);
  });

  it("memulihkan tata letak tersimpan dan menyesuaikannya ke layar", () => {
    localStorage.setItem(
      WINDOWS_KEY,
      JSON.stringify({
        windows: [
          {
            id: "win-a",
            appId: "wordle",
            x: 3000,
            y: 200,
            w: 900,
            h: 600,
            zoomed: false,
            minimized: false,
            restore: null,
            z: 4,
          },
        ],
        focusedId: "win-a",
        zTop: 4,
      }),
    );

    const { result } = setup({ width: 1024, height: 700, top: MENU_BAR_HEIGHT });

    expect(result.current.windows).toHaveLength(1);
    expect(result.current.windows[0].x).toBe(1024 - 148);
    expect(result.current.windows[0].w).toBe(900);
    expect(result.current.focusedId).toBe("win-a");
  });

  it("mengabaikan tata letak rusak", () => {
    localStorage.setItem(WINDOWS_KEY, "{ bukan json");
    const { result } = setup();
    expect(result.current.windows).toHaveLength(0);
  });

  it("mengecilkan jendela saat viewport menyusut", () => {
    const { result, rerender } = setup();
    act(() => result.current.open("wordle", sizes.wordle));

    rerender({ area: { width: 700, height: 520, top: MENU_BAR_HEIGHT } });

    const win = result.current.windows[0];
    expect(win.w).toBeLessThanOrEqual(700);
    expect(win.h).toBeLessThanOrEqual(520 - MENU_BAR_HEIGHT);
  });

  it("resetLayout menyusun ulang jendela dan membatalkan zoom", () => {
    const { result } = setup();
    act(() => result.current.open("gatrion", sizes.gatrion));
    act(() => result.current.open("wordle", sizes.wordle));
    act(() => result.current.toggleZoom(result.current.windows[1].id));

    act(() => result.current.resetLayout());

    expect(result.current.windows.every((win) => !win.zoomed)).toBe(true);
    expect(result.current.windows.every((win) => !win.minimized)).toBe(true);
  });

  it("mencatat aplikasi yang sedang berjalan tanpa duplikat", () => {
    const { result } = setup();
    act(() => result.current.open("wordle", sizes.wordle));
    act(() => result.current.newWindow("wordle", sizes.wordle));
    act(() => result.current.open("gatrion", sizes.gatrion));

    expect(result.current.runningApps).toEqual(["gatrion", "wordle"]);
  });
});
