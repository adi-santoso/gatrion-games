/**
 * Input keyboard untuk game canvas, ter-scope ke jendela yang sedang fokus.
 *
 * Aturan penting (supaya pintasan desktop tetap hidup):
 * - Hanya tombol yang ada di `bindings` yang disentuh; sisanya dibiarkan lewat.
 * - Event dengan ⌘ / ⌃ / ⌥ tidak pernah dicegat, jadi ⌘W, ⌘M, ⌘N, ⌘Space, ⌘Tab
 *   tetap milik desktop.
 * - `drain()` mengembalikan press sekali pakai (mis. belok, jeda), sedangkan
 *   `isHeld()` untuk tombol yang ditahan.
 * - `bindGameKeys` melepas semua listener saat dipanggil balik (unmount / blur).
 */

export type GameAction = "up" | "down" | "left" | "right" | "pause" | "restart";

export type Bindings = Readonly<Record<string, GameAction>>;

/** Kode `event.code`, bukan `event.key`, supaya layout keyboard tidak berpengaruh. */
export const ARROW_BINDINGS: Bindings = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "pause",
  KeyR: "restart",
};

/** Maksimal press yang menunggu diproses; sisanya dibuang agar tidak menumpuk. */
const MAX_QUEUED_PRESSES = 8;

export function actionForCode(code: string, bindings: Bindings = ARROW_BINDINGS): GameAction | undefined {
  return Object.prototype.hasOwnProperty.call(bindings, code) ? bindings[code] : undefined;
}

export interface InputState {
  press(action: GameAction): void;
  release(action: GameAction): void;
  /** Ambil semua press yang belum diproses, urut sesuai kejadian. */
  drain(): GameAction[];
  isHeld(action: GameAction): boolean;
  clear(): void;
}

export function createInputState(): InputState {
  const held = new Set<GameAction>();
  let pressed: GameAction[] = [];

  return {
    press(action) {
      held.add(action);
      if (pressed.length < MAX_QUEUED_PRESSES) pressed.push(action);
    },
    release(action) {
      held.delete(action);
    },
    drain() {
      const pending = pressed;
      pressed = [];
      return pending;
    },
    isHeld(action) {
      return held.has(action);
    },
    clear() {
      held.clear();
      pressed = [];
    },
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export interface BindOptions {
  target: Window | HTMLElement;
  state: InputState;
  bindings?: Bindings;
  /** Dicek di setiap event; kembalikan `false` saat jendela tidak fokus. */
  isEnabled?: () => boolean;
}

export function bindGameKeys({
  target,
  state,
  bindings = ARROW_BINDINGS,
  isEnabled,
}: BindOptions): () => void {
  const onKeyDown = (event: Event) => {
    const keyboard = event as KeyboardEvent;
    if (isEnabled && !isEnabled()) return;
    if (keyboard.metaKey || keyboard.ctrlKey || keyboard.altKey) return;
    const action = actionForCode(keyboard.code, bindings);
    if (!action) return;
    if (isEditableTarget(keyboard.target)) return;

    // Hanya tombol yang benar-benar dipakai game yang dicegah default-nya
    // (spasi menggulir halaman, panah memindah fokus).
    keyboard.preventDefault();
    // Auto-repeat tidak boleh menumpuk press; state "ditahan" sudah tercatat.
    if (keyboard.repeat) return;
    state.press(action);
  };

  const onKeyUp = (event: Event) => {
    const keyboard = event as KeyboardEvent;
    const action = actionForCode(keyboard.code, bindings);
    if (!action) return;
    state.release(action);
  };

  // Fokus hilang di tengah ketikan: jangan sampai tombol tersangkut "ditahan".
  const onBlur = () => state.clear();

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  if (typeof window !== "undefined") window.addEventListener("blur", onBlur);

  return () => {
    target.removeEventListener("keydown", onKeyDown);
    target.removeEventListener("keyup", onKeyUp);
    if (typeof window !== "undefined") window.removeEventListener("blur", onBlur);
    state.clear();
  };
}
