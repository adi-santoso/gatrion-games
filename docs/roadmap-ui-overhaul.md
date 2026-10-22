# Roadmap: Gatrion UI overhaul

## Tujuan produk

Membawa game idle tambang menuju komposisi dan nuansa mockup `docs/ui_overhaul.png`: layar dunia sebagai fokus, navigasi sisi, HUD sumber daya di atas, panel aktivitas dan aksi cepat, serta panel Bangunan, Riset, Peta Dunia, dan Inventory.

Mockup menjadi sasaran visual dan susunan informasi. Fondasi permainan tetap idle game yang sudah ada: produksi kristal, generator bertingkat, riset putaran, peleburan, mandor otomatis, progres offline, dan pencapaian. Sistem baru ditambahkan hanya jika diperlukan agar kontrol yang terlihat di mockup punya fungsi nyata. Jangan menampilkan nilai sumber daya, tombol, misi, atau aktivitas palsu.

## Aturan setiap milestone

- Setiap milestone berakhir pada build yang dapat dimainkan, bukan layar statis atau tombol placeholder.
- Produksi idle, klik bonus, pembelian, riset, peleburan, auto-buy, penyimpanan, dan progres offline yang sudah ada tetap bekerja kecuali sebuah milestone secara eksplisit menggantinya dengan padanan yang sudah berfungsi.
- Navigasi hanya menampilkan tujuan yang bisa dibuka. Tiap aksi yang tampak harus melakukan aksi nyata atau menjelaskan syaratnya.
- Save lama tetap dapat dimuat. Perubahan skema dilakukan dengan migrasi berurutan dan nilai awal yang aman; progres lama tidak dihapus.
- Tiap milestone dicek pada save baru dan save lama, desktop dan mobile. Pemeriksaan ini adalah kriteria penerimaan, bukan klaim bahwa sudah dijalankan.

## Milestone

### M0 — Spesifikasi interaksi dan pemetaan sistem (selesai)

**Hasil:** keputusan implementasi disimpan di [idle-ui-overhaul-spec.md](idle-ui-overhaul-spec.md): pemetaan panel, aturan ekonomi, persistensi, perilaku desktop/mobile, dan urutan implementasi.

- 10 generator lama menjadi bangunan tambang penghasil kristal; inti tetap mata uang peleburan permanen.
- Mockup akan memiliki kayu, batu, dan herbal sebagai material putaran baru, tetapi hanya ditampilkan setelah sumber dan kegunaannya tersedia.
- Mandor memetakan aktivitas berjalan dan menjadi karakter awal; rekrutmen tambahan serta misi harian adalah sistem baru.
- Peta zona diturunkan dari tier generator. Reset pada quick action berarti peleburan dengan konfirmasi.
- Dashboard desktop mengikuti komposisi mockup; mobile memakai navigasi ringkas dan panel bertab/accordion.

**Masih bisa dimainkan:** game belum berubah; seluruh loop saat ini tetap menjadi baseline.

**Selesai bila:** setiap area mockup punya sumber state dan aksi yang jelas, aturan reset/persistensi ditetapkan, dan fitur baru tidak ditampilkan sebelum loop-nya selesai.

### M1 — Kerangka navigasi dan tata letak dunia (selesai)

**Hasil:** bentuk layar mengikuti hierarki mockup: navigasi sisi, HUD atas, area utama, panel samping, dan area panel bawah.

- Bangun kerangka responsif; pada layar kecil, navigasi sisi berubah menjadi navigasi ringkas yang tetap mudah dijangkau.
- Pindahkan fitur lama ke tujuan yang sesuai tanpa mengubah rumus ekonomi: Bangunan/Tambang untuk generator, Riset untuk upgrade putaran, Inventory/Arsip untuk statistik dan pencapaian, Peta untuk progres tier.
- Panel aktivitas dan aksi cepat hanya menautkan ke fitur yang memang sudah dapat dipakai.
- Pertahankan fallback akses ke seluruh fitur jika layout baru belum memuat sebuah panel.
- Implementasi: sidebar desktop dan menu horizontal mobile; Home membuka kabinet tambang, Character menuju mandor, Inventory ke arsip/statistik, Upgrade ke riset, Peta Dunia ke strip progres tier, dan Settings ke tema. Tautan ke hub dan Wordle tetap tersedia.

**Masih bisa dimainkan:** pemain dapat mengumpulkan kristal, mengetuk bonus, membeli generator, mengganti tab, membuka riset/peleburan/arsip, dan menyimpan progres dari layout baru.

