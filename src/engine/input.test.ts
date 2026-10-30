import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ARROW_BINDINGS, actionForCode, bindGameKeys, createInputState } from "./input";
import type { Bindings } from "./input";
import { useGameInput } from "./useGameInput";

/** Kirim event keyboard sungguhan ke window, lalu kembalikan event-nya. */
function press(type: "keydown" | "keyup", init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("actionForCode", () => {
  it("memetakan kode tombol default dan binding kustom", () => {
    expect(actionForCode("ArrowUp")).toBe("up");
    expect(actionForCode("KeyW")).toBe("up");
    expect(actionForCode("Space")).toBe("pause");
    expect(actionForCode("KeyZ", { KeyZ: "left" })).toBe("left");
  });

  it("tidak menganggap properti prototipe sebagai binding", () => {
    expect(actionForCode("toString")).toBeUndefined();
    expect(actionForCode("constructor")).toBeUndefined();
  });
});

describe("bindGameKeys", () => {
  it("mencegah default hanya untuk tombol yang dipetakan", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    expect(press("keydown", { code: "ArrowUp" }).defaultPrevented).toBe(true);
    expect(press("keydown", { code: "KeyQ" }).defaultPrevented).toBe(false);
    expect(press("keydown", { code: "Tab" }).defaultPrevented).toBe(false);

    expect(state.drain()).toEqual(["up"]);
    unbind();
  });

  it("tidak pernah mencegat pintasan ⌘/⌃/⌥ milik desktop", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    const shortcuts: KeyboardEventInit[] = [
      { code: "KeyW", key: "w", metaKey: true }, // ⌘W tutup jendela
      { code: "KeyM", key: "m", metaKey: true }, // ⌘M minimalkan
      { code: "KeyN", key: "n", metaKey: true }, // ⌘N jendela baru
      { code: "Space", key: " ", metaKey: true }, // ⌘Space Spotlight
      { code: "Tab", key: "Tab", metaKey: true }, // ⌘Tab app switcher
      { code: "ArrowUp", key: "ArrowUp", ctrlKey: true }, // ⌃↑ Mission Control
      { code: "ArrowUp", key: "ArrowUp", altKey: true },
    ];

    for (const init of shortcuts) {
      const event = press("keydown", init);
      expect(event.defaultPrevented, JSON.stringify(init)).toBe(false);
    }

    // Tidak ada tombol game yang ikut tercatat.
    expect(state.drain()).toEqual([]);
    expect(state.isHeld("up")).toBe(false);
    unbind();
  });

  it("mencatat tombol ditahan, melepasnya saat keyup, dan drain hanya sekali", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    press("keydown", { code: "KeyA" });
    expect(state.isHeld("left")).toBe(true);

    press("keyup", { code: "KeyA" });
    expect(state.isHeld("left")).toBe(false);

    expect(state.drain()).toEqual(["left"]);
    expect(state.drain()).toEqual([]);
    unbind();
  });

  it("tidak menumpuk press dari auto-repeat", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    press("keydown", { code: "Space" });
    press("keydown", { code: "Space", repeat: true });

    expect(state.drain()).toEqual(["pause"]);
    unbind();
  });

  it("mengabaikan tombol yang diketik di input/textarea", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", {
      code: "ArrowUp",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(state.drain()).toEqual([]);
    unbind();
  });

  it("tidak menangkap apa pun saat jendela tidak fokus", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state, isEnabled: () => false });

    const event = press("keydown", { code: "ArrowUp" });

    expect(event.defaultPrevented).toBe(false);
    expect(state.drain()).toEqual([]);
    unbind();
  });

  it("menghormati binding kustom", () => {
    const bindings: Bindings = { KeyZ: "left" };
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state, bindings });

    expect(press("keydown", { code: "ArrowUp" }).defaultPrevented).toBe(false);
    expect(press("keydown", { code: "KeyZ" }).defaultPrevented).toBe(true);
    expect(state.drain()).toEqual(["left"]);
    unbind();
  });

  it("melepas semua listener dan mengosongkan state saat unbind", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    press("keydown", { code: "ArrowUp" });
    expect(state.isHeld("up")).toBe(true);
    expect(state.drain()).toEqual(["up"]);

    unbind();

    // State tidak tertinggal "ditahan".
    expect(state.isHeld("up")).toBe(false);

    const after = press("keydown", { code: "ArrowUp", repeat: true });
    expect(after.defaultPrevented).toBe(false);
    expect(state.drain()).toEqual([]);
    expect(state.isHeld("up")).toBe(false);
  });

  it("mengosongkan tombol yang ditahan saat jendela kehilangan fokus", () => {
    const state = createInputState();
    const unbind = bindGameKeys({ target: window, state });

    press("keydown", { code: "KeyS" });
    expect(state.isHeld("down")).toBe(true);

    window.dispatchEvent(new Event("blur"));
    expect(state.isHeld("down")).toBe(false);

    unbind();
  });
});

describe("useGameInput", () => {
  it("hanya menangkap tombol saat jendela aktif", () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useGameInput({ active }),
      { initialProps: { active: false } },
    );

    act(() => {
      press("keydown", { code: "ArrowRight" });
    });
    expect(result.current.drain()).toEqual([]);

    rerender({ active: true });
    act(() => {
      press("keydown", { code: "ArrowRight" });
    });
    expect(result.current.drain()).toEqual(["right"]);

    rerender({ active: false });
    act(() => {
      press("keydown", { code: "ArrowRight" });
    });
    expect(result.current.drain()).toEqual([]);
  });

  it("memakai binding default panah dan WASD", () => {
    expect(ARROW_BINDINGS.ArrowUp).toBe("up");
    expect(ARROW_BINDINGS.KeyD).toBe("right");
    expect(ARROW_BINDINGS.Space).toBe("pause");
    expect(ARROW_BINDINGS.KeyR).toBe("restart");
  });
});
