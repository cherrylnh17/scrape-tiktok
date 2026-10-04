# TikTok Comments to CSV & Excel Converter

Aplikasi web satu halaman (*single page application*) berbasis **Next.js (App Router)** dan **TypeScript** untuk mengonversi respons JSON API komentar TikTok menjadi file spreadsheet (**CSV** dengan UTF-8 BOM, **Excel (.xlsx)**, atau format **TSV** untuk disalin langsung ke Google Sheets).

Semua pemrosesan dilakukan **100% di browser (client-side)** tanpa server/backend. Data Anda tidak pernah dikirim ke mana pun.

---

## ✨ Fitur Utama

1. **Parser Aliran JSON Cerdas (Stream JSON Parser)**
   - Mampu memisahkan beberapa objek JSON yang ditempel sekaligus secara berurutan (hasil pagination API TikTok berulang), baik dipisah baris baru maupun tidak.
   - Menggunakan state-machine penghitung kedalaman kurung kurawal (`{}`) yang menangani tanda petik dan karakter escape (`\`) dengan benar, sehingga simbol `{}` atau emoji di dalam komentar tidak merusak struktur.
   - Toleran terhadap error: Jika ada objek yang corrupt atau tidak valid, sistem menampilkan nomor objek yang gagal dan tetap memproses objek valid lainnya.

2. **Fitur Unggah File JSON & Tempel Teks (Dual Mode)**
   - **Unggah Berkas**: Drag & drop atau pilih satu maupun banyak file `.json` sekaligus (misal `komentar_tiktok.json` hasil scraping). Pembacaan file 100% lokal di browser menggunakan File API (tanpa dikirim ke server).
   - **Tempel Teks Manual**: Tab untuk menempelkan teks JSON secara langsung dengan tombol *"Coba contoh"*.
   - **Antrean Batch Data**: Tombol *"Tambahkan ke daftar"* dan *"Pilih file lain"* memungkinkan Anda menumpuk data dari berbagai file atau sesi scraping tanpa menghapus data sebelumnya.

3. **Ekstraksi Komentar & Balasan**
   - Mengambil komentar utama dan preview balasan (`reply_comment`).
   - Penentuan tipe otomatis: item dengan `reply_id` "0" atau kosong = `komentar`; selain itu = `balasan` dan `induk_cid` diisi dengan `reply_id`.
   - **CID Presisi Tinggi**: `cid` dan `induk_cid` selalu dipertahankan sebagai tipe teks/string agar ID 64-bit TikTok tidak kehilangan presisi atau terpotong di Excel.
   - Privasi terjaga: Data identitas pengguna (`nickname`, `unique_id`, `uid`, `sec_uid`) diabaikan dan tidak diekstraksi.

4. **Opsi Fleksibel**
   - ☑️ **Sertakan balasan**: Mengikutsertakan komentar balasan sebagai baris terpisah.
   - ☑️ **Hapus duplikat**: Menghapus duplikasi berdasarkan `cid` (mempertahankan kemunculan pertama).
   - ⬜ **Bersihkan baris baru di teks**: Mengganti karakter *enter* (`\n`) dengan spasi agar teks berada dalam satu baris rapi.

5. **Format Ekspor Lengkap**
   - **Unduh CSV**: Standar RFC 4180 dengan UTF-8 BOM (`\uFEFF`) agar emoji dan karakter multi-bahasa terbuka sempurna tanpa error di Microsoft Excel.
   - **Unduh Excel (.xlsx)**: Dihasilkan via SheetJS (`xlsx`) dengan *dynamic import*, tipe sel teks (`@`) pada kolom ID, serta lebar kolom otomatis.
   - **Salin ke Clipboard (TSV)**: Format Tab-Separated Values untuk langsung ditempel (*paste*) ke Google Sheets.
   - Penamaan file otomatis berformat waktu: `komentar_tiktok_YYYYMMDD_HHmm.ext`.

6. **Halaman Panduan Mengambil Data (DevTools Console Script)**
   - Langkah demi langkah (9 langkah) cara menyadap respons API komentar dan balasan TikTok menggunakan Console DevTools Chrome tanpa ekstensi.
   - Script penyadap interaktif (`CONSOLE_SCRIPT`) dilengkapi tombol salin kode, auto-scroll otomatis (`__tt.otoScroll()`), dan unduh file JSON (`__tt.unduh()`).
   - Dilengkapi panduan pemecahan masalah (*troubleshooting*), catatan format, serta kotak peringatan keamanan.

7. **Desain Modern & Responsif**
   - Antarmuka Bahasa Indonesia, bersih, elegan, dan mendukung **Dark Mode** (Otomatis / Terang / Gelap).
   - Pratinjau tabel interaktif (50 baris pertama) dilengkapi pencarian teks, filter tipe, penyalinan CID cepat, dan tombol ekspansi teks panjang.

---

## 📁 Struktur Proyek

```text
scrape/
├── app/
│   ├── globals.css         # Styling Tailwind CSS v4 & custom scrollbar
│   ├── layout.tsx          # Layout root & metadata dalam Bahasa Indonesia
│   ├── page.tsx            # Halaman utama merender Converter
│   └── panduan/
│       └── page.tsx        # Halaman panduan DevTools Console
├── components/
│   ├── CodeBlock.tsx       # Komponen penampil kode dengan copy button & inline copy
│   ├── Converter.tsx       # Komponen utama ("use client"), state & interaksi
│   ├── GuideSteps.tsx      # Komponen stepper 9 langkah, FAQ accordion, & peringatan
│   └── PreviewTable.tsx    # Komponen tabel pratinjau interaktif
├── lib/
│   ├── consoleScript.ts    # Konstanta script penyadap DevTools Console
│   ├── extractComments.ts  # Logika ekstraksi komentar, balasan, dan format waktu
│   ├── exporters.ts        # Fungsi ekspor CSV (BOM), XLSX (SheetJS), & TSV
│   └── parseJsonStream.ts  # Parser pemisah aliran objek JSON & penghitung kurung kurawal
├── types/
│   └── tiktok.ts           # Definisi TypeScript untuk request, respon, & row
├── package.json

└── README.md
```

---

## 📊 Kolom Output

| No | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| 1 | `cid` | String | ID unik komentar TikTok (string 64-bit) |
| 2 | `induk_cid` | String | ID komentar induk (kosong untuk komentar utama, terisi jika balasan) |
| 3 | `tipe` | String | `komentar` atau `balasan` |
| 4 | `text` | String | Teks asli komentar (termasuk emoji & baris baru) |
| 5 | `likes` | Number | Jumlah suka dari `digg_count` |
| 6 | `jumlah_balasan`| Number | Total balasan dari `reply_comment_total` |
| 7 | `bahasa` | String | Kode bahasa dari `comment_language` (misal `id`, `en`) |
| 8 | `waktu` | String | Waktu lokal terformat (`YYYY-MM-DD HH:mm:ss`) dari Unix timestamp `create_time` |

---

## 🚀 Cara Menjalankan Secara Lokal

Pastikan Anda telah menginstal **Node.js** (versi 18.x atau yang lebih baru).

### 1. Instal Dependensi
```bash
npm install
```

### 2. Jalankan Mode Pengembangan (*Development Server*)
```bash
npm run dev
```

Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

### 3. Membangun Proyek untuk Produksi (*Production Build*)
```bash
npm run build
npm run start
```

---

## 🌐 Cara Deploy ke Vercel

Aplikasi ini dapat di-deploy ke **Vercel** dengan sangat mudah:

### Opsi 1: Melalui Git Repository (GitHub / GitLab / Bitbucket)
1. Unggah kode ke repositori GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit tiktok comment converter"
   git remote add origin https://github.com/username/tiktok-comment-converter.git
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com/) dan klik **"Add New Project"**.
3. Impor repositori GitHub tersebut.
4. Vercel akan otomatis mendeteksi framework **Next.js**. Klik **"Deploy"**.

### Opsi 2: Menggunakan Vercel CLI
1. Instal Vercel CLI secara global:
   ```bash
   npm install -g vercel
   ```
2. Jalankan perintah deploy di folder proyek:
   ```bash
   vercel
   ```
3. Ikuti petunjuk di terminal untuk menyelesaikan deployment.

---

## 💡 Panduan Mendapatkan JSON Komentar TikTok

1. Buka video TikTok di browser desktop (Chrome / Firefox / Edge).
2. Tekan **F12** atau klik kanan pilih **Inspect**, lalu masuk ke tab **Network**.
3. Di kolom filter Network, ketik: `comment/list`.
4. Gulir ke bawah pada kolom komentar video di halaman TikTok untuk memuat komentar baru.
5. Klik salah satu request `comment/list?...` yang muncul.
6. Buka tab **Response**, pilih semua teks JSON (Ctrl+A), salin (Ctrl+C), lalu tempelkan ke aplikasi ini.