**Selesai bila:** tidak ada navigasi mati; semua fitur lama dapat ditemukan dan dipakai di desktop maupun mobile.

### M2 — Layar utama tambang dan HUD

**Hasil:** area tambang menjadi fokus visual seperti area dunia pada mockup, dengan status dan aksi utama yang terbaca sekilas.

- Ganti panggung inti dengan ilustrasi/scene tambang, kristal yang dapat diketuk, umpan balik klik, dan label sektor aktif.
- Susun HUD untuk kristal, laju produksi, inti, tier, dan status mandor. Nilainya berasal langsung dari save dan fungsi ekonomi.
- Tampilkan aktivitas produksi yang benar-benar aktif serta aksi cepat untuk menuju Bangunan, Riset, dan peleburan.
- Pertahankan keterbacaan angka, kontrol keyboard/aksesibilitas, dan reduced motion.

**Masih bisa dimainkan:** klik memberi bonus, produksi berjalan, HUD berubah, dan aksi cepat membuka kontrol yang benar.

**Selesai bila:** scene tetap ringan dan dapat dipakai di viewport sempit; tidak menutupi fungsi inti atau menampilkan penghitung dekoratif.

### M3 — Bangunan dan loop generator

**Hasil:** panel Bangunan menyerupai panel mockup, tetapi generator lama menjadi implementasi ekonominya.

- Tampilkan tier yang sudah ada sebagai kartu bangunan dengan ikon, level/jumlah, laju, biaya, progres buka, dan kontrol beli.
- Kelompokkan bangunan ke kategori visual bila membantu navigasi; kategori tidak boleh menyiratkan fungsi produksi yang belum ada.
- Pertahankan pembelian x1/x10/max, harga deret, milestone produksi, mandor, dan aturan buka tier.
- Gunakan label yang menjaga tema tambang. Nama seperti kamp, kantor, atau pabrik kayu hanya dipakai jika perilaku dan biaya bangunannya sesuai.

**Masih bisa dimainkan:** pemain dapat membeli dan meningkatkan setiap generator yang terbuka; pembelian manual dan otomatis menghasilkan progres yang sama seperti sebelumnya.

**Selesai bila:** seluruh 10 tier lama tetap dapat dicapai dan tidak ada reset atau perubahan diam-diam pada biaya/produksi.

### M4 — Riset dan aktivitas berjalan

**Hasil:** panel riset dan daftar aktivitas terasa seperti bagian dari dunia game, bukan panel administrasi terpisah.

- Pindahkan dua upgrade riset yang ada ke kartu teknologi dengan level, efek, biaya, batas, dan syarat yang nyata.
- Tampilkan mandor sebagai aktivitas berjalan; waktu hanya ditampilkan jika ada timer nyata. Jangan menambah durasi riset palsu untuk mencocokkan screenshot.
- Pertahankan upgrade permanen inti pada alur peleburan, dengan penjelasan bahwa efeknya bertahan antar putaran.
- Tampilkan status offline yang berasal dari efisiensi dan batas offline aktual.

**Masih bisa dimainkan:** riset dapat dibeli, efeknya mengubah produksi/offline, peleburan tetap memberi inti dan upgrade permanen tetap berfungsi.

**Selesai bila:** semua kartu menjelaskan dampak langsung dan batas reset/ketahanannya.

### M5 — Peta dunia dan progres zona

**Hasil:** panel Peta Dunia memenuhi peran visual peta pada mockup tanpa membuat sistem progres kedua yang terpisah.

- Bentuk zona dari urutan 10 tier dan syarat buka yang sudah ada. Zona terbuka/terkunci diturunkan dari state generator.
- Pilih zona untuk melihat tier yang terkait, produksi, dan syarat berikutnya; aksi “Masuk” membawa pemain ke panel Bangunan/tier relevan.
- Hadiah zona, bila ditambahkan, harus memakai mata uang atau upgrade yang sudah didefinisikan.
- Hindari save state peta duplikat kecuali ada progres yang tidak bisa dihitung dari save idle.

**Masih bisa dimainkan:** peta berfungsi sebagai navigasi/progres; pemain tetap bisa membeli tier berikutnya dan kembali ke tambang tanpa kehilangan konteks.

**Selesai bila:** seluruh wilayah punya pemetaan tier dan tujuan nyata, termasuk pada save lama.

### M6 — Inventory dan ekonomi sumber daya tambahan

**Hasil:** putuskan dan implementasikan tingkat kesetiaan mekanik terhadap empat ikon sumber daya di mockup.

