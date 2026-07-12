# samp-cli 🚀

`samp-cli` adalah alat baris perintah (CLI tool) modern berbasis **Node.js** yang dirancang khusus untuk mempermudah alur kerja (workflow) developer **SA-MP**. Terinspirasi dari konsep `sampctl`, tool ini bertindak sebagai manajer proyek, pengelola dependensi otomatis, serta otomatisasi proses *build* dan *run* tanpa mengotori folder proyekmu.

---

## ✨ Fitur Utama

- **📦 Proyek Inisialisasi Interaktif (`samp init`)** Membuat struktur folder proyek standar (`gamemodes`, `filterscripts`, `scriptfiles`, `pawno/include`) serta menghasilkan berkas `pawn.json` secara otomatis melalui terminal interaktif. Mampu mendeteksi preferensi server antara SA-MP (dan selanjutkan akan dibuat untuk OpenMP)

- **📥 Manajemen Dependensi Otomatis (`samp install`)** Unduh berkas *include* (`.inc`) dan *plugin* (`.dll`/`.so`) langsung dari repositori GitHub secara otomatis.  
  - Dilengkapi fitur cerdas *fallback* unduhan langsung dari *branch utama* (`main`/`master`) jika repositori tujuan tidak menyediakan rilis (*GitHub Releases* resmi).
  - Klasifikasi otomatis struktur manifes (memasukkan objek *files*, *includes*, dan *plugins*).

---

## 🚀 Teknologi yang Digunakan

Proyek CLI ini dibangun menggunakan ekosistem Node.js yang andal:
- **Commander.js** – Untuk penanganan struktur perintah dan argumen CLI.
- **Axios & @octokit/rest** – Untuk komunikasi dengan GitHub API dan pengunduhan berkas.
- **Adm-Zip & Tar** – Untuk penanganan ekstraksi kompresi lintas platform (Windows & Linux).
- **Picocolors** – Untuk visualisasi teks terminal yang rapi dan berwarna.
- **Inquirer.js** – Untuk interaksi terminal berbasis *prompt* yang interaktif.

---

## 🛠️ Kontribusi

Kontribusi selalu terbuka! Jika kamu menemukan *bug*, memiliki ide fitur baru, atau ingin menyempurnakan logika CLI ini, silakan buat *Issue* atau kirimkan *Pull Request*.

---

*Dikembangkan dengan 💖 untuk memajukan ekosistem Developer Pawn Indonesia.*