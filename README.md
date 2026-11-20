# 🌟 Learning English with Bunda Shaumi (Kelas 3 SD)

Web aplikasi pembelajaran interaktif Bahasa Inggris untuk siswa Kelas 3 Sekolah Dasar bertema **Hobbies (Kegemaran)**. Dirancang khusus untuk **Bunda Shaumi**, dapat dimainkan di berbagai perangkat: Smart TV Touchscreen kelas, Laptop/PC, hingga Tablet dan HP (Responsif & Mobile-Friendly).

![Tampilan Web](bunda_shaumi.png)

---

## 🎮 4 Permainan Edukasi yang Tersedia

1. **🏃 Super Duel Hobbies (Platformer Adventure ala Mario)**
   - Mode Duel 2 Pemain (TV/Laptop) & Solo 1 Pemain (HP).
   - Berlari, melompat, menyundul kotak `[?]`, menjawab tebak gambar hobi bahasa Inggris, dan menyentuh tiang bendera finish.
2. **🪢 Duel Tarik Tambang Hobbies (Tug of War)**
   - Mode Duel 1v1 Tim Biru vs Merah & Mode Solo Lawan Waktu 60 Detik.
   - Pemain tercepat menebak gambar menarik tali tambang ke arahnya hingga melewati garis batas.
3. **🎯 Hobby Match (Sambung Pasangan & Buka Kartu Memori)**
   - Mode Sambung Garis Kurva Bezier antara kartu gambar dan teks hobi.
   - Mode Kartu Memori 1–10: Mengingat letak kartu gambar dan artinya.
4. **🔎 Word Search: Hobbies (Teka-Teki Cari Kata)**
   - Grid teka-teki silang 9x9 dengan stabilo warna-warni ceria.
   - Menemukan 6 kosakata hobi dengan usapan jari (*swipe*) atau ketukan huruf awal dan akhir.

---

## ✨ Fitur Unggulan

- **Karakter Asli Bunda Shaumi:** Maskot ramah anak di header banner dengan sapaan *"Hello kids!"* serta hadir sebagai avatar pembimbing di dalam setiap permainan.
- **Mode Layar Penuh (Fullscreen):** Tersedia tombol Fullscreen di setiap game untuk kenyamanan maksimal di TV layar sentuh kelas.
- **Efek Suara Retro & Audio Pelafalan:** Efek suara ramah anak (Web Audio API) dan pelafalan aksen Bahasa Inggris jernih berkecepatan 0.88x (Web Speech API).
- **Kelola Soal Mandiri (Fitur Settings):**
  - Ubah, tambah, atau hapus soal langsung dari menu web.
  - Unduh template CSV untuk pengisian soal di Microsoft Excel atau Google Sheets.
  - Unggah file CSV untuk mengganti kumpulan soal secara instan.
  - **Sinkronisasi Langsung Google Spreadsheet:** Cukup tempel link Google Sheet publik, klik Sinkronkan, maka seluruh soal game langsung diperbarui secara otomatis tanpa ubah kode!
  - Tombol Reset ke Soal Bawaan kapan saja.

---

## 🚀 Panduan Deploy ke GitHub Pages (1 Menit)

Aplikasi ini berbasis **Static Web App murni (HTML5 + Vanilla JS)** tanpa backend rumit, sehingga 100% gratis dan sangat cepat di-hosting di GitHub Pages:

