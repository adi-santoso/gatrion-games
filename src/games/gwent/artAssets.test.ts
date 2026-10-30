import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ART_CREDITS, CREDITS_BY_ID, CREDITS_LINE } from "./artCredits";
import { CARDS } from "./cards";

describe("aset art kartu", () => {
  it("setiap kartu punya file SVG yang valid di public/art/kartu", () => {
    for (const card of Object.values(CARDS)) {
      const file = `public/art/kartu/${card.id}.svg`;

      expect(existsSync(file), card.id).toBe(true);
      const svg = readFileSync(file, "utf8");
      expect(svg, card.id).toContain("<svg");
      expect(svg.length, card.id).toBeGreaterThan(80);
    }
  });

  it("setiap kartu punya kredit CC BY 3.0 dari game-icons.net", () => {
    const ids = Object.values(CARDS)
      .map((card) => card.id)
      .sort();
    expect(ART_CREDITS.map((credit) => credit.id).sort()).toEqual(ids);

    for (const id of ids) {
      const credit = CREDITS_BY_ID[id];
      expect(credit, id).toBeDefined();
      expect(credit.license, id).toBe("CC BY 3.0");
      expect(credit.source, id).toContain("game-icons.net");
      expect(credit.author.length, id).toBeGreaterThan(0);
    }

    expect(CREDITS_LINE).toContain("game-icons.net");
    expect(CREDITS_LINE).toContain("CC BY 3.0");
  });

  it("berisi tepat 40 kartu dengan art unik, bukan placeholder", () => {
    const cards = Object.values(CARDS);
    expect(cards).toHaveLength(40);

    const files = readdirSync("public/art/kartu").filter((file) => file.endsWith(".svg"));
    expect(files).toHaveLength(40);

    const hashes = new Map<string, string>();
    for (const card of cards) {
      const svg = readFileSync(`public/art/kartu/${card.id}.svg`, "utf8");
      expect(svg, card.id).toMatch(/<path[^>]*\sd="/);
      expect(svg.length, card.id).toBeGreaterThanOrEqual(200);

      const hash = createHash("sha256").update(svg).digest("hex");
      expect(hashes.has(hash), `${card.id} duplikat art dengan ${hashes.get(hash)}`).toBe(false);
      hashes.set(hash, card.id);
    }
  });
});
