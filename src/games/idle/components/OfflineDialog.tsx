import { useEffect, useRef } from "react";
import { formatDuration, formatNumber } from "../../../lib/format";
import type { OfflineReport } from "../types";

interface Props {
  report: OfflineReport | null;
  rate: number;
  onClose: () => void;
}

export function OfflineDialog({ report, rate, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!report) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [report, onClose]);

  if (!report) return null;

  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="offline-title">
        <h2 id="offline-title" className="display text-lg">
          Selamat kembali
        </h2>
        <p className="mono mt-2 text-[11px] leading-relaxed text-muted">
          Kamu pergi {formatDuration(report.seconds * 1000)} · laju tambang {formatNumber(rate)}/detik
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span data-testid="offline-gain" className="display text-3xl text-lime">
            +{formatNumber(report.gain)}
          </span>
          <span className="mono text-[11px] text-muted">kristal</span>
        </div>
        <p className="mono mt-3 text-[10px] leading-relaxed text-muted/70">
          Dihitung {Math.round(report.efficiency * 100)}% dari laju tambang, dibatasi{" "}
          {report.capSeconds / 3600} jam. Naikkan lewat riset dan gudang dalam. Tutup dialog untuk
          lanjut menambang.
        </p>
        <button
          ref={closeRef}
          type="button"
          className="mt-5 w-full rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-95"
          onClick={onClose}
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}
