export type Theme = "light" | "dark";

export const THEME_KEY = "gatrion.theme";

const THEME_COLOR: Record<Theme, string> = {
  light: "#f6f4ec",
  dark: "#0b0c09",
};

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
