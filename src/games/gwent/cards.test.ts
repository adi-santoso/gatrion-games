import { describe, expect, it } from "vitest";
import { CARD_COUNT, CARDS, DECKS, ROWS, needsTarget } from "./cards";

describe("katalog 40 kartu", () => {
  it("berisi tepat 40 kartu dengan id unik", () => {
    const ids = Object.values(CARDS).map((card) => card.id);

    expect(CARD_COUNT).toBe(40);
    expect(new Set(ids).size).toBe(40);
  });

  it("setiap kartu punya art, teks, dan statistik yang masuk akal", () => {
    for (const card of Object.values(CARDS)) {
      expect(card.art, card.id).toBe(`/art/kartu/${card.id}.svg`);
      expect(card.text.length, card.id).toBeGreaterThan(3);

      if (card.kind === "unit" || card.kind === "hero") {
        expect(card.row, card.id).toBeDefined();
        expect(ROWS).toContain(card.row);
        expect(card.strength ?? 0, card.id).toBeGreaterThan(0);
      } else {
        expect(card.strength, card.id).toBeUndefined();
        expect(card.row, card.id).toBeUndefined();
      }
    }
  });

  it("kedua dek berisi 24 kartu yang semuanya ada di katalog", () => {
    for (const [faction, deck] of Object.entries(DECKS)) {
      expect(deck.cards, faction).toHaveLength(24);
      for (const id of deck.cards) {
        expect(CARDS[id], `${faction}:${id}`).toBeDefined();
      }
      expect(deck.cards, faction).toContain("s-bakar");
    }
  });

  it("cukup kartu untuk tiga ronde (10 tangan + 3 tarikan)", () => {
    for (const deck of Object.values(DECKS)) {
      expect(deck.cards.length).toBeGreaterThanOrEqual(13);
    }
  });

  it("hanya cuaca dan terompet yang butuh sasaran", () => {
    const kinds = Object.values(CARDS).filter(needsTarget).map((card) => card.kind);
    expect(new Set(kinds)).toEqual(new Set(["weather", "horn"]));
  });
});
