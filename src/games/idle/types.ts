export type BuyAmount = "1" | "10" | "max";

export type UpgradeId = "gear" | "offline";

export type PermId = "spark" | "headstart" | "autobuy" | "vault";

export type MaterialId = "wood" | "stone" | "herb";

export type MaterialBag = Record<MaterialId, number>;

export interface Generator {
  id: string;
  name: string;
  base: number;
  rate: number;
}

export interface RunUpgrades {
  gear: number;
  offline: number;
}

export interface PermUpgrades {
  spark: number;
  headstart: number;
  autobuy: number;
  vault: number;
}

export interface IdleSave {
  v: number;
  crystals: number;
  /** total kristal dijalankan ini (direset saat prestise) */
  total: number;
  /** total kristal sepanjang semua putaran */
  allTime: number;
  clicks: number;
  clickLevel: number;
  gens: Record<string, number>;
  ach: string[];
  buy: BuyAmount;
  startedAt: number;
  lastSeen: number;
  best: number;
  cores: number;
  prestiges: number;
  upg: RunUpgrades;
  perm: PermUpgrades;
  auto: boolean;
  /** jumlah unit yang dibeli oleh mandor otomatis (statistik) */
  autoBuys: number;
  /** Saldo material putaran ini; seluruhnya direset saat peleburan. */
  materials: MaterialBag;
  /** Bangunan penghasil material dan upgrade pemakaian material. */
  materialBuildings: Record<MaterialId, number>;
  materialUpgrades: Record<MaterialId, number>;
}

export interface OfflineReport {
  gain: number;
  materials: MaterialBag;
  seconds: number;
  efficiency: number;
  capSeconds: number;
}
