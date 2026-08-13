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
| `npm run version:show` | Tampilkan versi aplikasi saat ini |

## CI, versi, dan release

Pull request dan setiap push ke `main` menjalankan instalasi bersih, typecheck,
dan build produksi. Versi mengikuti Semantic Versioning dan dibuat dari
Conventional Commits melalui Release Please.

Saat release PR digabung, pipeline akan membuat tag `vX.Y.Z`, memperbarui
`package.json`, `package-lock.json`, serta `CHANGELOG.md`, lalu menerbitkan
GitHub Release dengan bundle server Nuxt dan checksum SHA-256.

Panduan lengkap ada di [VERSIONING.md](VERSIONING.md).

## Deployment

Push ke `main` yang lolos workflow `CI` akan diteruskan oleh workflow `Deploy`
ke VPS produksi. GitHub Actions membangun server Nuxt, mengunggah release baru,
memindahkan symlink `/opt/zenko/web/current`, lalu me-restart service
`zenko-web`. Jika health check gagal, script deployment mengembalikan symlink
ke release sebelumnya.

Konfigurasi systemd dan Nginx yang dilacak di repo ada di folder
[deploy](deploy). Secret `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, dan
`VPS_KNOWN_HOSTS` disimpan sebagai GitHub Actions environment secrets untuk
environment `production`.

## Konfigurasi

| Variable                  | Default                        | Keterangan                          |
| ------------------------- | ------------------------------ | ----------------------------------- |
| `NUXT_PUBLIC_APP_VERSION` | versi dari `package.json`      | Versi build untuk diagnosis         |
| `NUXT_PUBLIC_API_BASE`    | `http://localhost:8080/api/v1` | Base URL zenko-api                  |
| `NUXT_PUBLIC_USE_MOCK`    | `false`                        | `true` = katalog dari fixture lokal |

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

## Login dan pendaftaran

Form `/daftar` membuat akun email/password melalui `/auth/register`, lalu
mengarahkan pengguna ke ruang tunggu verifikasi. Form `/masuk` menerbitkan
cookie sesi melalui `/auth/login`. Halaman lupa/reset/ganti password memakai
endpoint recovery yang sama dan aktif secara default.

Password tidak pernah disimpan di frontend; form hanya mengirimkannya lewat
request ke zenko-api. Produksi wajib memakai HTTPS sebelum menerima kredensial.

### Google

Tombol **Masuk dengan Google** melakukan navigasi penuh ke
`{apiBase}/auth/google`; consent screen Google tidak bisa dijalankan di iframe.
Setelah selesai, zenko-api menerbitkan cookie `HttpOnly` lalu mengembalikan
browser ke `/?masuk=berhasil`, atau ke `/masuk?error=<alasan>` bila gagal.

Karena cookienya `HttpOnly` dan milik origin API, status login tidak bisa dibaca
dari `document.cookie`. `useAuth()` menanyakannya ke `/auth/me` — hanya di sisi
klien, lewat plugin `auth.client.ts`. Saat SSR cookie browser tidak tersedia di
server Nuxt, dan menebaknya akan membuat header berkedip salah saat hydration.

Login butuh zenko-api berjalan dengan kredensial Google terisi; mode mock tidak
mencakup autentikasi.

## Struktur

Nama berkas dan folder memakai bahasa Inggris; URL yang dilihat pengunjung
tetap bahasa Indonesia lewat `definePageMeta({ path })` di tiap halaman.

