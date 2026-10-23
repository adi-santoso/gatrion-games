import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cascadeRect, clampRect, zoomRect } from "./geometry";
import { loadWindows, saveWindows } from "./storage";
import type { AppId, Bounds, PersistedState, Rect, WindowSize, WindowState } from "./types";

let sequence = 0;

function nextId(): string {
  sequence += 1;
  return `win-${Date.now().toString(36)}-${sequence}`;
}

function topmost(windows: WindowState[]): WindowState | null {
  let best: WindowState | null = null;
  for (const win of windows) {
    if (win.minimized) continue;
    if (!best || win.z > best.z) best = win;
  }
  return best;
}

function normalize(state: PersistedState, bounds: Bounds): PersistedState {
  const windows = state.windows.map((win) => ({
    ...win,
    ...clampRect(win, bounds),
  }));
  const focused = windows.find((win) => win.id === state.focusedId && !win.minimized);
  return {
    windows,
    focusedId: focused?.id ?? topmost(windows)?.id ?? null,
    zTop: state.zTop,
  };
}

export interface WindowManagerOptions {
  bounds: Bounds;
  /** Dibuka saat belum ada tata letak tersimpan sama sekali. */
  defaultApp?: { appId: AppId; size: WindowSize };
}

export function useWindowManager({ bounds, defaultApp }: WindowManagerOptions) {
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const [state, setState] = useState<PersistedState>(() => {
    const stored = loadWindows();
    if (stored) return normalize(stored, bounds);
    if (!defaultApp) return { windows: [], focusedId: null, zTop: 0 };
    return {
      windows: [
        {
          ...cascadeRect(defaultApp.size, bounds, 0),
          id: nextId(),
          appId: defaultApp.appId,
          zoomed: false,
          minimized: false,
          restore: null,
          z: 1,
        },
      ],
      focusedId: null,
      zTop: 1,
    };
  });

  // Fokus awal harus menunjuk jendela yang benar-benar ada.
  const focused = useMemo(() => {
    const matching = state.windows.find((win) => win.id === state.focusedId && !win.minimized);
    return matching ?? topmost(state.windows);
  }, [state.focusedId, state.windows]);

  useEffect(() => {
    const timer = window.setTimeout(() => saveWindows(state), 250);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Menu bar dan dock memakai z-index 46–50; rapikan tumpukan sebelum menabraknya.
  useEffect(() => {
    if (state.zTop <= 30) return;
    setState((previous) => {
      const windows = [...previous.windows]
        .sort((a, b) => a.z - b.z)
        .map((win, index) => ({ ...win, z: index + 1 }));
      return { ...previous, windows, zTop: windows.length };
    });
  }, [state.zTop]);

  useEffect(() => {
    setState((previous) => {
      let changed = false;
      const windows = previous.windows.map((win) => {
        const fitted = clampRect(win, bounds);
        if (fitted.x !== win.x || fitted.y !== win.y || fitted.w !== win.w || fitted.h !== win.h) {
          changed = true;
          return { ...win, ...fitted };
        }
        return win;
      });
      return changed ? { ...previous, windows } : previous;
    });
  }, [bounds.height, bounds.top, bounds.width]);

  const addWindow = useCallback((appId: AppId, size: WindowSize, previous: PersistedState) => {
    const currentBounds = boundsRef.current;
    const openCount = previous.windows.filter((win) => !win.minimized).length;
    const z = previous.zTop + 1;
    const win: WindowState = {
      ...cascadeRect(size, currentBounds, openCount),
      id: nextId(),
      appId,
      zoomed: false,
      minimized: false,
      restore: null,
      z,
    };
    return { windows: [...previous.windows, win], focusedId: win.id, zTop: z };
  }, []);

  /** Klik ikon dock: fokuskan jendela aplikasi kalau sudah ada, kalau belum buka baru. */
  const open = useCallback((appId: AppId, size: WindowSize) => {
    setState((previous) => {
      const existing = previous.windows.find((win) => win.appId === appId);
      if (!existing) return addWindow(appId, size, previous);
      const z = previous.zTop + 1;
      const windows = previous.windows.map((win) =>
        win.id === existing.id ? { ...win, minimized: false, z } : win,
      );
      return { ...previous, windows, focusedId: existing.id, zTop: z };
    });
  }, [addWindow]);

  /** ⌘N: jendela baru untuk aplikasi yang sama. */
  const newWindow = useCallback(
    (appId: AppId, size: WindowSize) => {
      setState((previous) => addWindow(appId, size, previous));
    },
    [addWindow],
  );

  const focus = useCallback((id: string) => {
    setState((previous) => {
      const target = previous.windows.find((win) => win.id === id);
      if (!target) return previous;
      if (previous.focusedId === id && target.z === previous.zTop) return previous;
      const z = previous.zTop + 1;
      return {
        ...previous,
        focusedId: id,
        zTop: z,
        windows: previous.windows.map((win) =>
          win.id === id ? { ...win, minimized: false, z } : win,
        ),
      };
    });
  }, []);

  const close = useCallback((id: string) => {
    setState((previous) => {
      const windows = previous.windows.filter((win) => win.id !== id);
      const focusedId =
        previous.focusedId === id ? topmost(windows)?.id ?? null : previous.focusedId;
      return { ...previous, windows, focusedId };
    });
  }, []);

  const minimize = useCallback((id: string) => {
    setState((previous) => {
      const windows = previous.windows.map((win) =>
        win.id === id ? { ...win, minimized: true } : win,
      );
      const focusedId = previous.focusedId === id ? topmost(windows)?.id ?? null : previous.focusedId;
      return { ...previous, windows, focusedId };
    });
  }, []);

  const restore = useCallback((id: string) => {
    setState((previous) => {
      const z = previous.zTop + 1;
      return {
        ...previous,
        focusedId: id,
        zTop: z,
        windows: previous.windows.map((win) =>
          win.id === id ? { ...win, minimized: false, z } : win,
        ),
      };
    });
  }, []);

  const toggleZoom = useCallback((id: string) => {
    setState((previous) => {
      const currentBounds = boundsRef.current;
      const z = previous.zTop + 1;
      return {
        ...previous,
        focusedId: id,
        zTop: z,
        windows: previous.windows.map((win) => {
          if (win.id !== id) return win;
          if (win.zoomed) {
            const rect = clampRect(win.restore ?? win, currentBounds);
            return { ...win, ...rect, zoomed: false, restore: null, z };
          }
          return {
            ...win,
            ...zoomRect(currentBounds),
            zoomed: true,
            restore: { x: win.x, y: win.y, w: win.w, h: win.h },
            z,
          };
        }),
      };
    });
  }, []);

  const move = useCallback((id: string, x: number, y: number) => {
    setState((previous) => ({
      ...previous,
      windows: previous.windows.map((win) =>
        win.id === id
          ? { ...win, ...clampRect({ ...win, x, y }, boundsRef.current) }
          : win,
      ),
    }));
  }, []);

  const resize = useCallback((id: string, rect: Rect) => {
    setState((previous) => ({
      ...previous,
      windows: previous.windows.map((win) =>
        win.id === id ? { ...win, ...clampRect(rect, boundsRef.current) } : win,
      ),
    }));
  }, []);

  const closeApp = useCallback((appId: AppId) => {
    setState((previous) => {
      const windows = previous.windows.filter((win) => win.appId !== appId);
      const focusedId =
        previous.focusedId && windows.some((win) => win.id === previous.focusedId)
          ? previous.focusedId
          : topmost(windows)?.id ?? null;
      return { ...previous, windows, focusedId };
    });
  }, []);

  const minimizeApp = useCallback((appId: AppId) => {
    setState((previous) => {
      const windows = previous.windows.map((win) =>
        win.appId === appId ? { ...win, minimized: true } : win,
      );
      const focusedWindow = previous.focusedId
        ? windows.find((win) => win.id === previous.focusedId)
        : null;
      return {
        ...previous,
        windows,
        focusedId: focusedWindow && !focusedWindow.minimized ? focusedWindow.id : topmost(windows)?.id ?? null,
      };
    });
  }, []);

  const minimizeOthers = useCallback((id: string) => {
    setState((previous) => ({
      ...previous,
      windows: previous.windows.map((win) =>
        win.id === id ? win : { ...win, minimized: true },
      ),
      focusedId: id,
    }));
  }, []);

  const bringAllToFront = useCallback(() => {
    setState((previous) => {
      if (previous.windows.length === 0) return previous;
      let z = previous.zTop;
      const ordered = [...previous.windows].sort((a, b) => a.z - b.z);
      const windows = ordered.map((win) => {
        z += 1;
        return { ...win, z };
      });
      return { ...previous, windows, zTop: z, focusedId: topmost(windows)?.id ?? null };
    });
  }, []);

  const cycle = useCallback((direction: 1 | -1) => {
    setState((previous) => {
      const visible = previous.windows
        .filter((win) => !win.minimized)
        .sort((a, b) => b.z - a.z);
      if (visible.length < 2) return previous;
      const index = visible.findIndex((win) => win.id === previous.focusedId);
      const next = visible[(index + direction + visible.length) % visible.length];
      const z = previous.zTop + 1;
      return {
        ...previous,
        focusedId: next.id,
        zTop: z,
        windows: previous.windows.map((win) => (win.id === next.id ? { ...win, z } : win)),
      };
    });
  }, []);

  const resetLayout = useCallback(() => {
    setState((previous) => {
      const currentBounds = boundsRef.current;
      let z = previous.zTop;
      const ordered = [...previous.windows].sort((a, b) => a.z - b.z);
      const windows = ordered.map((win, index) => {
        z += 1;
        const size = { w: Math.min(win.w, currentBounds.width - 20), h: win.h };
        return {
          ...win,
          ...cascadeRect(size, currentBounds, index),
          zoomed: false,
          restore: null,
          minimized: false,
          z,
        };
      });
      return { ...previous, windows, zTop: z, focusedId: topmost(windows)?.id ?? null };
    });
  }, []);

  const runningApps = useMemo(() => {
    const ordered = [...state.windows].sort((a, b) => b.z - a.z);
    const seen: AppId[] = [];
    for (const win of ordered) {
      if (!seen.includes(win.appId)) seen.push(win.appId);
    }
    return seen;
  }, [state.windows]);

  return {
    windows: state.windows,
    focusedWindow: focused,
    focusedId: focused?.id ?? null,
    focusedAppId: focused?.appId ?? null,
    runningApps,
    minimizedWindows: state.windows.filter((win) => win.minimized),
    open,
    newWindow,
    focus,
    close,
    minimize,
    restore,
    toggleZoom,
    move,
    resize,
    closeApp,
    minimizeApp,
    minimizeOthers,
    bringAllToFront,
    cycle,
    resetLayout,
  };
}

export type WindowManager = ReturnType<typeof useWindowManager>;
