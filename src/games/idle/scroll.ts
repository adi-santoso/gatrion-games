const SCROLL_PADDING = 8;

function isScrollable(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  const overflowY = style.overflowY;
  return overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
}

/** Panel idle bisa berada di dalam jendela desktop atau halaman biasa. */
export function findScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node) {
    if (isScrollable(node)) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Bawa target ke dalam pandangan tanpa melewati batasnya.
 *
 * `scrollIntoView({ block: "center" })` menggeser kabinet setinggi 1400px ke
 * tengah layar, sehingga klik menu samping langsung melompat ke tengah halaman.
 * Di sini target diratakan ke atas, dan tidak ada gulir kalau target sudah
 * sepenuhnya terlihat.
 */
export function revealElement(element: HTMLElement | null, padding = SCROLL_PADDING): boolean {
  if (!element) return false;

  const container = findScrollParent(element);
  if (!container) {
    if (typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return false;
  }

  const offset = element.getBoundingClientRect().top - container.getBoundingClientRect().top;
  const targetBottom = offset + element.offsetHeight;
  if (offset >= padding && targetBottom <= container.clientHeight - padding) return false;

  const top = Math.max(0, container.scrollTop + offset - padding);
  if (Math.abs(top - container.scrollTop) < 1) return false;

  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top, behavior: "smooth" });
  } else {
    container.scrollTop = top;
  }
  return true;
}