```
app/
  app.vue                 shell: <NuxtLayout> + <NuxtPage>
  pages/
    index.vue             /                     beranda
    about.vue             /tentang-kami
    packages/index.vue    /paket                katalog lengkap
    packages/[slug].vue   /paket/:slug          detail paket
    become-tutor.vue      /jadi-tutor           + form pengajuan
    login.vue             /masuk
    register.vue          /daftar
    terms.vue             /ketentuan-layanan
    privacy.vue           /kebijakan-privasi
    dashboard/admin.vue   /dashboard/admin      peran: admin
    dashboard/tutor.vue   /dashboard/tutor      peran: tutor, admin
    account/index.vue     /akun                 profil + ganti kata sandi
    account/packages.vue  /akun/paket           kartu paket yang dimiliki
    account/package-detail.vue
                          /akun/paket/:slug     analisis subtes + riwayat
    account/purchases.vue /akun/pembelian       daftar transaksi
    account/invoice.vue   /akun/pembelian/:invoice   invoice, bisa dicetak
  components/
    ui/                   AppButton, FormField, GoogleButton, BrandMark
    icons/                IconCheck, IconEye, IconSeal, IconSearch
    layout/               AppHeader, AppFooter, ProfileMenu
    home/                 section beranda + mock beranimasi
    catalog/              PackageCard, PackageGrid, SortTabs
    auth/                 panel samping halaman masuk/daftar
    legal/                LegalDocument
    dashboard/            DashboardStats, DashboardPanel, DashboardBadge
    account/              OwnedPackageCard
  composables/            useAuth, useCatalog, useTutorApplications,
                          useDashboardNav, useAccountNav, useOwnedPackages,
                          usePurchases, useAccountPassword, useDateFormat,
                          useInView
  layouts/                default (header+footer), auth (polos), dashboard,
                          account (header+footer+sidebar akun)
  middleware/auth.ts      guard sesi + peran, dibaca dari meta.roles
  mocks/                  fixture katalog, dashboard, dan akun
  types/router.d.ts       augmentasi RouteMeta (meta.roles)
  assets/css/main.css     design token (@theme) + component class
  plugins/auth.client.ts  memuat sesi sekali saat aplikasi start
shared/types/             tipe wire, cerminan zenko-api/internal/model/
  catalog.ts  user.ts  tutor-application.ts
```

Komponen dikelompokkan per domain hanya untuk memudahkan navigasi. Karena
`components: [{ path: '~/components', pathPrefix: false }]` di `nuxt.config.ts`,
nama tagnya tetap `<AppButton>` — bukan `<UiAppButton>` — sehingga memindahkan
berkas antar folder tidak memaksa perubahan di semua pemakainya.

## Peran dan akses

Tiga peran: `student` (default akun baru), `tutor`, `admin`. Peran datang dari
`GET /auth/me` dan ikut ditandatangani di cookie sesi oleh zenko-api.

`app/middleware/auth.ts` menjaga halaman dashboard: tanpa sesi diarahkan ke
`/masuk?lanjut=...`, sesi valid tapi peran salah diarahkan ke dashboard yang
sesuai. Guard ini **client-only** — cookie sesi `HttpOnly` milik origin API dan
tidak terlihat oleh server Nuxt.

Guard ini kenyamanan, bukan batas keamanan. Penegakan sesungguhnya ada di
zenko-api, yang menolak request dengan 401/403 tanpa peduli halaman apa yang
berhasil dibuka di browser.

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
- **Form pencarian** belum memfilter apa-apa; endpoint `?q=` di backend sudah
  siap dipakai.
- **Menu mobile** belum ada — di bawah 768px link nav disembunyikan.
- **Login/daftar dengan email** belum tersambung; hanya Google yang berfungsi.
  Formulirnya memvalidasi input lalu mengarahkan pengguna ke tombol Google.
- **Isi dashboard tutor dan siswa masih contoh** — lihat
  [app/mocks/dashboard.ts](app/mocks/dashboard.ts). zenko-api belum punya
  endpoint penjualan, pencairan, pembelian, maupun riwayat try out. Dashboard
  admin sudah memakai data sungguhan untuk daftar pengajuan tutor; panel
  moderasi paket di halaman yang sama masih contoh.
- **Peran hanya berubah setelah masuk ulang**, karena peran ikut ditandatangani
  ke dalam cookie sesi.
