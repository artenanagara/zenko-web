# Versioning dan release

zenko-web memakai [Semantic Versioning](https://semver.org/) dengan versi awal
`0.1.0`. Sumber versi berada di `package.json` dan disalin ke runtime config
Nuxt sebagai `public.appVersion`.

## Format commit

Gunakan Conventional Commits:

- `feat: ...` menaikkan versi minor.
- `fix: ...` dan `perf: ...` menaikkan versi patch.
- `feat!: ...` atau footer `BREAKING CHANGE:` menaikkan versi major.
- `docs:`, `test:`, `ci:`, `build:`, `refactor:`, dan `chore:` tidak membuat
  release sendiri kecuali memuat breaking change.

Judul pull request juga harus mengikuti format tersebut. Gunakan squash merge
agar judul pull request menjadi commit yang mudah dibaca Release Please.

## Alur release

1. Commit conventional masuk ke `main`.
2. Workflow Release memperbarui pull request release otomatis.
3. Tinjau versi dan changelog pada pull request tersebut.
4. Gabungkan pull request saat release siap diterbitkan.
5. Workflow membuat tag `vX.Y.Z`, GitHub Release, bundle `.output`, dan checksum.

Artefak release adalah aplikasi Nitro siap jalan. Ekstrak arsip, atur environment
production, lalu jalankan `node .output/server/index.mjs`. Deployment ke hosting
tertentu dapat ditambahkan setelah penyedia dan environment production dipilih.

## Pengaturan GitHub

Di Settings, Actions, General, gunakan workflow permissions `Read and write`
dan izinkan GitHub Actions membuat pull request. Secara opsional, tambahkan
secret `RELEASE_PLEASE_TOKEN` berupa fine-grained PAT dengan akses Contents dan
Pull requests agar CI ikut berjalan pada pull request yang dibuat bot.
