import { formatNumber } from "../../../lib/format";
import {
  GENERATORS,
  bulkCost,
  isUnlocked,
  milestoneMultiplier,
  nextMilestone,
  tierRate,
  unlockHint,
  wantedCount,
} from "../economy";
import type { IdleSave } from "../types";
import { LockGlyph } from "./Glyphs";

interface Props {
  save: IdleSave;
  onBuy: (generatorId: string) => void;
}

export function ShopList({ save, onBuy }: Props) {
  return (
    <div id="shop" className="tier-grid building-grid">
      {GENERATORS.map((generator, index) => {
        const unlocked = isUnlocked(save, generator);
        const owned = save.gens[generator.id] ?? 0;
        const wanted = unlocked ? wantedCount(save, generator) : 0;
        const quantity = wanted > 0 ? wanted : 1;
        const cost = bulkCost(generator, owned, quantity);
        const affordable = unlocked && wanted > 0 && cost <= save.crystals;
        const hint = unlockHint(save, generator);
        const factor = milestoneMultiplier(owned);
        const next = nextMilestone(owned);
        const progress = next ? Math.min(100, (owned / next.at) * 100) : 100;

        return (
          <button
            key={generator.id}
            type="button"
            data-gen={generator.id}
            data-affordable={affordable ? "true" : "false"}
            data-unlocked={unlocked ? "true" : "false"}
            className="tier-card building-card"
            disabled={!affordable}
            onClick={() => onBuy(generator.id)}
          >
            <span className="building-card-art">
              <span className="tier-ico" data-locked={unlocked ? "false" : "true"}>
                <img
                  className="tier-icon"
                  src={`/icons/idle/${generator.id}.png`}
                  alt=""
                  width={42}
                  height={42}
                  loading="lazy"
                  decoding="async"
                />
                {!unlocked && (
                  <span className="tier-lock">
                    <LockGlyph className="h-4 w-4" />
                  </span>
                )}
              </span>
              <span className="building-card-level">
                {unlocked ? `Lv. ${owned}` : `Tier ${String(index + 1).padStart(2, "0")}`}
              </span>
            </span>

            <span className="tier-body building-card-body">
              <span className="tier-head">
                <span className="tier-name">{unlocked ? generator.name : "Terkunci"}</span>
                {factor > 1 && (
                  <span data-role="milestone" className="tier-mult">
                    ×{factor}
                  </span>
                )}
              </span>

              <span className="tier-meta">
                {!unlocked ? (
                  hint
                ) : owned === 0 ? (
                  `per unit · +${formatNumber(generator.rate)}/dtk`
                ) : (
                  <>
                    <span className="tier-owned">{owned} unit</span> · +
                    {formatNumber(tierRate(save, generator))}/dtk
                  </>
                )}
              </span>

              {unlocked && (
                <span className="tier-foot building-card-foot">
                  <span className="tier-track">
                    <span style={{ width: `${Math.max(3, progress)}%` }} />
                  </span>
                  <span className="building-card-purchase">
                    <span className="building-card-action">{affordable ? "Bangun" : "Kristal kurang"}</span>
                    <span data-role="cost" className="tier-cost">
                      {quantity > 1 ? `×${quantity} ` : ""}
                      {formatNumber(cost)} ✦
                    </span>
                  </span>
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
