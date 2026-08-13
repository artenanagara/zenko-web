# Dashboard Tutor — spec

Status: draft for review. Grounded in the schema that already exists in
`zenko-api` (`model.Product`, `model.Section`, `model.Question`,
`model.ExamType`) — sections below say explicitly which parts that schema
already covers and which parts need new backend work.

## Ringkasan (`/dashboard/tutor`)

Stat cards:

| Kartu | Sumber | Catatan |
|---|---|---|
| Total pendapatan | `orders` milik produk tutor ini, status lunas | **Baru**: `OrderStore` saat ini hanya query per pembeli (`ListForAccount`), belum ada query "pesanan yang berisi produk tutor X". Perlu query baru. |
| Jumlah produk | `products` where `author_account_id = me` | Sudah ada (`ProductStore`), tinggal filter by author + hitung per status. |
| Total payout | Payout terkumpul yang sudah dicairkan | **Baru** — belum ada model payout sama sekali (lihat bagian Pencairan). |

**Tambahan saya:**
- **Produk butuh perhatian** — jumlah produk berstatus `rejected` (dengan alasan) dan `review` (menunggu). Tanpa ini, tutor harus buka tab Produk Saya cuma untuk tahu ada yang ditolak.
- **Grafik penjualan 30 hari** (sparkline kecil, bukan chart penuh) — nice-to-have, bukan blocker v1.
- **Produk terlaris minggu ini** — 1 baris, bukan tabel penuh (tabel lengkapnya di tab Penjualan).

## Produk Saya (`/dashboard/tutor/produk`)

Card memanjang (horizontal), bukan grid — sesuai permintaan. Satu baris per produk:

```
[Thumbnail 16:10] Judul produk                              [Status badge]
                   Kategori · Tipe (Single/Bundle) · N soal
                   Rp harga                                   [⋯ menu aksi]
```

- **Tab/filter status**: Semua, Draft, Menunggu Review, Live, Ditolak, Diarsipkan — pakai badge count di tiap tab. Status datang langsung dari `model.ProductStatus`, sudah ada.
- **Aksi per status** (beda tombol tergantung status, bukan menu generik yang sama untuk semua):
  - `draft` → Lanjutkan mengedit, Ajukan review, Hapus.
  - `review` → Lihat (read-only), Tarik dari review (kembali ke draft).
  - `live` → Lihat performa, Edit (**tampilkan peringatan**: mengedit produk live menariknya dari katalog publik sampai direview ulang — ini sudah aturan yang ada di `product.go`, harus terlihat di UI, bukan kejutan), Arsipkan.
  - `rejected` → **Tampilkan `RejectReason` dengan jelas**, tombol Edit & ajukan ulang.
  - `archived` → Aktifkan kembali (kembali ke draft untuk direview, karena archived juga bukan status live).
- **Pencarian + filter kategori** di atas daftar begitu jumlah produk tutor lebih dari ~10.
- **Empty state**: kalau belum punya produk sama sekali → CTA besar "Buat produk pertamamu" langsung ke wizard, bukan tabel kosong.

## Penjualan (`/dashboard/tutor/penjualan`)

Tabel dengan kolom: Tanggal, Produk, Pembeli (nama, bukan email — privasi), Harga, Status (Lunas/Menunggu/Kedaluwarsa), Invoice.

- Filter: rentang tanggal, produk, status.
- **Baru di backend**: sama seperti stat "Total pendapatan" di atas — butuh query pesanan per tutor, bukan per pembeli. Ini satu-satunya endpoint baru yang paling penting untuk seluruh dashboard tutor, karena Ringkasan dan Penjualan dua-duanya bergantung padanya.
- Export CSV — nice-to-have, bukan v1.

## Pencairan (`/dashboard/tutor/pencairan`)

Kartu saldo (seperti Visa card) di atas, tabel riwayat payout di bawah.

**Ini butuh model backend yang benar-benar baru** — tidak ada satu pun bagian dari ini yang sudah didukung skema sekarang:

- `Balance` (saldo tersedia untuk dicairkan) — turunan dari total penjualan lunas dikurangi fee platform dikurangi yang sudah dicairkan. Perlu diputuskan: fee platform berapa persen, dan apakah saldo langsung tersedia begitu order lunas atau ada masa tahan (misal 7 hari, untuk menutupi risiko refund).
- `PayoutRequest` (id, tutor, jumlah, status: pending/processing/paid/rejected, rekening tujuan, tanggal).
- Minimum pencairan — perlu angka (mis. Rp100.000) supaya tidak ada payout Rp5.000.
- **Kartu saldo**: karena ini bukan kartu pembayaran sungguhan (tidak ada nomor kartu, tidak ada network Visa/Mastercard), sebaiknya cuma treatment visual — saldo besar, nama tutor, mungkin nomor rekening yang sudah diverifikasi ditutupi sebagian (•••• 4821). Jangan menyiratkan ini kartu fisik/virtual yang bisa dipakai belanja — itu produk yang beda sama sekali (perlu izin sebagai penerbit kartu, di luar cakupan).
- **Ajukan pencairan**: tombol yang membuka form pilih rekening (dari Setting) + jumlah, dengan validasi ≤ saldo tersedia dan ≥ minimum.

