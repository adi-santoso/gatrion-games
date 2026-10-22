import type {
  BuyAmount,
  Generator,
  IdleSave,
  OfflineReport,
  PermId,
  PermUpgrades,
  RunUpgrades,
  UpgradeId,
} from "./types";

export const SAVE_VERSION = 3;

/** Setiap unit yang sama menaikkan harga 15%. */
export const GEN_GROWTH = 1.15;

/** Ambang jumlah unit yang melipatgandakan output tier tersebut. */
export const MILESTONES = [10, 25, 50, 100, 200] as const;
export const MILESTONE_FACTOR = 2;

/** Tier berikutnya terbuka setelah tier sebelumnya dimiliki sebanyak ini. */
export const TIER_UNLOCK_REQUIRED = 5;

export const CLICK_BASE = 40;
export const CLICK_GROWTH = 1.9;

export const OFFLINE_BASE_EFFICIENCY = 0.5;
export const OFFLINE_EFFICIENCY_PER_LEVEL = 0.1;
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const OFFLINE_CAP_PER_LEVEL = 2 * 3600;
export const OFFLINE_MIN_SECONDS = 60;

export const PRESTIGE_MIN_TOTAL = 1_000_000;

/** Pembelian otomatis dasar per tick mandor (sebelum upgrade inti). */
export const AUTO_BUYS_PER_TICK = 1;

/** Tier 1 sudah dimiliki sejak awal: tambang berjalan tanpa perlu klik. */
export const STARTER_TIER = "pick";
export const STARTER_OWNED = 1;

export const GENERATORS: Generator[] = [
  { id: "pick", name: "Pencungkil", base: 15, rate: 0.5 },
  { id: "drill", name: "Bor Tangan", base: 120, rate: 4 },
  { id: "rig", name: "Rig Otomatis", base: 1_400, rate: 28 },
  { id: "plant", name: "Pabrik Kristal", base: 16_000, rate: 180 },
  { id: "reactor", name: "Reaktor Plasma", base: 200_000, rate: 1_200 },
  { id: "singularity", name: "Singularitas", base: 2_500_000, rate: 9_000 },
  { id: "gate", name: "Gerbang Kuantum", base: 30_000_000, rate: 65_000 },
  { id: "dyson", name: "Cincin Dyson", base: 400_000_000, rate: 480_000 },
  { id: "city", name: "Kota Kristal", base: 6_000_000_000, rate: 3_400_000 },
  { id: "core", name: "Inti Galaksi", base: 90_000_000_000, rate: 24_000_000 },
];

// ---------------------------------------------------------------- upgrades

export interface RunUpgradeDef {
  id: UpgradeId;
  name: string;
  base: number;
  growth: number;
  max: number;
  describe: (level: number) => string;
}

export const GEAR_FACTOR = 1.25;

export const RUN_UPGRADES: RunUpgradeDef[] = [
  {
    id: "gear",
    name: "Gerbang gigi",
    base: 5_000,
    growth: 4,
    max: 20,
    describe: (level) =>
      level >= 20
        ? `produksi ×${Math.pow(GEAR_FACTOR, level).toFixed(1)} · maksimal`
        : `produksi ×${Math.pow(GEAR_FACTOR, level).toFixed(2)} → ×${Math.pow(GEAR_FACTOR, level + 1).toFixed(2)}`,
  },
  {
    id: "offline",
    name: "Jadwal jaga",
    base: 25_000,
    growth: 5,
    max: 5,
    describe: (level) =>
      level >= 5
        ? "progres offline 100% · maksimal"
        : `progres offline ${Math.round(offlineEfficiencyAt(level) * 100)}% → ${Math.round(
            offlineEfficiencyAt(level + 1) * 100,
          )}%`,
  },
];

export function runUpgradeCost(id: UpgradeId, level: number): number {
  const def = RUN_UPGRADES.find((upgrade) => upgrade.id === id);
  if (!def) return Number.POSITIVE_INFINITY;
  return Math.ceil(def.base * Math.pow(def.growth, level));
}

export interface CoreUpgradeDef {
  id: PermId;
  name: string;
  costs: number[];
  describe: (level: number) => string;
}

export const SPARK_FACTOR = 1.15;
export const CORE_BONUS = 0.02;

