# Mode perbaikan (produksi)

Halaman yang dilihat pengunjung ketika `zenkoedu.id` sengaja dimatikan
sementara, dan ketika Nuxt tidak menjawab.

## Kenapa HTML statis, bukan halaman Nuxt

Nginx mem-proxy `/` ke Nuxt di `127.0.0.1:3000`. Saat perbaikan, justru proses
Nuxt itulah yang mati — jadi halaman perbaikan berupa route Nuxt tidak akan
pernah tampil. Berkas ini dilayani Nginx sendiri, tanpa menyentuh aplikasi.

Karena alasan yang sama halaman itu tidak boleh punya dependensi luar: ikon
disisipkan sebagai `data:` URI dan seluruh CSS ditulis inline. Satu berkas,
nol permintaan tambahan, tidak bisa tampil setengah jadi.

## Cara kerjanya

`deploy/zenko.nginx` (vhost `zenkoedu.id` saja — staging dan design tidak
disentuh) memeriksa satu berkas penanda pada setiap permintaan:

```nginx
set $maintenance 0;
if (-f /var/www/zenko-maintenance/on) { set $maintenance 1; }
```

- **Halaman** (`location /`) → `503`, dijawab `@maintenance` dengan
  `index.html`, plus `Retry-After: 600` dan `Cache-Control: no-store`.
- **API** (`location ^~ /api/`) → `503` dengan **JSON**, bukan HTML. Klien di
  sisi web mengurai JSON; mengirimi mereka HTML membuat fetch gagal dengan
  galat parse yang membingungkan alih-alih status yang bisa ditindaklanjuti.
- **`502` dan `504`** ikut dijawab halaman yang sama, jadi kalau upstream mati
  di luar rencana pengunjung tetap melihat halaman Zenko, bukan layar galat
  telanjang dari Nginx.
- **`/.well-known/acme-challenge/`** tidak tersentuh, jadi Certbot tetap bisa
  memperbarui sertifikat selama mode perbaikan aktif.
- **`/health`** juga tidak disentuh, jadi pemantauan tetap bisa membedakan
  "sengaja dimatikan" dari "benar-benar mati".

Statusnya sengaja `503`, bukan `200`. Membalas `200` dengan isi halaman
perbaikan memberi tahu mesin pencari bahwa itulah isi halaman katalog yang
sebenarnya — cara cepat kehilangan peringkat untuk halaman yang tidak
bermasalah.

Penanda dipakai alih-alih menyunting vhost supaya menyalakan dan mematikan
mode ini tidak pernah butuh `nginx -s reload`, tidak bisa merusak sintaks
vhost, dan tidak menyisakan konfigurasi setengah jadi kalau operatornya
terputus di tengah jalan.

## Pemasangan (sekali saja, di VPS)

Dari mesin lokal:

```bash
scp zenko-web/deploy/maintenance/index.html  <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/maintenance-mode.sh     <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko.nginx             <you>@103.89.5.73:/tmp/
```

Lalu di server:

```bash
sudo install -d -m 0755 /var/www/zenko-maintenance
sudo install -m 0644 /tmp/index.html /var/www/zenko-maintenance/index.html

sudo install -m 0755 /tmp/maintenance-mode.sh /usr/local/sbin/maintenance-mode

# Simpan versi lama dulu — vhost ini juga melayani staging dan design.
sudo cp /etc/nginx/sites-available/zenko.nginx /etc/nginx/sites-available/zenko.nginx.bak
sudo mv /tmp/zenko.nginx /etc/nginx/sites-available/zenko.nginx
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` wajib lulus sebelum reload. Kalau gagal, kembalikan `.bak` dan
jangan reload.

## Pemakaian

```bash
sudo maintenance-mode on      # zenkoedu.id membalas 503 + halaman perbaikan
sudo maintenance-mode off     # kembali normal
maintenance-mode status       # tanpa root
```

Tidak perlu reload Nginx untuk keduanya — penandanya dibaca per permintaan.

`on` menolak berjalan kalau `/var/www/zenko-maintenance/index.html` tidak ada:
tanpa berkas itu pengunjung akan mendapat `503` telanjang, yang lebih buruk
daripada tidak menyalakannya sama sekali.

## Memverifikasi tanpa mengganggu pengunjung

```bash
# Dari server, sebelum menyalakan untuk publik:
curl -sI  https://zenkoedu.id/            | head -1     # harap: 200
sudo maintenance-mode on
curl -sI  https://zenkoedu.id/            | head -1     # harap: 503
curl -s   https://zenkoedu.id/api/v1/packages | head -c 80   # harap: JSON, bukan HTML
curl -sI  https://zenkoedu.id/health      | head -1     # harap: 200, tetap hidup
sudo maintenance-mode off
```

## Kalau halaman ini diubah

`index.html` tidak ikut terkirim oleh pipeline deploy — pipeline hanya
mengirim `.output` hasil build Nuxt. Jadi setelah menyunting berkas itu,
salin ulang manual dengan perintah `scp` + `install` di atas. Sama seperti
`zenko.nginx` dan berkas `*.service`, ini artefak sisi server yang dipasang
tangan.
