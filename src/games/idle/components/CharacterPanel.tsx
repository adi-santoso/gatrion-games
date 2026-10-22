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
      <div className="grid gap-2 px-3 pb-3 md:grid-cols-3">
        {RECRUITS.map((recruit) => {
          const hired = save.crew[recruit.id];
          const costEntries = Object.entries(recruit.cost) as Array<[keyof typeof save.materials, number]>;
          const sourceAvailable = costEntries.every(([id]) => save.materialBuildings[id] > 0);
          const affordable = costEntries.every(([id, amount]) => save.materials[id] >= amount);
          const costLabel = costEntries.map(([id, amount]) => `${formatNumber(amount)} ${MATERIAL_BUILDINGS.find((item) => item.id === id)?.materialName ?? id}`).join(" · ");
          return (
            <article key={recruit.id} className="rounded-xl border border-line bg-bg-soft p-3" data-recruit={recruit.id}>
              <div className="mono text-[9px] uppercase tracking-wider text-muted">{recruit.role}</div>
              <h3 className="mt-1 text-sm font-semibold">{recruit.name}</h3>
              <p className="mt-2 min-h-10 text-[11px] leading-relaxed text-muted">{recruit.effect}</p>
              <div className="mono mt-2 text-[9px] text-muted">Biaya: {costLabel}</div>
              <button
                type="button"
                className="mt-2 w-full rounded-md border border-line-strong px-2 py-1.5 text-[10px] text-ink transition hover:border-lime/50 disabled:cursor-not-allowed disabled:opacity-50"
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
