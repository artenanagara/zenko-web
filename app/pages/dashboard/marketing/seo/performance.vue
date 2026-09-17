<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Performa Pencarian | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const metrics = ['Klik pencarian', 'Impresi pencarian', 'CTR rata-rata', 'Posisi rata-rata']
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Performa Pencarian" description="Pantau visibilitas Zenko di Google Search Console." />
    <AppSectionMessage title="Integrasi Search Console belum aktif">Halaman dan struktur datanya sudah disiapkan, tetapi belum ada koneksi Search Console pada environment ini. Angka performa tidak ditampilkan sampai sumber datanya tersedia.</AppSectionMessage>
    <DashboardStats :items="metrics.map(label => ({ label, value: '—' }))" :columns="4" />
    <AppPanel header="Kueri pencarian" :collapsible="false">
      <AppEmptyState title="Belum ada data kueri" description="Kueri, halaman pemenang, impresi, klik, dan posisi akan muncul setelah job Search Console berjalan." />
    </AppPanel>
  </div>
</template>
