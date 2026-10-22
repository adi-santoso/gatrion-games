import { describe, expect, it } from "vitest";
import {
  CLICK_BASE,
  CORE_UPGRADES,
  GENERATORS,
  MILESTONE_FACTOR,
  MATERIAL_UPGRADE_MAX,
  OFFLINE_CAP_SECONDS,
  OFFLINE_MIN_SECONDS,
  PRESTIGE_MIN_TOTAL,
  RUN_UPGRADES,
  SAVE_VERSION,
  TIER_UNLOCK_REQUIRED,
  affordableCount,
  autoBuyStep,
  autoBuysPerTick,
  autoUpgradeStep,
  bulkCost,
  clickGain,
  clickUpgradeCost,
  coreGain,
  coreMultiplier,
  coreUpgradeCost,
  defaultSave,
  defaultDailyMissionState,
  ensureDailyMissionDate,
  materialBuildingCost,
  materialBuildingRate,
  materialUpgradeCost,
  globalMultiplier,
  isUnlocked,
  milestoneMultiplier,
  newlyUnlocked,
  offlineEfficiency,
  offlineReport,
  prestige,
  production,
  runUpgradeCost,
  sanitizeSave,
  startingGens,
  tierRate,
  unitCost,
  unlockHint,
  wantedCount,
} from "./economy";
import type { IdleSave } from "./types";

const pick = GENERATORS[0];
const drill = GENERATORS[1];

function makeSave(overrides: Partial<IdleSave> = {}): IdleSave {
  return { ...defaultSave(1000), ...overrides };
}

describe("default save", () => {
  it("langsung menambang tanpa klik", () => {
    const save = defaultSave(1000);
    expect(save.gens.pick).toBe(1);
    expect(production(save)).toBeGreaterThan(0);
    expect(save.auto).toBe(true);
    expect(save.v).toBe(SAVE_VERSION);
  });
});

describe("misi harian dan kru", () => {
  it("mereset misi pada tanggal lokal baru", () => {
    const firstDay = new Date(2026, 0, 1, 23, 59).getTime();
    const nextDay = new Date(2026, 0, 2, 0, 1).getTime();
    const save = makeSave({ dailyMissions: { date: "2026-01-01", progress: { crystals: 500, taps: 10, buildings: 3 }, claimed: ["taps"] } });
    const next = ensureDailyMissionDate(save, nextDay);
    expect(next.dailyMissions).toEqual(defaultDailyMissionState(nextDay));
    expect(ensureDailyMissionDate(save, firstDay)).toBe(save);
  });

  it("efek kru berlaku dan kru putaran hilang saat lebur", () => {
    const plain = makeSave();
    const crew = makeSave({ crew: { engineer: true, geologist: true, herbalist: true } });
    expect(autoBuysPerTick(crew)).toBe(autoBuysPerTick(plain) + 1);
    expect(globalMultiplier(crew)).toBeCloseTo(globalMultiplier(plain) * 1.1);
    expect(offlineEfficiency(crew)).toBe(offlineEfficiency(plain) + 0.1);
    expect(prestige(makeSave({ total: 1_000_000, crew: crew.crew })).crew).toEqual({ engineer: false, geologist: false, herbalist: false });
  });
});

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
    const save = makeSave({ crystals: bulkCost(pick, 0, 5), gens: { pick: 0 } });
    expect(affordableCount(save, pick)).toBe(5);
  });

  it("mode max mengikuti kristal yang ada", () => {
    const save = makeSave({ crystals: 100, buy: "max" });
    expect(wantedCount(save, pick)).toBe(affordableCount(save, pick));
  });
});

describe("milestone", () => {
  it("melipatgandakan output tiap ambang", () => {
    expect(milestoneMultiplier(0)).toBe(1);
    expect(milestoneMultiplier(9)).toBe(1);
    expect(milestoneMultiplier(10)).toBe(MILESTONE_FACTOR);
    expect(milestoneMultiplier(25)).toBe(MILESTONE_FACTOR ** 2);
    expect(milestoneMultiplier(200)).toBe(MILESTONE_FACTOR ** 5);
  });

  it("rate tier memakai milestone", () => {
    const save = makeSave({ gens: { pick: 20 } });
    expect(tierRate(save, pick)).toBeCloseTo(20 * 0.5 * 2);
  });
});