## Setting (`/dashboard/tutor/setting`)

**Profil tutor:**
- Nama & foto **ikut akun Google** (`model.User.Name`/`AvatarURL` tidak bisa diketik bebas — sudah dibahas sebelumnya). Yang bisa diedit tutor sendiri: bio singkat, spesialisasi/kategori yang dikuasai (dipakai di halaman katalog "oleh Budi Santoso" nantinya bisa tautan ke profil tutor). **Baru**: field bio/spesialisasi belum ada di `model.User`, perlu tabel profil tutor terpisah.

**Rekening bank:**
- Nama bank, nomor rekening, nama pemilik rekening. **Baru**, dan ini data sensitif — simpan nomor rekening ter-mask di UI (tampilkan cuma 4 digit terakhir setelah tersimpan), dan idealnya tutor harus konfirmasi ulang (misal re-enter) untuk mengubahnya, bukan sekali submit langsung berubah — supaya akun yang diretas tidak bisa diam-diam ganti rekening pencairan orang lain.

## Wizard "Tambah Produk"

Alurnya sudah bagus — saya rapikan tiap langkah dan tandai bagian yang perlu diputuskan.

### Step 1 — Jenis & struktur

- **Jenis**: Single / Bundle — sudah persis `model.ProductType`.
- **Kategori**: BUMN, SKD/CPNS, TKA, SNBT, SKB, Kedinasan, Jalur Mandiri Kampus.
  - ⚠️ **UTBK dan SNBT itu istilah untuk hal yang sama** (UTBK = mekanisme ujiannya/Ujian Tulis Berbasis Komputer, SNBT = nama programnya/Seleksi Nasional Berbasis Tes yang memakainya) — kalau keduanya jadi kategori terpisah, tutor dan pembeli akan bingung produk mana yang harus dipakai. Saran: satu kategori saja ("SNBT / UTBK"), sudah begitu penamaannya di `seedExamTypes()` yang ada sekarang.
  - ⚠️ **Jalur Mandiri Kampus** setiap kampus beda format ujiannya (UGM ≠ ITB ≠ UI) — tidak realistis dibuatkan template baku per kampus. Saran: kategori ini otomatis pakai exam type **"Custom"** (tutor susun subtes sendiri), bukan blueprint tetap seperti SNBT/SKD.
  - Kategori yang sudah ada template resminya di backend sekarang cuma **SNBT** dan **CPNS SKD**. BUMN/TKA/SKB/Kedinasan perlu ditambahkan sebagai `ExamType` baru di `seedExamTypes()` — dan saya kebetulan sudah riset strukturnya waktu bangun fitur try-out sebelumnya (TKD/AKHLAK/Bahasa Inggris untuk BUMN, subtes per mapel untuk TKA, dst.), jadi tinggal dipindahkan jadi seed data resmi, bukan mulai dari nol.
- **Sub kategori**: perlu daftar konkret per kategori sebelum ini bisa dibangun — misal SKD → CPNS / PPPK / Sekolah Kedinasan; TKA → Saintek / Soshum / per mata pelajaran. Ini saya perlu input dari kamu (**pertanyaan terbuka**, lihat di bawah).
- **Pengaturan soal (jumlah, waktu)**: ini persis `SectionTemplate` — pilih kategori otomatis mengisi jumlah subtes/soal/waktu default dari template, tutor boleh override manual (kecuali exam type "Custom", yang memang mulai kosong).

### Step 2 — Identitas produk

- Nama produk, deskripsi, upload thumbnail. Langsung sesuai `model.Product` (`Title`, `Description`, `ThumbnailURL`). Perlu endpoint upload gambar (belum ada — cek apakah sudah ada rencana storage, S3-compatible atau lokal di VPS).

### Step 3 — Isi soal

Dua jalur, keduanya perlu **menyesuaikan field dengan `Section.DefaultKind`/`ScoringMode`** dari step 1 — form single_choice beda dari form weighted (TKP-style):

