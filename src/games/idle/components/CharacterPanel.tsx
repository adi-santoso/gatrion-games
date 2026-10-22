import { AutoSection } from "./AutoSection";
import { formatNumber } from "../../../lib/format";
import { MATERIAL_BUILDINGS, RECRUITS } from "../economy";
import type { IdleSave, RecruitId } from "../types";

interface Props {
  save: IdleSave;
  onRecruit: (id: RecruitId) => void;
  onToggleAuto: (enabled: boolean) => void;
}

export function CharacterPanel({ save, onRecruit, onToggleAuto }: Props) {
  return (
    <section id="character-panel" aria-labelledby="character-panel-title">
      <div className="panel-head flex-wrap">
        <span id="character-panel-title" className="panel-title">Kru tambang</span>
        <span className="research-reset-badge">HILANG SAAT LEBUR</span>
      </div>
      <p className="px-3 pb-3 text-[11px] leading-relaxed text-muted">Rekrut spesialis dengan material. Efeknya membantu putaran ini dan kru akan berganti saat peleburan.</p>
      <div className="px-3 pb-3"><AutoSection save={save} onToggle={onToggleAuto} /></div>
      <div className="idle-crew-grid px-3 pb-3">
        {RECRUITS.map((recruit) => {
          const hired = save.crew[recruit.id];
          const costEntries = Object.entries(recruit.cost) as Array<[keyof typeof save.materials, number]>;
          const sourceAvailable = costEntries.every(([id]) => save.materialBuildings[id] > 0);
          const affordable = costEntries.every(([id, amount]) => save.materials[id] >= amount);
          const costLabel = costEntries.map(([id, amount]) => `${formatNumber(amount)} ${MATERIAL_BUILDINGS.find((item) => item.id === id)?.materialName ?? id}`).join(" · ");
          return (
            <article key={recruit.id} className="idle-crew-card" data-recruit={recruit.id}>
              <div className="idle-crew-role">{recruit.role}</div>
              <h3>{recruit.name}</h3>
              <p>{recruit.effect}</p>
              <div className="idle-crew-cost">Biaya: {costLabel}</div>
              <button
                type="button"
                className="idle-crew-action"
                disabled={hired || !sourceAvailable || !affordable}
                onClick={() => onRecruit(recruit.id)}
              >
                {hired ? "Sudah direkrut" : !sourceAvailable ? "Bangun sumber material" : affordable ? "Rekrut" : "Material belum cukup"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
