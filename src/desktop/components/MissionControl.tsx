import type { AppDefinition } from "../apps";
import type { WindowState } from "../types";

interface Props {
  windows: WindowState[];
  focusedId: string | null;
  appById: (id: WindowState["appId"]) => AppDefinition;
  onSelect: (windowId: string) => void;
  onClose: () => void;
}

export function MissionControl({ windows, focusedId, appById, onSelect, onClose }: Props) {
  const visible = windows.filter((win) => !win.minimized).sort((a, b) => b.z - a.z);

  return (
    <div className="mac-mission" role="dialog" aria-modal="true" aria-label="Mission Control" onPointerDown={onClose}>
      <div className="mac-mission-inner" onPointerDown={(event) => event.stopPropagation()}>
        <header className="mac-mission-head">
          <h2>Mission Control</h2>
          <p>{visible.length} jendela · klik untuk fokus</p>
        </header>

        {visible.length === 0 ? (
          <p className="mac-mission-empty">Belum ada jendela terbuka.</p>
        ) : (
          <ul className="mac-mission-grid">
            {visible.map((win) => {
              const app = appById(win.appId);
              return (
                <li key={win.id}>
                  <button
                    type="button"
                    className="mac-mission-card"
                    data-focused={win.id === focusedId ? "true" : "false"}
                    onClick={() => onSelect(win.id)}
                    aria-label={`Fokuskan ${app.name}`}
                  >
                    <span className="mac-mission-screen" aria-hidden="true">
                      <span className="mac-mission-app-icon" data-app={app.id}>
                        {app.icon}
                      </span>
                    </span>
                    <span className="mac-mission-title">{app.name}</span>
                    <span className="mac-mission-meta">
                      {win.w} × {win.h}
                      {win.zoomed ? " · penuh" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="mac-mission-foot">tekan esc untuk keluar</footer>
      </div>
    </div>
  );
}
