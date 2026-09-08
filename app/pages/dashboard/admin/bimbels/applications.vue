<script setup lang="ts">
/**
 * Dulu antrean persetujuan pendaftaran bimbel; sekarang tidak ada lagi
 * persetujuan yang perlu diberikan — mendaftar langsung membuat ruangnya.
 *
 * Rutenya dipertahankan sebagai pengalihan ke direktori yang menggantikannya,
 * bukan dihapus: alamat ini pernah jadi menu di sidebar admin selama
 * berbulan-bulan, dan 404 untuk admin yang sedang mencari daftar bimbel adalah
 * cara paling buruk memberitahunya bahwa daftarnya pindah. Pendaftaran yang
 * terlanjur tertinggal di antrean lama ikut ditampilkan di sana.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
  redirect: '/dashboard/admin/bimbels',
})
</script>

<template>
  <div />
</template>
