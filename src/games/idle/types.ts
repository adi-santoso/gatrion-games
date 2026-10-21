export type BuyAmount = "1" | "10" | "max";

export interface Generator {
  id: string;
  name: string;
  base: number;
  rate: number;
}

export interface IdleSave {
  v: number;
  crystals: number;
  total: number;
  clicks: number;
  clickLevel: number;
  gens: Record<string, number>;
  ach: string[];
  buy: BuyAmount;
  startedAt: number;
  lastSeen: number;
  best: number;
}

export interface OfflineReport {
  gain: number;
  seconds: number;
}
