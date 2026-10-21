import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultSave } from "./economy";
import { IdlePage } from "./IdlePage";

function seed(overrides: Record<string, unknown> = {}) {
  const save = { ...defaultSave(Date.now()), crystals: 100_000, total: 100_000, ...overrides };
  localStorage.setItem("gatrion.idle.save", JSON.stringify(save));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <IdlePage />
    </MemoryRouter>,
  );
}

describe("IdlePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("menampilkan kristal dan daftar generator", () => {
    seed();
    renderPage();
    expect(screen.getByTestId("crystals")).toHaveTextContent("100K");
    expect(screen.getAllByRole("button", { name: /Pencungkil/ })).toHaveLength(1);
  });

  it("klik menambah kristal dan jumlah klik", async () => {
    seed();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Tambang kristal/ }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("gatrion.idle.save") ?? "{}");
      expect(saved.clicks).toBe(1);
      expect(saved.crystals).toBeGreaterThan(100_000);
    });
  });

  it("membeli sepuluh unit sekaligus", async () => {
    seed();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "x10" }));
    const row = screen.getByRole("button", { name: /Pencungkil/ });
    expect(row).toHaveTextContent("×10");

    fireEvent.click(row);

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("gatrion.idle.save") ?? "{}");
      expect(saved.gens.pick).toBe(10);
      expect(saved.crystals).toBeLessThan(100_000);
    });
    expect(screen.getByRole("button", { name: /Pencungkil/ })).toHaveTextContent("x10");
  });

  it("menampilkan dialog progres offline saat kembali", () => {
    seed({ gens: { pick: 20 }, crystals: 0, total: 0, lastSeen: Date.now() - 3_600_000 });
    renderPage();
    const dialog = screen.getByRole("dialog", { name: "Selamat kembali" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByTestId("offline-gain")).toHaveTextContent(/^\+18/);
  });
});
