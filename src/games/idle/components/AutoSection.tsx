import { Switch } from "../../../components/Switch";
import { formatNumber } from "../../../lib/format";
import { autoBuysPerTick } from "../economy";
import type { IdleSave } from "../types";
import { HelmetGlyph } from "./Glyphs";

interface Props {
  save: IdleSave;
  onToggle: (enabled: boolean) => void;
}

export function AutoSection({ save, onToggle }: Props) {
  const steps = autoBuysPerTick(save);

  return (
    <section id="auto" className="rounded-xl border border-line bg-bg-soft px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${save.auto ? "bg-lime" : "bg-line-strong"}`}
          />
          <HelmetGlyph className="text-muted" />
          <h2 className="text-[13px] font-medium">Mandor otomatis</h2>
        </div>
        <Switch label="Auto-beli generator" checked={save.auto} onChange={onToggle} />
      </div>
      <p className="mono mt-1.5 text-[10px] leading-relaxed text-muted">
        {save.auto
          ? `prioritas riset, lalu generator · hingga ${steps} pembelian/0,5 dtk · ${formatNumber(save.autoBuys)} unit dibeli`
          : "mandor nonaktif · pembelian manual; produksi idle tetap berjalan"}
      </p>
    </section>
  );
}
