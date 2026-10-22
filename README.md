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
npm test           # 108 pemeriksaan (engine, reducer, statistik, ekonomi, format, UI, aset)
npm run build      # tsc --noEmit && vite build -> dist/
npm run preview    # cek hasil build di :4173
npm run dict       # regenerasi kamus Wordle (butuh jaringan)
npm run icons      # regenerasi aset ikon idle (SVG; PNG butuh resvg)
```

Butuh Node 20+.

## Rute

| URL | Isi |
| --- | --- |
| `/` | hub: status harian, kristal idle, katalog game |
| `/wordle` | Wordle (harian/bebas, hard mode, statistik, pengaturan) |
| `/idle` | Idle tambang (kabinet game: HUD, stage inti, tab tambang/riset/lebur/arsip) |

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

## Tema

Default **mode terang**, dan ada tombol matahari/bulan di header setiap halaman untuk pindah ke
gelah. Pilihan disimpan di `localStorage` (`gatrion.theme`) dan diterapkan oleh skrip kecil di
`index.html` sebelum paint, jadi tidak ada kedipan saat memuat ulang.

Seluruh warna berasal dari token di `src/styles/theme.css`: nilai terang di `@theme`, nilai gelap
menimpa variabel yang sama di `[data-theme="dark"]`. Komponen tidak menyimpan warna sendiri,
termasuk tile Wordle dan kartu idle, jadi menambah tema lain cukup menambah satu blok token.

## Idle tambang

Tambang berjalan sendiri sejak detik pertama: tier pertama sudah dimiliki dan **mandor otomatis**
membeli generator untukmu. Klik hanya bonus opsional, bukan syarat progres.

- **10 tier generator** (Pencungkil → Inti Galaksi). Tier berikutnya terbuka setelah 5 unit tier
  sebelumnya; harga unit naik 1.15×.
- **Milestone** di 10/25/50/100/200 unit menggandakan output tier itu — sampai ×32 di puncak.
- **Riset putaran** (direset saat lebur): *Gerbang gigi* (×1.25 produksi, 20 level) dan
  *Jadwal jaga* (efisiensi offline 50% → 100%, 5 level).
- **Peleburan (prestise)**: kumpulkan total 1 juta kristal dalam satu putaran → inti permanen
  (3 inti, lalu +3 setiap total naik 10×) supaya satu putaran panjang tidak menghasilkan ribuan
  inti. Inti menaikkan produksi selamanya (×1.15/level) dan membeli *Modal awal*, *Mandor cepat*,
  serta *Gudang dalam*.
- Mandor otomatis membeli 1 unit tiap 0,5 detik dan bisa dipercepat sampai 5 unit.
- Beli borongan **x1 / x10 / max** (harga deret geometri, bukan `harga × 10`).
- Progres offline: 50% laju (bisa sampai 100%), maksimal 8 jam (+2 jam per *Gudang dalam*),
  minimum 1 menit — muncul sebagai dialog saat kembali.
- **18 pencapaian**; pencapaian yang syaratnya sudah terpenuhi langsung terbuka saat save dimuat.
- Auto-save tiap 3 detik dan saat tab ditutup; skema save v3, save v1/v2 dimigrasikan otomatis.
- **Tata letak kabinet**: HUD (inti, tier, status mandor) di atas, stage inti tambang yang bisa
  diketuk sebagai bonus, jalur kedalaman 10 segmen, lalu dock bertab — tambang, riset, lebur, dan
  arsip — supaya semua panel tidak menumpuk jadi satu halaman panjang.

## Aset idle

Sepuluh tier punya lambang sendiri, dari pencungkil sampai inti galaksi, plus ikon garis kecil untuk
HUD (kristal, inti, mandor, riset, gembok). Semua dibuat sendiri oleh generator di
`tools/build-idle-icons.mjs` — tidak ada aset pihak ketiga.

- **PNG 192×192** di `public/icons/idle/<tier>.png` dipakai langsung oleh kartu tier dan inti di
  stage (`.tier-icon`, `.core-icon`).
- **SVG sumber** di folder yang sama bisa diedit lalu diregenerasi; skrip menulis ulang keduanya.
- Ikon memakai *plat* gelap bergaya slot item, jadi tetap terbaca di tema terang maupun gelap tanpa
  perlu dua set gambar. Gaya: garis krem 3–4px, aksen lime untuk kristal dan amber untuk energi.
- Ikon garis di HUD memakai `currentColor` (`components/Glyphs.tsx`), jadi otomatis ikut warna teks.

PNG dibuat dengan `@resvg/resvg-js` yang **tidak** menjadi dependency proyek:

```bash
npm install --prefix .cache/render @resvg/resvg-js
node tools/build-idle-icons.mjs --sheet   # sekalian contact sheet di .cache/idle-icons/
```

Tanpa resvg skrip tetap menulis SVG saja. `iconAssets.test.ts` memastikan setiap tier punya PNG
192px yang valid dan SVG sumbernya, jadi nama file tidak bisa melenceng dari id tier.

## Struktur

```
index.html
vite.config.ts            plugin react + tailwind, alokasi host preview, config vitest
src/
  main.tsx, App.tsx       router
  styles/theme.css        design token (terang + gelap) & komponen (tile, key, seg, kabinet idle)
  components/             Shell (nav/footer), ThemeToggle, SegmentedControl, Switch, Toast
  lib/storage.ts          wrapper localStorage bertipe + versi
  lib/theme.ts            muat/simpan/terapkan tema terang-gelap
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
    economy.ts            tier, milestone, riset, inti, prestise, auto-beli, offline (pure)
    storage.ts, useIdleGame.ts
    IdlePage.tsx, components/{ShopList,UpgradesPanel,PrestigePanel,PrestigeDialog,AutoSection,ClickPad,AchievementsList,OfflineDialog,Glyphs}.tsx
  data/wordle-id.json, wordle-en.json   kamus hasil generator (jangan diedit manual)
  test/setup.ts
public/icons/idle/        aset lambang tier (PNG 192px + SVG sumber)
tools/build-wordle-dict.js            generator kamus (Node murni, tanpa dependency)
tools/build-idle-icons.mjs            generator aset ikon idle (SVG, PNG opsional)
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
| `gatrion.theme` | `light` (default) atau `dark` |
| `gatrion.idle.save` | kristal, tier, riset, inti, upgrade permanen, pencapaian, waktu terakhir |

Kunci lama (`gatrion.wordle.stats`, `gatrion.wordle.lang`, idle v1) dimigrasikan otomatis.

## Catatan teknis

- Status tile/keyboard memakai atribut `data-state="correct|present|absent"`; logika game tidak
  pernah menyentuh nama class warna, jadi tema cukup diganti dari `src/styles/theme.css`.
- Tema aktif ditandai `data-theme` pada `<html>`; `color-scheme` ikut berubah sehingga scrollbar dan
  kontrol bawaan browser menyesuaikan.
- Semua aset (CSS, font, kamus) ikut di-bundle — situs jalan offline setelah load pertama.

## Roadmap

1. Arsip puzzle harian yang terlewat.
2. Wordle: statistik hard mode terpisah, mode "quordle".
3. Idle: ascension kedua setelah semua tier terbuka.
4. Game ketiga: 2048 atau typing sprint.
