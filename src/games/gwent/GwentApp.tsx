import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { GwentPage } from "./GwentPage";

/** Phaser hanya diunduh saat jendela kartu dibuka dan WebGL tersedia. */
const PhaserBoard = lazy(() => import("./PhaserBoard"));

type Mode = "dom" | "phaser";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

interface BoundaryProps {
  children: ReactNode;
  onFail: () => void;
}

/** Kalau scene gagal dibuat, jangan tinggalkan papan kosong: pakai fallback DOM. */
class BoardBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface GwentAppProps {
  active?: boolean;
}

/**
 * Kanvas Phaser adalah tampilan utama; `GwentPage` (DOM) menjadi fallback saat
 * WebGL tidak ada — termasuk di jsdom — saat pengguna meminta animasi
 * dikurangi, atau saat scene gagal dimuat. Keduanya memakai aturan yang sama
 * dari `engine.ts`.
 */
export function GwentApp({ active = true }: GwentAppProps = {}) {
  const [mode, setMode] = useState<Mode>("dom");

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (!reduced && supportsWebGL()) setMode("phaser");
  }, []);

  if (mode === "phaser") {
    return (
      <BoardBoundary onFail={() => setMode("dom")}>
        <Suspense fallback={<div className="gwent-loading">memuat meja kartu…</div>}>
          <PhaserBoard active={active} />
        </Suspense>
      </BoardBoundary>
    );
  }

  return <GwentPage active={active} />;
}
