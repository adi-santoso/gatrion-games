import { formatNumber } from "../../../lib/format";
import {
  GENERATORS,
  bulkCost,
  isUnlocked,
  tierRate,
  unlockHint,
  wantedCount,
} from "../economy";
import type { IdleSave } from "../types";
import { InventoryPanel } from "./InventoryPanel";
import { UpgradesPanel } from "./UpgradesPanel";
import { WorldMapPanel } from "./WorldMapPanel";

interface Props {
  save: IdleSave;
  onBuy: (generatorId: string) => void;
  onUpgrade: (id: "gear" | "offline") => void;
  onMaterialUpgrade: (id: "wood" | "stone" | "herb") => void;
  onEnterZone: (generatorId: string) => void;
  onOpen: (panel: "mine" | "research" | "map" | "archive") => void;
}

export function IdleHomePanels({ save, onBuy, onUpgrade, onMaterialUpgrade, onEnterZone, onOpen }: Props) {
  return (
    <section className="idle-home-panels" aria-label="Ringkasan tambang">
      <article className="idle-home-panel idle-home-buildings">
        <HomePanelHeading title="Bangunan" action="Semua →" onAction={() => onOpen("mine")} />
        <HomeBuildings save={save} onBuy={onBuy} />
      </article>
      <article className="idle-home-panel idle-home-research">
        <HomePanelHeading title="Riset Teknologi" action="Detail →" onAction={() => onOpen("research")} />
        <UpgradesPanel save={save} onBuy={onUpgrade} />
      </article>
      <article className="idle-home-panel idle-home-map">
        <WorldMapPanel save={save} onEnter={onEnterZone} />
      </article>
      <article className="idle-home-panel idle-home-inventory">
        <HomePanelHeading title="Inventory" action="Detail →" onAction={() => onOpen("archive")} />
        <InventoryPanel save={save} onUpgrade={onMaterialUpgrade} />
      </article>
    </section>
  );
}

function HomePanelHeading({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="idle-home-panel-heading">
      <h2>{title}</h2>
      <button type="button" onClick={onAction}>{action}</button>
    </div>
  );
}

function HomeBuildings({ save, onBuy }: { save: IdleSave; onBuy: (generatorId: string) => void }) {
  const unlocked = GENERATORS.filter((generator) => isUnlocked(save, generator));
  const latest = unlocked.slice(-4);
  const next = GENERATORS.find((generator) => !isUnlocked(save, generator));
  const visible = unlocked.length < 4
    ? GENERATORS.slice(0, 4)
    : [...latest.slice(-3), ...(next ? [next] : [])];

  return (
    <div className="idle-home-building-grid">
      {visible.map((generator) => {
        const open = isUnlocked(save, generator);
        const owned = save.gens[generator.id] ?? 0;
        const quantity = open ? wantedCount(save, generator) : 0;
        const cost = bulkCost(generator, owned, quantity || 1);
        const affordable = open && quantity > 0 && cost <= save.crystals;
        return (
          <article className="idle-home-building-card" key={generator.id} data-home-gen={generator.id} data-gen={generator.id} data-unlocked={open ? "true" : "false"}>
            <div className="idle-home-building-art">
              <img src={`/icons/idle/${generator.id}.png`} alt="" width="42" height="42" />
              <span>{open ? `Lv.${owned}` : `Zona ${String(GENERATORS.indexOf(generator) + 1).padStart(2, "0")}`}</span>
            </div>
            <strong>{generator.name}</strong>
            <small>{open ? `${formatNumber(tierRate(save, generator))}/dtk` : unlockHint(save, generator)}</small>
            <button type="button" disabled={!affordable} onClick={() => onBuy(generator.id)}>
              {open ? `${affordable ? "Bangun" : "Kristal kurang"} · ${formatNumber(cost)} ✦` : "Terkunci"}
            </button>
          </article>
        );
      })}
    </div>
  );
}
