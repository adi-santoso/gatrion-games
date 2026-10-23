import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_KEY = "gatrion.theme";

const THEME_COLOR: Record<Theme, string> = {
  light: "#f6f4ec",
  dark: "#0b0c09",
};

const listeners = new Set<() => void>();

export function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // mode privat / storage penuh: tema tetap berlaku untuk sesi ini
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTheme(): Theme {
  return loadTheme();
}

/** Satu sumber kebenaran tema, supaya menu bar dan panel game tidak berbeda. */
export function setTheme(theme: Theme): void {
  saveTheme(theme);
  applyTheme(theme);
  for (const listener of listeners) listener();
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, getTheme);
}
