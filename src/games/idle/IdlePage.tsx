import { SegmentedControl } from "../../components/SegmentedControl";
import { Shell } from "../../components/Shell";
import { Toast } from "../../components/Toast";
import { formatDuration, formatNumber } from "../../lib/format";
import { AchievementsList } from "./components/AchievementsList";
import { ClickPad } from "./components/ClickPad";
import { OfflineDialog } from "./components/OfflineDialog";
import { ShopList } from "./components/ShopList";
import { clickGain, clickUpgradeCost, production } from "./economy";
import { useIdleGame } from "./useIdleGame";
import type { BuyAmount } from "./types";

const BUY_OPTIONS: Array<{ value: BuyAmount; label: string }> = [
  { value: "1", label: "x1" },
  { value: "10", label: "x10" },
  { value: "max", label: "max" },
];

export function IdlePage() {
  const idle = useIdleGame();
  const { save } = idle;

  const rate = production(save);
  const gain = clickGain(save);
  const upgradeCost = clickUpgradeCost(save.clickLevel);
  const canUpgrade = save.crystals >= upgradeCost;

  return (
    <Shell>
      <main className="grid gap-12 pb-20 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-14">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="display text-3xl">Idle tambang</h1>
              <p className="mono mt-1.5 text-[11px] text-muted">kristal · terus jalan</p>
            </div>
            <span className="mono rounded-full border border-line px-2.5 py-1 text-[10px] text-muted">
              auto-save
            </span>
          </div>

          <div className="mt-8 flex items-baseline gap-3">
            <span data-testid="crystals" className="display text-5xl tabular-nums sm:text-6xl">
              {formatNumber(save.crystals)}
            </span>
            <span className="mono text-[11px] text-muted">kristal</span>
          </div>
          <div className="mono mt-2 flex items-center gap-2 text-[11px] text-muted">
            <span>{formatNumber(rate)}/detik</span>
            <span className="text-muted/40">·</span>
            <span>+{formatNumber(gain)} per klik</span>
          </div>

          <ClickPad gain={gain} onTap={idle.tap} />

          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
            <Stat label="total" value={formatNumber(save.total)} />
            <Stat label="klik" value={formatNumber(save.clicks)} />
            <Stat label="rekor" value={formatNumber(save.best)} />
            <Stat label="sesi" value={formatDuration(Date.now() - save.startedAt)} />
          </div>

          <p className="mono mt-5 text-[10px] leading-relaxed text-muted/70">
            tersimpan tiap 3 detik · saat ditinggal tetap jalan 50% laju, maksimal 8 jam
          </p>

          <div className="mt-8 border-t border-line pt-5">
            <h2 className="mono text-[11px] text-muted">pencapaian</h2>
            <AchievementsList save={save} />
          </div>
        </section>

        <aside className="space-y-9">
          <div>
            <h2 className="mono border-b border-line pb-2 text-[11px] text-muted">upgrade klik</h2>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Tangan lebih cepat</div>
                <div className="mono mt-0.5 text-[10px] text-muted">
                  +3 kristal per klik · Lv.{save.clickLevel}
                </div>
              </div>
              <button
                type="button"
                disabled={!canUpgrade}
                onClick={idle.buyClickUpgrade}
                className="mono rounded-md border border-line px-3 py-1.5 text-[11px] text-ink transition hover:border-line-strong hover:bg-soft disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:border-line disabled:hover:bg-transparent"
              >
                {formatNumber(upgradeCost)} ✦
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between border-b border-line pb-2">
              <h2 className="mono text-[11px] text-muted">generator</h2>
              <SegmentedControl
                label="Jumlah pembelian"
                value={save.buy}
                options={BUY_OPTIONS}
                onChange={idle.setBuy}
              />
            </div>
            <ShopList save={save} onBuy={idle.buy} />
          </div>

          <div className="flex items-center justify-between">
            <span className="mono text-[10px] text-muted/70">{idle.saveStatus}</span>
            <button
              type="button"
              className="mono text-[10px] text-muted/60 transition hover:text-danger"
              onClick={idle.reset}
            >
              reset
            </button>
          </div>
        </aside>
      </main>

      <Toast message={idle.toast} />
      <OfflineDialog report={idle.offline} rate={rate} onClose={idle.dismissOffline} />
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-sm">{value}</div>
      <div className="mono mt-0.5 text-[10px] text-muted">{label}</div>
    </div>
  );
}
