import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { Desktop } from "./components/Desktop";
import { WINDOWS_KEY } from "./storage";

function renderDesktop(entries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <Desktop />
    </MemoryRouter>,
  );
}

function menubar() {
  return screen.getByRole("banner", { name: "Menu bar" });
}

function dock() {
  return screen.getByRole("navigation", { name: "Dock" });
}

function dockButton(name: string) {
  return within(dock()).getByRole("button", { name });
}

describe("Desktop", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  it("membuka jendela Gatrion sebagai aplikasi default", () => {
    renderDesktop();
    expect(screen.getByRole("dialog", { name: "Gatrion" })).toBeInTheDocument();
    expect(within(menubar()).getByRole("button", { name: "Berkas" })).toBeInTheDocument();
    expect(within(dock()).getByRole("button", { name: "Gatrion" })).toBeInTheDocument();
  });

  it("membuka aplikasi dari ikon dock", async () => {
    renderDesktop();
    fireEvent.click(dockButton("Wordle"));

    expect(await screen.findByRole("dialog", { name: "Wordle" })).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(2);
  });

  it("klik dock aplikasi yang sudah terbuka memfokuskan jendelanya", async () => {
    renderDesktop();
    fireEvent.click(dockButton("Wordle"));
    await screen.findByRole("dialog", { name: "Wordle" });

    fireEvent.click(dockButton("Wordle"));

    await waitFor(() => expect(screen.getAllByRole("dialog")).toHaveLength(2));
    const wordle = screen.getByRole("dialog", { name: "Wordle" });
    expect(wordle).toHaveAttribute("data-focused", "true");
  });

  it("menutup jendela lewat tombol lampu merah", async () => {
    renderDesktop();
    fireEvent.click(screen.getByRole("button", { name: "Tutup Gatrion" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Gatrion" })).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Meja kerja kosong.")).toBeInTheDocument();
  });

  it("meminimalkan jendela ke dock lalu memulihkannya", async () => {
    renderDesktop();
    fireEvent.click(screen.getByRole("button", { name: "Minimalkan Gatrion" }));

    const restore = await screen.findByRole("button", { name: "Pulihkan Gatrion" });
    expect(screen.queryByRole("dialog", { name: "Gatrion" })).not.toBeInTheDocument();

    fireEvent.click(restore);
    expect(await screen.findByRole("dialog", { name: "Gatrion" })).toBeInTheDocument();
  });

  it("menambah jendela baru dari menu Berkas", async () => {
    renderDesktop();
    fireEvent.click(within(menubar()).getByRole("button", { name: "Berkas" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Jendela Baru/ }));

    await waitFor(() => expect(screen.getAllByRole("dialog", { name: "Gatrion" })).toHaveLength(2));
  });

  it("membuka Spotlight dengan ⌘Space dan menjalankan hasil pertama", async () => {
    renderDesktop();
    fireEvent.keyDown(window, { key: " ", code: "Space", metaKey: true });

    const input = screen.getByRole("textbox", { name: "Cari aplikasi atau perintah" });
    fireEvent.change(input, { target: { value: "wordle" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByRole("dialog", { name: "Wordle" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Cari aplikasi atau perintah" })).not.toBeInTheDocument();
  });

  it("menampilkan app switcher lewat ⌘Tab dan pindah saat ⌘ dilepas", async () => {
    renderDesktop();
    fireEvent.click(dockButton("Idle Tambang"));
    await screen.findByRole("dialog", { name: "Idle Tambang" });

    fireEvent.keyDown(window, { key: "Tab", metaKey: true });
    expect(screen.getByRole("dialog", { name: "Pindah aplikasi" })).toBeInTheDocument();

    fireEvent.keyUp(window, { key: "Meta" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Pindah aplikasi" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "Gatrion" })).toHaveAttribute("data-focused", "true");
  });

  it("menampilkan Mission Control lewat ⌃↑", async () => {
    renderDesktop();
    fireEvent.click(dockButton("Wordle"));
    await screen.findByRole("dialog", { name: "Wordle" });

    fireEvent.keyDown(window, { key: "ArrowUp", ctrlKey: true });

    const mission = screen.getByRole("dialog", { name: "Mission Control" });
    expect(within(mission).getByRole("button", { name: "Fokuskan Wordle" })).toBeInTheDocument();
    expect(within(mission).getByRole("button", { name: "Fokuskan Gatrion" })).toBeInTheDocument();
  });

  it("mengganti tema dari Pusat Kendali", async () => {
    renderDesktop();
    fireEvent.click(within(menubar()).getByRole("button", { name: "Pusat Kendali" }));
    fireEvent.click(screen.getByRole("button", { name: "Ganti mode warna" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });

  it("membuka jendela idle dari deep link lama", async () => {
    renderDesktop(["/idle"]);
    expect(await screen.findByRole("dialog", { name: "Idle Tambang" })).toBeInTheDocument();
  });

  it("membuka Ular dari dock sebagai aplikasi yang siap dimainkan", async () => {
    renderDesktop();
    fireEvent.click(dockButton("Ular"));

    const win = await screen.findByRole("dialog", { name: "Ular" });
    expect(win).toHaveAttribute("data-focused", "true");
    expect(within(win).getByTestId("snake-score")).toHaveTextContent("0");
    expect(within(win).getByTestId("snake-status")).toHaveTextContent("siap");
    expect(within(win).getByRole("button", { name: "Mulai ulang" })).toBeInTheDocument();
  });

  it("menampilkan Launchpad dari ikon dock", async () => {
    renderDesktop();
    fireEvent.click(dockButton("Launchpad"));

    const pad = screen.getByRole("dialog", { name: "Launchpad" });
    expect(within(pad).getByRole("button", { name: "Pengaturan Sistem" })).toBeInTheDocument();
  });

  it("menyimpan tata letak jendela ke localStorage", async () => {
    renderDesktop();
    await waitFor(() => expect(localStorage.getItem(WINDOWS_KEY)).toContain("gatrion"));
  });

  it("memulihkan jendela yang tersimpan saat reload", async () => {
    localStorage.setItem(
      WINDOWS_KEY,
      JSON.stringify({
        windows: [
          {
            id: "win-wordle",
            appId: "wordle",
            x: 120,
            y: 80,
            w: 900,
            h: 600,
            zoomed: false,
            minimized: false,
            restore: null,
            z: 3,
          },
        ],
        focusedId: "win-wordle",
        zTop: 3,
      }),
    );

    renderDesktop();
    expect(await screen.findByRole("dialog", { name: "Wordle" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Gatrion" })).not.toBeInTheDocument();
  });
});
