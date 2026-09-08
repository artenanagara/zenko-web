<script setup lang="ts">
/**
 * Dulu meja verifikasi langganan bimbel yang berdiri sendiri; sekarang antrean
 * itu sudah melebur ke /dashboard/admin/payments bersama pembelian paket.
 *
 * Rutenya sengaja dipertahankan sebagai pengalihan, bukan dihapus: alamat ini
 * pernah tampil di menu admin selama berbulan-bulan dan kemungkinan besar ada
 * di bookmark seseorang. Halaman 404 untuk admin yang sedang mencari antrean
 * pembayaran adalah cara paling buruk untuk memberitahunya bahwa antreannya
 * pindah.
 *
 * Pengalihannya permanen dan terjadi di server saat SSR, jadi tidak ada kedipan
 * halaman kosong sebelum berpindah.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
  redirect: '/dashboard/admin/payments',
})
</script>

<template>
  <div />
</template>