1. **Buat Repositori Baru di GitHub:**
   - Buka [github.com/new](https://github.com/new).
   - Beri nama repositori, misalnya: `learning-english-bunda-shaumi`.
   - Pilih **Public** lalu klik **Create repository**.

2. **Unggah Semua Berkas Projek:**
   - Unggah seluruh berkas dari folder ini ke repositori tersebut:
     - `index.html`
     - `bunda_shaumi.png`
     - `template_soal_hobbies.csv`
     - folder `js/` (berisi `data.js`, `app.js`, `game-platformer.js`, dll.)
     - folder `games/` (berisi `platformer.html`, `tugofwar.html`, dll.)
     - `README.md`
   - *Atau via Git Terminal:*
     ```bash
     git init
     git add .
     git commit -m "Inisialisasi web pembelajaran Bunda Shaumi"
     git branch -M main
     git remote add origin https://github.com/USERNAME-ANDA/learning-english-bunda-shaumi.git
     git push -u origin main
     ```

3. **Aktifkan GitHub Pages:**
   - Masuk ke menu **Settings** di repositori GitHub Anda.
   - Pada bilah kiri, pilih tab **Pages**.
   - Di bagian **Build and deployment > Branch**:
     - Pilih Branch: `main` (atau `master`)
     - Pilih Folder: `/ (root)`
     - Klik **Save**.
   - Tunggu sekitar 1 menit. Tautan website Anda siap dibuka di:
     `https://USERNAME-ANDA.github.io/learning-english-bunda-shaumi/`

---

## 📝 Panduan Bunda Shaumi: Mengedit Bank Soal

Bunda Shaumi dapat mengedit soal dengan 3 cara mudah:

### Opsi A: Lewat Menu Pengaturan di Web (Paling Cepat)
1. Buka website, klik tombol **⚙️ Soal** pada game mana saja atau di dalam jendela permainan.
2. Tambahkan kosakata baru pada form **Tambah Kosakata Hobi Baru**, lalu klik **➕ Simpan Soal**.
3. Klik tombol **🗑️** untuk menghapus kosakata yang tidak ingin dipakai.

### Opsi B: Menggunakan File Excel / CSV
1. Klik tombol **⚙️ Soal** lalu klik **📥 Unduh Template CSV**.
2. Buka file CSV tersebut di Microsoft Excel atau Notepad.
3. Edit kata dan artinya dengan format:
   ```csv
   ID,WORD,MEANING,HINT,IMAGE_SVG_TYPE
   reading,READING,Membaca,Buku cerita,reading
   singing,SINGING,Bernyanyi,Bernyanyi di mikrofon,singing
   ```
4. Simpan file, lalu klik **📤 Upload File CSV** di website.

### Opsi C: Menggunakan Google Spreadsheet (Otomatis & Real-Time)
1. Buat file baru di Google Spreadsheet dengan kolom: `ID`, `WORD`, `MEANING`, `HINT`, `IMAGE_SVG_TYPE`.
2. Klik tombol **Bagikan (Share)** di pojok kanan atas Google Sheets.
3. Ubah Akses Umum menjadi **"Siapa saja yang memiliki link dapat melihat"** (*Anyone with the link can view*).
4. Salin link-nya dan tempel di kolom **Sinkronisasi Tautan Google Spreadsheet** pada menu Settings web, lalu klik **🔗 Sinkronkan Sekarang**.
5. Kapan pun Bunda memperbarui soal di Google Sheets, cukup klik tombol sinkronisasi tersebut!

---

## 📂 Struktur Berkas

```
web bunda shaumi/
├── index.html                    # Halaman portal utama & launcher
├── bunda_shaumi.png              # Foto karakter asli Bunda Shaumi
├── template_soal_hobbies.csv     # File acuan template CSV
├── README.md                     # Dokumentasi & panduan deploy
├── ZettBOT.md                    # File gateway lisensi ZettBOT
├── prd.md                        # Dokumen spesifikasi PRD & arsitektur sistem
├── revisi.md                     # Catatan checklist implementasi
├── games/
│   ├── platformer.html           # Frame game Super Duel Hobbies
│   ├── tugofwar.html             # Frame game Duel Tarik Tambang
│   ├── match.html                # Frame game Hobby Match
│   └── wordsearch.html           # Frame game Word Search
└── js/
    ├── data.js                   # Bank 15 soal default, SVG, CRUD, CSV & Sheets sync
    ├── app.js                    # Pengendali portal utama, navigasi & settings modal
    ├── game-platformer.js        # Engine game platformer
    ├── game-tugofwar.js          # Engine game tarik tambang
    ├── game-match.js             # Engine game hobby match
    └── game-wordsearch.js        # Engine game word search
```

---

Dibuat dengan penuh dedikasi untuk menunjang pembelajaran interaktif siswa kelas 3 SD bersama **Bunda Shaumi**.
*(c) Dikembangkan dengan standar rekayasa sistem ZettBOT by Zettbos.*
