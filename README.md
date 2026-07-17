# samp-cli 🚀

`samp-cli` adalah alat baris perintah (CLI tool) modern berbasis **Node.js** yang dirancang khusus untuk mempermudah alur kerja (workflow) developer **SA-MP**. Terinspirasi dari konsep `sampctl`, tool ini bertindak sebagai manajer proyek, pengelola dependensi otomatis, serta otomatisasi proses *build* dan *run* tanpa mengotori folder proyekmu.

---

## ✨ Fitur Utama

- **📦 Proyek Inisialisasi Interaktif (`samp init`)** Membuat struktur folder proyek standar (`gamemodes`, `filterscripts`, `scriptfiles`, `pawno/include`) serta menghasilkan berkas `pawn.json` secara otomatis melalui terminal interaktif. Mampu mendeteksi preferensi server antara SA-MP (dan selanjutkan akan dibuat untuk OpenMP)

- **📥 Manajemen Dependensi Otomatis (`samp install`)** Unduh berkas *include* (`.inc`) dan *plugin* (`.dll`/`.so`) langsung dari repositori GitHub secara otomatis.  
  - Dilengkapi fitur cerdas *fallback* unduhan langsung dari *branch utama* (`main`/`master`) jika repositori tujuan tidak menyediakan rilis (*GitHub Releases* resmi).
  - Klasifikasi otomatis struktur manifes (memasukkan objek *files*, *includes*, dan *plugins*).
  - ![Cara penginstallan dependency](https://github.com/YosuaS2023/samp-cli/blob/feat/compiler-linter/img/samp_install_1.png)

- **📥 Compiler (`samp build`)** Mengompile sebuah kode yang telah di konfigurasi di (`pawn.json`) pada *output* dan *entry*
  - Konfigurasi dependencies untuk compiler memanggil include yang dibutuhkan
  - [Build](https://github.com/YosuaS2023/samp-cli/blob/feat/compiler-linter/img/samp_build_1.png)

- **📥 Manajemen Kompiler (`samp compiler`)** Manajemen kompiler seperti penginstallan kompiler dan pemilihan versi kompiler
  - Cmd (`samp compiler use`) Untuk memilih versi kompiler yang telah di download
  - Cmd (`samp compiler install [version: contoh 3.10.10]`) Menginstall versi compiler berdasar release dari github (`https://github.com/pawn-lang/compiler`)
  - ![Contoh Pengunaan](https://github.com/YosuaS2023/samp-cli/blob/feat/compiler-linter/img/samp_compiler_1.png)

- **♻️ Statis Analisis** Memeriksa resiko terjadinya Run Time Error pada saat kompilasi kode. Seperti error Array out Bounds (terutama pada akses array loop for)
  - untuk saat ini masih prototype/uji coba
  - ![Contoh](https://github.com/YosuaS2023/samp-cli/blob/feat/compiler-linter/img/statis_analisis_aob.png)
---

---
## Cara build menjadi .exe

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
npm run build

---

## 🚀 Teknologi yang Digunakan

Proyek CLI ini dibangun menggunakan ekosistem Node.js yang andal:
- **Commander.js** – Untuk penanganan struktur perintah dan argumen CLI.
- **Axios & @octokit/rest** – Untuk komunikasi dengan GitHub API dan pengunduhan berkas.
- **Adm-Zip & Tar** – Untuk penanganan ekstraksi kompresi lintas platform (Windows & Linux).
- **Picocolors** – Untuk visualisasi teks terminal yang rapi dan berwarna.
- **Inquirer.js** – Untuk interaksi terminal berbasis *prompt* yang interaktif.
- **Bun** - Untuk build menjadi .exe
---

## 🛠️ Kontribusi

Kontribusi selalu terbuka! Jika kamu menemukan *bug*, memiliki ide fitur baru, atau ingin menyempurnakan logika CLI ini, silakan buat *Issue* atau kirimkan *Pull Request*.

---

*Dikembangkan dengan 💖 untuk memajukan ekosistem Developer Pawn Indonesia.*