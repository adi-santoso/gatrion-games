# gatrion-games

Dua game browser untuk mengisi jeda kerja: **Wordle dua bahasa** dan **Idle tambang**.
Keduanya dibuka di dalam desktop bergaya macOS — jendela yang bisa digeser, dock, menu bar, dan
Spotlight — tetapi tetap satu SPA tanpa login dan tanpa backend. Semua progres disimpan di
`localStorage`.

## Stack

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Build | **Vite 8** | dev server + HMR, build statis, code splitting per kamus |
| UI | **React 19** + **react-router-dom 7** | layar game adalah state machine; satu `useReducer` per game |
| Desktop | window manager sendiri (`src/desktop`) | posisi, fokus, minimize, dan zoom jendela disimpan per pengguna |
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
npm test           # 174 pemeriksaan (engine, reducer, statistik, ekonomi, format, UI, aset, desktop)
npm run build      # tsc --noEmit && vite build -> dist/
npm run preview    # cek hasil build di :4173
npm run dict       # regenerasi kamus Wordle (butuh jaringan)
npm run icons      # regenerasi aset ikon idle (SVG; PNG butuh resvg)
```

Butuh Node 20+.

## Desktop

Seluruh situs adalah satu desktop. Halaman beranda menjadi aplikasi **Gatrion**, dan setiap game
terbuka sebagai jendela aplikasi sendiri.

- **Menu bar** — logo Gatrion (Tentang, Pengaturan Sistem, sembunyikan, tutup semua), menu aplikasi
  yang sedang aktif (Tentang, Keluar ⌘Q), Berkas (Jendela Baru ⌘N, Tutup ⌘W), Tampilan (mode
  terang/gelap, perbesar, Mission Control), Jendela (minimalkan, daftar jendela), dan Bantuan.
  Bagian kanan: Spotlight, Pusat Kendali (tema, animasi, ukuran dock, atur ulang tata letak), status
  jaringan, baterai (kalau browser mendukung), serta jam dan kalender.
- **Jendela** — tiga lampu lalu lintas (tutup, minimize, perbesar), judul di tengah, bisa digeser
  dari title bar, di-resize dari delapan sisi, dan di-double-click untuk zoom. Jendela tidak aktif
  meredup seperti macOS; fokus teratas menentukan menu aplikasi.
- **Dock** — Launchpad, ikon tiap aplikasi, pintasan Pengaturan, dan thumbnail jendela yang
  diperkecil. Ikon membesar saat kursor mendekat (magnifikasi), titik kecil menandai aplikasi yang
  berjalan. Ukuran dock bisa kecil, sedang, atau besar.
- **Cmd+Tab** — HUD ikon aplikasi yang berjalan; Tab memutar pilihan, lepas ⌘ untuk pindah, Esc
  membatalkan. ⌘` memutar jendela aplikasi yang sama.
- **Spotlight** (⌘Space atau ⌘K) — cari aplikasi dan perintah (ganti tema, Mission Control, atur
  ulang tata letak, tutup semua jendela).
- **Mission Control** (⌃↑ atau F3) — semua jendela dalam satu layar; klik untuk fokus.
- **Launchpad** — kisi semua aplikasi, klik di luar atau Esc untuk menutup.
- **Tata letak tersimpan** — posisi, ukuran, status zoom, dan fokus jendela disimpan di
  `gatrion.desktop.windows.v1`; preferensi dock/animasi di `gatrion.desktop.prefs.v1`.

Pintasan ⌘ yang juga dipakai browser (⌘W, ⌘N, ⌘T) bisa ditangkap browser lebih dulu; semua aksi yang
sama selalu tersedia di menu. Di layar sempit (≤780px) jendela otomatis memenuhi layar tanpa resize,
dan dock mengecil.

## Rute

SPA memakai satu rute; URL lama tetap berfungsi sebagai deep link yang membuka jendelanya lalu
kembali ke `/`.

| URL | Hasil |
| --- | --- |
| `/` | desktop dengan jendela Gatrion (atau tata letak terakhir) |
| `/wordle` | membuka jendela Wordle |
| `/idle` | membuka jendela Idle tambang |
| `/settings` | membuka jendela Pengaturan Sistem |

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

