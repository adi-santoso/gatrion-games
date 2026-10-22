import { useState } from "react";
import { formatNumber } from "../../../lib/format";
import {
  GENERATORS,
  isUnlocked,
  tierRate,
  unlockHint,
} from "../economy";
import type { IdleSave } from "../types";

const ROUTE = [
  [12, 76], [29, 59], [45, 75], [61, 53], [80, 68],
  [88, 37], [70, 25], [51, 34], [33, 19], [12, 34],
];

interface Props {
  save: IdleSave;
  onEnter: (generatorId: string) => void;
}

export function WorldMapPanel({ save, onEnter }: Props) {
  const lastUnlocked = [...GENERATORS].reverse().find((generator) => isUnlocked(save, generator)) ?? GENERATORS[0];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = GENERATORS.find((generator) => generator.id === selectedId) ?? lastUnlocked;
  const index = GENERATORS.findIndex((generator) => generator.id === selected.id);
  const unlocked = isUnlocked(save, selected);
  const owned = save.gens[selected.id] ?? 0;
  const rate = tierRate(save, selected);
  const path = ROUTE.map(([x, y]) => `${(x / 100) * 1000},${(y / 100) * 500}`).join(" ");

  return (
    <section id="world-map" className="world-map-panel" aria-label="Peta dunia tambang">
      <div className="panel-head world-map-heading">
        <div>
          <span className="panel-title">Peta Dunia</span>
          <p>{GENERATORS.filter((generator) => isUnlocked(save, generator)).length}/{GENERATORS.length} zona terbuka · progres mengikuti tier tambang</p>
        </div>
      </div>

      <div className="world-map-canvas" role="group" aria-label="Zona tambang berdasarkan tier generator">
        <svg className="world-map-route" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={path} />
        </svg>
        {GENERATORS.map((generator, zoneIndex) => {
          const [x, y] = ROUTE[zoneIndex];
          const open = isUnlocked(save, generator);
          const active = selected.id === generator.id;
          return (
            <button
              key={generator.id}
              type="button"
              className="world-map-zone"
              data-unlocked={open ? "true" : "false"}
              data-selected={active ? "true" : "false"}
              aria-pressed={active}
              aria-label={`Zona ${String(zoneIndex + 1).padStart(2, "0")}, ${generator.name}, ${open ? "terbuka" : "terkunci"}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => setSelectedId(generator.id)}
            >
              <span className="world-map-zone-marker">
                <img src={`/icons/idle/${generator.id}.png`} alt="" width="34" height="34" loading="lazy" />
                {!open && <i aria-hidden="true">⌑</i>}
              </span>
              <small>Zona {String(zoneIndex + 1).padStart(2, "0")}</small>
            </button>
          );
        })}
        <span className="world-map-caption">JALUR PENAMBANGAN</span>
      </div>

      <article className="world-map-detail" aria-live="polite">
        <div className="world-map-detail-icon">
          <img src={`/icons/idle/${selected.id}.png`} alt="" width="50" height="50" />
        </div>
        <div className="world-map-detail-copy">
          <span className="world-map-detail-kicker">ZONA {String(index + 1).padStart(2, "0")} · {unlocked ? "TERBUKA" : "TERKUNCI"}</span>
          <h3>{selected.name}</h3>
          <p>{unlocked ? `${owned} unit · +${formatNumber(rate)}/dtk` : unlockHint(save, selected)}</p>
        </div>
        <button type="button" disabled={!unlocked} onClick={() => onEnter(selected.id)}>
          {unlocked ? "Masuk tambang" : "Belum terbuka"}
        </button>
      </article>
    </section>
  );
}
