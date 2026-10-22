import { formatNumber } from "../../../lib/format";
import {
  MATERIAL_BUILDINGS,
  MATERIAL_IDS,
  MATERIAL_UPGRADE_EFFECTS,
  MATERIAL_UPGRADE_MAX,
  MATERIAL_UPGRADE_NAMES,
  materialRates,
  materialUpgradeCost,
  production,
} from "../economy";
import type { IdleSave, MaterialId } from "../types";

interface Props {
  save: IdleSave;
  onUpgrade: (id: MaterialId) => void;
}

const MARKS: Record<MaterialId, string> = { wood: "♧", stone: "⬟", herb: "❧" };

export function InventoryPanel({ save, onUpgrade }: Props) {
  const rates = materialRates(save);
  const activeMaterials = MATERIAL_IDS.filter((id) => save.materialBuildings[id] > 0);

  return (
    <section className="inventory-overview" aria-labelledby="inventory-title">
      <div className="panel-head inventory-heading">
        <div>
          <span id="inventory-title" className="panel-title">Persediaan Tambang</span>
          <p>Saldo dan peningkatan memakai progres save saat ini.</p>
        </div>
      </div>

      <div className="inventory-resource-grid">
        <article className="inventory-resource-card" data-resource="crystals">
          <span className="inventory-resource-mark">✧</span>
          <div><strong>Kristal</strong><small>mata uang putaran · +{formatNumber(production(save))}/dtk</small></div>
          <b>{formatNumber(save.crystals)}</b>
        </article>
        <article className="inventory-resource-card" data-resource="cores">
          <span className="inventory-resource-mark">◈</span>
          <div><strong>Inti</strong><small>mata uang permanen · {save.prestiges} peleburan</small></div>
          <b>{formatNumber(save.cores)}</b>
        </article>
        {activeMaterials.map((id) => {
          const building = MATERIAL_BUILDINGS.find((item) => item.id === id)!;
          return (
            <article key={id} className="inventory-resource-card" data-resource={id}>
              <span className="inventory-resource-mark" aria-hidden="true">{MARKS[id]}</span>
              <div><strong>{building.materialName}</strong><small>produksi material · +{formatNumber(rates[id])}/dtk</small></div>
              <b>{formatNumber(save.materials[id])}</b>
            </article>
          );
        })}
      </div>

      <div className="inventory-material-section">
        <div className="inventory-subheading">
          <span className="panel-title">Peralatan Material</span>
          <span>{activeMaterials.length} sumber aktif</span>
        </div>
        {activeMaterials.length === 0 ? (
          <p className="inventory-empty-material">Bangun Kamp Penebang, Tambang Batu, atau Kebun Herbal untuk membuka material dan peningkatannya.</p>
        ) : (
          <div className="inventory-upgrade-grid">
            {activeMaterials.map((id) => <MaterialUpgradeCard key={id} id={id} save={save} onUpgrade={onUpgrade} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function MaterialUpgradeCard({ id, save, onUpgrade }: { id: MaterialId; save: IdleSave; onUpgrade: (id: MaterialId) => void }) {
  const level = save.materialUpgrades[id];
  const maxed = level >= MATERIAL_UPGRADE_MAX;
  const cost = materialUpgradeCost(id, level);
  const affordable = !maxed && save.materials[id] >= cost;
  const materialName = MATERIAL_BUILDINGS.find((building) => building.id === id)!.materialName;

  return (
    <article className="inventory-upgrade-card" data-material-upgrade={id}>
      <div className="inventory-upgrade-title">
        <strong>{MATERIAL_UPGRADE_NAMES[id]}</strong>
        <span>Lv. {level}/{MATERIAL_UPGRADE_MAX}</span>
      </div>
      <p>{MATERIAL_UPGRADE_EFFECTS[id]}</p>
      <button type="button" disabled={!affordable} onClick={() => onUpgrade(id)}>
        {maxed ? "Maks" : `Tingkatkan · ${formatNumber(cost)} ${materialName}`}
      </button>
    </article>
  );
}
