<script setup lang="ts">
/**
 * Dulu daftar paket bimbel yang berdiri sendiri; sekarang daftar itu hidup di
 * dalam `/akun/bimbel` bersama keanggotaan yang membukanya.
 *
 * Rutenya dipertahankan sebagai pengalihan, bukan dihapus: alamat ini pernah
 * jadi menu di sidebar akun dan di menu profil, jadi ia kemungkinan ada di
 * bookmark siswa dan di tautan yang dibagikan pengelola bimbel. Pengalihannya
 * permanen dan terjadi saat SSR, jadi tidak ada kedipan halaman kosong.
 */
definePageMeta({
  path: '/akun/paket-bimbel',
  layout: 'account',
  middleware: 'auth',
  redirect: '/akun/bimbel',
})
</script>

<template>
  <div />
</template>
