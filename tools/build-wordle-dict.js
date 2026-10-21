#!/usr/bin/env node
/**
 * Membangun kamus Wordle lengkap ke src/data/wordle-{id,en}.json
 *
 *   npm run dict              # pakai cache .cache/wordle-dict
 *   node tools/build-wordle-dict.js --refresh
 *
 * Sumber:
 *  - EN jawaban : daftar jawaban resmi Wordle (gist cfreeman, 2.315 kata)
 *  - EN tebakan : kata yang diterima Wordle (gist dracos, ±14.8k)
 *  - ID tebakan : KBBI v6.1.0 (aryakdaniswara/kbbi-v6-wordlist), kata 5 huruf
 *  - ID jawaban : irisan KBBI dengan frekuensi bahasa Indonesia (hermitdave),
 *                 supaya jawaban harian tetap kata yang umum dipakai
 */
"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, ".cache", "wordle-dict");
const OUT_DIR = path.join(ROOT, "src", "data");

const SOURCES = {
  "en-answers.txt": "https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt",
  "en-guesses.txt": "https://gist.githubusercontent.com/dracos/dd0668f281e685bad51479e5acaadb93/raw/valid-wordle-words.txt",
  "id-kbbi.txt": "https://raw.githubusercontent.com/aryakdaniswara/kbbi-v6-wordlist/main/all_entries_v6.1.0.txt",
  "id-freq.txt": "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/id/id_50k.txt",
};

const WORD_RE = /^[a-z]{5}$/;
const refresh = process.argv.includes("--refresh");

async function fetchToCache(name, url) {
  const file = path.join(CACHE, name);
  if (!refresh && fs.existsSync(file) && fs.statSync(file).size > 1000) {
    return fs.readFileSync(file, "utf8");
  }
  process.stdout.write("unduh " + name + " … ");
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error("gagal unduh " + url + " (" + res.status + ")");
  const text = await res.text();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, text);
  console.log(Math.round(text.length / 1024) + " KB");
  return text;
}

/** Baris -> kata 5 huruf kecil yang unik. */
function toWords(text) {
  const out = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const word = raw.trim().toLowerCase();
    if (WORD_RE.test(word)) out.add(word);
  }
  return out;
}

const sorted = (set) => Array.from(set).sort();

async function main() {
  const [enAnswersRaw, enGuessesRaw, idKbbiRaw, idFreqRaw] = await Promise.all([
    fetchToCache("en-answers.txt", SOURCES["en-answers.txt"]),
    fetchToCache("en-guesses.txt", SOURCES["en-guesses.txt"]),
    fetchToCache("id-kbbi.txt", SOURCES["id-kbbi.txt"]),
    fetchToCache("id-freq.txt", SOURCES["id-freq.txt"]),
  ]);

  const enAnswers = toWords(enAnswersRaw);
  const enGuesses = toWords(enGuessesRaw);
  for (const w of enAnswers) enGuesses.add(w);

  const idGuesses = toWords(idKbbiRaw);
  const freq = new Map();
  for (const line of idFreqRaw.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const word = parts[0].toLowerCase();
    const count = Number(parts[1]);
    if (!WORD_RE.test(word) || !Number.isFinite(count)) continue;
    if (!freq.has(word) || freq.get(word) < count) freq.set(word, count);
  }
  const idAnswers = new Set(Array.from(idGuesses).filter((w) => freq.has(w)));
  for (const w of idAnswers) idGuesses.add(w);

  for (const w of enAnswers) if (!enGuesses.has(w)) throw new Error("EN answer di luar guesses: " + w);
  for (const w of idAnswers) if (!idGuesses.has(w)) throw new Error("ID answer di luar guesses: " + w);

  const generatedAt = new Date().toISOString().slice(0, 10);
  const payloads = {
    en: {
      meta: {
        generatedAt,
        answers: enAnswers.size,
        guesses: enGuesses.size,
        answerSource: "Wordle official answers (gist cfreeman)",
        guessSource: "Wordle accepted words (gist dracos)",
      },
      answers: sorted(enAnswers),
      guesses: sorted(enGuesses),
    },
    id: {
      meta: {
        generatedAt,
        answers: idAnswers.size,
        guesses: idGuesses.size,
        answerSource: "KBBI v6.1.0 ∩ frekuensi bahasa Indonesia (hermitdave)",
        guessSource: "KBBI v6.1.0 (aryakdaniswara/kbbi-v6-wordlist)",
      },
      answers: sorted(idAnswers),
      guesses: sorted(idGuesses),
    },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const lang of ["id", "en"]) {
    const file = path.join(OUT_DIR, "wordle-" + lang + ".json");
    fs.writeFileSync(file, JSON.stringify(payloads[lang], null, 0) + "\n");
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(
      lang + ": " + payloads[lang].answers.length + " jawaban, " +
      payloads[lang].guesses.length + " tebakan -> " + path.relative(ROOT, file) + " (" + kb + " KB)"
    );
  }

  console.log("semua kata 5 huruf, unik, jawaban ⊆ tebakan.");
}

main().catch((err) => {
  console.error("gagal: " + err.message);
  process.exit(1);
});
