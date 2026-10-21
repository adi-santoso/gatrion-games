# gatrion-games

Dua game browser untuk mengisi jeda kerja: **Wordle dua bahasa** dan **Idle tambang**.
Tanpa login, tanpa backend — semua progres disimpan di `localStorage`.

## Stack

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Build | **Vite 8** | dev server + HMR, build statis, code splitting per kamus |
| UI | **React 19** + **react-router-dom 7** | layar game adalah state machine; satu `useReducer` per game |
| Bahasa | **TypeScript** (strict) | skema save v1→v2, 3 status tile × 2 mode × 2 bahasa |
| Style | **Tailwind CSS 4** via `@tailwindcss/vite` | CSS ter-build, tanpa FOUC |
| Font | **@fontsource-variable** (Bricolage Grotesque, Inter, JetBrains Mono) | self-host, situs jalan tanpa internet |
| Test | **Vitest** + **@testing-library/react** (jsdom) | engine & alur UI |

Tidak ada dependency runtime dari CDN: `npm run build` menghasilkan `dist/` statis yang bisa
ditaruh di hosting mana pun (Netlify, Cloudflare Pages, GitHub Pages, nginx).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 62 pemeriksaan (engine, reducer, statistik, ekonomi, format, UI)
npm run build      # tsc --noEmit && vite build -> dist/
npm run preview    # cek hasil build di :4173
npm run dict       # regenerasi kamus Wordle (butuh jaringan)
```

Butuh Node 20+.

## Rute

| URL | Isi |
| --- | --- |
| `/` | hub: status harian, kristal idle, katalog game |
| `/wordle` | Wordle (harian/bebas, hard mode, statistik, pengaturan) |
| `/idle` | Idle tambang (generator, pencapaian, dialog offline) |

## Wordle

- **Puzzle harian** — jawaban diturunkan dari tanggal (seed `lang:puzzle`), nomor puzzle mulai
  1 Januari 2024. Berganti otomatis saat lewat tengah malam walau tab dibiarkan terbuka.
- **Mode bebas** — kata acak tanpa batas, tombol "kata baru".
- **Kamus lengkap** — 14.170 kata Indonesia (KBBI v6.1.0) dan 14.855 kata English (daftar resmi
  Wordle). Jawaban diambil dari subset kata umum: 2.549 (ID) dan 2.315 (EN).
- **Hard mode** — huruf hijau harus tetap di posisi, huruf kuning wajib dipakai lagi; pelanggaran
  ditolak dengan alasan spesifik.
- **Statistik per bahasa** — main, win rate, streak, distribusi tebakan, streak harian terpisah.
- **Share** — grid emoji + mode, nomor puzzle, bahasa, penanda hard (clipboard API + fallback).
- Keyboard fisik + on-screen, penolakan kata di luar kamus, `aria-live` untuk pembaca layar.

Kamus di-*code split*: import dinamis per bahasa, jadi pemain ID tidak mengunduh daftar kata
English. Tidak ada request jaringan saat bermain.

## Idle tambang

- Klik untuk menambang, 6 tier generator (Pencungkil → Singularitas), harga naik 1.15×.
- Beli borongan **x1 / x10 / max** (harga deret geometri, bukan `harga × 10`).
- Upgrade klik dan **8 pencapaian** yang tersimpan; pencapaian yang syaratnya sudah terpenuhi
  langsung terbuka saat save dimuat.
- Progres offline: 50% laju, maksimal 8 jam, minimum 1 menit — muncul sebagai dialog saat kembali.
- Auto-save tiap 3 detik dan saat tab ditutup; skema save v2 dengan migrasi otomatis dari v1.

## Struktur

```
index.html
vite.config.ts            plugin react + tailwind, alokasi host preview, config vitest
src/
  main.tsx, App.tsx       router
  styles/theme.css        design token + komponen (tile, key, seg, bar, pad)
  components/             Shell (nav/footer), SegmentedControl, Switch, Toast
  lib/storage.ts          wrapper localStorage bertipe + versi
  lib/format.ts           format angka (id-ID)
  pages/HubPage.tsx       status harian + kristal dibaca dari storage
  games/wordle/
    engine.ts             skor huruf ganda, hard mode, seed harian (pure)
    engine.test.ts        integritas kamus, skor, hard mode, determinisme seed
    dictionary.ts         loader dinamis per bahasa
    reducer.ts            state machine permainan (sudah dites)
    storage.ts, stats.ts, share.ts
    useWordle.ts          hook: persistensi, rollover harian, keyboard
    WordlePage.tsx, components/{Board,Keyboard,StatsPanel,SettingsDialog}.tsx
  games/idle/
    economy.ts            biaya, produksi, progres offline (pure)
    storage.ts, useIdleGame.ts
    IdlePage.tsx, components/{ClickPad,ShopList,AchievementsList,OfflineDialog}.tsx
  data/wordle-id.json, wordle-en.json   kamus hasil generator (jangan diedit manual)
  test/setup.ts
tools/build-wordle-dict.js            generator kamus (Node murni, tanpa dependency)
```

## Kamus

Kamus dibangun dari sumber publik, bukan diketik manual:

| Bagian | Sumber |
| --- | --- |
| Jawaban EN (2.315) | daftar jawaban resmi Wordle (gist `cfreeman`) |
| Tebakan EN (14.855) | daftar kata yang diterima Wordle (gist `dracos`) |
| Tebakan ID (14.170) | KBBI v6.1.0 — `aryakdaniswara/kbbi-v6-wordlist` |
| Jawaban ID (2.549) | irisan KBBI dengan daftar frekuensi bahasa Indonesia (`hermitdave/FrequencyWords`) |

```bash
npm run dict              # pakai cache .cache/wordle-dict
node tools/build-wordle-dict.js --refresh   # unduh ulang semua sumber
```

Aturan yang dijaga generator dan diuji ulang di `engine.test.ts`: semua kata tepat 5 huruf a-z,
tanpa duplikat, jawaban selalu bagian dari daftar tebakan, dan jumlah di metadata sama dengan isi.

## Data yang disimpan

| Key | Isi |
| --- | --- |
| `gatrion.wordle.settings.v2` | bahasa, mode, hard mode |
| `gatrion.wordle.games.v2` | state permainan harian & bebas per bahasa |
| `gatrion.wordle.stats.v2` | statistik + streak harian per bahasa |
| `gatrion.idle.save` | kristal, generator, pencapaian, waktu terakhir |

Kunci lama (`gatrion.wordle.stats`, `gatrion.wordle.lang`, idle v1) dimigrasikan otomatis.

## Catatan teknis

- Status tile/keyboard memakai atribut `data-state="correct|present|absent"`; logika game tidak
  pernah menyentuh nama class warna, jadi tema cukup diganti dari `src/styles/theme.css`.
- Semua aset (CSS, font, kamus) ikut di-bundle — situs jalan offline setelah load pertama.

## Roadmap

1. Arsip puzzle harian yang terlewat.
2. Wordle: statistik hard mode terpisah, mode "quordle".
3. Idle: prestige dengan bonus permanen.
4. Game ketiga: 2048 atau typing sprint.
