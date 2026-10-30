/**
 * Lawan komputer untuk duel tiga baris — murni dan deterministik.
 *
 * Heuristiknya sengaja sederhana: pilih kartu dengan nilai langsung terbaik,
 * simpan hero untuk ronde penentu, dan tutup ronde saat sudah unggul setelah
 * lawan lewat. Fungsi ini juga dipakai tes untuk memainkan satu pertandingan
 * penuh tanpa DOM.
 */

import { ROWS } from "./cards";
import type { Row, Side } from "./cards";
import { otherSide, playCard, rowScore, totalScore, unitValue } from "./engine";
import type { CardInstance, GwentState } from "./engine";

export type AiMove = { kind: "play"; uid: string; target?: Row } | { kind: "pass" };

interface Candidate {
  uid: string;
  target?: Row;
  value: number;
}

function isUnit(inst: CardInstance): boolean {
  return inst.card.kind !== "hero";
}

export function chooseAiMove(state: GwentState, side: Side = "ai"): AiMove {
  if (state.status !== "playing") return { kind: "pass" };
  if (state.turn !== side || state.passed[side]) return { kind: "pass" };

  const board = state.boards[side];
  if (board.hand.length === 0) return { kind: "pass" };

  const foe = otherSide(side);
  const ownScore = totalScore(state, side);
  const foeScore = totalScore(state, foe);

  // Lawan sudah lewat: kalau sudah unggul, tutup ronde tanpa membakar kartu.
  if (state.passed[foe] && ownScore > foeScore) return { kind: "pass" };

  const candidates: Candidate[] = [];

  for (const inst of board.hand) {
    const card = inst.card;

    if (card.kind === "unit" || card.kind === "hero") {
      const row = card.row;
      if (!row) continue;
      const value = unitValue(state, side, row, card);
      // Hero lebih berguna di ronde penentu.
      candidates.push({
        uid: inst.uid,
        value: card.kind === "hero" && state.round < 3 ? value - 2 : value,
      });
      continue;
    }

    if (card.kind === "horn") {
      for (const row of ROWS) {
        if (state.horns[side].includes(row)) continue;
        const units = board.rows[row].filter(isUnit);
        if (units.length < 2) continue;
        const gain = units.reduce(
          (total, item) => total + unitValue(state, side, row, item.card),
          0,
        );
        candidates.push({ uid: inst.uid, target: row, value: gain });
      }
      continue;
    }

    if (card.kind === "weather") {
      for (const row of ROWS) {
        if (state.weather.includes(row)) continue;
        const theirs = rowScore(state, foe, row);
        const ours = rowScore(state, side, row);
        if (theirs <= ours) continue;
        candidates.push({ uid: inst.uid, target: row, value: theirs - ours });
      }
      continue;
    }

    if (card.kind === "morale") {
      const units = ROWS.flatMap((row) => board.rows[row]).filter(isUnit).length;
      if (units > 0) candidates.push({ uid: inst.uid, value: units });
      continue;
    }

    // Bakar: hanya berguna kalau unit terkuat ada di sisi lawan.
    let theirBest = 0;
    let ownBest = 0;
    for (const row of ROWS) {
      for (const item of state.boards[foe].rows[row]) {
        if (item.card.kind !== "hero") {
          theirBest = Math.max(theirBest, item.card.strength ?? 0);
        }
      }
      for (const item of board.rows[row]) {
        if (item.card.kind !== "hero") {
          ownBest = Math.max(ownBest, item.card.strength ?? 0);
        }
      }
    }
    if (theirBest > ownBest && theirBest >= 6) {
      candidates.push({ uid: inst.uid, value: theirBest });
    }
  }

  if (candidates.length === 0) return { kind: "pass" };

  candidates.sort((a, b) => b.value - a.value || a.uid.localeCompare(b.uid));
  const best = candidates[0];
  const outcome = playCard(state, side, best.uid, best.target);

  return outcome.error ? { kind: "pass" } : { kind: "play", uid: best.uid, target: best.target };
}
