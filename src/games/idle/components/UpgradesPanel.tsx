import { formatNumber } from "../../../lib/format";
import { RUN_UPGRADES, runUpgradeCost } from "../economy";
import type { IdleSave, UpgradeId } from "../types";

interface Props {
  save: IdleSave;
  onBuy: (id: UpgradeId) => void;
}

export function UpgradesPanel({ save, onBuy }: Props) {
  return (
    <div id="research" className="research-grid">
      {RUN_UPGRADES.map((upgrade) => {
        const level = save.upg[upgrade.id];
        const maxed = level >= upgrade.max;
        const cost = runUpgradeCost(upgrade.id, level);
        const affordable = !maxed && cost <= save.crystals;
        const progress = Math.min(100, (level / upgrade.max) * 100);

        return (
          <article
            key={upgrade.id}
            className="research-card"
            data-upgrade-id={upgrade.id}
            data-maxed={maxed ? "true" : "false"}
          >
            <div className="research-card-heading">
              <span className="research-card-icon" aria-hidden="true">
                {upgrade.id === "gear" ? "⚙" : "◷"}
              </span>
              <div className="research-card-title">
                <span className="research-card-eyebrow">TEKNOLOGI PUTARAN</span>
                <h3>{upgrade.name}</h3>
              </div>
              <span className="research-card-level">Lv. {level}/{upgrade.max}</span>
            </div>
            <p className="research-card-effect">{upgrade.describe(level)}</p>
            <div className="research-card-progress" aria-label={`Riset level ${level} dari ${upgrade.max}`}>
              <span><i style={{ width: `${progress}%` }} /></span>
              <small>{level}/{upgrade.max}</small>
            </div>
            <div className="research-card-footer">
              <span className="research-card-scope">Reset saat lebur</span>
              <button
                type="button"
                data-upgrade={upgrade.id}
                data-affordable={affordable ? "true" : "false"}
                disabled={!affordable}
                onClick={() => onBuy(upgrade.id)}
              >
                {maxed ? "Maks" : `${formatNumber(cost)} ✦`}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
