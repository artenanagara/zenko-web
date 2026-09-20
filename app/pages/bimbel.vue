<script setup lang="ts">
/**
 * `/bimbel` dipesan untuk direktori bimbel publik — cerminan `/paket`, dengan
 * profil per bimbel di `/bimbel/:slug`.
 *
 * Sampai direktori itu ada, URL-nya dialihkan ke halaman pemasaran. Route-nya
 * sengaja tidak dihapus: alamat ini sudah pernah dibagikan, dan menghapusnya
 * akan mematikan tautan yang beredar.
 *
 * Isi lamanya — daftar keanggotaan, kode bergabung, dan pengajuan — pindah ke
 * `/akun/bimbel` dan `/untuk-bimbel/daftar`, karena satu URL memikul tiga
 * pekerjaan sekaligus: pemasaran, pendaftaran, dan ruang milik sendiri.
 */
definePageMeta({ path: '/bimbel' })
</script>

<template>
  <NuxtPage />
</template>
