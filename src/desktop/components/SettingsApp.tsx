import { Switch } from "../../components/Switch";
import { useTheme, setTheme } from "../../lib/theme";
import { useDesktop } from "../context";
import type { DockSize } from "../types";

const DOCK_OPTIONS: Array<{ value: DockSize; label: string; hint: string }> = [
  { value: "sm", label: "Kecil", hint: "48 px" },
  { value: "md", label: "Sedang", hint: "56 px" },
  { value: "lg", label: "Besar", hint: "64 px" },
];

export function SettingsApp() {
  const theme = useTheme();
  const { prefs, setDockSize, setReduceMotion, resetLayout, closeAllWindows, minimizeAll, windowCount } =
    useDesktop();

  return (
    <div className="settings-app">
      <header className="settings-head">
        <h1>Pengaturan Sistem</h1>
        <p>Sesuaikan tampilan desktop, dock, dan perilaku jendela.</p>
      </header>

      <section className="settings-group" aria-labelledby="settings-appearance">
        <h2 id="settings-appearance">Tampilan</h2>
        <div className="settings-row">
          <div className="settings-copy">
            <strong>Mode warna</strong>
            <span>Berlaku untuk desktop dan kedua game.</span>
          </div>
          <div className="settings-theme" role="group" aria-label="Mode warna">
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <span className="settings-swatch" data-swatch="light" aria-hidden="true" />
              Terang
            </button>
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <span className="settings-swatch" data-swatch="dark" aria-hidden="true" />
              Gelap
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-copy">
            <strong>Kurangi animasi</strong>
            <span>Matikan transisi jendela, dock, dan Mission Control.</span>
          </div>
          <Switch
            checked={prefs.reduceMotion}
            onChange={setReduceMotion}
            label="Kurangi animasi"
          />
        </div>
      </section>

      <section className="settings-group" aria-labelledby="settings-dock">
        <h2 id="settings-dock">Dock</h2>
        <div className="settings-row">
          <div className="settings-copy">
            <strong>Ukuran ikon</strong>
            <span>Dock membesar saat kursor mendekat.</span>
          </div>
          <div className="settings-dock" role="group" aria-label="Ukuran ikon dock">
            {DOCK_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={prefs.dockSize === option.value}
                onClick={() => setDockSize(option.value)}
              >
                {option.label}
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="settings-windows">
        <h2 id="settings-windows">Jendela</h2>
        <div className="settings-row">
          <div className="settings-copy">
            <strong>{windowCount} jendela terbuka</strong>
            <span>Tata letak tersimpan otomatis di browser ini.</span>
          </div>
          <div className="settings-actions">
            <button type="button" onClick={resetLayout}>
              Atur ulang tata letak
            </button>
            <button type="button" onClick={minimizeAll} disabled={windowCount === 0}>
              Minimalkan semua
            </button>
            <button type="button" onClick={closeAllWindows} disabled={windowCount === 0}>
              Tutup semua
            </button>
          </div>
        </div>
      </section>

      <footer className="settings-foot">
        <span>gatrion games · desktop shell</span>
        <span>React · TypeScript · Vite</span>
      </footer>
    </div>
  );
}
