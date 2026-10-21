import { describe, expect, it } from "vitest";
import {
  CLICK_BASE,
  GENERATORS,
  OFFLINE_CAP_SECONDS,
  affordableCount,
  bulkCost,
  clickGain,
  clickUpgradeCost,
  defaultSave,
  newlyUnlocked,
  offlineReport,
  production,
  sanitizeSave,
  unitCost,
  wantedCount,
} from "./economy";
import type { IdleSave } from "./types";

const pick = GENERATORS[0];

function makeSave(overrides: Partial<IdleSave> = {}): IdleSave {
  return { ...defaultSave(1000), ...overrides };
}

describe("biaya generator", () => {
  it("harga naik 1.15x per unit", () => {
    expect(unitCost(pick, 0)).toBe(15);
    expect(unitCost(pick, 1)).toBe(18);
    expect(unitCost(pick, 2)).toBe(20);
  });

  it("bulk cost sama dengan jumlah unit berurutan", () => {
    const owned = 4;
    const expected =
      unitCost(pick, owned) +
      unitCost(pick, owned + 1) +
      unitCost(pick, owned + 2);
    expect(bulkCost(pick, owned, 3)).toBe(expected);
  });

  it("menghitung jumlah yang terjangkau", () => {
    const save = makeSave({ crystals: bulkCost(pick, 0, 5) });
    expect(affordableCount(save, pick)).toBe(5);
  });

  it("mode max mengikuti kristal yang ada", () => {
    const save = makeSave({ crystals: 100, buy: "max" });
    expect(wantedCount(save, pick)).toBe(affordableCount(save, pick));
  });
});

describe("produksi dan klik", () => {
  it("menjumlahkan rate seluruh generator", () => {
    const save = makeSave({ gens: { pick: 4, drill: 2 } });
    expect(production(save)).toBeCloseTo(4 * 0.5 + 2 * 4);
  });

  it("klik memberi bonus dari produksi", () => {
    const save = makeSave({ clickLevel: 2, gens: { pick: 20 } });
    expect(clickGain(save)).toBeCloseTo(1 + 2 * 3 + production(save) * 0.02);
  });

  it("harga upgrade klik tumbuh geometris", () => {
    expect(clickUpgradeCost(0)).toBe(CLICK_BASE);
    expect(clickUpgradeCost(1)).toBeGreaterThan(CLICK_BASE);
  });
});

describe("progres offline", () => {
  it("menghitung 50% laju selama satu jam", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0 });
    const report = offlineReport(save, 3_600_000);
    expect(report.seconds).toBe(3600);
    expect(report.gain).toBeCloseTo(10 * 3600 * 0.5);
  });

  it("dibatasi 8 jam", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0 });
    const report = offlineReport(save, 24 * 3_600_000);
    expect(report.seconds).toBe(OFFLINE_CAP_SECONDS);
  });

  it("tidak memberi apa pun untuk jeda di bawah semenit", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0 });
    expect(offlineReport(save, 30_000).gain).toBe(0);
  });
});

describe("sanitizeSave", () => {
  it("mengabaikan nilai rusak dan mengisi default", () => {
    const save = sanitizeSave({
      crystals: -50,
      clicks: "12",
      gens: { pick: 3, unknown: 99 },
      buy: "banyak",
      ach: ["tap1", 5, "tap1"],
    }, 5000);

    expect(save.crystals).toBe(0);
    expect(save.clicks).toBe(12);
    expect(save.gens.pick).toBe(3);
    expect(save.gens.drill).toBe(0);
    expect(save.buy).toBe("1");
    expect(save.ach).toEqual(["tap1"]);
    expect(save.v).toBe(2);
  });

  it("bertahan dari input bukan objek", () => {
    expect(sanitizeSave("rusak").crystals).toBe(0);
    expect(sanitizeSave(null).buy).toBe("1");
  });
});

describe("pencapaian", () => {
  it("membuka pencapaian sesuai kondisi", () => {
    const save = makeSave({ clicks: 1 });
    expect(newlyUnlocked(save)).toContain("tap1");
    expect(newlyUnlocked(save)).not.toContain("tap100");
  });

  it("tidak mengulang pencapaian yang sudah dimiliki", () => {
    const save = makeSave({ clicks: 1, ach: ["tap1"] });
    expect(newlyUnlocked(save)).not.toContain("tap1");
  });

  it("membuka semua tier saat seluruh generator terisi", () => {
    const gens = Object.fromEntries(GENERATORS.map((generator) => [generator.id, 1]));
    expect(newlyUnlocked(makeSave({ gens }))).toContain("tiers");
  });
});
