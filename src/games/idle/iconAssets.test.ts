import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GENERATORS } from "./economy";

const ICON_DIR = path.resolve(process.cwd(), "public/icons/idle");

describe("aset ikon idle", () => {
  it.each(GENERATORS.map((generator) => generator.id))(
    "punya PNG 192px untuk tier %s",
    (id) => {
      const file = path.join(ICON_DIR, `${id}.png`);
      const png = readFileSync(file);
      expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
      // IHDR menyimpan lebar/tinggi sebagai uint32 big-endian di byte 16-23
      expect(png.readUInt32BE(16)).toBe(192);
      expect(png.readUInt32BE(20)).toBe(192);
      expect(statSync(file).size).toBeGreaterThan(2000);
    },
  );

  it.each(GENERATORS.map((generator) => generator.id))(
    "punya SVG sumber untuk tier %s",
    (id) => {
      const svg = readFileSync(path.join(ICON_DIR, `${id}.svg`), "utf8");
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain('viewBox="0 0 64 64"');
    },
  );
});
