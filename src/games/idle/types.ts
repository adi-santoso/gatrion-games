export type BuyAmount = "1" | "10" | "max";

export type UpgradeId = "gear" | "offline";

export type PermId = "spark" | "headstart" | "autobuy" | "vault";

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
}

export interface OfflineReport {
  gain: number;
  seconds: number;
  efficiency: number;
  capSeconds: number;
}
