import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import idData from "../../data/wordle-id.json";
import {
  buildDictionary,
  dailyAnswerIndex,
  puzzleNumber,
  type DictionaryPayload,
} from "./engine";
import { WordlePage } from "./WordlePage";

const dictionary = buildDictionary(idData as unknown as DictionaryPayload);

function todayAnswer(): string {
  const puzzle = puzzleNumber(new Date());
  return dictionary.answers[dailyAnswerIndex("id", puzzle, dictionary.answers.length)];
}

function renderPage() {
  return render(
    <MemoryRouter>
      <WordlePage />
    </MemoryRouter>,
  );
}

function typeWord(word: string) {
  for (const letter of word) {
    fireEvent.keyDown(window, { key: letter });
  }
  fireEvent.keyDown(window, { key: "Enter" });
}

describe("WordlePage", () => {
  it("memuat kamus lalu menampilkan papan", async () => {
    renderPage();
    expect(await screen.findByRole("grid", { name: "Papan tebakan" })).toBeInTheDocument();
    expect(screen.getByTestId("puzzle-number").textContent).toMatch(/^#\d+$/);
  });

  it("menolak kata di luar kamus", async () => {
    renderPage();
    await screen.findByRole("grid", { name: "Papan tebakan" });

    typeWord("zzzzz");

    expect(await screen.findByText(/belum ada di kamus/)).toBeInTheDocument();
    expect(screen.queryByText(/Kena dalam/)).not.toBeInTheDocument();
  });

  it("menang pada tebakan pertama dan memperbarui statistik", async () => {
    renderPage();
    await screen.findByRole("grid", { name: "Papan tebakan" });

    typeWord(todayAnswer());

    expect(await screen.findByText(/Kena dalam 1 tebakan/)).toBeInTheDocument();
    expect(screen.getByTestId("daily-streak").textContent).toBe("1");
    const saved = JSON.parse(localStorage.getItem("gatrion.wordle.stats.v2") ?? "{}");
    expect(saved.id.played).toBe(1);
    expect(saved.id.wins).toBe(1);
  });

  it("tidak menangkap ketikan saat jendelanya tidak aktif", async () => {
    render(
      <MemoryRouter>
        <WordlePage active={false} />
      </MemoryRouter>,
    );
    await screen.findByRole("grid", { name: "Papan tebakan" });

    typeWord("kataa");

    expect(document.querySelectorAll('.tile[data-filled="true"]')).toHaveLength(0);
  });

  it("mode bebas menyediakan kata baru", async () => {
    renderPage();
    await screen.findByRole("grid", { name: "Papan tebakan" });

    fireEvent.click(screen.getByRole("button", { name: "bebas" }));
    expect(await screen.findByTestId("puzzle-number")).toHaveTextContent("acak");

    const newGame = screen.getByRole("button", { name: "Kata baru" });
    fireEvent.click(newGame);

    expect(screen.getByTestId("puzzle-number")).toHaveTextContent("acak");
  });
});
