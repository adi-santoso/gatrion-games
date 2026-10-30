import { describe, expect, it } from "vitest";
import { chooseAiMove } from "./ai";
import { CARDS } from "./cards";
import type { Row, Side } from "./cards";
import {
  createGame,
  nextRandom,
  pass,
  playCard,
  rowScore,
  totalScore,
} from "./engine";
import type { CardInstance, GwentState } from "./engine";

function inst(id: string, uid = id): CardInstance {
  return { uid, card: CARDS[id] };
}

function withRows(
  state: GwentState,
  side: Side,
  rows: Partial<Record<Row, CardInstance[]>>,
): GwentState {
  return {
    ...state,
    boards: {
      ...state.boards,
      [side]: { ...state.boards[side], rows: { ...state.boards[side].rows, ...rows } },
    },
  };
}

function withHand(state: GwentState, side: Side, hand: CardInstance[]): GwentState {
  return {
    ...state,
    boards: { ...state.boards, [side]: { ...state.boards[side], hand } },
  };
}

describe("createGame", () => {
  it("membagi 10 kartu ke tangan dan sisanya ke deck", () => {
    const game = createGame(42);

    for (const side of ["player", "ai"] as Side[]) {
      expect(game.boards[side].hand).toHaveLength(10);
      expect(game.boards[side].deck.length).toBeGreaterThanOrEqual(3);
      expect(game.boards[side].rows.melee).toHaveLength(0);
    }

    expect(game.turn).toBe("player");
    expect(game.round).toBe(1);
    expect(game.status).toBe("playing");
    expect(game.roundResult).toBeNull();
  });

  it("deterministik untuk seed yang sama", () => {
    const first = createGame(7);
    const second = createGame(7);

    expect(first.boards.player.hand.map((item) => item.uid)).toEqual(
      second.boards.player.hand.map((item) => item.uid),
    );
    expect(first.boards.ai.hand.map((item) => item.uid)).toEqual(
      second.boards.ai.hand.map((item) => item.uid),
    );
  });

  it("memakai dek berbeda untuk kedua pihak", () => {
    const game = createGame(7);
    expect(game.boards.player.faction).toBe("benteng");
    expect(game.boards.ai.faction).toBe("rawa");
  });
});

describe("nextRandom", () => {
  it("deterministik dan berada di rentang [0, 1)", () => {
    const step = nextRandom(123);
    expect(step).toEqual(nextRandom(123));
    expect(step.value).toBeGreaterThanOrEqual(0);
    expect(step.value).toBeLessThan(1);
  });
});

describe("playCard", () => {
  it("menempatkan unit di barisnya lalu berpindah giliran", () => {
    const game = createGame(11);
    const card = game.boards.player.hand.find((item) => item.card.kind === "unit");
    expect(card).toBeDefined();
    const row = card!.card.row!;

    const out = playCard(game, "player", card!.uid);

    expect(out.error).toBeUndefined();
    expect(out.state.boards.player.hand).toHaveLength(9);
    expect(out.state.boards.player.rows[row].map((item) => item.uid)).toContain(card!.uid);
    expect(out.state.turn).toBe("ai");
    expect(rowScore(out.state, "player", row)).toBe(card!.card.strength);
  });

  it("menolak langkah di luar giliran, kartu asing, dan setelah lewat", () => {
    const game = createGame(11);
    const card = game.boards.player.hand[0];

    expect(playCard(game, "ai", card.uid).error).toBe("Bukan giliran pemain itu.");
    expect(playCard(game, "player", "tidak-ada").error).toContain("tidak ada");
    expect(playCard(pass(game, "player"), "player", card.uid).error).toContain("sudah lewat");
  });

  it("menolak langkah setelah pertandingan selesai", () => {
    const game: GwentState = { ...createGame(11), status: "over" };
    expect(playCard(game, "player", game.boards.player.hand[0].uid).error).toContain("selesai");
  });

  it("cuaca butuh baris sasaran", () => {
    const base = withHand(createGame(11), "player", [inst("s-cuaca", "cuaca-1")]);

    expect(playCard(base, "player", "cuaca-1").error).toContain("baris");

    const out = playCard(base, "player", "cuaca-1", "melee");
    expect(out.error).toBeUndefined();
    expect(out.state.weather).toEqual(["melee"]);
  });

  it("terompet menggandakan baris sendiri dan menolak dobel", () => {
    const base = withRows(withHand(createGame(11), "player", [inst("s-terompet", "horn-1")]), "player", {
      melee: [inst("b-ksatria", "k1")],
    });

    const out = playCard(base, "player", "horn-1", "melee");
    expect(out.error).toBeUndefined();
    expect(rowScore(out.state, "player", "melee")).toBe(12);

    const again = withHand({ ...out.state, turn: "player" }, "player", [
      inst("s-terompet", "horn-2"),
    ]);
    expect(playCard(again, "player", "horn-2", "melee").error).toContain("terompet");
  });

  it("moral menambah 1 untuk tiap unit non-hero", () => {
    const base = withRows(withHand(createGame(11), "player", [inst("s-moral", "moral-1")]), "player", {
      melee: [inst("b-ksatria", "k1"), inst("b-jenderal", "hero-1")],
    });

    const out = playCard(base, "player", "moral-1");
    expect(out.error).toBeUndefined();
    // 6 + 1 (moral) + 12 (hero kebal moral)
    expect(rowScore(out.state, "player", "melee")).toBe(19);
  });

  it("bakar menghancurkan unit terkuat non-hero di kedua sisi, hero selamat", () => {
    let game = withRows(createGame(11), "player", {
      melee: [inst("b-katapel", "katapel-1"), inst("b-jenderal", "hero-1")],
    });
    game = withRows(game, "ai", { melee: [inst("r-raksasa", "raksasa-1")] });
    game = withHand(game, "player", [inst("s-bakar", "bakar-1")]);

    const out = playCard(game, "player", "bakar-1");

    expect(out.error).toBeUndefined();
    expect(out.state.boards.player.rows.melee.map((item) => item.uid)).toEqual(["hero-1"]);
    expect(out.state.boards.ai.rows.melee).toHaveLength(0);
  });
});

