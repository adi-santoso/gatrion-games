import { useEffect, useRef } from "react";
import { Switch } from "../../../components/Switch";
import type { Dictionary, Lang } from "../types";

interface Props {
  open: boolean;
  hard: boolean;
  lang: Lang;
  dictionary: Dictionary | null;
  onClose: () => void;
  onToggleHard: (value: boolean) => void;
  onResetStats: () => void;
}

export function SettingsDialog({
  open,
  hard,
  lang,
  dictionary,
  onClose,
  onToggleHard,
  onResetStats,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const answers = dictionary?.meta.answers ?? dictionary?.answers.length ?? 0;
  const guesses = dictionary?.meta.guesses ?? dictionary?.guesses.length ?? 0;

  return (
    <div
      className="dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="display text-lg">
            Pengaturan
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="mono text-[11px] text-muted transition hover:text-ink"
            onClick={onClose}
          >
            tutup
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
          <div>
            <div className="text-sm font-medium">Hard mode</div>
            <p className="mono mt-0.5 text-[10px] leading-relaxed text-muted">
              Petunjuk yang sudah terbuka wajib dipakai lagi.
            </p>
          </div>
          <Switch checked={hard} onChange={onToggleHard} label="Hard mode" />
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="text-sm font-medium">Hapus statistik</div>
          <p className="mono mt-0.5 text-[10px] leading-relaxed text-muted">
            Semua jumlah main, streak, dan distribusi kedua bahasa.
          </p>
          <button
            type="button"
            className="mono mt-3 rounded-md border border-line px-3 py-1.5 text-[11px] text-muted transition hover:border-danger/60 hover:text-danger"
            onClick={() => {
              if (window.confirm("Hapus semua statistik Wordle (kedua bahasa)?")) {
                onResetStats();
                onClose();
              }
            }}
          >
            hapus statistik
          </button>
        </div>

        <p className="mono mt-5 border-t border-line pt-4 text-[10px] leading-relaxed text-muted/60">
          Kamus {lang}: {answers.toLocaleString("id-ID")} jawaban dari{" "}
          {guesses.toLocaleString("id-ID")} kata 5 huruf. Jawaban dipilih dari kata paling umum;
          tebakan divalidasi terhadap seluruh kamus.
        </p>
      </div>
    </div>
  );
}
