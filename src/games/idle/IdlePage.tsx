import { useState } from "react";
import { Link } from "react-router-dom";
import { SegmentedControl } from "../../components/SegmentedControl";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Toast } from "../../components/Toast";
import { formatNumber } from "../../lib/format";
import { AchievementsList } from "./components/AchievementsList";
import { AutoSection } from "./components/AutoSection";
import { CharacterPanel } from "./components/CharacterPanel";
import { ClickPad } from "./components/ClickPad";
import { DailyMissionsPanel } from "./components/DailyMissionsPanel";
import { CoreGlyph, CrystalGlyph, FlaskGlyph } from "./components/Glyphs";
import { MaterialBuildingsPanel } from "./components/MaterialBuildingsPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { IdleHomePanels } from "./components/IdleHomePanels";
import { OfflineDialog } from "./components/OfflineDialog";
import { PrestigeDialog } from "./components/PrestigeDialog";
import { PrestigePanel } from "./components/PrestigePanel";
import { ShopList } from "./components/ShopList";
import { UpgradesPanel } from "./components/UpgradesPanel";
import { WorldMapPanel } from "./components/WorldMapPanel";
import {
  ACHIEVEMENTS,
  GENERATORS,
  MATERIAL_BUILDINGS,
  TIER_UNLOCK_REQUIRED,
  clickGain,
  clickUpgradeCost,
  coreGain,
  isUnlocked,
  offlineCapSeconds,
  offlineEfficiency,
  production,
} from "./economy";
import { revealElement } from "./scroll";
import { useIdleGame } from "./useIdleGame";
import type { BuyAmount, DailyMissionId, IdleSave } from "./types";

const BUY_OPTIONS: Array<{ value: BuyAmount; label: string }> = [
  { value: "1", label: "x1" },
  { value: "10", label: "x10" },
  { value: "max", label: "max" },
];

const MATERIAL_MARKS = { wood: "♧", stone: "⬟", herb: "❧" } as const;

type TabId = "home" | "mine" | "research" | "prestige" | "archive" | "map" | "character";
type DestinationId = "home" | "character" | "inventory" | "upgrade" | "map" | "settings";

const DESTINATIONS: Array<{
  id: Exclude<DestinationId, "settings">;
  label: string;
  icon: string;
}> = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "character", label: "Character", icon: "♙" },
  { id: "inventory", label: "Inventory", icon: "▣" },
  { id: "upgrade", label: "Upgrade", icon: "↟" },
  { id: "map", label: "Peta Dunia", icon: "⌖" },
];

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "mine", label: "tambang" },
  { id: "character", label: "kru" },
  { id: "research", label: "riset" },
  { id: "map", label: "peta" },
  { id: "prestige", label: "lebur" },
  { id: "archive", label: "arsip" },
];