const HEADSTART: Array<Record<string, number>> = [
  { pick: 1 },
  { pick: 5, drill: 1 },
  { pick: 15, drill: 4, rig: 1 },
  { pick: 40, drill: 12, rig: 4 },
];

export const CORE_UPGRADES: CoreUpgradeDef[] = [
  {
    id: "spark",
    name: "Percikan inti",
    // harga berlipat dua tiap level, tanpa batas praktis selama 20 level
    costs: Array.from({ length: 20 }, (_, level) => 4 * 2 ** level),
    describe: (level) => `produksi ×${Math.pow(SPARK_FACTOR, level).toFixed(2)} permanen`,
  },
  {
    id: "headstart",
    name: "Modal awal",
    costs: [5, 15, 40],
    describe: (level) => {
      const gens = HEADSTART[Math.min(level, HEADSTART.length - 1)];
      const parts = GENERATORS.filter((generator) => (gens[generator.id] ?? 0) > 0).map(
        (generator) => `${gens[generator.id]} ${generator.name.toLowerCase()}`,
      );
      return `mulai dengan ${parts.join(" + ")}`;
    },
  },
  {
    id: "autobuy",
    name: "Mandor cepat",
    costs: [2, 6, 18, 50],
    describe: (level) =>
      level > 0
        ? `${AUTO_BUYS_PER_TICK + level} pembelian otomatis per 0,5 detik`
        : `${AUTO_BUYS_PER_TICK} pembelian otomatis per 0,5 detik`,
  },
  {
    id: "vault",
    name: "Gudang dalam",
    costs: [4, 10, 25],
    describe: (level) =>
      `batas offline ${offlineCapAt(level) / 3600} jam`,
  },
];

export function coreUpgradeCost(id: PermId, level: number): number | null {
  const def = CORE_UPGRADES.find((upgrade) => upgrade.id === id);
  if (!def) return null;
  const cost = def.costs[level];
  return cost === undefined ? null : cost;
}

export function startingGens(perm: PermUpgrades): Record<string, number> {
  const gens: Record<string, number> = {};
  for (const generator of GENERATORS) gens[generator.id] = 0;
  const bonus = HEADSTART[Math.min(Math.max(0, perm.headstart), HEADSTART.length - 1)];
  for (const [id, count] of Object.entries(bonus)) gens[id] = count;
  gens[STARTER_TIER] = Math.max(gens[STARTER_TIER] ?? 0, STARTER_OWNED);
  return gens;
}

// ---------------------------------------------------------------- multipliers

export function milestoneMultiplier(owned: number): number {
  let multiplier = 1;
  for (const threshold of MILESTONES) {
    if (owned >= threshold) multiplier *= MILESTONE_FACTOR;
  }
  return multiplier;
}

export function nextMilestone(owned: number): { at: number; multiplier: number } | null {
  for (const threshold of MILESTONES) {
    if (owned < threshold) return { at: threshold, multiplier: milestoneMultiplier(threshold) };
  }
  return null;
}

export function gearMultiplier(save: IdleSave): number {
  return Math.pow(GEAR_FACTOR, save.upg.gear);
}

export function sparkMultiplier(save: IdleSave): number {
  return Math.pow(SPARK_FACTOR, save.perm.spark);
}

export function coreMultiplier(save: IdleSave): number {
  return 1 + CORE_BONUS * save.cores;
}

/** Pengali yang berlaku untuk semua tier. */
export function globalMultiplier(save: IdleSave): number {
  return gearMultiplier(save) * sparkMultiplier(save) * coreMultiplier(save);
}

export function tierRate(save: IdleSave, generator: Generator): number {
  const owned = save.gens[generator.id] ?? 0;
  return owned * generator.rate * milestoneMultiplier(owned) * globalMultiplier(save);
}

export function production(save: IdleSave): number {
  return GENERATORS.reduce((sum, generator) => sum + tierRate(save, generator), 0);
}

// ---------------------------------------------------------------- unlocks & shop

export function generatorIndex(id: string): number {
  return GENERATORS.findIndex((generator) => generator.id === id);
}

export function isUnlocked(save: IdleSave, generator: Generator): boolean {
  const index = generatorIndex(generator.id);
  if (index <= 0) return true;
  const previous = GENERATORS[index - 1];
  return (save.gens[previous.id] ?? 0) >= TIER_UNLOCK_REQUIRED;
}

