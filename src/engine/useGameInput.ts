import { useEffect, useRef } from "react";
import { ARROW_BINDINGS, bindGameKeys, createInputState } from "./input";
import type { Bindings, InputState } from "./input";

export interface GameInputOptions {
  /** Hanya tangkap tombol saat jendela game fokus. */
  active: boolean;
  bindings?: Bindings;
}

/**
 * Input keyboard ter-scope: saat `active` false (atau saat unmount) semua
 * listener dilepas dan tombol yang ditahan dibersihkan, jadi tidak ada input
 * yang bocor ke game lain atau ke desktop.
 */
export function useGameInput({ active, bindings = ARROW_BINDINGS }: GameInputOptions): InputState {
  const stateRef = useRef<InputState | null>(null);
  if (stateRef.current === null) stateRef.current = createInputState();
  const state = stateRef.current;

  useEffect(() => {
    if (!active) {
      state.clear();
      return;
    }
    return bindGameKeys({ target: window, state, bindings });
  }, [active, bindings, state]);

  return state;
}
