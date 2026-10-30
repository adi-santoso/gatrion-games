/**
 * Mesin duel tiga baris — murni, tanpa DOM.
 *
 * Aturan:
 * - Tiap pemain punya 3 baris (dekat, jauh, kepung) dan 10 kartu di tangan.
 * - Bergantian memainkan satu kartu atau lewat; ronde selesai saat keduanya lewat.
 * - Kekuatan unit = dasar → cuaca (jadi 1) → terompet (×2) → moral (+1).
 * - Hero kebal cuaca, terompet, dan pembakaran.
 * - Menang 2 ronde lebih dulu; kalau 3 ronde habis, kemenangan ronde terbanyak.
 * - Antara ronde 1 dan 2 masing-masing menarik 2 kartu, lalu 1 kartu.
 */

import { CARDS, DECKS, ROWS, ROW_LABEL, SIDE_LABEL } from "./cards";
import type { CardDef, Faction, Row, Side } from "./cards";

export interface CardInstance {
  uid: string;
  card: CardDef;
}

export interface BoardSide {
  faction: Faction;
  hand: CardInstance[];
  deck: CardInstance[];
  rows: Record<Row, CardInstance[]>;
}

export interface RoundResult {
  round: number;
  winner: Side | "draw";
  player: number;
  ai: number;
}

export interface GwentState {
  seed: number;
  round: number;
  turn: Side;
  boards: Record<Side, BoardSide>;
  passed: Record<Side, boolean>;
  weather: Row[];
  horns: Record<Side, Row[]>;
  morale: Record<Side, number>;
  wins: Record<Side, number>;
  status: "playing" | "over";
  roundResult: RoundResult | null;
  winner: Side | "draw" | null;
  log: string[];
}

export const HAND_SIZE = 10;
export const MAX_ROUNDS = 3;
export const SIDES: readonly Side[] = ["player", "ai"];

export function otherSide(side: Side): Side {
  return side === "player" ? "ai" : "player";
}

function emptyRows(): Record<Row, CardInstance[]> {
  return { melee: [], ranged: [], siege: [] };
}

export function emptyBoard(faction: Faction): BoardSide {
  return { faction, hand: [], deck: [], rows: emptyRows() };
}

/** mulberry32: cukup untuk mengocok, deterministik untuk tes. */
export function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t };
}

function shuffle<T>(items: readonly T[], seed: number): { items: T[]; seed: number } {
  const copy = [...items];
  let current = seed;

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const step = nextRandom(current);
    current = step.seed;
    const swap = Math.floor(step.value * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }

  return { items: copy, seed: current };
}

function buildDeck(faction: Faction, seed: number): { board: BoardSide; seed: number } {
  const cards: CardInstance[] = DECKS[faction].cards.map((id, index) => ({
    uid: `${faction}-${id}-${index}`,
    card: CARDS[id],
  }));
  const { items, seed: nextSeed } = shuffle(cards, seed);

  return {
    board: {
      faction,
      hand: items.slice(0, HAND_SIZE),
      deck: items.slice(HAND_SIZE),
      rows: emptyRows(),
    },
    seed: nextSeed,
  };
}

export function createGame(seed: number = Date.now()): GwentState {
  const player = buildDeck("benteng", seed);
  const ai = buildDeck("rawa", player.seed);

  return {
    seed: ai.seed,
    round: 1,
    turn: "player",
    boards: { player: player.board, ai: ai.board },
    passed: { player: false, ai: false },
    weather: [],
    horns: { player: [], ai: [] },
    morale: { player: 0, ai: 0 },
    wins: { player: 0, ai: 0 },
    status: "playing",
    roundResult: null,
    winner: null,
    log: ["Ronde 1 dimulai. Kamu main lebih dulu."],
  };
}

/** Nilai satu kartu di papan, setelah cuaca, terompet, dan moral. */
export function unitValue(state: GwentState, side: Side, row: Row, card: CardDef): number {
  const base = card.strength ?? 0;
  if (card.kind === "hero") return base;

  let value = state.weather.includes(row) ? 1 : base;
  if (state.horns[side].includes(row)) value *= 2;
  return value + state.morale[side];
}

export function rowScore(state: GwentState, side: Side, row: Row): number {
  return state.boards[side].rows[row].reduce(
    (total, inst) => total + unitValue(state, side, row, inst.card),
    0,
  );
}

export function totalScore(state: GwentState, side: Side): number {
  return ROWS.reduce((total, row) => total + rowScore(state, side, row), 0);
}

export interface PlayOutcome {
  state: GwentState;
  error?: string;
}

function placeUnit(state: GwentState, side: Side, row: Row, inst: CardInstance): GwentState {
  const board = state.boards[side];
  return {
    ...state,
    boards: {
      ...state.boards,
      [side]: { ...board, rows: { ...board.rows, [row]: [...board.rows[row], inst] } },
    },
  };
}