export function unlockHint(save: IdleSave, generator: Generator): string | null {
  if (isUnlocked(save, generator)) return null;
  const index = generatorIndex(generator.id);
  const previous = GENERATORS[index - 1];
  const owned = save.gens[previous.id] ?? 0;
  return `butuh ${TIER_UNLOCK_REQUIRED} ${previous.name} (${owned}/${TIER_UNLOCK_REQUIRED})`;
}

export function ownedTotal(save: IdleSave): number {
  return GENERATORS.reduce((sum, generator) => sum + (save.gens[generator.id] ?? 0), 0);
}

export function unitCost(generator: Generator, owned: number): number {
  return Math.ceil(generator.base * Math.pow(GEN_GROWTH, owned));
}

/** Harga total untuk membeli `quantity` unit berurutan (deret geometri). */
export function bulkCost(generator: Generator, owned: number, quantity: number): number {
  let total = 0;
  for (let i = 0; i < quantity; i++) total += unitCost(generator, owned + i);
  return total;
}

export function affordableCount(save: IdleSave, generator: Generator): number {
  const owned = save.gens[generator.id] ?? 0;
  let quantity = 0;
  let spend = 0;
  while (quantity < 500) {
    const next = unitCost(generator, owned + quantity);
    if (spend + next > save.crystals) break;
    spend += next;
    quantity += 1;
  }
  return quantity;
}

export function wantedCount(save: IdleSave, generator: Generator): number {
  if (save.buy === "max") return affordableCount(save, generator);
  return Number(save.buy) || 1;
}

// ---------------------------------------------------------------- klik manual (opsional)

export function clickUpgradeCost(level: number): number {
  return Math.ceil(CLICK_BASE * Math.pow(CLICK_GROWTH, level));
}

export function clickGain(save: IdleSave): number {
  return 1 + save.clickLevel * 3 + production(save) * 0.02;
}

// ---------------------------------------------------------------- prestise

export function coreGain(total: number): number {
  if (total < PRESTIGE_MIN_TOTAL) return 0;
  // 3 inti per pangkat 10 total, jadi satu putaran panjang tidak meledak
  return Math.floor(3 * (1 + Math.log10(total / PRESTIGE_MIN_TOTAL)));
}

export function canPrestige(save: IdleSave): boolean {
  return coreGain(save.total) > 0;
}

/** Putaran baru: kristal, tier, dan riset direset; inti & upgrade permanen disimpan. */
export function freshRun(save: IdleSave, now = Date.now()): IdleSave {
  return {
    v: SAVE_VERSION,
    crystals: 0,
    total: 0,
    allTime: Math.max(save.allTime, save.total),
    clicks: save.clicks,
    clickLevel: 0,
    gens: startingGens(save.perm),
    ach: save.ach,
    buy: save.buy,
    startedAt: now,
    lastSeen: now,
    best: save.best,
    cores: save.cores,
    prestiges: save.prestiges,
    upg: { gear: 0, offline: 0 },
    perm: save.perm,
    auto: save.auto,
    autoBuys: save.autoBuys,
  };
}

/** Lepaskan semua progres putaran ini menjadi inti permanen. */
export function prestige(save: IdleSave, now = Date.now()): IdleSave {
  const gain = coreGain(save.total);
  if (gain <= 0) return save;
  const next = freshRun(save, now);
  return {
    ...next,
    cores: save.cores + gain,
    prestiges: save.prestiges + 1,
  };
}

// ---------------------------------------------------------------- auto-beli

/** Berapa unit yang dibeli mandor setiap 0,5 detik. */
export function autoBuysPerTick(save: IdleSave): number {
  return AUTO_BUYS_PER_TICK + save.perm.autobuy;
}

/**
 * Riset otomatis: beli upgrade putaran termurah yang terjangkau dan belum maksimal.
 * Dijalankan sebelum pembelian generator supaya mandor tidak menghabiskan semua
 * kristal untuk tier dan membuat riset mustahil dibeli.
 */