**A. Buat manual (advanced):**
- Rich text editor untuk `Prompt` (dan `Explanation`) — rekomendasi **Tiptap** (berbasis ProseMirror, ringan, sudah biasa dipakai di Vue/Nuxt), bukan bikin sendiri.
- Alur "selesai satu, lanjut berikutnya" tanpa modal berulang: soal tersimpan begitu tutor pindah ke soal berikutnya (autosave per soal ke draft produk), daftar soal di sisi kiri/bawah bisa diklik untuk lompat & edit ulang — pola yang mirip dengan navigator soal yang sudah saya bangun untuk try-out workspace, cocok dipakai ulang untuk editor ini.
- Validasi per kind: `single_choice` wajib tepat satu opsi `IsCorrect`; `weighted` semua opsi wajib punya `Weight`; `true_false` tiap pernyataan wajib dikunci true/false; `short_answer` minimal satu `Answers`.
- Progress indikator: "12 dari 30 soal (target subtes ini)" — dari `QuestionTarget`.

**B. Impor CSV:**
- Sediakan **template unduhan per jenis soal** (kolom beda untuk single_choice vs weighted vs true_false — satu template generik akan membingungkan). Kolom minimal: `prompt, kind, option_a..option_e, correct/weight_a..weight_e, explanation`.
- Validasi saat unggah: tampilkan baris mana yang error dan kenapa (jangan "gagal impor" tanpa rincian) — pola yang sama seperti pesan error validasi lain di app ini (spesifik, bukan generik).
- Setelah impor, tutor tetap masuk ke editor yang sama untuk mengoreksi/melengkapi (misal `Explanation` yang wajib diisi sebelum submit review tapi sering kosong di CSV).

### Step 4 — Harga & kelengkapan

- Harga (`Price`, `PriceOriginal` untuk diskon).
- Info kelengkapan — ini map ke `IncludesFor(category)` yang sudah ada di backend (generik per kategori), tapi tutor mungkin mau menambah butir sendiri di luar yang generik → perlu field `Includes []string` custom di `Product` (**belum ada di model sekarang**, saat ini `Includes` hanya diturunkan otomatis dari kategori, bukan tersimpan per produk).
- **Info pendapatan diterima per pembelian**: harga dikurangi fee platform — tampilkan angka bersihnya di layar ini juga (bukan cuma di dashboard nanti), supaya tutor set harga dengan sadar berapa yang benar-benar masuk kantong.
- Ringkasan sebelum submit: tampilkan preview kartu produk seperti yang akan dilihat pembeli, plus checklist "siap diajukan" (semua subtes penuh sesuai target, semua soal ada pembahasan, harga terisi) — baru tombol "Ajukan Review" aktif.

## Keputusan (sudah dikonfirmasi)

- **Fee platform: 30% per pembelian.** Payout dari 70% sisanya.
- **Saldo tertahan dulu**, bukan langsung cair saat order lunas. Angka pastinya belum ditentukan — saya usulkan **7 hari** (umum dipakai buat menutup risiko refund/chargeback), gampang diubah jadi konstanta konfigurasi kalau mau beda. Setelah 7 hari, saldo pindah dari "tertahan" ke "tersedia" otomatis (butuh job terjadwal atau dihitung on-the-fly dari `paid_at`, bukan status manual).
- **Minimum pencairan: Rp100.000.**
- **Metode pencairan: transfer bank saja**, ke rekening yang tersimpan di Setting (bukan e-wallet). Tidak bisa ajukan pencairan kalau belum ada rekening tersimpan — tombolnya nonaktif dengan keterangan "Lengkapi rekening bank dulu".
- **UTBK digabung ke SNBT** — satu kategori "SNBT / UTBK". Sudah begitu adanya di `seedExamTypes()` sekarang (`Label: "SNBT / UTBK"`), tidak perlu perubahan kode.
- **Jalur Mandiri Kampus → exam type "Custom".** Tutor susun subtes sendiri karena tiap kampus beda format, tidak ditemplate baku.

### Upload gambar: Cloudflare R2

Ya, **ada tingkat gratis yang benar-benar bisa dipakai**, bukan sekadar trial:

- **10 GB storage gratis/bulan**, lalu $0.015/GB setelahnya (murah — 100 GB thumbnail cuma ~$1.5/bulan).
- **Egress (bandwidth keluar) gratis selamanya** — ini yang beda dari S3: nampilin gambar ke pengunjung situs tidak pernah kena tagihan bandwidth, berapa pun trafiknya. Untuk thumbnail produk yang dilihat berkali-kali, ini penghematan besar dibanding S3 biasa.
- 1 juta write ops + 10 juta read ops gratis/bulan — jauh di atas kebutuhan upload thumbnail marketplace ini untuk waktu yang lama.
- Cara pakai: bucket R2 + custom domain/Cloudflare Worker sederhana buat serve publik (atau langsung public bucket URL). Upload dari `zenko-api` pakai S3-compatible API (client Go `aws-sdk-go-v2` dengan endpoint R2, tidak perlu SDK khusus Cloudflare).

