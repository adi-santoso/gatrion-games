import type { BuyAmount, Generator, IdleSave, OfflineReport } from "./types";

export const SAVE_VERSION = 2;
export const GEN_GROWTH = 1.15;
export const CLICK_BASE = 40;
export const CLICK_GROWTH = 1.9;
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const OFFLINE_EFFICIENCY = 0.5;
export const OFFLINE_MIN_SECONDS = 60;

export const GENERATORS: Generator[] = [
  { id: "pick", name: "Pencungkil", base: 15, rate: 0.5 },
  { id: "drill", name: "Bor Tangan", base: 120, rate: 4 },
  { id: "rig", name: "Rig Otomatis", base: 1400, rate: 28 },
  { id: "plant", name: "Pabrik Kristal", base: 16000, rate: 180 },
  { id: "reactor", name: "Reaktor Plasma", base: 200000, rate: 1200 },
  { id: "singularity", name: "Singularitas", base: 2500000, rate: 9000 },
];

export interface Achievement {
  id: string;
  name: string;
  test: (save: IdleSave) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "tap1", name: "Klik pertama", test: (s) => s.clicks >= 1 },
  { id: "tap100", name: "Seratus klik", test: (s) => s.clicks >= 100 },
  { id: "gen1", name: "Pegawai pertama", test: (s) => ownedTotal(s) >= 1 },
  { id: "pick10", name: "Sepuluh pencungkil", test: (s) => (s.gens.pick ?? 0) >= 10 },
  {
    id: "tiers",
    name: "Semua tier terisi",
    test: (s) => GENERATORS.every((g) => (s.gens[g.id] ?? 0) >= 1),
  },
  { id: "cps50", name: "50 kristal/detik", test: (s) => production(s) >= 50 },
  { id: "total10k", name: "Total 10 ribu", test: (s) => s.total >= 10000 },
  // "offline" dibuka khusus oleh alur progres offline
  { id: "offline", name: "Kembali dari jeda", test: () => false },
];

export function defaultSave(now = Date.now()): IdleSave {
  const gens: Record<string, number> = {};
  for (const generator of GENERATORS) gens[generator.id] = 0;

  return {
    v: SAVE_VERSION,
    crystals: 0,
    total: 0,
    clicks: 0,
    clickLevel: 0,
    gens,
    ach: [],
    buy: "1",
    startedAt: now,
    lastSeen: now,
    best: 0,
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

  const gens: Record<string, number> = {};
  const rawGens = (typeof source.gens === "object" && source.gens !== null
    ? source.gens
    : {}) as Record<string, unknown>;
  for (const generator of GENERATORS) {
    gens[generator.id] = Math.floor(number(rawGens[generator.id]));
  }

  const buy: BuyAmount =
    source.buy === "10" || source.buy === "max" ? source.buy : "1";
  const ach = Array.isArray(source.ach)
    ? source.ach.filter((id): id is string => typeof id === "string")
    : [];

  return {
    v: SAVE_VERSION,
    crystals: number(source.crystals),
    total: number(source.total),
    clicks: Math.floor(number(source.clicks)),
    clickLevel: Math.floor(number(source.clickLevel)),
    gens,
    ach: Array.from(new Set(ach)),
    buy,
    startedAt: number(source.startedAt, now) || now,
    lastSeen: number(source.lastSeen, now) || now,
    best: number(source.best),
  };
}

export function ownedTotal(save: IdleSave): number {
  return GENERATORS.reduce((sum, generator) => sum + (save.gens[generator.id] ?? 0), 0);
}

export function production(save: IdleSave): number {
  return GENERATORS.reduce(
    (sum, generator) => sum + (save.gens[generator.id] ?? 0) * generator.rate,
    0,
  );
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

export function clickUpgradeCost(level: number): number {
  return Math.ceil(CLICK_BASE * Math.pow(CLICK_GROWTH, level));
}

export function clickGain(save: IdleSave): number {
  return 1 + save.clickLevel * 3 + production(save) * 0.02;
}

/** Hitung progres saat tab ditutup (belum diterapkan ke save). */
export function offlineReport(save: IdleSave, now = Date.now()): OfflineReport {
  const seconds = Math.min(
    OFFLINE_CAP_SECONDS,
    Math.max(0, (now - save.lastSeen) / 1000),
  );
  if (seconds < OFFLINE_MIN_SECONDS) return { gain: 0, seconds };
  return { gain: production(save) * seconds * OFFLINE_EFFICIENCY, seconds };
}

/** Kembalikan id pencapaian baru yang belum dimiliki. */
export function newlyUnlocked(save: IdleSave): string[] {
  return ACHIEVEMENTS.filter(
    (achievement) => !save.ach.includes(achievement.id) && achievement.test(save),
  ).map((achievement) => achievement.id);
}