export function autoUpgradeStep(save: IdleSave): IdleSave | null {
  if (!save.auto) return null;

  for (const upgrade of RUN_UPGRADES) {
    const level = save.upg[upgrade.id];
    if (level >= upgrade.max) continue;
    const cost = runUpgradeCost(upgrade.id, level);
    if (cost > save.crystals) continue;
    return {
      ...save,
      crystals: save.crystals - cost,
      upg: { ...save.upg, [upgrade.id]: level + 1 },
    };
  }

  return null;
}

/**
 * Satu langkah auto-beli: pilih tier terbuka dengan kenaikan laju per kristal
 * terbaik dan beli satu unit. Mengembalikan null kalau tidak ada yang dibeli.
 */
export function autoBuyStep(save: IdleSave): IdleSave | null {
  if (!save.auto) return null;

  let best: { id: string; cost: number; score: number } | null = null;

  for (const generator of GENERATORS) {
    if (!isUnlocked(save, generator)) continue;
    const owned = save.gens[generator.id] ?? 0;
    const cost = unitCost(generator, owned);
    if (cost > save.crystals) continue;

    const before = owned * milestoneMultiplier(owned);
    const after = (owned + 1) * milestoneMultiplier(owned + 1);
    const score = ((after - before) * generator.rate) / cost;
    if (!best || score > best.score) best = { id: generator.id, cost, score };
  }

  if (!best) return null;

  return {
    ...save,
    crystals: save.crystals - best.cost,
    gens: { ...save.gens, [best.id]: (save.gens[best.id] ?? 0) + 1 },
    autoBuys: save.autoBuys + 1,
  };
}

// ---------------------------------------------------------------- progres offline

export function offlineEfficiencyAt(level: number): number {
  return Math.min(1, OFFLINE_BASE_EFFICIENCY + OFFLINE_EFFICIENCY_PER_LEVEL * level);
}

export function offlineCapAt(vaultLevel: number): number {
  return OFFLINE_CAP_SECONDS + OFFLINE_CAP_PER_LEVEL * vaultLevel;
}

export function offlineEfficiency(save: IdleSave): number {
  return offlineEfficiencyAt(save.upg.offline);
}

export function offlineCapSeconds(save: IdleSave): number {
  return offlineCapAt(save.perm.vault);
}

/** Hitung progres saat tab ditutup (belum diterapkan ke save). */
export function offlineReport(save: IdleSave, now = Date.now()): OfflineReport {
  const capSeconds = offlineCapSeconds(save);
  const efficiency = offlineEfficiency(save);
  const seconds = Math.min(capSeconds, Math.max(0, (now - save.lastSeen) / 1000));
  if (seconds < OFFLINE_MIN_SECONDS) return { gain: 0, seconds, efficiency, capSeconds };
  return { gain: production(save) * seconds * efficiency, seconds, efficiency, capSeconds };
}

// ---------------------------------------------------------------- pencapaian

export interface Achievement {
  id: string;
  name: string;
  test: (save: IdleSave) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "online", name: "Tambang menyala", test: (s) => production(s) >= 1 },
  { id: "tap1", name: "Sentuhan pertama", test: (s) => s.clicks >= 1 },
  { id: "tap100", name: "Seratus ketukan", test: (s) => s.clicks >= 100 },
  { id: "first10", name: "Sepuluh pencungkil", test: (s) => (s.gens.pick ?? 0) >= 10 },
  {
    id: "tiers",
    name: "Semua tier terbuka",
    test: (s) => GENERATORS.every((generator) => isUnlocked(s, generator)),
  },
  {
    id: "milestone",
    name: "Milestone pertama",
    test: (s) => GENERATORS.some((generator) => (s.gens[generator.id] ?? 0) >= MILESTONES[0]),
  },
  { id: "cps50", name: "50 kristal/detik", test: (s) => production(s) >= 50 },
  { id: "cps5k", name: "5 ribu kristal/detik", test: (s) => production(s) >= 5_000 },
  { id: "cps1m", name: "Sejuta kristal/detik", test: (s) => production(s) >= 1_000_000 },
  { id: "total10k", name: "Total 10 ribu", test: (s) => s.total >= 10_000 },
  { id: "total1m", name: "Total sejuta", test: (s) => s.total >= 1_000_000 },
  { id: "total1b", name: "Total semiliar", test: (s) => s.allTime >= 1_000_000_000 },
  { id: "gear5", name: "Riset level 5", test: (s) => s.upg.gear >= 5 },
  { id: "prestige1", name: "Peleburan pertama", test: (s) => s.prestiges >= 1 },
  { id: "prestige10", name: "Sepuluh peleburan", test: (s) => s.prestiges >= 10 },
  { id: "cores100", name: "Seratus inti", test: (s) => s.cores >= 100 },
  { id: "autobuy", name: "Mandor cepat", test: (s) => s.perm.autobuy >= 1 },
  // "offline" dibuka khusus oleh alur progres offline
  { id: "offline", name: "Kembali dari jeda", test: () => false },
];