- Inventory versi pertama menampilkan aset yang memang telah dimiliki: kristal, inti, generator/bangunan, upgrade, dan pencapaian.
- Jika mockup harus menampilkan kayu, batu, dan herbal sebagai mata uang yang dapat dibelanjakan, tambahkan sumber produksi, penggunaan, batas/overflow, dan keseimbangan biaya sebagai fitur ekonomi baru. Jangan sekadar menambahkan tiga counter.
- Tambahkan field save melalui migrasi dari versi saat ini. Save lama mulai dengan jumlah sumber daya tambahan yang seimbang dan tidak kehilangan kristal, inti, atau generator.
- Bangunan lama tetap memberi progres selama ekonomi baru diperkenalkan; tidak ada soft-lock yang mengharuskan sumber daya yang belum dapat diproduksi.

**Masih bisa dimainkan:** semua sumber daya dapat diperoleh dan dipakai dalam loop tertutup; save baru dan save lama dapat terus maju walau pemain belum membuka bangunan tingkat lanjut.

**Selesai bila:** tidak ada mata uang yang hanya menumpuk tanpa sink, atau biaya yang mencegah pemain mencapai sumber pertamanya.

### M7 — Misi, rekrutmen, dan quick actions

**Hasil:** fitur kanan dan tombol aksi mockup memiliki perilaku permainan yang nyata.

- Mulai dari misi berbasis kondisi yang sudah tersedia (membeli generator, membuka tier, melakukan riset, mencapai target produksi). Hadiah harus terdefinisi dan dapat diklaim satu kali.
- Jika misi harian digunakan, simpan tanggal/ID klaim dengan aturan reset zona waktu yang jelas; jangan mengubah pencapaian lama menjadi misi harian secara diam-diam.
- Rekrutmen hanya ditambahkan sebagai sistem baru setelah peran karakter, biaya, efek, batas, dan penyimpanannya dirancang. Mandor yang ada dapat menjadi karakter pertama bila efeknya dibuat eksplisit.
- Quick actions hanya menjalankan aksi yang aman dan umum, atau membuka panel konfirmasi untuk aksi seperti peleburan.

**Masih bisa dimainkan:** misi bisa diselesaikan dan hadiah diklaim dengan aman; perekrutan/upgrade tidak merusak keseimbangan atau menghapus progres.

**Selesai bila:** tidak ada aksi cepat yang melewati konfirmasi penting dan tidak ada klaim hadiah ganda.

### M8 — Penyelarasan visual akhir dan penerimaan

**Hasil:** implementasi mendekati screenshot mockup pada desktop, dengan adaptasi mobile yang tetap fungsional.

- Selaraskan proporsi, warna, tipografi, ikon, framing panel, hierarchy, dan artwork dengan mockup.
- Pastikan panel Bangunan, Riset, Peta Dunia, Inventory, misi, aktivitas, HUD, dan quick actions menampilkan state permainan yang benar.
- Periksa kontras, fokus keyboard, target sentuh, pembacaan layar, reduced motion, dan pemotongan konten.
- Lakukan pemeriksaan regresi untuk alur idle, save lama, migrasi, offline, dan layar kecil.

**Masih bisa dimainkan:** seluruh loop utama selesai dari awal hingga peleburan, lalu dapat dimainkan lagi dengan upgrade permanen; semua panel pada mockup memiliki konten/aksi yang berfungsi.

**Selesai bila:** tampilan sesuai komposisi mockup tanpa mengorbankan kontrol atau progres game, dan pemeriksaan regresi lulus.

## Batas scope dan keputusan penting

- “Seperti mockup persis” berarti komposisi dan tingkat kelengkapan panelnya menjadi sasaran. Nama, angka, hadiah, dan sistem harus konsisten dengan idle tambang, bukan disalin jika bertentangan dengan aturan game.
- Bila sumber daya tambahan dan rekrutmen tidak meningkatkan pengalaman setelah prototipe, alternatif yang tetap setia pada mockup adalah mempertahankan satu mata uang kristal, memakai inti sebagai mata uang permanen, dan menjadikan generator sebagai bangunan. Dengan begitu tampilan dapat lengkap tanpa membangun ulang ekonomi.
- Jika tiga sumber daya tambahan memang wajib, M6 adalah ekspansi gameplay besar dan sebaiknya dipisah sebagai milestone/PR tersendiri dari overhaul visual.
- Hindari mengubah atau menghapus data save lama. Setiap versi save perlu migrasi teruji dan jalur pemulihan yang jelas sebelum dirilis.
