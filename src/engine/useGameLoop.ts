import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { fitCanvas } from "./canvas";
import { consumeFrame } from "./loop";

/**
 * Loop render untuk game canvas 2D.
 *
 * - Update berjalan dengan langkah tetap (`stepMs`) sementara render mengikuti
 *   refresh rate layar; delta antar-frame di-clamp oleh `consumeFrame`, jadi
 *   tab yang lama tidur tidak meledak menjadi ratusan tick.
 * - Kanvas mengikuti ukuran container dan `devicePixelRatio` (ResizeObserver,
 *   fallback ke `window.resize` di lingkungan tanpa ResizeObserver).
 * - Saat `active` false (jendela tidak fokus / diminimalkan) loop berhenti
 *   total: tidak ada render, tidak ada update, tidak ada baterai terpakai.
 * - Cleanup membatalkan frame, observer, dan listener.
 */
export interface GameLoopOptions {
  /** Biasanya `focused` dari WindowFrame. */
  active: boolean;
  /** Panjang satu langkah update dalam milidetik. */
  stepMs: number;
  update: (stepMs: number) => void;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export function useGameLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { active, stepMs, update, render }: GameLoopOptions,
): void {
  // Callback disimpan di ref supaya loop tidak dipasang ulang setiap render.
  const updateRef = useRef(update);
  const renderRef = useRef(render);
  const stepRef = useRef(stepMs);
  updateRef.current = update;
  renderRef.current = render;
  stepRef.current = stepMs;

  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.parentElement ?? canvas;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      const fit = fitCanvas(canvas, rect.width, rect.height, window.devicePixelRatio || 1);
      if (!fit) return;
      sizeRef.current = { width: fit.width, height: fit.height };
      const ctx = canvas.getContext("2d");
      // Gambar satu frame walau game sedang tidak aktif, supaya papan tidak kosong.
      if (ctx) renderRef.current(ctx, fit.width, fit.height);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [canvasRef]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let last = 0;
    let accumulator = 0;

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);

      if (document.visibilityState === "hidden") {
        // Tab disembunyikan: buang waktunya, jangan dipakai untuk menyusul.
        last = time;
        return;
      }

      if (last === 0) {
        last = time;
        return;
      }

      const frameMs = time - last;
      last = time;

      const step = stepRef.current;
      const result = consumeFrame(accumulator, frameMs, step);
      accumulator = result.accumulator;

      for (let index = 0; index < result.steps; index += 1) {
        updateRef.current(step);
      }

      const size = sizeRef.current;
      if (size.width > 0 && size.height > 0) {
        renderRef.current(ctx, size.width, size.height);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, canvasRef]);
}
