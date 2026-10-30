/**
 * Katalog 40 kartu untuk Duel Kartu (ala Gwent).
 *
 * Nama kartu orisinal. Art: ikon game-icons.net (CC BY 3.0) — satu ikon per
 * kartu, dipilih agar mencerminkan karakternya. Lihat `artCredits.ts`.
 */

export type Row = "melee" | "ranged" | "siege";
export type Side = "player" | "ai";
export type Faction = "benteng" | "rawa";

export type CardKind = "unit" | "hero" | "weather" | "horn" | "scorch" | "morale";

export interface CardDef {
  id: string;
  name: string;
  kind: CardKind;
  /** hanya untuk unit & hero */
  row?: Row;
  /** hanya untuk unit & hero */
  strength?: number;
  text: string;
  /** path publik ke ikon kartu */
  art: string;
}

export const ROWS: readonly Row[] = ["melee", "ranged", "siege"];

export const ROW_LABEL: Record<Row, string> = {
  melee: "Dekat",
  ranged: "Jauh",
  siege: "Kepung",
};

export const SIDE_LABEL: Record<Side, string> = {
  player: "Kamu",
  ai: "Lawan",
};

export const FACTION_LABEL: Record<Faction, string> = {
  benteng: "Benteng Utara",
  rawa: "Kawanan Rawa",
};

/** Cuaca dan terompet butuh baris sasaran sebelum dimainkan. */
export function needsTarget(card: CardDef): boolean {
  return card.kind === "weather" || card.kind === "horn";
}

function art(id: string): string {
  return `/art/kartu/${id}.svg`;
}

function unit(id: string, name: string, row: Row, strength: number): CardDef {
  return {
    id,
    name,
    kind: "unit",
    row,
    strength,
    text: `Unit ${ROW_LABEL[row]} · kekuatan ${strength}.`,
    art: art(id),
  };
}

function hero(id: string, name: string, row: Row, strength: number): CardDef {
  return {
    id,
    name,
    kind: "hero",
    row,
    strength,
    text: "Hero: kebal cuaca, terompet, dan pembakaran.",
    art: art(id),
  };
}

function effect(id: string, name: string, kind: CardKind, text: string): CardDef {
  return { id, name, kind, text, art: art(id) };
}

const BENTENG: CardDef[] = [
  unit("b-prajurit", "Prajurit Perisai", "melee", 4),
  unit("b-ksatria", "Ksatria Baja", "melee", 6),
  unit("b-penjaga", "Penjaga Gerbang", "melee", 5),
  unit("b-panji", "Pembawa Panji", "melee", 5),
  unit("b-pemanah", "Pemanah Jitu", "ranged", 5),
  unit("b-silang", "Penembak Silang", "ranged", 4),
  unit("b-tabib", "Tabib Medan", "ranged", 3),
  unit("b-balista", "Balista", "siege", 6),
  unit("b-katapel", "Katapel Api", "siege", 8),
  unit("b-dentum", "Menara Dentum", "siege", 7),
  unit("b-kavaleri", "Kavaleri Ringan", "melee", 5),
  unit("b-tabur", "Tabur Api", "ranged", 6),
  unit("b-menara-panah", "Menara Panah", "siege", 5),
  unit("b-obor", "Obor Suci", "ranged", 4),
  hero("b-jenderal", "Jenderal Utara", "melee", 12),
  hero("b-penjaga-agung", "Penjaga Agung", "ranged", 10),
  hero("b-pengepung", "Mesin Pengepung", "siege", 11),
  hero("b-panglima", "Panglima Perang", "melee", 11),
];

const RAWA: CardDef[] = [
  unit("r-serigala", "Serigala Rawa", "melee", 6),
  unit("r-raksasa", "Raksasa Lumpur", "melee", 8),
  unit("r-gigit", "Gigit Beracun", "melee", 4),
  unit("r-kelelawar", "Kawanan Kelelawar", "ranged", 5),
  unit("r-dengung", "Dengung Sayap", "ranged", 3),
  unit("r-lontar", "Lontar Batu", "siege", 6),
  unit("r-pohon", "Pohon Tua", "siege", 7),
  unit("r-ular-rawa", "Ular Rawa", "ranged", 4),
  unit("r-katak", "Katak Raksasa", "ranged", 6),
  unit("r-laba", "Laba-Laba Rawa", "ranged", 4),
  unit("r-burung", "Burung Bangkai", "ranged", 5),
  unit("r-akar", "Akar Menjalar", "siege", 5),
  unit("r-kabut", "Kabut Rawa", "ranged", 2),
  unit("r-iblis", "Iblis Lumpur", "melee", 9),
  hero("r-ratu", "Ratu Rawa", "melee", 13),
  hero("r-mata", "Mata Rawa", "ranged", 9),
  hero("r-tengkorak", "Tengkorak Berbicara", "ranged", 8),
  hero("r-raja", "Raja Rawa", "melee", 14),
];

const SPECIALS: CardDef[] = [
  effect("s-cuaca", "Cuaca Buruk", "weather", "Semua unit non-hero di satu baris (kedua pihak) menjadi 1."),
  effect("s-terompet", "Terompet Perang", "horn", "Gandakan nilai unit non-hero di satu baris milikmu."),
  effect("s-bakar", "Bakar", "scorch", "Hancurkan unit non-hero terkuat di kedua sisi papan."),
  effect("s-moral", "Semangat Pasukan", "morale", "+1 untuk setiap unit non-hero milikmu sampai ronde berakhir."),
];

export const CARDS: Record<string, CardDef> = Object.fromEntries(
  [...BENTENG, ...RAWA, ...SPECIALS].map((card) => [card.id, card]),
);

/** 40 kartu berbeda; dek memakai sebagian kartu lebih dari satu kali. */
export const CARD_COUNT = Object.keys(CARDS).length;

export const DECKS: Record<Faction, { name: string; cards: string[] }> = {
  benteng: {
    name: FACTION_LABEL.benteng,
    cards: [
      "b-prajurit",
      "b-prajurit",
      "b-ksatria",
      "b-ksatria",
      "b-penjaga",
      "b-panji",
      "b-pemanah",
      "b-silang",
      "b-tabib",
      "b-balista",
      "b-katapel",
      "b-dentum",
      "b-kavaleri",
      "b-tabur",
      "b-menara-panah",
      "b-obor",
      "b-jenderal",
      "b-penjaga-agung",
      "b-pengepung",
      "b-panglima",
      "s-cuaca",
      "s-terompet",
      "s-bakar",
      "s-moral",
    ],
  },
  rawa: {
    name: FACTION_LABEL.rawa,
    cards: [
      "r-serigala",
      "r-serigala",
      "r-raksasa",
      "r-gigit",
      "r-gigit",
      "r-kelelawar",
      "r-dengung",
      "r-lontar",
      "r-lontar",
      "r-pohon",
      "r-ular-rawa",
      "r-katak",
      "r-laba",
      "r-laba",
      "r-burung",
      "r-akar",
      "r-kabut",
      "r-iblis",
      "r-ratu",
      "r-mata",
      "r-tengkorak",
      "s-cuaca",
      "s-terompet",
      "s-bakar",
    ],
  },
};
