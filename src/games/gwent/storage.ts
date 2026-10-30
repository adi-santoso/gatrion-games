const RECORD_KEY = "gatrion.gwent.record.v1";

export interface GwentRecord {
  wins: number;
  losses: number;
  draws: number;
}

const EMPTY: GwentRecord = { wins: 0, losses: 0, draws: 0 };

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function loadRecord(): GwentRecord {
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<GwentRecord>;
    return { wins: count(parsed.wins), losses: count(parsed.losses), draws: count(parsed.draws) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveRecord(record: GwentRecord): void {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch {
    // mode privat: rekor hanya berlaku untuk sesi ini
  }
}
