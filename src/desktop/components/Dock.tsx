import { useState } from "react";
import type { AppDefinition } from "../apps";
import type { AppId, DockSize, WindowState } from "../types";
import { LaunchpadGlyph } from "./icons";

interface Props {
  apps: AppDefinition[];
  runningApps: AppId[];
  focusedAppId: AppId | null;
  minimized: WindowState[];
  dockSize: DockSize;
  appById: (id: AppId) => AppDefinition;
  onLaunch: (appId: AppId) => void;
  onRestore: (windowId: string) => void;
  onLaunchpad: () => void;
  onSettings: () => void;
}

export function Dock({
  apps,
  runningApps,
  focusedAppId,
  minimized,
  dockSize,
  appById,
  onLaunch,
  onRestore,
  onLaunchpad,
  onSettings,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const scaleFor = (index: number): number => {
    if (hovered === null) return 1;
    const distance = Math.abs(index - hovered);
    if (distance === 0) return 1.3;
    if (distance === 1) return 1.16;
    if (distance === 2) return 1.06;
    return 1;
  };

  return (
    <nav className="mac-dock" data-size={dockSize} aria-label="Dock" onPointerLeave={() => setHovered(null)}>
      <button
        type="button"
        className="dock-item"
        style={{ ["--dock-scale" as string]: scaleFor(0) }}
        onPointerEnter={() => setHovered(0)}
        onClick={onLaunchpad}
        aria-label="Launchpad"
      >
        <span className="dock-icon" data-app="launchpad">
          <LaunchpadGlyph />
        </span>
        <span className="dock-tip" aria-hidden="true">
          Launchpad
        </span>
      </button>

      <span className="dock-separator" aria-hidden="true" />

      {apps.map((app, index) => {
        const dockIndex = index + 1;
        const running = runningApps.includes(app.id);
        return (
          <button
            key={app.id}
            type="button"
            className="dock-item"
            style={{ ["--dock-scale" as string]: scaleFor(dockIndex) }}
            onPointerEnter={() => setHovered(dockIndex)}
            onClick={() => onLaunch(app.id)}
            aria-label={app.name}
            aria-current={focusedAppId === app.id ? "true" : undefined}
            data-running={running ? "true" : "false"}
          >
            <span className="dock-icon" data-app={app.id}>
              {app.icon}
            </span>
            <span className="dock-tip" aria-hidden="true">
              {app.shortName}
            </span>
            {running && <span className="dock-dot" aria-hidden="true" />}
          </button>
        );
      })}

      <span className="dock-separator" aria-hidden="true" />

      <button
        type="button"
        className="dock-item"
        style={{ ["--dock-scale" as string]: scaleFor(apps.length + 1) }}
        onPointerEnter={() => setHovered(apps.length + 1)}
        onClick={onSettings}
        aria-label="Pengaturan Sistem"
      >
        <span className="dock-icon" data-app="settings">
          {appById("settings").icon}
        </span>
        <span className="dock-tip" aria-hidden="true">
          Pengaturan
        </span>
      </button>

      {minimized.length > 0 && (
        <>
          <span className="dock-separator" aria-hidden="true" />
          <div className="dock-windows" aria-label="Jendela yang diperkecil">
            {minimized.map((win) => (
              <button
                key={win.id}
                type="button"
                className="dock-window"
                onClick={() => onRestore(win.id)}
                aria-label={`Pulihkan ${appById(win.appId).name}`}
                title={`Pulihkan ${appById(win.appId).name}`}
              >
                <span className="dock-window-icon" aria-hidden="true">
                  {appById(win.appId).icon}
                </span>
                <span className="dock-window-label">{appById(win.appId).shortName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
