#!/usr/bin/env bash
#
# Menyalakan / mematikan mode perbaikan produksi Zenko.
#
#   sudo maintenance-mode on      # zenkoedu.id membalas 503 + halaman perbaikan
#   sudo maintenance-mode off     # kembali normal
#   maintenance-mode status       # tanpa root
#
# Bekerja lewat berkas penanda, bukan dengan menyunting konfigurasi Nginx:
# menyalakan dan mematikannya tidak butuh reload, tidak bisa merusak sintaks
# vhost, dan tidak menyisakan konfigurasi setengah jadi kalau operatornya
# terputus di tengah jalan.
set -Eeuo pipefail

root=/var/www/zenko-maintenance
flag="${root}/on"
page="${root}/index.html"

usage() {
  echo "penggunaan: maintenance-mode {on|off|status}" >&2
  exit 2
}

require_root() {
  if [[ ${EUID} -ne 0 ]]; then
    echo "harus dijalankan sebagai root" >&2
    exit 1
  fi
}

case "${1:-}" in
  on)
    require_root
    # Menolak menyalakan mode perbaikan tanpa halaman yang bisa dilayani:
    # tanpa berkas ini pengunjung dapat 503 telanjang dari Nginx, yang justru
    # lebih buruk daripada tidak menyalakannya sama sekali.
    if [[ ! -f ${page} ]]; then
      echo "halaman perbaikan tidak ada di ${page} — jalankan deploy web dulu" >&2
      exit 1
    fi
    install -d -m 0755 "${root}"
    : > "${flag}"
    chmod 0644 "${flag}"
    echo "mode perbaikan AKTIF — zenkoedu.id membalas 503"
    ;;
  off)
    require_root
    rm -f "${flag}"
    echo "mode perbaikan MATI — zenkoedu.id melayani normal"
    ;;
  status)
    if [[ -f ${flag} ]]; then
      echo "AKTIF (sejak $(date -r "${flag}" '+%Y-%m-%d %H:%M:%S %Z'))"
    else
      echo "MATI"
    fi
    ;;
  *)
    usage
    ;;
esac
