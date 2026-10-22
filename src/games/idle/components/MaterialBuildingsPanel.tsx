import { formatNumber } from "../../../lib/format";
import {
  MATERIAL_BUILDINGS,
  materialBuildingBulkCost,
  materialBuildingRate,
  materialBuildingAffordableCount,
} from "../economy";
import type { IdleSave, MaterialId } from "../types";

interface Props {
  save: IdleSave;
  onBuy: (id: MaterialId) => void;
}

const MATERIAL_MARKS: Record<MaterialId, string> = { wood: "♧", stone: "⬟", herb: "❧" };

export function MaterialBuildingsPanel({ save, onBuy }: Props) {
  return (
    <section className="material-buildings" aria-labelledby="material-buildings-title">
      <div className="panel-head material-buildings-heading">
        <div>
          <span id="material-buildings-title" className="panel-title">Bangunan Material</span>
          <p>Sumber tambahan; tidak mengubah produksi generator kristal.</p>
        </div>
      </div>
      <div className="material-building-grid">
        {MATERIAL_BUILDINGS.map((building) => {
          const owned = save.materialBuildings[building.id];
          const wanted = save.buy === "max"
            ? materialBuildingAffordableCount(save, building.id)
            : Number(save.buy);
          const quantity = wanted > 0 ? wanted : 1;
          const cost = materialBuildingBulkCost(building.id, owned, quantity);
          const affordable = wanted > 0 && cost <= save.crystals;
          const rate = materialBuildingRate(save, building.id);
          return (
            <button
              key={building.id}
              type="button"
              className="material-building-card"
              data-material-building={building.id}
              data-affordable={affordable ? "true" : "false"}
              disabled={!affordable}
              onClick={() => onBuy(building.id)}
            >
              <span className="material-building-art" aria-hidden="true">{MATERIAL_MARKS[building.id]}</span>
              <span className="material-building-name">{building.name}</span>
              <span className="material-building-meta">{owned} unit · +{formatNumber(rate)} {building.materialName}/dtk</span>
              <span className="material-building-purchase">
                <span>{affordable ? "Bangun" : "Kristal kurang"}</span>
                <b>{quantity > 1 ? `×${quantity} ` : ""}{formatNumber(cost)} ✦</b>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
