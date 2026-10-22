import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultSave } from "./economy";
import { IdlePage } from "./IdlePage";

function seed(overrides: Record<string, unknown> = {}) {
  const save = { ...defaultSave(Date.now()), crystals: 100_000, total: 100_000, ...overrides };
  localStorage.setItem("gatrion.idle.save", JSON.stringify(save));
}

function stored() {
  return JSON.parse(localStorage.getItem("gatrion.idle.save") ?? "{}");
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

  it("menambang otomatis tanpa klik", () => {
    seed();
    renderPage();
    expect(screen.getByTestId("crystals")).toHaveTextContent("100K");
    expect(screen.getByTestId("rate")).toHaveTextContent("0.5/detik");
    expect(screen.getByText(/menambang sendiri sejak detik pertama/)).toBeInTheDocument();
  });

  it("menampilkan tier terkunci dan hint pembukaannya", () => {
    seed();
    renderPage();
    const locked = document.querySelector('[data-gen="drill"]');
    expect(locked).toHaveAttribute("data-unlocked", "false");
    expect(locked).toHaveTextContent(/butuh 5 Pencungkil/);
  });

  it("klik tetap memberi bonus manual", async () => {
    seed({ auto: false });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Ketuk untuk kristal/ }));

    await waitFor(() => {
      expect(stored().clicks).toBe(1);
      expect(stored().crystals).toBeGreaterThan(100_000);
    });
  });

  it("membeli sepuluh unit sekaligus", async () => {
    seed({ auto: false });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "x10" }));
    const row = document.querySelector('[data-gen="pick"]') as HTMLButtonElement;
    expect(row).toHaveTextContent("×10");

    fireEvent.click(row);

    await waitFor(() => {
      expect(stored().gens.pick).toBe(11);
      expect(stored().crystals).toBeLessThan(100_000);
    });
  });

  it("membeli riset dan menaikkan produksi", async () => {
    seed({ auto: false });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "riset" }));

    const gear = document.querySelector('[data-upgrade="gear"]') as HTMLButtonElement;
    expect(gear).not.toBeDisabled();
    fireEvent.click(gear);

    await waitFor(() => {
      expect(stored().upg.gear).toBe(1);
      expect(stored().crystals).toBeLessThan(100_000);
    });
  });

  it("membeli sumber material dan menampilkan hasil produksinya di inventory", async () => {
    seed({ crystals: 100_000, auto: false });
    renderPage();

    fireEvent.click(document.querySelector('[data-material-building="wood"]') as HTMLButtonElement);
    await waitFor(() => expect(stored().materialBuildings.wood).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));

    await waitFor(
      () => expect(document.querySelector('[data-resource="wood"]')).toHaveTextContent("0.5"),
      { timeout: 3000 },
    );
  });

  it("memakai material untuk upgrade yang mengubah bonus ketukan", async () => {
    seed({
      auto: false,
      materials: { wood: 0, stone: 10, herb: 0 },
      materialBuildings: { wood: 0, stone: 1, herb: 0 },
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));
    fireEvent.click(screen.getByRole("button", { name: "Tingkatkan · 10 Batu" }));

    await waitFor(() => {
      expect(stored().materialUpgrades.stone).toBe(1);
      expect(stored().materials.stone).toBe(0);
    });
  });

  it("menambahkan hasil material offline ke save dan ringkasan kembali", async () => {
    seed({
      auto: false,
      crystals: 0,
      total: 0,
      gens: { pick: 0 },
      materialBuildings: { wood: 1, stone: 0, herb: 0 },
      lastSeen: Date.now() - 3_600_000,
    });
    renderPage();

    const dialog = screen.getByRole("dialog", { name: "Selamat kembali" });
    expect(dialog).toHaveTextContent("+900 Kayu");
    fireEvent.click(within(dialog).getByRole("button", { name: "Lanjut" }));
    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));
    expect(document.querySelector('[data-resource="wood"]')).toHaveTextContent("900");
  });

  it("melakukan peleburan lewat dialog dan menyimpan inti", async () => {
    seed({ total: 4_000_000, crystals: 4_000_000, auto: false });
    renderPage();

    const button = document.querySelector('[data-action="prestige"]') as HTMLButtonElement;
    expect(button).toHaveTextContent("+4");
    fireEvent.click(button);

    const dialog = screen.getByRole("dialog", { name: "Lebur putaran ini?" });
    expect(within(dialog).getByTestId("prestige-gain")).toHaveTextContent("+4");

    fireEvent.click(within(dialog).getByRole("button", { name: "Lebur sekarang" }));

    await waitFor(() => {
      expect(stored().cores).toBe(4);
      expect(stored().prestiges).toBe(1);
      expect(stored().total).toBe(0);
      expect(stored().gens.pick).toBe(1);
    });
    expect(screen.getByTestId("cores")).toHaveTextContent("4");
  });

  it("mandor otomatis aktif sejak awal dan membeli generator sendiri", async () => {
    seed({ crystals: 10_000, auto: true });
    renderPage();

    await waitFor(
      () => {
        expect(stored().gens.pick).toBeGreaterThan(1);
        expect(stored().autoBuys).toBeGreaterThan(0);
      },
      { timeout: 4000 },
    );
  });

  it("berpindah tab antara tambang, lebur, dan arsip", () => {
    seed({ auto: false });
    renderPage();

    expect(document.querySelector('[data-gen="pick"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "lebur" }));
    expect(document.querySelector('[data-core="spark"]')).toBeInTheDocument();
    expect(document.querySelector('[data-gen="pick"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "arsip" }));
    expect(screen.getByText("lencana")).toBeInTheDocument();
    expect(document.querySelector("#achievements")).toBeInTheDocument();
  });

  it("peta mengikuti unlock tier dan masuk ke bangunan yang dipilih", async () => {
    seed({ gens: { pick: 5, drill: 0 }, crystals: 10_000, total: 100_000, auto: false });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Peta Dunia" }));
    expect(screen.getByRole("heading", { name: "Bor Tangan" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Zona 03, Rig Otomatis, terkunci/ }));
    expect(document.querySelector(".world-map-detail")).toHaveTextContent("butuh 5 Bor Tangan (0/5)");
    expect(screen.getByRole("button", { name: "Belum terbuka" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Zona 02, Bor Tangan, terbuka/ }));
    fireEvent.click(screen.getByRole("button", { name: "Masuk tambang" }));
    expect(document.querySelector('[data-gen="drill"]')).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[data-gen="drill"]')).toHaveFocus());
  });

  it("menampilkan dialog progres offline dengan efisiensi", () => {
    seed({ gens: { pick: 20 }, crystals: 0, total: 0, lastSeen: Date.now() - 3_600_000 });
    renderPage();
    const dialog = screen.getByRole("dialog", { name: "Selamat kembali" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByTestId("offline-gain")).toHaveTextContent(/^\+36/);
    expect(dialog).toHaveTextContent(/50% dari laju tambang/);
  });
});
