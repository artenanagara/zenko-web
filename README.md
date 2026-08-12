# zenko-web

Frontend untuk **Zenko**, marketplace paket try out (SKD/CPNS, BUMN, SNBT, TKA).
Nuxt 4 + Tailwind CSS 4. Data katalog diambil dari [zenko-api](../zenko-api).

## Menjalankan

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
```

`.env.example` menyalakan mode mock, jadi katalog langsung terisi tanpa backend.
Kalau ingin memakai data sungguhan, jalankan `zenko-api` di terminal terpisah
lalu set `NUXT_PUBLIC_USE_MOCK=false`.

| Script              | Keterangan                          |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Dev server dengan HMR               |
| `npm run build`     | Build produksi ke `.output`         |
| `npm run preview`   | Jalankan hasil build                |
| `npm run typecheck` | `vue-tsc` di seluruh proyek         |

## Konfigurasi

| Variable               | Default                        | Keterangan                          |
| ---------------------- | ------------------------------ | ----------------------------------- |
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8080/api/v1` | Base URL zenko-api                  |
| `NUXT_PUBLIC_USE_MOCK` | `false`                        | `true` = katalog dari fixture lokal |

Dibaca lewat `runtimeConfig.public` di `nuxt.config.ts`, jadi bisa diganti saat
runtime tanpa build ulang.

## Mode mock

`NUXT_PUBLIC_USE_MOCK=true` membuat `useCatalog` mengambil data dari
[app/mocks/catalog.ts](app/mocks/catalog.ts) alih-alih memanggil API — berguna
saat mengerjakan tampilan tanpa menyalakan backend, atau saat Go belum
terpasang. Isinya 12 paket dan 3 testimoni, cerminan dari
`zenko-api/internal/store/seed.go`; **ubah keduanya bersamaan** kalau data seed
berubah.

Tab urutan tetap berfungsi di mode ini: `sortMockPackages` menyalin logika
`sortPackages` di service backend, jadi Pilihan/Terlaris/Terbaru menghasilkan
urutan yang sama seperti API sungguhan.

Defaultnya `false` supaya build produksi tidak pernah menyajikan fixture karena
lupa mematikan flag.

## Struktur

```
app/
  app.vue              shell: header + halaman + footer
  pages/index.vue      landing page, merangkai section
  components/          komponen presentasional
  composables/         useCatalog.ts — pembungkus endpoint API
  assets/css/main.css  design token (@theme) + component class
types/catalog.ts       tipe wire, cerminan internal/model/catalog.go
```

## Design token

Seluruh token desain ada di blok `@theme` pada `app/assets/css/main.css`, dan
Tailwind otomatis menurunkannya jadi utility:

| Token                     | Utility                            |
| ------------------------- | ---------------------------------- |
| `--color-primary`         | `bg-primary`, `text-primary`       |
| `--color-ink` / `--color-muted` | `text-ink`, `text-muted`      |
| `--shadow-lift`           | `shadow-lift`                      |
| `--radius-lg`             | `rounded-lg`                       |
| `--ease-smooth`           | `ease-smooth`                      |
| `--font-serif`            | `font-serif`                       |

Ubah nilainya di satu tempat, seluruh halaman ikut.

Beberapa hal yang tidak nyaman ditulis sebagai utility disimpan sebagai
component class di file yang sama: `.dot-grid` (pola titik latar),
`.tab-track` (border gradient), `.panel-inset` (inner shadow panel CTA),
`.text-accent` (frasa serif italic), dan `.clamp-2`.

## Catatan

- **Gambar** masih memakai URL Unsplash dan Pravatar dari seed backend.
  Ganti sebelum produksi, dan pertimbangkan `<NuxtImg>` untuk optimasi.
- **Belum ada** halaman detail paket. `PackageCard` sudah menaut ke
  `/paket/{slug}`, tinggal dibuat `app/pages/paket/[slug].vue`.
- **Form pencarian** belum memfilter apa-apa; endpoint `?q=` di backend sudah
  siap dipakai.
- **Menu mobile** belum ada — di bawah 768px link nav disembunyikan.