/** Hancurkan semua unit non-hero dengan kekuatan dasar tertinggi. */
function scorchBoard(state: GwentState): GwentState {
  let highest = 0;

  for (const side of SIDES) {
    for (const row of ROWS) {
      for (const inst of state.boards[side].rows[row]) {
        if (inst.card.kind === "hero") continue;
        highest = Math.max(highest, inst.card.strength ?? 0);
      }
    }
  }

  if (highest === 0) return state;

  const boards: Record<Side, BoardSide> = { ...state.boards };

  for (const side of SIDES) {
    const board = state.boards[side];
    const rows = { ...board.rows };
    for (const row of ROWS) {
      rows[row] = board.rows[row].filter(
        (inst) => inst.card.kind === "hero" || (inst.card.strength ?? 0) !== highest,
      );
    }
    boards[side] = { ...board, rows };
  }

  return { ...state, boards };
}

function describePlay(side: Side, inst: CardInstance, target?: Row): string {
  const who = SIDE_LABEL[side];
  const name = inst.card.name;
  return target ? `${who} memainkan ${name} di baris ${ROW_LABEL[target]}.` : `${who} memainkan ${name}.`;
}

export function playCard(state: GwentState, side: Side, uid: string, target?: Row): PlayOutcome {
  if (state.status !== "playing") return { state, error: "Pertandingan sudah selesai." };
  if (state.passed[side]) return { state, error: `${SIDE_LABEL[side]} sudah lewat di ronde ini.` };
  if (state.turn !== side) return { state, error: "Bukan giliran pemain itu." };

  const board = state.boards[side];
  const inst = board.hand.find((item) => item.uid === uid);
  if (!inst) return { state, error: "Kartu itu tidak ada di tangan." };

  const card = inst.card;
  const hand = board.hand.filter((item) => item.uid !== uid);
  let next: GwentState = { ...state, boards: { ...state.boards, [side]: { ...board, hand } } };

  if (card.kind === "unit" || card.kind === "hero") {
    if (!card.row) return { state, error: "Kartu unit tanpa baris." };
    next = placeUnit(next, side, card.row, inst);
  } else if (card.kind === "weather") {
    if (!target) return { state, error: "Pilih baris untuk cuaca." };
    next = next.weather.includes(target) ? next : { ...next, weather: [...next.weather, target] };
  } else if (card.kind === "horn") {
    if (!target) return { state, error: "Pilih baris untuk terompet." };
    if (next.horns[side].includes(target)) {
      return { state, error: "Baris itu sudah punya terompet." };
    }
    next = { ...next, horns: { ...next.horns, [side]: [...next.horns[side], target] } };
  } else if (card.kind === "morale") {
    next = { ...next, morale: { ...next.morale, [side]: next.morale[side] + 1 } };
  } else {
    next = scorchBoard(next);
  }

  next = { ...next, log: [...next.log, describePlay(side, inst, target)] };
  return { state: advanceTurn(next, side) };
}

function advanceTurn(state: GwentState, side: Side): GwentState {
  if (state.passed.player && state.passed.ai) return resolveRound(state);
  const other = otherSide(side);
  // Kalau lawan sudah lewat, giliran tetap di pemain yang masih aktif.
  return { ...state, turn: state.passed[other] ? side : other };
}

export function pass(state: GwentState, side: Side): GwentState {
  if (state.status !== "playing" || state.passed[side]) return state;

  const next: GwentState = {
    ...state,
    passed: { ...state.passed, [side]: true },
    log: [...state.log, `${SIDE_LABEL[side]} lewat.`],
  };

  if (next.passed.player && next.passed.ai) return resolveRound(next);
  return { ...next, turn: otherSide(side) };
}

function refill(board: BoardSide, count: number): BoardSide {
  const drawn = board.deck.slice(0, count);
  return {
    ...board,
    hand: [...board.hand, ...drawn],
    deck: board.deck.slice(drawn.length),
    rows: emptyRows(),
  };
}

function resolveRound(state: GwentState): GwentState {
  const player = totalScore(state, "player");
  const ai = totalScore(state, "ai");
  const winner: Side | "draw" = player > ai ? "player" : ai > player ? "ai" : "draw";

  const wins = { ...state.wins };
  if (winner !== "draw") wins[winner] += 1;

  const roundResult: RoundResult = { round: state.round, winner, player, ai };
  const verdict =
    winner === "draw" ? "seri" : `${SIDE_LABEL[winner]} menang`;
  const log = [...state.log, `Ronde ${state.round}: ${player}–${ai} (${verdict}).`];

  if (wins.player >= 2 || wins.ai >= 2 || state.round >= MAX_ROUNDS) {
    const finalWinner: Side | "draw" =
      wins.player > wins.ai ? "player" : wins.ai > wins.player ? "ai" : "draw";
    return {
      ...state,
      wins,
      roundResult,
      status: "over",
      winner: finalWinner,
      passed: { player: true, ai: true },
      log,
    };
  }

  const draws = state.round === 1 ? 2 : 1;

  return {
    ...state,
    round: state.round + 1,
    // Ronde baru dibuka oleh pihak yang kalah ronde sebelumnya.
    turn: winner === "player" ? "ai" : "player",
    boards: { player: refill(state.boards.player, draws), ai: refill(state.boards.ai, draws) },
    passed: { player: false, ai: false },
    weather: [],
    horns: { player: [], ai: [] },
    morale: { player: 0, ai: 0 },
    wins,
    roundResult,
    status: "playing",
    log,
  };
}
