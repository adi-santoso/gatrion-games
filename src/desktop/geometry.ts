import type { Bounds, Rect, WindowSize } from "./types";

export const MIN_WINDOW_WIDTH = 380;
export const MIN_WINDOW_HEIGHT = 280;

/** Menu bar macOS: 24pt, di sini 28px supaya jam tetap terbaca. */
export const MENU_BAR_HEIGHT = 28;

/** Ruang yang disisakan untuk dock di bawah jendela. */
export const DOCK_RESERVE = 96;

/** Jendela boleh keluar tepi, tapi bagian ini harus tetap terlihat. */
export const KEEP_VISIBLE_X = 148;
export const KEEP_VISIBLE_Y = 46;

export const EDGE_INSET = 10;

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function clampRect(
  rect: Rect,
  bounds: Bounds,
  minW = MIN_WINDOW_WIDTH,
  minH = MIN_WINDOW_HEIGHT,
): Rect {
  const availableW = Math.max(1, bounds.width);
  const availableH = Math.max(1, bounds.height - bounds.top);

  const w = clamp(rect.w, Math.min(minW, availableW), availableW);
  const h = clamp(rect.h, Math.min(minH, availableH), availableH);

  const maxX = availableW - KEEP_VISIBLE_X;
  const minX = KEEP_VISIBLE_X - w;
  const maxY = bounds.top + availableH - KEEP_VISIBLE_Y;
  const minY = bounds.top;

  return {
    x: Math.round(clamp(rect.x, minX, maxX)),
    y: Math.round(clamp(rect.y, minY, maxY)),
    w: Math.round(w),
    h: Math.round(h),
  };
}

/** Ukuran jendela baru: di tengah, sedikit bertingkat bila sudah ada yang terbuka. */
export function cascadeRect(size: WindowSize, bounds: Bounds, index: number): Rect {
  const availableW = Math.max(1, bounds.width - EDGE_INSET * 2);
  const availableH = Math.max(1, bounds.height - bounds.top - DOCK_RESERVE);
  const w = Math.min(size.w, availableW);
  const h = Math.min(size.h, availableH);

  const step = 26;
  const offset = (index % 5) * step;
  const x = (bounds.width - w) / 2 - step * 2 + offset;
  const y = bounds.top + EDGE_INSET + Math.max(0, (availableH - h) / 2) + offset;

  return clampRect({ x, y, w, h }, bounds);
}

/** Tombol hijau: penuhi area kerja tanpa menutupi menu bar dan dock. */
export function zoomRect(bounds: Bounds): Rect {
  return clampRect(
    {
      x: EDGE_INSET,
      y: bounds.top + EDGE_INSET,
      w: Math.max(1, bounds.width - EDGE_INSET * 2),
      h: Math.max(1, bounds.height - bounds.top - DOCK_RESERVE),
    },
    bounds,
  );
}

export interface ResizeInput {
  dir: string;
  start: Rect;
  dx: number;
  dy: number;
}

/** Hitung rect baru saat menarik salah satu dari delapan pegangan resize. */
export function resizeRect({ dir, start, dx, dy }: ResizeInput, bounds: Bounds): Rect {
  let { x, y, w, h } = start;

  if (dir.includes("e")) w = start.w + dx;
  if (dir.includes("s")) h = start.h + dy;
  if (dir.includes("w")) {
    w = start.w - dx;
    x = start.x + dx;
  }
  if (dir.includes("n")) {
    h = start.h - dy;
    y = start.y + dy;
  }

  // jangan biarkan tepi yang ditarik melewati tepi seberang
  if (w < MIN_WINDOW_WIDTH) {
    if (dir.includes("w")) x = start.x + start.w - MIN_WINDOW_WIDTH;
    w = MIN_WINDOW_WIDTH;
  }
  if (h < MIN_WINDOW_HEIGHT) {
    if (dir.includes("n")) y = start.y + start.h - MIN_WINDOW_HEIGHT;
    h = MIN_WINDOW_HEIGHT;
  }

  return clampRect({ x, y, w, h }, bounds);
}