Default **mode terang**, dan tema bisa diganti dari Pusat Kendali di menu bar, dari aplikasi
Pengaturan Sistem, atau dari tombol matahari/bulan di panel idle. Semua tombol memakai satu store
tema (`lib/theme.ts`), jadi tidak ada dua panel yang bisa berbeda mode. Pilihan disimpan di
`localStorage` (`gatrion.theme`) dan diterapkan oleh skrip kecil di `index.html` sebelum paint, jadi
tidak ada kedipan saat memuat ulang.

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
  main.tsx, App.tsx       satu rute: <Desktop />
  styles/theme.css        design token (terang + gelap) & komponen (tile, key, seg, kabinet idle)
  styles/desktop.css      chrome macOS: wallpaper, menu bar, dock, jendela, overlay
  components/             Shell (nav/footer), ThemeToggle, SegmentedControl, Switch, Toast
  lib/storage.ts          wrapper localStorage bertipe + versi
  lib/theme.ts            store tema terang-gelap (dipakai menu bar & panel game)
  lib/format.ts           format angka (id-ID)
  pages/HubPage.tsx       isi jendela Gatrion: katalog game, pintasan, status
  desktop/
    types.ts, geometry.ts        tipe jendela + hitung posisi, clamp, cascade, resize (pure)
    storage.ts, useWindowManager.ts  buka/fokus/tutup/minimize/zoom + persistensi tata letak
    usePrefs.ts                 preferensi dock & animasi
    apps.tsx                    katalog aplikasi + pemetaan deep link
    context.tsx                 API desktop untuk aplikasi di dalam jendela
    components/Desktop.tsx      perakitan desktop, pintasan papan ketik, overlay
    components/{MenuBar,Dock,WindowFrame,Spotlight,MissionControl,Launchpad,AboutDialog,AppSwitcher,SettingsApp}.tsx
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
| `gatrion.desktop.windows.v1` | aplikasi, posisi, ukuran, zoom, minimize, dan fokus tiap jendela |
| `gatrion.desktop.prefs.v1` | ukuran dock dan pengaturan kurangi animasi |

Kunci lama (`gatrion.wordle.stats`, `gatrion.wordle.lang`, idle v1) dimigrasikan otomatis.

## Catatan teknis

- Status tile/keyboard memakai atribut `data-state="correct|present|absent"`; logika game tidak
  pernah menyentuh nama class warna, jadi tema cukup diganti dari `src/styles/theme.css`.
- Tema aktif ditandai `data-theme` pada `<html>`; `color-scheme` ikut berubah sehingga scrollbar dan
  kontrol bawaan browser menyesuaikan.
- Semua aset (CSS, font, kamus) ikut di-bundle — situs jalan offline setelah load pertama.
- Window manager memakai koordinat piksel di atas menu bar, jadi jendela tetap di tempatnya saat
  viewport berubah ukuran (posisinya di-clamp, bukan di-reset). Nilai `z-index` jendela dirapikan
  otomatis sebelum menabrak lapisan menu bar (46–50).
- Game idle aslinya memakai `100vh` untuk sidebar-nya; di dalam jendela nilainya ditimpa menjadi
  `height: 100%` supaya layout mengikuti jendela, bukan viewport. Di bawah 880px layout idle jadi
  satu kolom dan jendela yang menggulir.
- Wordle menerima prop `active`; jendela yang tidak fokus berhenti menangkap ketikan, dan input
  Spotlight/pengaturan tidak pernah masuk ke papan permainan.
- Navigasi samping idle memakai `revealElement` (`games/idle/scroll.ts`): target diratakan ke atas di
  dalam kontainer yang benar-benar menggulir, dan tidak ada gulir kalau target sudah terlihat. Dulu
  `scrollIntoView({ block: "center" })` menggeser kabinet 1400px ke tengah, jadi klik menu langsung
  melompat turun.

## Roadmap

1. Arsip puzzle harian yang terlewat.
2. Wordle: statistik hard mode terpisah, mode "quordle".
3. Idle: ascension kedua setelah semua tier terbuka.
4. Game ketiga: 2048 atau typing sprint.
