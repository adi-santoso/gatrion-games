# Spesifikasi M0 — Idle UI overhaul

Dokumen ini mengunci pemetaan produk dan interaksi untuk mengimplementasikan mockup `docs/ui_overhaul.png` di atas fondasi idle tambang saat ini. Ini adalah keputusan scope dan perilaku; angka biaya, laju baru, dan artwork final ditentukan pada milestone implementasi masing-masing.

## 1. Sasaran dan prinsip

- Sasaran visual desktop adalah komposisi mockup: navigasi kiri, HUD sumber daya di atas, scene dunia sebagai fokus, panel aktivitas dan aksi cepat di sisi kanan, serta dashboard Bangunan, Riset, Peta Dunia, dan Inventory di bawah.
- Di layar kecil, komposisi yang sama berubah menjadi satu kolom dengan HUD yang dapat digeser/dibungkus, navigasi bawah atau menu ringkas, scene lebih pendek, lalu panel-panel dalam tab. Tidak ada fungsi yang hanya dapat diakses dengan hover.
- Ekonomi kristal, 10 tier generator, tap bonus, mandor, dua riset putaran, peleburan, upgrade permanen, offline progress, dan pencapaian tetap menjadi loop dasar.
- Setiap penghitung dan aksi di UI membaca atau mengubah state permainan nyata. Panel boleh diringkas, tetapi tidak boleh berisi data contoh setelah dirilis.
- Tujuan “seperti mockup persis” berlaku pada susunan, hierarki, dan cakupan panel. Nama dan aturan tetap mengikuti tema tambang kristal agar UI tidak menjanjikan sistem yang belum ada.

## 2. Pemetaan layar dan mekanik

| Area mockup | Nama/tujuan di game | State atau aksi sumber | Keputusan |
|---|---|---|---|
| Home | Ikhtisar Tambang | Kristal, laju, tap, aktivitas, next unlock | Scene utama tetap tambang kristal; bukan layar baru dengan ekonomi terpisah. |
| Character | Mandor | `auto`, level/upgrade mandor permanen | Mula-mula menjadi halaman Mandor yang menjelaskan auto-buy yang sudah ada. Roster perekrutan baru hanya muncul saat sistem rekrutmen nyata tersedia. |
| Inventory | Persediaan | Kristal, inti, material, bangunan, riset, pencapaian | Panel item hanya menampilkan jenis dan jumlah yang benar-benar dimiliki; deskripsi item menjelaskan fungsi. |
| Upgrade | Riset & Upgrade | Riset putaran dan upgrade permanen inti | Satu tujuan navigasi; panel membedakan efek yang reset saat lebur dari efek permanen. |
| World Map | Peta Kedalaman | 10 tier generator dan syarat unlock | Zona diturunkan dari progres tier; peta mengarahkan pemain ke generator yang sedang dikejar. |
| Settings | Pengaturan | Tema dan preferensi aplikasi yang tersedia | Pertahankan pengaturan tema sekarang. Jangan menambah kontrol audio/bahasa yang belum didukung. |
| Daily Mission | Misi | Target dari aksi/progres ekonomi | Fitur baru: objective dan klaim hadiah disimpan per hari. Pencapaian seumur hidup tetap terpisah. |
| Aktivitas Berjalan | Status loop aktif | Produksi, mandor, riset bila ada timer nyata | Tampilkan laju/level dan status yang benar; jangan mengarang timer untuk proses instan. |
| Quick Actions | Bangun, Upgrade, Rekrut, Reset | Navigasi ke Bangunan, Riset, Mandor, dan dialog lebur | “Reset” berarti peleburan yang ada dan selalu membuka konfirmasi. “Rekrut” menuju Mandor sampai rekrutmen diperkenalkan. |
| Bangunan | Bangunan Produksi | Generator yang ada + bangunan material baru | 10 generator lama tampil sebagai bangunan tambang penghasil kristal; bangunan material menjadi ekspansi, bukan pengganti tier. |
| Riset Teknologi | Riset | `gear`, `offline`, upgrade inti permanen | Memakai efek dan biaya yang nyata dari ekonomi; tidak membuat riset dekoratif. |
| Peta Dunia | Zona tambang | Syarat buka generator | Membagi tier yang berurutan menjadi zona; “Masuk” memilih tier/panel relevan dan tidak memindahkan save ke state duplikat. |
| Inventory detail | Detail item/material | Resource ledger dan entitas yang dimiliki | Detail hanya untuk entitas yang sudah tersedia; consumable baru memerlukan aksi penggunaan nyata. |

## 3. Keputusan ekonomi

### Mata uang

1. `crystals` tetap mata uang produksi utama dan progres satu putaran. Tap, generator yang ada, harga generator, serta rumus produksi tidak diganti oleh material lain.
2. `cores` tetap mata uang peleburan permanen. HUD menampilkannya dengan label yang jelas sebagai inti, bukan kristal biasa.
3. Agar panel sumber daya mockup punya makna, ekspansi gameplay akan menambahkan **kayu, batu, dan herbal** sebagai material putaran. Material tersebut tidak ditampilkan sebelum sumber dan penggunaan pertamanya tersedia.
4. Bangunan material adalah cabang produksi baru. Generator kristal lama tidak diubah hasil produksinya. Biaya bangunan/material ditambahkan bertahap dan tidak boleh menciptakan syarat melingkar (material tidak bisa dibeli sebelum ada cara mendapatkannya).
5. Pada lebur, kristal, bangunan putaran, upgrade putaran, dan material putaran direset. Inti, upgrade permanen, statistik seumur hidup, serta pencapaian dipertahankan. Upgrade permanen boleh membuka modal awal yang ditentukan eksplisit.
6. HUD hanya memperlihatkan resource yang sudah diperkenalkan/terbuka. Tidak ada saldo awal palsu untuk membuat screenshot tampak penuh.

