import { describe, expect, it, vi } from "vitest";
import { findScrollParent, revealElement } from "./scroll";

function makeScroller() {
  const container = document.createElement("div");
  container.style.overflowY = "auto";
  const child = document.createElement("div");
  container.append(child);
  document.body.append(container);

  Object.defineProperty(container, "clientHeight", { value: 600, configurable: true });
  const scrollTo = vi.fn();
  container.scrollTo = scrollTo as unknown as typeof container.scrollTo;

  Object.defineProperty(child, "offsetHeight", { value: 400, configurable: true });

  const place = (childTop: number, scrollTop = 0) => {
    container.scrollTop = scrollTop;
    container.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
    child.getBoundingClientRect = () => ({ top: childTop }) as DOMRect;
  };

  return { container, child, scrollTo, place };
}

describe("findScrollParent", () => {
  it("menemukan induk yang bisa menggulir paling dekat", () => {
    const { container, child } = makeScroller();
    expect(findScrollParent(child)).toBe(container);
  });

  it("mengembalikan null bila tidak ada kontainer bergulir", () => {
    const outer = document.createElement("div");
    const inner = document.createElement("span");
    outer.append(inner);
    document.body.append(outer);
    expect(findScrollParent(inner)).toBeNull();
  });
});

describe("revealElement", () => {
  it("tidak menggulir kalau target sudah terlihat penuh", () => {
    const { child, scrollTo, place } = makeScroller();
    place(20);

    expect(revealElement(child)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("meratakan target ke atas, bukan ke tengah", () => {
    const { container, child, scrollTo, place } = makeScroller();
    place(700);

    expect(revealElement(child)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 692, behavior: "smooth" });
    expect(container.scrollTop).toBe(0);
  });

  it("menggulir ke atas saat target berada di atas pandangan", () => {
    const { child, scrollTo, place } = makeScroller();
    place(-500, 300);

    expect(revealElement(child)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("tidak menggulir lagi saat target besar sudah mulai di atas", () => {
    const { child, scrollTo, place } = makeScroller();
    place(0, 0);

    expect(revealElement(child)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("mengabaikan target kosong", () => {
    expect(revealElement(null)).toBe(false);
  });
});
