import { useEffect } from "react";
import { GatrionGlyph } from "./icons";

interface Props {
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["⌘", "Space"], label: "Spotlight" },
  { keys: ["⌘", "Tab"], label: "Pindah aplikasi" },
  { keys: ["⌃", "↑"], label: "Mission Control" },
  { keys: ["⌘", "N"], label: "Jendela baru" },
  { keys: ["⌘", "W"], label: "Tutup jendela" },
  { keys: ["⌘", "M"], label: "Minimalkan" },
  { keys: ["⌘", "`"], label: "Jendela berikutnya" },
];

export function AboutDialog({ onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="mac-about-backdrop" role="presentation" onPointerDown={onClose}>
      <div
        className="mac-about"
        role="dialog"
        aria-modal="true"
        aria-label="Tentang Gatrion"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="mac-about-icon" aria-hidden="true">
          <GatrionGlyph />
        </span>
        <h2>Gatrion</h2>
        <p className="mac-about-version">desktop shell · v1.0</p>

        <p className="mac-about-copy">
          Dua game kecil di dalam desktop: Wordle dua bahasa dan idle tambang kristal. Semua progres
          tersimpan di browser ini tanpa akun.
        </p>

        <dl className="mac-about-specs">
          <div>
            <dt>Wordle</dt>
            <dd>14.170 kata Indonesia · 14.855 English</dd>
          </div>
          <div>
            <dt>Idle</dt>
            <dd>10 tier tambang · mandor otomatis</dd>
          </div>
          <div>
            <dt>Penyimpanan</dt>
            <dd>localStorage · tanpa server</dd>
          </div>
        </dl>

        <ul className="mac-about-shortcuts" aria-label="Pintasan papan ketik">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label}>
              <span>{shortcut.label}</span>
              <span className="mac-about-keys">
                {shortcut.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="mac-about-note">
          Sebagian pintasan ⌘ bisa dipakai browser lebih dulu (mis. ⌘W menutup tab). Menu di menu bar
          selalu bisa diklik.
        </p>

        <button type="button" className="mac-about-close" onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </div>
  );
}
