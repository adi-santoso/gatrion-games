import { formatNumber } from "../../../lib/format";

interface Props {
  gain: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function PrestigeDialog({ gain, onConfirm, onClose }: Props) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prestige-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="prestige-title" className="display text-lg">
          Lebur putaran ini?
        </h2>
        <p className="mono mt-2 text-[11px] leading-relaxed text-muted">
          Semua kristal, generator, dan riset direset. Kamu mendapat inti permanen yang
          menaikkan produksi selamanya.
        </p>

        <div className="mt-4 flex items-baseline gap-2">
          <span data-testid="prestige-gain" className="display text-3xl text-lime">
            +{formatNumber(gain)}
          </span>
          <span className="mono text-[11px] text-muted">inti</span>
        </div>

        <ul className="mono mt-4 space-y-1 text-[10px] text-muted/80">
          <li>direset · kristal, generator, riset, level klik</li>
          <li>disimpan · inti, upgrade permanen, pencapaian, statistik</li>
        </ul>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="mono flex-1 rounded-lg border border-line px-4 py-2 text-sm transition hover:border-line-strong hover:bg-soft"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            data-action="prestige-confirm"
            className="flex-1 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-95"
            onClick={onConfirm}
          >
            Lebur sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
