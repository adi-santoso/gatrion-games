import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { AppDefinition } from "../apps";
import { resizeRect } from "../geometry";
import type { Bounds, WindowState } from "../types";
import { CloseGlyph, ExpandGlyph, MinusGlyph } from "./icons";

interface Props {
  win: WindowState;
  app: AppDefinition;
  bounds: Bounds;
  focused: boolean;
  reduceMotion: boolean;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onToggleZoom: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, rect: { x: number; y: number; w: number; h: number }) => void;
}

const HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;

export function WindowFrame({
  win,
  app,
  bounds,
  focused,
  reduceMotion,
  onFocus,
  onClose,
  onMinimize,
  onToggleZoom,
  onMove,
  onResize,
}: Props) {
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: { x: number; y: number };
  } | null>(null);
  const resize = useRef<{
    pointerId: number;
    dir: string;
    startX: number;
    startY: number;
    origin: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const [interacting, setInteracting] = useState(false);
  const [minimizing, setMinimizing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, [data-no-drag]")) return;
    onFocus(win.id);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: win.x, y: win.y },
    };
    setInteracting(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    onMove(
      win.id,
      current.origin.x + (event.clientX - current.startX),
      current.origin.y + (event.clientY - current.startY),
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    drag.current = null;
    setInteracting(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const startResize = (dir: string) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    onFocus(win.id);
    resize.current = {
      pointerId: event.pointerId,
      dir,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: win.x, y: win.y, w: win.w, h: win.h },
    };
    setInteracting(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveResize = (event: ReactPointerEvent<HTMLElement>) => {
    const current = resize.current;
    if (!current || current.pointerId !== event.pointerId) return;
    onResize(
      win.id,
      resizeRect(
        {
          dir: current.dir,
          start: current.origin,
          dx: event.clientX - current.startX,
          dy: event.clientY - current.startY,
        },
        bounds,
      ),
    );
  };

  const endResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (!resize.current) return;
    resize.current = null;
    setInteracting(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const requestMinimize = useCallback(() => {
    if (reduceMotion) {
      onMinimize(win.id);
      return;
    }
    setMinimizing(true);
    timer.current = window.setTimeout(() => {
      setMinimizing(false);
      onMinimize(win.id);
    }, 200);
  }, [onMinimize, reduceMotion, win.id]);

  return (
    <section
      className="mac-window"
      data-app={app.id}
      data-focused={focused ? "true" : "false"}
      data-interacting={interacting ? "true" : "false"}
      data-minimizing={minimizing ? "true" : "false"}
      data-zoomed={win.zoomed ? "true" : "false"}
      role="dialog"
      aria-label={app.name}
      aria-modal="false"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
      }}
      onPointerDownCapture={() => {
        if (!focused) onFocus(win.id);
      }}
    >
      <header
        className="mac-titlebar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onToggleZoom(win.id)}
      >
        <div className="mac-lights" data-no-drag="true">
          <button
            type="button"
            className="mac-light"
            data-light="close"
            aria-label={`Tutup ${app.name}`}
            title="Tutup"
            onClick={() => onClose(win.id)}
          >
            <CloseGlyph />
          </button>
          <button
            type="button"
            className="mac-light"
            data-light="minimize"
            aria-label={`Minimalkan ${app.name}`}
            title="Perkecil ke dock"
            onClick={requestMinimize}
          >
            <MinusGlyph />
          </button>
          <button
            type="button"
            className="mac-light"
            data-light="zoom"
            aria-label={`${win.zoomed ? "Kembalikan" : "Perbesar"} ${app.name}`}
            title={win.zoomed ? "Kembalikan ukuran" : "Perbesar jendela"}
            onClick={() => onToggleZoom(win.id)}
          >
            <ExpandGlyph />
          </button>
        </div>

        <h2 className="mac-window-title">{app.name}</h2>

        <span className="mac-titlebar-tail" aria-hidden="true" />
      </header>

      <div className="mac-window-body" data-fill={app.fill ? "true" : "false"}>
        {app.render({ focused })}
      </div>

      {HANDLES.map((dir) => (
        <span
          key={dir}
          className="mac-resize"
          data-dir={dir}
          onPointerDown={startResize(dir)}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          aria-hidden="true"
        />
      ))}
    </section>
  );
}