### Bangunan dan progres

- 10 generator yang ada tetap menjadi jalur progres inti. Nama/ikon dapat disesuaikan ke tema lokasi tambang, tetapi ID, jumlah, biaya, syarat unlock, dan laju lama harus tetap kompatibel dengan save.
- Zona peta adalah presentasi progres tier, bukan sistem level kedua. Pemetaannya ditentukan sebelum M5 dan dapat dihitung dari `gens`.
- Bangunan penghasil kayu, batu, dan herbal adalah fitur baru dengan definisi biaya, laju, unlock, dan dampak offline sebelum ditampilkan sebagai kartu yang dapat dibeli.
- “Upgrade” mengarah ke riset dan upgrade permanen; “Bangun” mengarah ke panel Bangunan. Beli x1/x10/max tetap tersedia untuk generator yang mendukungnya.

### Misi, karakter, dan reset

- Misi harian adalah sistem baru, bukan alias pencapaian. Objective dapat berasal dari aksi yang tercatat (beli bangunan, capai laju, riset, buka zona); klaim punya ID dan tanggal lokal yang mencegah hadiah ganda.
- Mandor adalah karakter awal yang merepresentasikan auto-buy yang sudah ada. Rekrutmen tambahan tidak menjadi tombol aktif sampai karakter punya biaya, efek, batas, persistensi, dan balancing yang ditentukan.
- Tombol Reset selalu meminta konfirmasi dan menjalankan peleburan yang sama dengan mekanik saat ini. Jika syarat lebur belum terpenuhi, tampilkan alasan dan syarat, bukan tindakan reset kosong.

## 4. Struktur antarmuka

### Desktop

- Navigasi kiri: Home, Character/Mandor, Inventory, Upgrade, World Map, Settings.
- Bar atas: resource yang sudah terbuka dan profil/status pemain.
- Area hero utama: scene tambang/kerajaan, level/sektor, produksi aktif, progres target dan aksi utama.
- Kolom kanan: Daily Mission, Aktivitas Berjalan, Quick Actions.
- Dashboard bawah: Bangunan, Riset Teknologi, Peta Dunia, Inventory. Kartu dashboard adalah ringkasan dari state yang sama dengan halaman navigasi, bukan salinan state.

### Mobile

- Navigasi samping berubah menjadi menu ringkas dengan akses langsung ke enam tujuan utama.
- Resource HUD boleh horizontal-scroll; ikon harus punya label/nama aksesibel dan saldo tetap terlihat.
- Hero berada di atas, diikuti misi dan aksi, lalu empat dashboard menjadi tab/accordion. Jangan mengecilkan seluruh komposisi desktop sampai teks tidak terbaca.
- Dialog peleburan dan klaim hadiah memakai target sentuh yang jelas dan tidak tertutup navigasi.

## 5. Batas data dan migrasi

- `IdleSave` saat ini versi 3. Milestone yang menambahkan material, misi, atau rekrutmen harus menaikkan versi save dan menambahkan migrasi dari v3; migrasi harus idempotent.
- Field UI seperti tab terpilih, panel terbuka, dan item peta yang sedang dipilih tidak disimpan sebagai progres ekonomi.
- Progres zona dihitung dari tier bila memungkinkan. Resource material, klaim misi harian, serta roster hanya disimpan jika sistem tersebut telah dirilis.
- Reset peleburan harus menggunakan satu fungsi ekonomi pusat supaya tombol cepat, dialog, dan layar Upgrade tidak menerapkan aturan reset berbeda.
- Jangan menghapus data yang tidak dikenal saat sanitasi save; pertahankan perilaku migrasi yang kompatibel dan tetapkan default hanya untuk field baru.

## 6. Urutan implementasi yang disetujui

1. M1: kerangka responsif dan navigasi; panel lama dapat diakses dan semua loop lama tetap hidup.
2. M2: scene utama, HUD data nyata, aktivitas produksi, dan quick actions yang menautkan fitur lama.
3. M3: tampilkan generator sebagai bangunan tanpa mengganti ekonomi kristal.
4. M4: integrasikan riset, mandor, peleburan, dan status offline ke panel mockup.
5. M5: peta zona turunan dari 10 tier.
6. M6: inventory terlebih dahulu untuk state yang sudah ada, lalu material kayu/batu/herbal beserta sumber dan sink sebagai ekspansi ekonomi.
7. M7: misi harian dan perekrutan setelah skema save dan aturan hadiah/efek jelas.
8. M8: penyelarasan visual dan pemeriksaan regresi akhir.

## 7. Kriteria penerimaan M0

- Setiap area utama mockup memiliki tujuan dan sumber state yang terdefinisi.
- Perbedaan antara fitur existing dan fitur baru tertulis eksplisit.
- Aturan reset dan persistensi tidak ambigu.
- Tidak ada mata uang, misi, aktivitas, atau karakter yang boleh ditampilkan sebagai fitur fungsional sebelum loop-nya lengkap.
- Roadmap milestone berikutnya mengikuti keputusan dalam dokumen ini.
