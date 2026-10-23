import { useEffect } from "react";
import type { AppDefinition } from "../apps";
import type { AppId } from "../types";

interface Props {
  apps: AppDefinition[];
  onOpenApp: (appId: AppId) => void;
  onClose: () => void;
}

export function Launchpad({ apps, onOpenApp, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="mac-launchpad" role="dialog" aria-modal="true" aria-label="Launchpad" onPointerDown={onClose}>
      <div className="mac-launchpad-inner" onPointerDown={(event) => event.stopPropagation()}>
        <ul className="mac-launchpad-grid">
          {apps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                className="mac-launchpad-app"
                onClick={() => {
                  onOpenApp(app.id);
                  onClose();
                }}
              >
                <span className="mac-launchpad-icon" data-app={app.id}>
                  {app.icon}
                </span>
                <span className="mac-launchpad-name">{app.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mac-launchpad-hint">klik di luar atau tekan esc untuk menutup</p>
      </div>
    </div>
  );
}
