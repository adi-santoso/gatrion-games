import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { THEME_KEY } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  it("memakai mode terang sebagai default", () => {
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Mode gelap");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("berganti ke gelap lalu kembali ke terang", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(button).toHaveAttribute("aria-label", "Mode terang");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("membaca tema tersimpan saat pertama dirender", () => {
    localStorage.setItem(THEME_KEY, "dark");
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Mode terang");
  });
});
