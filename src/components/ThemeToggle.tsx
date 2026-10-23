import { useEffect } from "react";
import { applyTheme, saveTheme, toggleTheme, useTheme } from "../lib/theme";

export function ThemeToggle() {
  const theme = useTheme();

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const next = theme === "dark" ? "terang" : "gelap";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => toggleTheme()}
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
