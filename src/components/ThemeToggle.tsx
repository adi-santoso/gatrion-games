import { useCallback, useEffect, useState } from "react";
import { applyTheme, loadTheme, saveTheme, type Theme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
  }, []);

  const next = theme === "dark" ? "terang" : "gelap";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Mode ${next}`}
      title={`Ganti ke mode ${next}`}
    >
      <span aria-hidden="true" className="theme-toggle-glyph">
        {theme === "dark" ? "☾" : "☀"}
      </span>
      <span className="hidden sm:inline">{theme === "dark" ? "gelap" : "terang"}</span>
    </button>
  );
}
