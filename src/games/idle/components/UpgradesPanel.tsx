import { formatNumber } from "../../../lib/format";
import { RUN_UPGRADES, runUpgradeCost } from "../economy";
import type { IdleSave, UpgradeId } from "../types";

interface Props {
  save: IdleSave;
  onBuy: (id: UpgradeId) => void;
}

export function UpgradesPanel({ save, onBuy }: Props) {
  return (
    <div id="research" className="mt-1 divide-y divide-line">
      {RUN_UPGRADES.map((upgrade) => {
        const level = save.upg[upgrade.id];
        const maxed = level >= upgrade.max;
        const cost = runUpgradeCost(upgrade.id, level);
        const affordable = !maxed && cost <= save.crystals;

        return (
          <div key={upgrade.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{upgrade.name}</div>
              <div className="mono mt-0.5 text-[10px] text-muted">
                {upgrade.describe(level)} · Lv.{level}
              </div>
            </div>
            <button
              type="button"
              data-upgrade={upgrade.id}
              disabled={!affordable}
              onClick={() => onBuy(upgrade.id)}
              className="mono shrink-0 rounded-md border border-line px-2 py-1 text-[11px] transition hover:border-line-strong hover:bg-soft disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:border-line disabled:hover:bg-transparent"
            >
              {maxed ? "maks" : `${formatNumber(cost)} ✦`}
            </button>
          </div>
        );
      })}
    </div>
  );
}
