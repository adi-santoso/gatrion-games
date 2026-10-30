import { describe, expect, it } from "vitest";
import {
  CARD_ROW,
  DESIGN,
  HAND_Y,
  allBands,
  bandsFor,
  cardSlot,
  fitScale,
  frameFor,
  handSlot,
  handSlotIn,
  orientationFor,
} from "./layout";

describe("layout papan", () => {
  it("menyusun enam baris di dalam papan tanpa keluar batas", () => {
    const bands = allBands();

    expect(bands).toHaveLength(6);
    for (const band of bands) {
      expect(band.x).toBeGreaterThanOrEqual(0);
      expect(band.x + band.width).toBeLessThanOrEqual(DESIGN.width);
      expect(band.y + band.height).toBeLessThanOrEqual(DESIGN.height);
    }
  });

  it("mencerminkan urutan baris lawan dan pemain", () => {
    expect(bandsFor("ai", 46).map((band) => band.row)).toEqual(["siege", "ranged", "melee"]);
    expect(bandsFor("player", 348).map((band) => band.row)).toEqual(["melee", "ranged", "siege"]);
  });

  it("memberi jarak tetap antar kartu dan tidak melampaui baris", () => {
    const band = bandsFor("player", 348)[0];
    const first = cardSlot(band, 0);
    const second = cardSlot(band, 1);

    expect(second.x - first.x).toBe(CARD_ROW.w + 6);
    expect(first.y).toBe(band.y + band.height / 2);
    expect(cardSlot(band, 14).x + CARD_ROW.w / 2).toBeLessThanOrEqual(band.x + band.width);
  });

  it("memusatkan kartu tangan dan menyusut saat kartu bertambah", () => {
    const two = [handSlot(0, 2), handSlot(1, 2)];
    expect(two[0].x + two[1].x).toBeCloseTo(DESIGN.width, 5);
    expect(two[0].y).toBe(HAND_Y);

    const many = [handSlot(0, 12), handSlot(11, 12)];
    const step = (many[1].x - many[0].x) / 11;
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(CARD_ROW.w * 2);
    expect(many[0].x).toBeGreaterThan(0);
    expect(many[1].x).toBeLessThan(DESIGN.width);
  });

  it("menyusun papan potret di dalam frame dan tetap memuat sepuluh kartu", () => {
    const frame = frameFor("portrait");

    expect(orientationFor(390, 844)).toBe("portrait");
    expect(orientationFor(1280, 800)).toBe("landscape");
    expect(orientationFor(0, 0)).toBe("landscape");

    expect(frame.bands).toHaveLength(6);
    for (const band of frame.bands) {
      expect(band.x).toBeGreaterThanOrEqual(0);
      expect(band.x + band.width).toBeLessThanOrEqual(frame.width);
      expect(band.y + band.height).toBeLessThanOrEqual(frame.height);
    }

    const lastBand = frame.bands[5];
    expect(lastBand.y + lastBand.height).toBeLessThan(frame.targetY);
    expect(frame.targetY).toBeLessThan(frame.handY - frame.handCard.h / 2);
    expect(frame.handY + frame.handCard.h / 2).toBeLessThan(frame.creditsY);

    const hand = [
      handSlotIn(frame, 0, 10),
      handSlotIn(frame, 4, 10),
      handSlotIn(frame, 5, 10),
      handSlotIn(frame, 9, 10),
    ];
    for (const slot of hand) {
      expect(slot.x).toBeGreaterThan(0);
      expect(slot.x).toBeLessThan(frame.width);
    }
    expect(hand[0].y).toBe(hand[1].y);
    expect(hand[2].y).toBe(hand[3].y);
    expect(hand[2].y - hand[0].y).toBe(frame.handCard.h + 6);
    expect(hand[0].y - frame.handCard.h / 2).toBeGreaterThan(frame.targetY + 28);
    expect(hand[2].y + frame.handCard.h / 2).toBeLessThan(frame.creditsY);
    expect(handSlotIn(frame, 0, 4).y).toBe(frame.handY);
  });

  it("skala letterbox menjaga rasio desain", () => {
    expect(fitScale(1160, 760)).toBeCloseTo(1);
    expect(fitScale(580, 380)).toBeCloseTo(0.5);
    expect(fitScale(0, 0)).toBe(1);
    expect(fitScale(Number.NaN, 100)).toBe(1);
  });
});