describe("pengali global", () => {
  it("riset dan inti menaikkan produksi semua tier", () => {
    const plain = makeSave({ gens: { pick: 10 } });
    const upgraded = makeSave({
      gens: { pick: 10 },
      upg: { gear: 2, offline: 0 },
      perm: { spark: 1, headstart: 0, autobuy: 0, vault: 0 },
      cores: 50,
    });

    expect(globalMultiplier(plain)).toBe(1);
    expect(globalMultiplier(upgraded)).toBeCloseTo(
      Math.pow(1.25, 2) * 1.15 * coreMultiplier(upgraded),
    );
    expect(production(upgraded)).toBeGreaterThan(production(plain) * 3);
  });
});

describe("klik manual (opsional)", () => {
  it("klik memberi bonus dari produksi", () => {
    const save = makeSave({ clickLevel: 2, gens: { pick: 20 } });
    expect(clickGain(save)).toBeCloseTo(1 + 2 * 3 + production(save) * 0.02);
  });

  it("harga upgrade klik tumbuh geometris", () => {
    expect(clickUpgradeCost(0)).toBe(CLICK_BASE);
    expect(clickUpgradeCost(1)).toBeGreaterThan(CLICK_BASE);
  });
});

describe("pembukaan tier", () => {
  it("tier pertama selalu terbuka, berikutnya butuh tier sebelumnya", () => {
    const save = makeSave();
    expect(isUnlocked(save, pick)).toBe(true);
    expect(isUnlocked(save, drill)).toBe(false);
    expect(unlockHint(save, drill)).toContain(`${TIER_UNLOCK_REQUIRED} Pencungkil`);

    const ready = makeSave({ gens: { pick: TIER_UNLOCK_REQUIRED } });
    expect(isUnlocked(ready, drill)).toBe(true);
    expect(unlockHint(ready, drill)).toBeNull();
  });
});

describe("riset", () => {
  it("harga riset tumbuh dan dibatasi level maksimum", () => {
    expect(runUpgradeCost("gear", 0)).toBe(RUN_UPGRADES[0].base);
    expect(runUpgradeCost("gear", 2)).toBe(RUN_UPGRADES[0].base * 16);
    expect(coreUpgradeCost("spark", 0)).toBe(CORE_UPGRADES[0].costs[0]);
    expect(coreUpgradeCost("spark", 1)).toBe(CORE_UPGRADES[0].costs[0] * 2);
    expect(coreUpgradeCost("autobuy", 0)).toBe(CORE_UPGRADES[2].costs[0]);
    expect(coreUpgradeCost("autobuy", CORE_UPGRADES[2].costs.length)).toBeNull();
  });
});

describe("auto-beli", () => {
  it("berjalan sejak awal tanpa upgrade inti", () => {
    const save = makeSave({ crystals: 1e6 });
    const next = autoBuyStep(save);
    expect(next).not.toBeNull();
    expect(next?.autoBuys).toBe(1);
  });

  it("membeli tier terbaik yang terjangkau", () => {
    const save = makeSave({ crystals: 1_000 });
    const next = autoBuyStep(save);
    expect(next).not.toBeNull();
    expect(next?.gens.pick).toBe(2);
    expect(next?.crystals).toBe(1_000 - unitCost(pick, 1));
    expect(next?.autoBuys).toBe(1);
  });

  it("diam saja kalau toggle dimatikan", () => {
    const save = makeSave({ crystals: 1_000, auto: false });
    expect(autoBuyStep(save)).toBeNull();
  });

  it("membeli riset lebih dulu kalau terjangkau", () => {
    const save = makeSave({ crystals: 6_000 });
    const upgraded = autoUpgradeStep(save);
    expect(upgraded?.upg.gear).toBe(1);
    expect(upgraded?.crystals).toBe(6_000 - runUpgradeCost("gear", 0));
    expect(upgraded?.gens.pick).toBe(save.gens.pick);
  });

  it("tidak membeli riset yang sudah maksimal", () => {
    const maxed = makeSave({
      crystals: 1e12,
      upg: { gear: RUN_UPGRADES[0].max, offline: RUN_UPGRADES[1].max },
    });
    expect(autoUpgradeStep(maxed)).toBeNull();
  });

  it("upgrade inti menambah pembelian per tick", () => {
    expect(autoBuysPerTick(makeSave())).toBe(1);
    expect(
      autoBuysPerTick(makeSave({ perm: { spark: 0, headstart: 0, autobuy: 3, vault: 0 } })),
    ).toBe(4);
  });
});

