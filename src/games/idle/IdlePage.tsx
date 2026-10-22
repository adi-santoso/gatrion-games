import { useState } from "react";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Shell } from "../../components/Shell";
import { Toast } from "../../components/Toast";
import { formatDuration, formatNumber } from "../../lib/format";
import { AchievementsList } from "./components/AchievementsList";
import { AutoSection } from "./components/AutoSection";
import { ClickPad } from "./components/ClickPad";
import { OfflineDialog } from "./components/OfflineDialog";
import { PrestigeDialog } from "./components/PrestigeDialog";
import { PrestigePanel } from "./components/PrestigePanel";
import { ShopList } from "./components/ShopList";
import { UpgradesPanel } from "./components/UpgradesPanel";
import {
  ACHIEVEMENTS,
  GENERATORS,
  clickGain,
  clickUpgradeCost,
  coreGain,
  isUnlocked,
  offlineCapSeconds,
  offlineEfficiency,
  production,
  unlockHint,
} from "./economy";
import { useIdleGame } from "./useIdleGame";
import type { BuyAmount, IdleSave } from "./types";

const BUY_OPTIONS: Array<{ value: BuyAmount; label: string }> = [
  { value: "1", label: "x1" },
  { value: "10", label: "x10" },
  { value: "max", label: "max" },
];

type TabId = "mine" | "research" | "prestige" | "archive";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "mine", label: "tambang" },
  { id: "research", label: "riset" },
  { id: "prestige", label: "lebur" },
  { id: "archive", label: "arsip" },
];

export function IdlePage() {
  const idle = useIdleGame();
  const { save } = idle;
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("mine");

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
    <Shell>
      <main className="pb-20">
        <div className="idle-cabinet">
          <div className="idle-top">
            <div className="flex items-baseline gap-2">
              <span className="mono text-[10px] uppercase tracking-[0.18em] text-ink">
                tambang kristal
              </span>
              <span className="mono text-[9px] text-muted">sektor 01</span>
            </div>

            <div className="idle-hud">
              <span className="idle-chip" data-tone="accent">
                <span aria-hidden="true">◈</span>
                <strong data-testid="cores">{formatNumber(save.cores)}</strong>
                <span>inti</span>
                <button
                  type="button"
                  className="chip-action"
                  data-action="prestige"
                  aria-label={canPrestige ? "Lebur putaran ini" : "Peleburan belum tersedia"}
                  disabled={!canPrestige}
                  onClick={() => setPrestigeOpen(true)}
                >
                  {canPrestige ? `+${formatNumber(pendingCores)}` : "lebur"}
                </button>
              </span>
              <span className="idle-chip">
                tier <strong>{unlockedTiers.length}</strong>/{GENERATORS.length}
              </span>
              <span className="idle-chip" data-tone={save.auto ? "live" : "idle"}>
                <span className="lamp" aria-hidden="true" />
                {save.auto ? "mandor aktif" : "mandor mati"}
              </span>
            </div>
          </div>

          <section className="idle-stage">
            <ClickPad gain={gain} tierName={topTier.name} onTap={idle.tap} />

            <div className="idle-score">
              <div className="flex items-baseline justify-between gap-3">
                <span className="panel-title">kristal</span>
                <span className="mono text-[10px] text-muted">
                  sesi {formatDuration(Date.now() - save.startedAt)}
                </span>
              </div>
              <div data-testid="crystals" className="display idle-score-value mt-1">
                {formatNumber(save.crystals)}
              </div>
              <div className="mono mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                <span data-testid="rate" className="text-lime">
                  +{formatNumber(rate)}/detik
                </span>
                <span className="text-muted/40">·</span>
                <span>menambang sendiri sejak detik pertama</span>
              </div>

              <DepthStrip save={save} />

              <div className="mono mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-muted">
                <span>
                  {nextTier
                    ? `berikutnya ${nextTier.name} · ${unlockHint(save, nextTier)}`
                    : "semua tier sudah terbuka"}
                </span>
                <span className="text-muted/70">ketuk inti = bonus, tidak wajib</span>
              </div>
            </div>
          </section>

          <div className="tab-bar" role="group" aria-label="Panel tambang">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tab-btn"
                aria-pressed={tab === item.id}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_264px]">
            <div className="min-w-0 py-1">
              {tab === "mine" && (
                <>
                  <div className="panel-head flex-wrap">
                    <span className="panel-title">generator · beli</span>
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
                </>
              )}

              {tab === "research" && (
                <>
                  <div className="panel-head">
                    <span className="panel-title">riset putaran</span>
                    <span className="mono text-[10px] text-muted">reset saat lebur</span>
                  </div>
                  <UpgradesPanel save={save} onBuy={idle.buyRunUpgrade} />
                  <p className="mono mx-3 mb-3 text-[10px] leading-relaxed text-muted/70">
                    mandor membeli riset lebih dulu, lalu generator. riset bertahan sampai kamu
                    melebur putaran ini.
                  </p>
                </>
              )}

              {tab === "prestige" && (
                <PrestigePanel save={save} onBuy={idle.buyCoreUpgrade} />
              )}

              {tab === "archive" && (
                <>
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
                </>
              )}
            </div>

            <aside className="space-y-3 border-t border-line px-3 py-3 lg:border-l lg:border-t-0">
              <AutoSection save={save} onToggle={idle.setAuto} />

              <p className="mono text-[10px] leading-relaxed text-muted/70">
                tersimpan tiap 3 detik · saat ditinggal tetap jalan{" "}
                {Math.round(offlineEfficiency(save) * 100)}% laju, maksimal{" "}
                {offlineCapSeconds(save) / 3600} jam
              </p>

              <div className="flex items-center justify-between gap-3">
                <span className="mono text-[9px] text-muted/70">{idle.saveStatus}</span>
                <button
                  type="button"
                  className="mono text-[10px] text-muted/60 transition hover:text-danger"
                  onClick={idle.reset}
                >
                  reset
                </button>
              </div>
            </aside>
          </div>
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
    </Shell>
  );
}

function DepthStrip({ save }: { save: IdleSave }) {
  return (
    <div className="depth">
      {GENERATORS.map((generator, index) => {
        const owned = save.gens[generator.id] ?? 0;
        const on = isUnlocked(save, generator);
        return (
          <span
            key={generator.id}
            className="depth-seg"
            data-on={on ? "true" : "false"}
            title={`${generator.name} · ${owned} unit`}
          >
            {owned > 0 ? owned : index + 1}
          </span>
        );
      })}
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
