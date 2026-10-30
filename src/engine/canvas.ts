/**
 * Helper kanvas 2D kecil: ukuran mengikuti devicePixelRatio, plus penggambaran dasar.
 *
 * Semua fungsi di sini butuh canvas sungguhan (browser). Logika game jangan
 * bergantung pada modul ini supaya tetap bisa diuji di Node.
 */

/** Di atas 2× tidak ada bedanya secara visual, hanya memakan memori. */
export const MAX_DPR = 2;

export interface CanvasSize {
  /** ukuran logis dalam piksel CSS */
  width: number;
  height: number;
  dpr: number;
}

/**
 * Samakan backing store kanvas dengan ukuran CSS × dpr, lalu set transform
 * supaya kode gambar tetap memakai koordinat CSS. Kembalikan `null` bila
 * elemen belum punya ukuran (mis. jendela masih tersembunyi).
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): CanvasSize | null {
  if (!Number.isFinite(cssWidth) || !Number.isFinite(cssHeight) || cssWidth < 1 || cssHeight < 1) {
    return null;
  }

  const ratio = Math.min(Math.max(Number.isFinite(dpr) && dpr > 0 ? dpr : 1, 1), MAX_DPR);
  const width = Math.round(cssWidth);
  const height = Math.round(cssHeight);
  const backingWidth = Math.max(1, Math.round(width * ratio));
  const backingHeight = Math.max(1, Math.round(height * ratio));

  if (canvas.width !== backingWidth) canvas.width = backingWidth;
  if (canvas.height !== backingHeight) canvas.height = backingHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return { width, height, dpr: ratio };
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Kotak bersudut tumpul tanpa bergantung pada `ctx.roundRect` yang lebih baru. */
export function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export interface LabelOptions {
  font?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** "halo" tipis di belakang teks supaya tetap terbaca di latar apa pun */
  shadow?: string;
}

/** Teks HUD sederhana di atas kanvas. */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  { font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace", color = "#ece9df", align = "center", baseline = "middle", shadow }: LabelOptions = {},
): void {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 8;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