/** Kembalikan id pencapaian baru yang belum dimiliki. */
export function newlyUnlocked(save: IdleSave): string[] {
  return ACHIEVEMENTS.filter(
    (achievement) => !save.ach.includes(achievement.id) && achievement.test(save),
  ).map((achievement) => achievement.id);
}

// ---------------------------------------------------------------- save

export function defaultSave(now = Date.now()): IdleSave {
  const perm: PermUpgrades = { spark: 0, headstart: 0, autobuy: 0, vault: 0 };
  const upg: RunUpgrades = { gear: 0, offline: 0 };

  return {
    v: SAVE_VERSION,
    crystals: 0,
    total: 0,
    allTime: 0,
    clicks: 0,
    clickLevel: 0,
    gens: startingGens(perm),
    ach: [],
    buy: "1",
    startedAt: now,
    lastSeen: now,
    best: 0,
    cores: 0,
    prestiges: 0,
    upg,
    perm,
    auto: true,
    autoBuys: 0,
  };
}

export function sanitizeSave(raw: unknown, now = Date.now()): IdleSave {
  const base = defaultSave(now);
  if (typeof raw !== "object" || raw === null) return base;

  const source = raw as Record<string, unknown>;
  const number = (value: unknown, fallback = 0): number => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  const level = (value: unknown, max: number): number =>
    Math.min(max, Math.floor(number(value)));

  const gens: Record<string, number> = {};
  const rawGens = (typeof source.gens === "object" && source.gens !== null
    ? source.gens
    : {}) as Record<string, unknown>;
  for (const generator of GENERATORS) {
    gens[generator.id] = Math.floor(number(rawGens[generator.id]));
  }

  const rawPerm = (typeof source.perm === "object" && source.perm !== null
    ? source.perm
    : {}) as Record<string, unknown>;
  const perm: PermUpgrades = {
    spark: level(rawPerm.spark, CORE_UPGRADES[0].costs.length),
    headstart: level(rawPerm.headstart, HEADSTART.length - 1),
    autobuy: rawPerm.autobuy ? 1 : 0,
    vault: level(rawPerm.vault, CORE_UPGRADES[3].costs.length),
  };

  const rawUpg = (typeof source.upg === "object" && source.upg !== null
    ? source.upg
    : {}) as Record<string, unknown>;
  const upg: RunUpgrades = {
    gear: level(rawUpg.gear, RUN_UPGRADES[0].max),
    offline: level(rawUpg.offline, RUN_UPGRADES[1].max),
  };

  const starters = startingGens(perm);
  for (const [id, count] of Object.entries(starters)) {
    gens[id] = Math.max(gens[id] ?? 0, count);
  }

  const buy: BuyAmount =
    source.buy === "10" || source.buy === "max" ? source.buy : "1";
  const ach = Array.isArray(source.ach)
    ? source.ach.filter((id): id is string => typeof id === "string")
    : [];

  const total = number(source.total);

  return {
    v: SAVE_VERSION,
    crystals: number(source.crystals),
    total,
    allTime: Math.max(number(source.allTime), total),
    clicks: Math.floor(number(source.clicks)),
    clickLevel: Math.floor(number(source.clickLevel)),
    gens,
    ach: Array.from(new Set(ach)),
    buy,
    startedAt: number(source.startedAt, now) || now,
    lastSeen: number(source.lastSeen, now) || now,
    best: number(source.best),
    cores: Math.floor(number(source.cores)),
    prestiges: Math.floor(number(source.prestiges)),
    upg,
    perm,
    auto: source.auto !== false,
    autoBuys: Math.floor(number(source.autoBuys)),
  };
}