describe("prestise", () => {
  it("butuh total satu juta kristal dan naik perlahan", () => {
    expect(coreGain(PRESTIGE_MIN_TOTAL - 1)).toBe(0);
    expect(coreGain(PRESTIGE_MIN_TOTAL)).toBe(3);
    expect(coreGain(PRESTIGE_MIN_TOTAL * 10)).toBe(6);
    expect(coreGain(PRESTIGE_MIN_TOTAL * 100)).toBe(9);
    // satu putaran panjang tidak meledak jadi ribuan inti
    expect(coreGain(PRESTIGE_MIN_TOTAL * 1e9)).toBeLessThan(40);
  });

  it("mereset putaran tapi menyimpan inti dan upgrade permanen", () => {
    const before = makeSave({
      total: 4_000_000,
      crystals: 500_000,
      gens: { pick: 40, drill: 10 },
      upg: { gear: 3, offline: 2 },
      perm: { spark: 1, headstart: 1, autobuy: 1, vault: 1 },
      cores: 5,
      prestiges: 2,
      ach: ["tap1"],
      clicks: 12,
      materials: { wood: 100, stone: 20, herb: 5 },
      materialBuildings: { wood: 2, stone: 1, herb: 1 },
      materialUpgrades: { wood: 1, stone: 2, herb: 3 },
    });

    const after = prestige(before, 5000);
    expect(after.cores).toBe(5 + coreGain(4_000_000));
    expect(after.prestiges).toBe(3);
    expect(after.crystals).toBe(0);
    expect(after.total).toBe(0);
    expect(after.allTime).toBe(4_000_000);
    expect(after.upg).toEqual({ gear: 0, offline: 0 });
    expect(after.gens).toEqual(startingGens(before.perm));
    expect(after.materials).toEqual({ wood: 0, stone: 0, herb: 0 });
    expect(after.materialBuildings).toEqual({ wood: 0, stone: 0, herb: 0 });
    expect(after.materialUpgrades).toEqual({ wood: 0, stone: 0, herb: 0 });
    expect(after.perm).toEqual(before.perm);
    expect(after.ach).toEqual(["tap1"]);
    expect(after.clicks).toBe(12);
  });

  it("tidak melakukan apa pun kalau belum cukup", () => {
    const save = makeSave({ total: 900_000 });
    expect(prestige(save)).toBe(save);
  });

  it("modal awal memberi unit gratis di putaran baru", () => {
    expect(startingGens({ spark: 0, headstart: 0, autobuy: 0, vault: 0 }).pick).toBe(1);
    const gens = startingGens({ spark: 0, headstart: 3, autobuy: 0, vault: 0 });
    expect(gens.pick).toBe(40);
    expect(gens.rig).toBe(4);
  });
});

describe("progres offline", () => {
  it("memakai efisiensi dasar 50%", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0 });
    const report = offlineReport(save, 3_600_000);
    expect(report.seconds).toBe(3600);
    expect(report.efficiency).toBe(0.5);
    expect(report.gain).toBeCloseTo(production(save) * 3600 * 0.5);
  });

  it("riset jadwal jaga menaikkan efisiensi", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0, upg: { gear: 0, offline: 5 } });
    expect(offlineEfficiency(save)).toBe(1);
    expect(offlineReport(save, 3_600_000).gain).toBeCloseTo(production(save) * 3600);
  });

  it("gudang dalam memperpanjang batas waktu", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0, perm: { spark: 0, headstart: 0, autobuy: 0, vault: 2 } });
    const report = offlineReport(save, 24 * 3_600_000);
    expect(report.capSeconds).toBe(OFFLINE_CAP_SECONDS + 2 * 7200);
    expect(report.seconds).toBe(report.capSeconds);
  });

  it("tidak memberi apa pun untuk jeda di bawah semenit", () => {
    const save = makeSave({ gens: { pick: 20 }, lastSeen: 0 });
    expect(offlineReport(save, (OFFLINE_MIN_SECONDS - 1) * 1000).gain).toBe(0);
  });

  it("menghitung produksi material offline dan efek bekal herbal", () => {
    const save = makeSave({
      gens: { pick: 20 },
      materialBuildings: { wood: 2, stone: 1, herb: 0 },
      materialUpgrades: { wood: 0, stone: 0, herb: 4 },
      lastSeen: 0,
    });
    const report = offlineReport(save, 3_600_000);
    expect(report.efficiency).toBe(0.7);
    expect(report.materials.wood).toBeCloseTo(2 * 0.5 * 3600 * 0.7);
    expect(report.materials.stone).toBeCloseTo(0.2 * 3600 * 0.7);
    expect(report.materials.herb).toBe(0);
    expect(offlineEfficiency(makeSave({ upg: { gear: 0, offline: 5 }, materialUpgrades: { wood: 0, stone: 0, herb: MATERIAL_UPGRADE_MAX } }))).toBe(1);
  });
});

