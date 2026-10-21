import { buildDictionary, type DictionaryPayload } from "./engine";
import type { Dictionary, Lang } from "./types";

const cache = new Map<Lang, Promise<Dictionary>>();

async function load(lang: Lang): Promise<Dictionary> {
  // import dinamis: Vite memecah tiap kamus jadi chunk sendiri,
  // jadi pemain ID tidak mengunduh daftar kata English (dan sebaliknya).
  const module =
    lang === "id"
      ? await import("../../data/wordle-id.json")
      : await import("../../data/wordle-en.json");
  return buildDictionary(module.default as unknown as DictionaryPayload);
}

export function loadDictionary(lang: Lang): Promise<Dictionary> {
  const cached = cache.get(lang);
  if (cached) return cached;
  const promise = load(lang);
  cache.set(lang, promise);
  return promise;
}