describe("skor", () => {
  it("urutan efek: cuaca → terompet → moral", () => {
    let game = withRows(createGame(11), "player", { melee: [inst("b-ksatria", "k1")] });
    game = {
      ...game,
      weather: ["melee"],
      horns: { player: ["melee"], ai: [] },
      morale: { player: 1, ai: 0 },
    };

    // 6 → cuaca 1 → terompet 2 → moral 3
    expect(rowScore(game, "player", "melee")).toBe(3);
  });

  it("hero kebal cuaca dan terompet", () => {
    let game = withRows(createGame(11), "player", { melee: [inst("b-jenderal", "h1")] });
    game = { ...game, weather: ["melee"], horns: { player: ["melee"], ai: [] } };

    expect(rowScore(game, "player", "melee")).toBe(12);
  });

  it("total adalah jumlah tiga baris", () => {
    const game = withRows(createGame(11), "player", {
      melee: [inst("b-ksatria", "k1")],
      ranged: [inst("b-tabib", "t1")],
      siege: [inst("b-balista", "b1")],
    });

    expect(totalScore(game, "player")).toBe(6 + 3 + 6);
  });
});

describe("ronde", () => {
  it("kedua pihak lewat: nilai dihitung dan ronde baru dibuka", () => {
    let game = withRows(createGame(11), "player", { melee: [inst("b-ksatria", "k1")] });
    game = withRows(game, "ai", { melee: [inst("r-gigit", "g1")] });

    const afterPlayer = pass(game, "player");
    expect(afterPlayer.turn).toBe("ai");

    const next = pass(afterPlayer, "ai");

    expect(next.wins.player).toBe(1);
    expect(next.round).toBe(2);
    expect(next.status).toBe("playing");
    expect(next.roundResult).toEqual({ round: 1, winner: "player", player: 6, ai: 4 });
    expect(next.weather).toEqual([]);
    expect(next.boards.player.rows.melee).toHaveLength(0);
    expect(next.boards.player.hand).toHaveLength(12);
    expect(next.boards.ai.hand).toHaveLength(12);
    expect(next.turn).toBe("ai");
  });

  it("ronde seri tidak memberi kemenangan", () => {
    let game = withRows(createGame(11), "player", { melee: [inst("b-ksatria", "k1")] });
    game = withRows(game, "ai", { melee: [inst("r-serigala", "s1")] });

    const next = pass(pass(game, "player"), "ai");

    expect(next.wins).toEqual({ player: 0, ai: 0 });
    expect(next.roundResult?.winner).toBe("draw");
    expect(next.round).toBe(2);
  });

  it("dua kemenangan mengakhiri pertandingan", () => {
    let game = withRows(createGame(11), "player", { melee: [inst("b-ksatria", "k1")] });
    game = { ...game, wins: { player: 1, ai: 0 } };

    const next = pass(pass(game, "player"), "ai");

    expect(next.status).toBe("over");
    expect(next.winner).toBe("player");
  });

  it("ronde ketiga tetap menutup pertandingan", () => {
    let game = withRows(createGame(11), "player", { melee: [inst("b-ksatria", "k1")] });
    game = { ...game, round: 3 };

    const next = pass(pass(game, "player"), "ai");

    expect(next.round).toBe(3);
    expect(next.status).toBe("over");
    expect(next.winner).toBe("player");
  });

  it("tidak bisa lewat dua kali", () => {
    const game = pass(createGame(11), "player");
    expect(pass(game, "player")).toBe(game);
  });
});

describe("lawan komputer", () => {
  it("memainkan kartu yang sah saat gilirannya", () => {
    const game: GwentState = { ...createGame(5), turn: "ai" };
    const move = chooseAiMove(game);

    expect(move.kind).toBe("play");
    if (move.kind !== "play") return;
    expect(playCard(game, "ai", move.uid, move.target).error).toBeUndefined();
  });

  it("menutup ronde kalau sudah unggul setelah lawan lewat", () => {
    let game = withRows(createGame(5), "ai", { melee: [inst("r-raksasa", "r1")] });
    game = { ...game, turn: "ai", passed: { player: true, ai: false } };

    expect(chooseAiMove(game)).toEqual({ kind: "pass" });
  });

  it("lewat kalau tangan kosong", () => {
    const game = withHand({ ...createGame(5), turn: "ai" }, "ai", []);
    expect(chooseAiMove(game)).toEqual({ kind: "pass" });
  });

  it("menyelesaikan pertandingan penuh tanpa langkah ilegal", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      let game = createGame(seed);
      let moves = 0;

      while (game.status === "playing" && moves < 200) {
        const side = game.turn;
        const move = chooseAiMove(game, side);

        if (move.kind === "pass") {
          game = pass(game, side);
        } else {
          const out = playCard(game, side, move.uid, move.target);
          expect(out.error, `seed ${seed}: ${out.error}`).toBeUndefined();
          game = out.state;
        }

        moves += 1;
      }

      expect(game.status, `seed ${seed} tidak selesai`).toBe("over");
      expect(moves).toBeLessThan(200);
    }
  });
});
