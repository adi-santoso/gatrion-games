/**
 * Waktu dan tata letak untuk game canvas 2D.
 *
 * Semua fungsi di sini murni (tanpa DOM) supaya bisa diuji tanpa browser:
 * - `consumeFrame` mengubah delta antar-frame menjadi jumlah update berukuran tetap.
 * - `fitGrid` menghitung ukuran sel yang pas di kanvas, terpusat.
 */

/**
 * Satu frame paling banyak dihitung 100 ms. Setelah tab tidur atau jendela
 * di-latarbelakangi, sisa waktu dibuang alih-alih dikejar dalam satu frame.
 */
export const MAX_FRAME_MS = 100;

export interface StepResult {
  /** berapa kali `update()` harus dipanggil */
  steps: number;
  /** sisa waktu yang dibawa ke frame berikutnya */
  accumulator: number;
}

/**
 * Fixed-timestep: kumpulkan waktu, jalankan update sejumlah langkah penuh.
 * `maxSteps` mencegah "spiral of death" saat frame sangat lambat — lebih baik
 * game terasa melambat sesaat daripada mengejar ratusan tick sekaligus.
 */
export function consumeFrame(
  accumulator: number,
  frameMs: number,
  stepMs: number,
  maxSteps = 5,
): StepResult {
  const step = Number.isFinite(stepMs) && stepMs > 0 ? stepMs : 1000 / 60;
  const frame = Math.min(Math.max(Number.isFinite(frameMs) ? frameMs : 0, 0), MAX_FRAME_MS);
  const total = (Number.isFinite(accumulator) ? Math.max(accumulator, 0) : 0) + frame;
  const steps = Math.floor(total / step);

  if (steps > maxSteps) {
    return { steps: maxSteps, accumulator: 0 };
  }

  return { steps, accumulator: total - steps * step };
}

export interface GridFit {
  /** panjang sisi satu sel dalam piksel CSS */
  cell: number;
  /** jarak antar sel dalam piksel CSS */
  gap: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Papan grid persegi yang memenuhi kanvas tanpa memotong: pakai sisi terpendek,
 * lalu pusatkan. Kembalian nol berarti kanvas belum punya ukuran.
 */
export function fitGrid(
  width: number,
  height: number,
  cols: number,
  rows: number,
  padding = 0,
  gap = 0,
): GridFit {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return { cell: 0, gap: 0, x: 0, y: 0, width: 0, height: 0 };
  }

  const safeCols = Math.max(1, Math.floor(cols));
  const safeRows = Math.max(1, Math.floor(rows));
  const span = (count: number, available: number) =>
    (available - 2 * padding - gap * (count - 1)) / count;

  const cell = Math.max(1, Math.floor(Math.min(span(safeCols, width), span(safeRows, height))));
  const boardWidth = cell * safeCols + gap * (safeCols - 1);
  const boardHeight = cell * safeRows + gap * (safeRows - 1);

  return {
    cell,
    gap,
    x: Math.round((width - boardWidth) / 2),
    y: Math.round((height - boardHeight) / 2),
    width: boardWidth,
    height: boardHeight,
  };
}
