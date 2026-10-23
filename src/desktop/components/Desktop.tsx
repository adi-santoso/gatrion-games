import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toggleTheme, useTheme } from "../../lib/theme";
import { APPS, appFromPath, getApp } from "../apps";
import { DesktopContext, type DesktopApi } from "../context";
import { MENU_BAR_HEIGHT } from "../geometry";
import type { AppId, OverlayKind } from "../types";
import { useDesktopPrefs } from "../usePrefs";
import { useWindowManager } from "../useWindowManager";
import { AboutDialog } from "./AboutDialog";
import { AppSwitcher } from "./AppSwitcher";
import { Dock } from "./Dock";
import { Launchpad } from "./Launchpad";
import { MenuBar } from "./MenuBar";
import { MissionControl } from "./MissionControl";
import { Spotlight, type SpotlightCommand } from "./Spotlight";
import { WindowFrame } from "./WindowFrame";

function useViewport() {
  const [size, setSize] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 800 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

interface SwitcherState {
  items: AppId[];
  index: number;
}

export function Desktop() {
  const viewport = useViewport();
  const bounds = useMemo(
    () => ({ width: viewport.width, height: viewport.height, top: MENU_BAR_HEIGHT }),
    [viewport.width, viewport.height],
  );

  const { prefs, setDockSize, setReduceMotion } = useDesktopPrefs();
  const theme = useTheme();
  const wm = useWindowManager({
    bounds,
    defaultApp: { appId: "gatrion", size: getApp("gatrion").size },
  });

  const [overlay, setOverlay] = useState<OverlayKind>("none");
  const [switcher, setSwitcher] = useState<SwitcherState | null>(null);

  const activeApp = wm.focusedAppId ? getApp(wm.focusedAppId) : getApp("gatrion");
  const visibleWindows = wm.windows.filter((win) => !win.minimized);

  // ---- deep link lama: /wordle, /idle, /settings membuka jendelanya.
  const location = useLocation();
  const navigate = useNavigate();
  const openRef = useRef(wm.open);
  openRef.current = wm.open;

  useEffect(() => {
    const appId = appFromPath(location.pathname);
    if (!appId) return;
    openRef.current(appId, getApp(appId).size);
    navigate("/", { replace: true });
  }, [location.pathname, navigate]);

  const openApp = useCallback(
    (appId: AppId) => {
      const app = getApp(appId);
      openRef.current(appId, app.size);
    },
    [],
  );

  const closeAllWindows = useCallback(() => {
    wm.windows.forEach((win) => wm.close(win.id));
  }, [wm.windows, wm.close]);

  const minimizeAllWindows = useCallback(() => {
    wm.windows.forEach((win) => wm.minimize(win.id));
  }, [wm.windows, wm.minimize]);

  const showAllWindows = useCallback(() => {
    wm.windows.forEach((win) => {
      if (win.minimized) wm.restore(win.id);
    });
    wm.bringAllToFront();
  }, [wm.windows, wm.restore, wm.bringAllToFront]);

  const switcherRef = useRef<SwitcherState | null>(null);
  switcherRef.current = switcher;

  const commitSwitcher = useCallback(() => {
    const current = switcherRef.current;
    setSwitcher(null);
    if (!current) return;
    const appId = current.items[current.index];
    if (!appId) return;
    openRef.current(appId, getApp(appId).size);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.metaKey && event.key === "Tab") {
        event.preventDefault();
        const running = wm.runningApps.length > 0 ? wm.runningApps : [activeApp.id];
        setSwitcher((previous) => {
          if (previous) {
            const step = event.shiftKey ? -1 : 1;
            return {
              ...previous,
              index: (previous.index + step + previous.items.length) % previous.items.length,
            };
          }
          return { items: running, index: running.length > 1 ? 1 : 0 };
        });
        return;
      }

      if (event.metaKey && (event.code === "Space" || key === "k")) {
        event.preventDefault();
        setOverlay((previous) => (previous === "spotlight" ? "none" : "spotlight"));
        return;
      }

      if (event.metaKey && event.key === "`") {
        event.preventDefault();
        wm.cycle(1);
        return;
      }

      if ((event.ctrlKey && event.key === "ArrowUp") || event.key === "F3") {
        event.preventDefault();
        setOverlay((previous) => (previous === "mission" ? "none" : "mission"));
        return;
      }

      if (event.key === "Escape") {
        if (switcherRef.current) {
          event.preventDefault();
          setSwitcher(null);
          return;
        }
        setOverlay((previous) => (previous === "none" ? previous : "none"));
        return;
      }

      if (!event.metaKey || event.altKey || overlay !== "none") return;

      if (key === "w" && wm.focusedId) {
        event.preventDefault();
        wm.close(wm.focusedId);
      } else if (key === "m" && wm.focusedId) {
        event.preventDefault();
        wm.minimize(wm.focusedId);
      } else if (key === "n") {
        event.preventDefault();
        wm.newWindow(activeApp.id, activeApp.size);
      } else if (key === "q") {
        event.preventDefault();
        wm.closeApp(activeApp.id);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Meta") commitSwitcher();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activeApp, commitSwitcher, overlay, wm]);

  const commands = useMemo<SpotlightCommand[]>(
    () => [
      {
        id: "theme",
        label: theme === "dark" ? "Mode terang" : "Mode gelap",
        hint: "Ganti tema desktop dan game",
        keywords: ["tema", "theme", "terang", "gelap", "mode", "warna"],
        run: () => toggleTheme(),
      },
      {
        id: "mission",
        label: "Mission Control",
        hint: "Lihat semua jendela terbuka",
        keywords: ["mission", "jendela", "window", "expose"],
        run: () => setOverlay("mission"),
      },
      {
        id: "layout",
        label: "Atur ulang tata letak",
        hint: "Susun ulang jendela",
        keywords: ["tata", "letak", "layout", "reset", "rapikan"],
        run: () => wm.resetLayout(),
      },
      {
        id: "close-all",
        label: "Tutup semua jendela",
        hint: "Bersihkan desktop",
        keywords: ["tutup", "close", "bersih"],
        run: () => closeAllWindows(),
      },
      {
        id: "settings",
        label: "Pengaturan Sistem",
        hint: "Tema, dock, animasi",
        keywords: ["pengaturan", "settings", "preferensi"],
        run: () => openApp("settings"),
      },
    ],
    [closeAllWindows, openApp, theme, wm],
  );

  const api = useMemo<DesktopApi>(
    () => ({
      prefs,
      setDockSize,
      setReduceMotion,
      resetLayout: wm.resetLayout,
      closeAllWindows,
      minimizeAll: minimizeAllWindows,
      openApp,
      openSpotlight: () => setOverlay("spotlight"),
      openMissionControl: () => setOverlay("mission"),
      windowCount: wm.windows.length,
    }),
    [closeAllWindows, minimizeAllWindows, openApp, prefs, setDockSize, setReduceMotion, wm.resetLayout, wm.windows.length],
  );

  return (
    <DesktopContext.Provider value={api}>
      <div
        className="mac-desktop"
        data-motion={prefs.reduceMotion ? "reduced" : "full"}
        data-overlay={overlay}
      >
        <div className="mac-wallpaper" aria-hidden="true">
          <span className="mac-wallpaper-haze" />
          <span className="mac-wallpaper-ridge" />
        </div>

        <MenuBar
          activeApp={activeApp}
          windows={wm.windows}
          focusedId={wm.focusedId}
          theme={theme}
          prefs={prefs}
          appById={getApp}
          onNewWindow={() => wm.newWindow(activeApp.id, activeApp.size)}
          onCloseWindow={() => wm.focusedId && wm.close(wm.focusedId)}
          onCloseAll={closeAllWindows}
          onMinimizeWindow={() => wm.focusedId && wm.minimize(wm.focusedId)}
          onToggleZoom={() => wm.focusedId && wm.toggleZoom(wm.focusedId)}
          onBringAll={wm.bringAllToFront}
          onShowAll={showAllWindows}
          onHideAll={minimizeAllWindows}
          onFocusWindow={(id) => wm.restore(id)}
          onOpenSpotlight={() => setOverlay("spotlight")}
          onOpenMissionControl={() => setOverlay("mission")}
          onAbout={() => setOverlay("about")}
          onOpenSettings={() => openApp("settings")}
          onMinimizeApp={() => wm.minimizeApp(activeApp.id)}
          onMinimizeOthers={() => wm.focusedId && wm.minimizeOthers(wm.focusedId)}
          onQuitApp={() => wm.closeApp(activeApp.id)}
          onResetLayout={wm.resetLayout}
          onSetDockSize={setDockSize}
          onSetReduceMotion={setReduceMotion}
        />

        <main className="mac-desktop-area" aria-label="Desktop">
          {visibleWindows.map((win) => (
            <WindowFrame
              key={win.id}
              win={win}
              app={getApp(win.appId)}
              bounds={bounds}
              focused={win.id === wm.focusedId}
              reduceMotion={prefs.reduceMotion}
              onFocus={wm.focus}
              onClose={wm.close}
              onMinimize={wm.minimize}
              onToggleZoom={wm.toggleZoom}
              onMove={wm.move}
              onResize={wm.resize}
            />
          ))}

          {visibleWindows.length === 0 && (
            <div className="mac-empty">
              <p className="mac-empty-title">Meja kerja kosong.</p>
              <p className="mac-empty-copy">
                Buka Launchpad untuk memilih aplikasi, atau tekan <kbd>⌘</kbd> <kbd>Space</kbd> untuk
                Spotlight.
              </p>
              <button type="button" onClick={() => setOverlay("launchpad")}>
                Buka Launchpad
              </button>
            </div>
          )}
        </main>

        <Dock
          apps={APPS.filter((app) => app.id !== "settings")}
          runningApps={wm.runningApps}
          focusedAppId={wm.focusedAppId}
          minimized={wm.minimizedWindows}
          dockSize={prefs.dockSize}
          appById={getApp}
          onLaunch={openApp}
          onRestore={wm.restore}
          onLaunchpad={() => setOverlay("launchpad")}
          onSettings={() => openApp("settings")}
        />

        {overlay === "launchpad" && (
          <Launchpad apps={APPS} onOpenApp={openApp} onClose={() => setOverlay("none")} />
        )}

        {overlay === "spotlight" && (
          <Spotlight
            apps={APPS}
            commands={commands}
            onOpenApp={openApp}
            onClose={() => setOverlay("none")}
          />
        )}

        {overlay === "mission" && (
          <MissionControl
            windows={wm.windows}
            focusedId={wm.focusedId}
            appById={getApp}
            onSelect={(id) => {
              wm.restore(id);
              setOverlay("none");
            }}
            onClose={() => setOverlay("none")}
          />
        )}

        {overlay === "about" && <AboutDialog onClose={() => setOverlay("none")} />}

        {switcher && (
          <AppSwitcher items={switcher.items.map(getApp)} index={switcher.index} />
        )}
      </div>
    </DesktopContext.Provider>
  );
}