describe("ekonomi material", () => {
  it("menghasilkan material dan memberi peningkatan dengan sink nyata", () => {
    const save = makeSave({ materialBuildings: { wood: 2, stone: 0, herb: 0 } });
    expect(materialBuildingCost("wood", 0)).toBe(500);
    expect(materialBuildingRate(save, "wood")).toBe(1);
    expect(materialUpgradeCost("wood", 0)).toBe(10);
    expect(globalMultiplier(makeSave({ materialUpgrades: { wood: 2, stone: 0, herb: 0 } }))).toBeCloseTo(1.1);
    expect(clickGain(makeSave({ materialUpgrades: { wood: 0, stone: 2, herb: 0 } }))).toBeCloseTo(1.313);
  });
});

describe("sanitizeSave", () => {
  it("mengabaikan nilai rusak dan mengisi default", () => {
    const save = sanitizeSave(
      {
        crystals: -50,
        clicks: "12",
        gens: { pick: 3, unknown: 99 },
        buy: "banyak",
        ach: ["tap1", 5, "tap1"],
        upg: { gear: "x", offline: 99 },
        perm: { spark: -2, autobuy: true, vault: 99 },
      },
      5000,
    );

    expect(save.crystals).toBe(0);
    expect(save.clicks).toBe(12);
    expect(save.gens.pick).toBe(3);
    expect(save.gens.drill).toBe(0);
    expect(save.buy).toBe("1");
    expect(save.ach).toEqual(["tap1"]);
    expect(save.upg).toEqual({ gear: 0, offline: RUN_UPGRADES[1].max });
    expect(save.perm.autobuy).toBe(1);
    expect(save.perm.vault).toBe(CORE_UPGRADES[3].costs.length);
    expect(save.auto).toBe(true);
    expect(save.v).toBe(SAVE_VERSION);
  });

  it("memigrasikan save v2 tanpa kehilangan progres", () => {
    const save = sanitizeSave({
      v: 2,
      crystals: 2_500,
      total: 90_000,
      clicks: 40,
      clickLevel: 3,
      gens: { pick: 12, drill: 4 },
      ach: ["offline"],
      buy: "10",
      startedAt: 111,
      lastSeen: 222,
      best: 3_000,
    });

    expect(save.v).toBe(SAVE_VERSION);
    expect(save.crystals).toBe(2_500);
    expect(save.gens.pick).toBe(12);
    expect(save.clickLevel).toBe(3);
    expect(save.buy).toBe("10");
    expect(save.allTime).toBe(90_000);
    expect(save.cores).toBe(0);
    expect(save.upg).toEqual({ gear: 0, offline: 0 });
    expect(save.ach).toEqual(["offline"]);
  });

  it("memigrasikan save v3 dengan saldo material aman", () => {
    const save = sanitizeSave({ v: 3, crystals: 2_500, total: 90_000, gens: { pick: 12 } });
    expect(save.crystals).toBe(2_500);
    expect(save.gens.pick).toBe(12);
    expect(save.materials).toEqual({ wood: 0, stone: 0, herb: 0 });
    expect(save.materialBuildings).toEqual({ wood: 0, stone: 0, herb: 0 });
    expect(save.materialUpgrades).toEqual({ wood: 0, stone: 0, herb: 0 });
    expect(save.v).toBe(SAVE_VERSION);
  });

  it("memigrasikan save v4 sambil mempertahankan ekonomi material", () => {
    const save = sanitizeSave({
      v: 4,
      crystals: 700,
      materials: { wood: 31, stone: 7, herb: 2 },
      materialBuildings: { wood: 2, stone: 1, herb: 0 },
      materialUpgrades: { wood: 1, stone: 0, herb: 0 },
    }, 1234);
    expect(save.materials).toEqual({ wood: 31, stone: 7, herb: 2 });
    expect(save.materialBuildings).toEqual({ wood: 2, stone: 1, herb: 0 });
    expect(save.dailyMissions.date).toBe(defaultDailyMissionState(1234).date);
    expect(save.crew).toEqual({ engineer: false, geologist: false, herbalist: false });
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

  it("membuka milestone dan semua tier saat terpenuhi", () => {
    const gens = Object.fromEntries(GENERATORS.map((generator) => [generator.id, 10]));
    const unlocked = newlyUnlocked(makeSave({ gens }));
    expect(unlocked).toContain("milestone");
    expect(unlocked).toContain("tiers");
  });

  it("mencatat prestise dan mandor otomatis", () => {
    const save = makeSave({
      prestiges: 1,
      perm: { spark: 0, headstart: 0, autobuy: 1, vault: 0 },
    });
    const unlocked = newlyUnlocked(save);
    expect(unlocked).toContain("prestige1");
    expect(unlocked).toContain("autobuy");
    expect(unlocked).not.toContain("prestige10");
  });
});