*(Beda dengan "Cloudflare Images", yang produk terpisah berbayar $5/bulan untuk resize/transform otomatis — tidak perlu itu untuk sekadar simpan+tampilkan thumbnail apa adanya.)*

## Struktur subtes per kategori (riset)

Ini yang dipakai untuk auto-isi "Pengaturan soal" begitu tutor pilih kategori di Step 1 — persis mekanisme `ExamType`/`SectionTemplate` yang sudah ada, tinggal ditambah entri baru. **SKD/CPNS dan SNBT sudah ada di `seedExamTypes()`, tidak diubah.** Empat berikut yang perlu ditambahkan:

**BUMN** (`category: "BUMN"`) — dari pola soal Rekrutmen Bersama BUMN 3 tahun terakhir:
| Subtes | Jumlah | Waktu | Penilaian |
|---|---|---|---|
| Tes Kemampuan Dasar (TKD) | 40 | 35 menit | Flat, benar=5 |
| Core Values AKHLAK | 30 | 25 menit | Weighted (tidak ada jawaban salah, tiap opsi berbobot) |
| Bahasa Inggris | 20 | 15 menit | Flat, benar=5 |

**Kedinasan** (`category: "Kedinasan"`) — sama persis strukturnya dengan SKD (BKN memakai instrumen yang sama untuk sekolah kedinasan), tapi kategori katalog beda jadi entri `ExamType` sendiri:
| Subtes | Jumlah | Waktu | Penilaian |
|---|---|---|---|
| Tes Wawasan Kebangsaan | 30 | 30 menit | Flat, benar=5, ambang 65 |
| Tes Intelegensi Umum | 35 | 35 menit | Flat, benar=5, ambang 80 |
| Tes Karakteristik Pribadi | 45 | 35 menit | Weighted, ambang 166 |

**SKB** (`category: "SKB"`) — total waktu bervariasi per formasi di praktiknya, angka di bawah estimasi wajar:
| Subtes | Jumlah | Waktu | Penilaian |
|---|---|---|---|
| Kompetensi Pedagogik | 40 | 48 menit | Flat, benar=5 |
| Kompetensi Bidang | 60 | 72 menit | Flat, benar=5 |

**TKA** (`category: "TKA"`) — ⚠️ **confidence lebih rendah dari yang lain**: TKA program baru 2026, sistemnya *Multi-stage Adaptive Testing* (soal menyesuaikan performa peserta secara real-time), jadi tidak ada "jumlah/waktu baku" resmi seperti SKD. Angka di bawah cuma titik awal yang wajar (tutor bebas ubah), bukan hasil riset ke aturan resmi:

Dua varian (satu kategori "TKA", dua `ExamType` beda supaya tutor pilih sesuai jurusan):
- `tka-saintek`: Matematika, Fisika, Kimia, Biologi — masing-masing 20 soal / 30 menit.
- `tka-soshum`: Ekonomi, Sejarah, Geografi, Sosiologi — masing-masing 20 soal / 30 menit.

Kisi-kisi resmi TKA SMA 2026 sebenarnya bilang 3 mapel wajib (Bahasa Indonesia, Matematika, Bahasa Inggris) + 2 mapel pilihan sesuai minat — lebih fleksibel dari 4 mapel tetap di atas. Karena ini exam type cuma pre-fill (tutor bisa tambah/hapus subtes bebas sebelum submit), saya sengaja bikin sederhana dulu (4 subtes tetap) daripada replikasi logika wajib+pilihan yang lebih rumit di awal — bisa dipertajam nanti kalau ternyata versi sederhana ini kurang pas.

## Yang sudah kepakai dari skema yang ada (tidak perlu dibangun ulang)

- `Product`, `Section`, `Question` — bentuk data sudah pas untuk seluruh wizard step 1–3.
- `ExamType`/`SectionTemplate` — mekanisme "pilih kategori → auto-isi struktur subtes" sudah punya tempatnya, tinggal nambah seed data per kategori.
- Alur moderasi draft → review → live → rejected (→ draft lagi) sudah ada aturannya di `product.go`, tinggal dipetakan ke UI.
- `IncludesFor(category)` — dasar untuk "info kelengkapan" otomatis.

## Yang benar-benar baru (belum ada sama sekali di backend)

- Query "pesanan/penjualan milik tutor X" (dibutuhkan Ringkasan + Penjualan).
- Seluruh model Payout/saldo (dibutuhkan Pencairan).
- Profil tutor (bio/spesialisasi) dan rekening bank (dibutuhkan Setting).
- Upload gambar (thumbnail produk, mungkin juga gambar dalam soal).
- Import CSV soal + template per jenis.
- `Includes` custom per produk (kalau tutor mau menambah butir di luar yang generik per kategori).