export function IdlePage() {
  const idle = useIdleGame();
  const { save } = idle;
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("home");
  const [destination, setDestination] = useState<DestinationId>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const scrollTo = (targetId: string) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        revealElement(document.getElementById(targetId));
      });
    }
  };

  const navigateTo = (next: DestinationId) => {
    setDestination(next);
    if (next === "settings") {
      setSettingsOpen(true);
      return;
    }

    setSettingsOpen(false);
    if (next === "inventory") setTab("archive");
    if (next === "upgrade") setTab("research");
    if (next === "home") setTab("home");
    if (next === "character") setTab("character");
    if (next === "map") setTab("map");

    const targetId = {
      home: "idle-dashboard",
      character: "character-panel",
      inventory: "archive-panel",
      upgrade: "idle-panel",
      map: "world-map",
    }[next];
    scrollTo(targetId);
  };

  const setPanelTab = (next: TabId) => {
    setTab(next);
    setSettingsOpen(false);
    setDestination(next === "home" ? "home" : next === "archive" ? "inventory" : next === "mine" ? "home" : next === "map" ? "map" : next === "character" ? "character" : "upgrade");
  };

  const enterMapZone = (generatorId: string) => {
    setPanelTab("mine");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(`[data-gen="${generatorId}"]`);
        revealElement(target);
        target?.focus({ preventScroll: true });
      });
    }
  };

  const runQuickAction = (action: "build" | "upgrade" | "recruit") => {
    if (action === "build") {
      setPanelTab("mine");
      scrollTo("idle-panel");
    }
    if (action === "upgrade") navigateTo("upgrade");
    if (action === "recruit") navigateTo("character");
  };

  const rate = production(save);
  const gain = clickGain(save);
  const upgradeCost = clickUpgradeCost(save.clickLevel);
  const canUpgrade = save.crystals >= upgradeCost;
  const unlockedTiers = GENERATORS.filter((generator) => isUnlocked(save, generator));
  const topTier = unlockedTiers[unlockedTiers.length - 1] ?? GENERATORS[0];
  const nextTier = GENERATORS.find((generator) => !isUnlocked(save, generator)) ?? null;
  const pendingCores = coreGain(save.total);
  const canPrestige = pendingCores > 0;

  return (
    <div className="idle-layout">
      <aside className="idle-sidebar" aria-label="Navigasi Gatrion">
        <Link to="/" className="idle-brand">
          <span className="idle-brand-mark" aria-hidden="true">G</span>
          <span>
            <strong>GATRION</strong>
            <small>CRYSTAL MINE</small>
          </span>
        </Link>

        <nav className="idle-primary-nav" aria-label="Menu idle">
          {DESTINATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="idle-nav-item"
              data-active={destination === item.id ? "true" : "false"}
              aria-current={destination === item.id ? "page" : undefined}
              data-nav={item.id}
              onClick={() => navigateTo(item.id)}
            >
              <span className="idle-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="idle-nav-item"
            data-active={destination === "settings" ? "true" : "false"}
            aria-current={destination === "settings" ? "page" : undefined}
            aria-expanded={settingsOpen}
            aria-controls="idle-settings"
            data-nav="settings"
            onClick={() => navigateTo("settings")}
          >
            <span className="idle-nav-icon" aria-hidden="true">⚙</span>
            <span>Settings</span>
          </button>
        </nav>

        <section
          id="idle-settings"
          className="idle-settings-panel"
          aria-label="Pengaturan game"
          hidden={!settingsOpen}
        >
          <span className="idle-settings-title">Tema</span>
          <ThemeToggle />
        </section>

        <div className="idle-sidebar-links">
          <Link to="/">Semua game</Link>
          <Link to="/wordle">Wordle</Link>
        </div>
      </aside>

      <div className="idle-workspace">
        <main className="idle-main">
        <div id="idle-dashboard" className="idle-cabinet">
          <section className="idle-stage">
            <ClickPad
              crystals={save.crystals}
              rate={rate}
              gain={gain}
              tierName={topTier.name}
              sector={unlockedTiers.length}
              upgradeCost={upgradeCost}
              canUpgrade={canUpgrade}
              onUpgrade={idle.buyClickUpgrade}
              onTap={idle.tap}
            />

            <div className="idle-home-top">
              <div className="idle-player-progress">
                <span className="idle-player-avatar" aria-hidden="true">
                  <img src="/images/idle/miner-avatar.png" alt="" width="48" height="48" />
                </span>
                <span className="idle-player-copy">
                  <strong>Lv. {unlockedTiers.length} · PENAMBANG</strong>
                  <span className="idle-player-progress-track"><i style={{ width: `${Math.min(100, ((save.gens[topTier.id] ?? 0) / TIER_UNLOCK_REQUIRED) * 100)}%` }} /></span>
                  <small>{nextTier ? `${save.gens[topTier.id] ?? 0} / ${TIER_UNLOCK_REQUIRED} · ${nextTier.name}` : "Seluruh sektor terbuka"}</small>
                </span>
              </div>
              <div className="idle-hud">
                <span className="idle-chip" data-tone="accent">
                  <CrystalGlyph />
                  <strong data-testid="crystals"><span data-testid="hud-crystals">{formatNumber(save.crystals)}</span></strong>
                  <span>kristal</span>
                  <span data-testid="rate" className="mono text-lime">+{formatNumber(rate)}/dtk</span>
                </span>
                <span className="idle-chip" data-tone="accent">
                  <CoreGlyph />
                  <strong data-testid="cores">{formatNumber(save.cores)}</strong>
                  <span>inti</span>
                  <button type="button" className="chip-action" data-action="prestige" aria-label={canPrestige ? "Lebur putaran ini" : "Peleburan belum tersedia"} disabled={!canPrestige} onClick={() => setPrestigeOpen(true)}>
                    {canPrestige ? `+${formatNumber(pendingCores)}` : "lebur"}
                  </button>
                </span>
                {MATERIAL_BUILDINGS.filter((building) => save.materialBuildings[building.id] > 0).map((building) => (
                  <span key={building.id} className="idle-chip" data-resource={building.id}>
                    <span aria-hidden="true">{MATERIAL_MARKS[building.id]}</span>
                    <strong>{formatNumber(save.materials[building.id])}</strong>
                    <span>{building.materialName}</span>
                  </span>
                ))}
                <span className="idle-chip">tier <strong>{unlockedTiers.length}</strong>/{GENERATORS.length}</span>
                <span className="idle-chip" data-tone={save.auto ? "live" : "idle"}><span className="lamp" aria-hidden="true" />{save.auto ? "mandor aktif" : "mandor mati"}</span>
              </div>
            </div>

            <div className="idle-home-activity">
              <IdleUtilityRail
                save={save}
                rate={rate}
                canPrestige={canPrestige}
                saveStatus={idle.saveStatus}
                onToggleAuto={idle.setAuto}
                onClaimMission={idle.claimDailyMission}
                onQuickAction={runQuickAction}
                onResetRun={() => setPrestigeOpen(true)}
                onResetAll={idle.reset}
              />
            </div>
          </section>

          {tab === "home" ? (
            <IdleHomePanels
              save={save}
              onBuy={idle.buy}
              onUpgrade={idle.buyRunUpgrade}
              onMaterialUpgrade={idle.buyMaterialUpgrade}
              onEnterZone={enterMapZone}
              onOpen={setPanelTab}
            />
          ) : <>
          <div className="tab-bar" role="group" aria-label="Panel tambang">
            <button
              type="button"
              className="tab-btn"
              aria-label="Kembali ke overview Home"
              aria-pressed={false}
              onClick={() => setPanelTab("home")}
            >
              overview
            </button>
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tab-btn"
                aria-pressed={tab === item.id}
                onClick={() => setPanelTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div id="idle-panel" className="min-w-0 py-1">
              {tab === "mine" && (
                <>
                  <div className="panel-head flex-wrap">
                    <span className="panel-title">bangunan tambang · {GENERATORS.length} tier</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-action="click-upgrade"
                        disabled={!canUpgrade}
                        onClick={idle.buyClickUpgrade}
                        className="mono rounded-md border border-line px-2 py-1 text-[10px] text-ink transition hover:border-line-strong hover:bg-soft disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:border-line disabled:hover:bg-transparent"
                      >
                        tangan Lv.{save.clickLevel} · {formatNumber(upgradeCost)} ✦
                      </button>
                      <SegmentedControl
                        label="Jumlah pembelian"
                        value={save.buy}
                        options={BUY_OPTIONS}
                        onChange={idle.setBuy}
                      />
                    </div>
                  </div>
                  <ShopList save={save} onBuy={idle.buy} />
                  <MaterialBuildingsPanel save={save} onBuy={idle.buyMaterialBuilding} />
                </>
              )}

              {tab === "research" && (
                <>
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-1.5">
                      <FlaskGlyph />
                      riset putaran
                    </span>
                    <span className="research-reset-badge">HILANG SAAT LEBUR</span>
                  </div>
                  <UpgradesPanel save={save} onBuy={idle.buyRunUpgrade} />
                  <div className="research-run-note">
                    <span className="research-run-note-mark" aria-hidden="true">i</span>
                    <p>
                      Efek riset berlaku untuk putaran ini saja. Mandor memprioritaskan riset yang mampu
                      dibeli sebelum membeli generator; inti dan upgrade di panel Lebur bersifat permanen.
                    </p>
                  </div>
                </>
              )}

              {tab === "character" && (
                <CharacterPanel save={save} onRecruit={idle.recruit} onToggleAuto={idle.setAuto} />
              )}

              {tab === "prestige" && (
                <PrestigePanel save={save} onBuy={idle.buyCoreUpgrade} />
              )}

              {tab === "map" && (
                <WorldMapPanel save={save} onEnter={enterMapZone} />
              )}

              {tab === "archive" && (
                <section id="archive-panel" aria-label="Inventory dan arsip">
                  <InventoryPanel save={save} onUpgrade={idle.buyMaterialUpgrade} />
                  <div className="panel-head">
                    <span className="panel-title">arsip tambang</span>
                    <span className="mono text-[10px] text-muted">
                      {save.ach.length}/{ACHIEVEMENTS.length} lencana
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-3 pb-3 sm:grid-cols-4">
                    <StatTile label="total putaran" value={formatNumber(save.total)} />
                    <StatTile label="semua putaran" value={formatNumber(save.allTime)} />
                    <StatTile label="rekor kristal" value={formatNumber(save.best)} />
                    <StatTile label="ketukan" value={formatNumber(save.clicks)} />
                    <StatTile label="auto-beli" value={formatNumber(save.autoBuys)} />
                    <StatTile label="peleburan" value={formatNumber(save.prestiges)} />
                    <StatTile label="tier terbuka" value={`${unlockedTiers.length}/${GENERATORS.length}`} />
                    <StatTile
                      label="offline"
                      value={`${Math.round(offlineEfficiency(save) * 100)}% · ${offlineCapSeconds(save) / 3600} jam`}
                    />
                  </div>
                  <div className="border-t border-line px-3 pt-2">
                    <span className="panel-title">lencana</span>
                  </div>
                  <AchievementsList save={save} />
                </section>
              )}
          </div>
          </>}
        </div>
        </main>

        <Toast message={idle.toast} />
        <OfflineDialog report={idle.offline} rate={rate} onClose={idle.dismissOffline} />
        {prestigeOpen && (
          <PrestigeDialog
            gain={pendingCores}
            onClose={() => setPrestigeOpen(false)}
            onConfirm={() => {
              setPrestigeOpen(false);
              idle.runPrestige();
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-value">{value}</div>
      <div className="stat-tile-label">{label}</div>
    </div>
  );
}

type QuickActionId = "build" | "upgrade" | "recruit";

interface IdleUtilityRailProps {
  save: IdleSave;
  rate: number;
  canPrestige: boolean;
  saveStatus: string;
  onToggleAuto: (enabled: boolean) => void;
  onClaimMission: (id: DailyMissionId) => void;
  onQuickAction: (action: QuickActionId) => void;
  onResetRun: () => void;
  onResetAll: () => void;
}

function IdleUtilityRail({
  save,
  rate,
  canPrestige,
  saveStatus,
  onToggleAuto,
  onClaimMission,
  onQuickAction,
  onResetRun,
  onResetAll,
}: IdleUtilityRailProps) {
  return (
    <div className="idle-utility-column">
      <DailyMissionsPanel save={save} onClaim={onClaimMission} />
      <section className="idle-activity-panel" aria-labelledby="idle-activity-title">
        <div className="idle-utility-heading">
          <h2 id="idle-activity-title">Aktivitas Berjalan</h2>
          <span className="idle-live-indicator"><i aria-hidden="true" /> LIVE</span>
        </div>

        <div className="idle-activity-row">
          <span className="idle-activity-icon" aria-hidden="true"><CrystalGlyph /></span>
          <span className="idle-activity-copy">
            <strong>Penambangan Kristal</strong>
            <small>{rate > 0 ? "Produksi otomatis" : "Belum ada produksi"}</small>
          </span>
          <span className="idle-activity-rate">+{formatNumber(rate)}/dtk</span>
        </div>

        <AutoSection save={save} onToggle={onToggleAuto} />

        <p className="idle-activity-footnote">
          Offline: {Math.round(offlineEfficiency(save) * 100)}% laju · maksimal {offlineCapSeconds(save) / 3600} jam
        </p>
      </section>

      <section className="idle-quick-panel" aria-labelledby="idle-quick-title">
        <div className="idle-utility-heading">
          <h2 id="idle-quick-title">Quick Actions</h2>
        </div>
        <div className="idle-quick-grid">
          <button type="button" onClick={() => onQuickAction("build")}>
            <span aria-hidden="true">▧</span>
            <small>Bangun</small>
          </button>
          <button type="button" onClick={() => onQuickAction("upgrade")}>
            <span aria-hidden="true">↟</span>
            <small>Upgrade</small>
          </button>
          <button type="button" onClick={() => onQuickAction("recruit")}>
            <span aria-hidden="true">♙</span>
            <small>Rekrut</small>
          </button>
          <button
            type="button"
            disabled={!canPrestige}
            aria-label={canPrestige ? "Reset putaran melalui peleburan" : "Reset tersedia setelah total satu juta kristal"}
            title={canPrestige ? "Lebur putaran dan dapatkan inti permanen" : "Butuh total 1 juta kristal dalam satu putaran"}
            onClick={onResetRun}
          >
            <span aria-hidden="true">↻</span>
            <small>Reset</small>
          </button>
        </div>
        <p className="idle-quick-hint">Reset menjalankan peleburan dan meminta konfirmasi.</p>
      </section>

      <div className="idle-save-summary">
        <span className="mono text-[9px] text-muted/70">{saveStatus}</span>
        <details>
          <summary>Reset seluruh progres</summary>
          <button type="button" onClick={onResetAll}>Reset total</button>
        </details>
      </div>
    </div>
  );
}
