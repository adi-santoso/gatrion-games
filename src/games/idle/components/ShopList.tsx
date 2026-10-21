import { formatNumber } from "../../../lib/format";
import { GENERATORS, bulkCost, wantedCount } from "../economy";
import type { IdleSave } from "../types";

interface Props {
  save: IdleSave;
  onBuy: (generatorId: string) => void;
}

export function ShopList({ save, onBuy }: Props) {
  return (
    <div id="shop" className="mt-1 divide-y divide-line">
      {GENERATORS.map((generator, index) => {
        const wanted = wantedCount(save, generator);
        const quantity = wanted > 0 ? wanted : 1;
        const cost = bulkCost(generator, save.gens[generator.id] ?? 0, quantity);
        const affordable = wanted > 0 && cost <= save.crystals;

        return (
          <button
            key={generator.id}
            type="button"
            data-gen={generator.id}
            data-affordable={affordable ? "true" : "false"}
            className="shop-row flex w-full items-center gap-3 py-3 text-left disabled:cursor-not-allowed"
            disabled={!affordable}
            onClick={() => onBuy(generator.id)}
          >
            <span className="mono w-4 shrink-0 text-[10px] text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{generator.name}</span>
              <span className="mono mt-0.5 block text-[10px] text-muted">
                +{generator.rate}/dtk · x{save.gens[generator.id] ?? 0}
              </span>
            </span>
            <span
              data-role="cost"
              className="mono shrink-0 rounded-md border border-line px-2 py-1 text-[11px]"
            >
              {quantity > 1 ? `×${quantity} ` : ""}
              {formatNumber(cost)} ✦
            </span>
          </button>
        );
      })}
    </div>
  );
}
