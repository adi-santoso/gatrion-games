/**
 * Tata letak papan di ruang desain.
 *
 * Dua orientasi: lanskap 1160×760 untuk jendela desktop, potret 440×780 untuk
 * layar sempit (canvas tetap memakai ruang yang tersedia, bukan 366×240).
 * Semua fungsi murni (tanpa Phaser/DOM) supaya posisi kartu bisa diuji di Node.
 */

import type { Row, Side } from "../cards";

export type Orientation = "landscape" | "portrait";

export interface CardSize {
  readonly w: number;
  readonly h: number;
}

export const DESIGN = { width: 1160, height: 760 } as const;

export const CARD_ROW: CardSize = { w: 58, h: 82 };
export const CARD_HAND: CardSize = { w: 84, h: 116 };

export const ROW_HEIGHT = 64;
export const ROW_GAP = 8;
export const ROW_TOP_AI = 46;
export const ROW_TOP_PLAYER = 348;
export const HAND_Y = 628;

/** Baris dekat selalu di tengah papan, jadi urutan lawan dicerminkan. */
export const ROW_ORDER: Record<Side, Row[]> = {
  ai: ["siege", "ranged", "melee"],
  player: ["melee", "ranged", "siege"],
};

export interface Band {
  side: Side;
  row: Row;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Frame {
  orientation: Orientation;
  width: number;
  height: number;
  margin: number;
  contentWidth: number;
  bands: Band[];
  middleY: number;
  targetY: number;
  handY: number;
  creditsY: number;
  rowCard: CardSize;
  handCard: CardSize;
  /** Ruang label + skor di kiri baris, sebelum kartu pertama. */
  labelWidth: number;
  /** Jarak tepi kiri/kanan untuk kipas kartu tangan. */
  handPadding: number;
}

interface Metrics {
  width: number;
  height: number;
  margin: number;
  bandHeight: number;
  bandGap: number;
  aiTop: number;
  playerTop: number;
  middleY: number;
  targetY: number;
  handY: number;
  creditsY: number;
  rowCard: CardSize;
  handCard: CardSize;
  labelWidth: number;
  handPadding: number;
}

const METRICS: Record<Orientation, Metrics> = {
  landscape: {
    width: DESIGN.width,
    height: DESIGN.height,
    margin: 16,
    bandHeight: ROW_HEIGHT,
    bandGap: ROW_GAP,
    aiTop: ROW_TOP_AI,
    playerTop: ROW_TOP_PLAYER,
    middleY: 300,
    targetY: 560,
    handY: HAND_Y,
    creditsY: 744,
    rowCard: CARD_ROW,
    handCard: CARD_HAND,
    labelWidth: 86,
    handPadding: 90,
  },
  portrait: {
    width: 440,
    height: 800,
    margin: 12,
    bandHeight: 66,
    bandGap: 6,
    aiTop: 40,
    playerTop: 282,
    middleY: 262,
    targetY: 508,
    handY: 659,
    creditsY: 790,
    rowCard: { w: 46, h: 64 },
    handCard: { w: 62, h: 96 },
    labelWidth: 56,
    handPadding: 16,
  },
};

function makeBands(metrics: Metrics): Band[] {
  const width = metrics.width - metrics.margin * 2;
  const rowsFor = (side: Side, top: number): Band[] =>
    ROW_ORDER[side].map((row, index) => ({
      side,
      row,
      x: metrics.margin,
      y: top + index * (metrics.bandHeight + metrics.bandGap),
      width,
      height: metrics.bandHeight,
    }));
  return [...rowsFor("ai", metrics.aiTop), ...rowsFor("player", metrics.playerTop)];
}

function buildFrame(orientation: Orientation): Frame {
  const metrics = METRICS[orientation];
  return {
    orientation,
    width: metrics.width,
    height: metrics.height,
    margin: metrics.margin,
    contentWidth: metrics.width - metrics.margin * 2,
    bands: makeBands(metrics),
    middleY: metrics.middleY,
    targetY: metrics.targetY,
    handY: metrics.handY,
    creditsY: metrics.creditsY,
    rowCard: metrics.rowCard,
    handCard: metrics.handCard,
    labelWidth: metrics.labelWidth,
    handPadding: metrics.handPadding,
  };
}

const FRAMES: Record<Orientation, Frame> = {
  landscape: buildFrame("landscape"),
  portrait: buildFrame("portrait"),
};

/** Potret dipakai saat ruang tampil lebih tinggi daripada lebarnya. */
export function orientationFor(containerWidth: number, containerHeight: number): Orientation {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(containerHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return "landscape";
  }
  return containerWidth / containerHeight < 0.9 ? "portrait" : "landscape";
}

export function frameFor(orientation: Orientation): Frame {
  return FRAMES[orientation];
}

export function bandsFor(side: Side, top: number): Band[] {
  const { width, margin, bandHeight, bandGap } = METRICS.landscape;
  return ROW_ORDER[side].map((row, index) => ({
    side,
    row,
    x: margin,
    y: top + index * (bandHeight + bandGap),
    width: width - margin * 2,
    height: bandHeight,
  }));
}

export function allBands(): Band[] {
  return [...bandsFor("ai", ROW_TOP_AI), ...bandsFor("player", ROW_TOP_PLAYER)];
}

/** Slot kartu di dalam satu baris; langkah menyusut bila kartu bertambah. */
export function cardSlotIn(
  frame: Frame,
  band: Band,
  index: number,
  count: number,
): { x: number; y: number } {
  const { w } = frame.rowCard;
  const gap = 6;
  const available = band.width - frame.labelWidth - w - gap;
  const step = Math.min(w + gap, count > 1 ? available / (count - 1) : w + gap);
  return {
    x: band.x + frame.labelWidth + w / 2 + index * step,
    y: band.y + band.height / 2,
  };
}

/** Slot kartu lanskap lama (dipakai tes dan pemanggil lama). */
export function cardSlot(band: Band, index: number): { x: number; y: number } {
  return {
    x: band.x + 86 + CARD_ROW.w / 2 + index * (CARD_ROW.w + 6),
    y: band.y + band.height / 2,
  };
}

/** Kartu tangan dirapatkan dan dipusatkan; langkah menyusut bila kartu banyak. */
export function handSlotIn(
  frame: Frame,
  index: number,
  count: number,
): { x: number; y: number } {
  // Di layar potret, tangan banyak kartu dipecah dua baris supaya nama kartu
  // tidak tertutup kartu sebelahnya.
  const rows = frame.orientation === "portrait" && count > 5 ? 2 : 1;
  const perRow = Math.ceil(count / rows);
  const rowIndex = Math.floor(index / perRow);
  const column = index % perRow;
  const inRow = Math.min(perRow, count - rowIndex * perRow);
  const available = frame.width - frame.handPadding * 2;
  const step = Math.min(frame.handCard.w + 8, available / Math.max(inRow, 1));
  const total = step * Math.max(inRow - 1, 0);
  const rowOffset = rows === 1 ? 0 : (rowIndex === 0 ? -1 : 1) * ((frame.handCard.h + 6) / 2);
  return {
    x: frame.width / 2 - total / 2 + column * step,
    y: frame.handY + rowOffset,
  };
}

export function handSlot(index: number, count: number): { x: number; y: number } {
  const available = DESIGN.width - 180;
  const step = Math.min(CARD_HAND.w + 8, available / Math.max(count, 1));
  const total = step * Math.max(count - 1, 0);
  return { x: DESIGN.width / 2 - total / 2 + index * step, y: HAND_Y };
}

/** Skala untuk menampilkan ruang desain di dalam container (letterbox). */
export function fitScale(containerWidth: number, containerHeight: number): number {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(containerHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return 1;
  }
  return Math.min(containerWidth / DESIGN.width, containerHeight / DESIGN.height);
}
