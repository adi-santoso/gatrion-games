import { formatNumber } from "../../../lib/format";
import {
  CORE_UPGRADES,
  coreMultiplier,
  coreUpgradeCost,
} from "../economy";
import type { IdleSave, PermId } from "../types";

interface Props {
  save: IdleSave;
  onBuy: (id: PermId) => void;
}

export function PrestigePanel({ save, onBuy }: Props) {
  return (
    <section id="prestige" className="pb-2">
      <div className="panel-head">
        <span className="panel-title">inti permanen</span>
        <span className="mono text-[10px] text-muted">{save.prestiges} putaran</span>
      </div>

      <p className="mono mx-3 mb-2 text-[10px] leading-relaxed text-muted">
        produksi ×{coreMultiplier(save).toFixed(2)} dari inti · inti tidak hilang saat lebur.
        Peleburan dimulai dari tombol inti di bagian atas kabinet.
      </p>

      <div className="divide-y divide-line border-t border-line">
        {CORE_UPGRADES.map((upgrade) => {
          const level = save.perm[upgrade.id];
          const cost = coreUpgradeCost(upgrade.id, level);
          const maxed = cost === null;
          const affordable = !maxed && cost <= save.cores;

          return (
            <div key={upgrade.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{upgrade.name}</div>
                <div className="mono mt-0.5 text-[10px] leading-relaxed text-muted">
                  {upgrade.describe(level)}
                </div>
              </div>
              <button
                type="button"
                data-core={upgrade.id}
                disabled={!affordable}
                onClick={() => onBuy(upgrade.id)}
                className="mono shrink-0 rounded-md border border-line px-2 py-1 text-[11px] transition hover:border-line-strong hover:bg-soft disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:border-line disabled:hover:bg-transparent"
              >
                {maxed ? "maks" : `${cost} ◈`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mono mx-3 mt-2 text-[10px] leading-relaxed text-muted/70">
        putaran ini {formatNumber(save.total)} kristal · butuh 1 juta untuk lebur pertama
      </p>
    </section>
  );
}
