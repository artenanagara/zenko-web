<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Peluang Cepat SEO | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const opportunities = [
  { title: 'Hampir masuk halaman 1', description: 'Temukan halaman pada posisi 5–15 yang layak diperkuat dengan internal link atau pembaruan konten.' },
  { title: 'Impresi tinggi, CTR rendah', description: 'Identifikasi halaman yang sering terlihat di Google tetapi belum cukup menarik untuk diklik.' },
  { title: 'Konten belum terindeks', description: 'Cari artikel atau halaman live yang belum mendapatkan impresi setelah tujuh hari.' },
]
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Peluang Cepat" description="Prioritaskan perbaikan SEO dengan dampak terbesar." />
    <AppSectionMessage title="Menunggu data pencarian">Peluang akan dihitung dari kombinasi data Search Console dan katalog konten. Tidak ada rekomendasi yang dibuat sebelum kedua sumber tersebut tersambung.</AppSectionMessage>
    <div class="grid gap-4 md:grid-cols-3">
      <AppPanel v-for="item in opportunities" :key="item.title" :header="item.title" :collapsible="false">
        <div class="grid min-h-36 content-between gap-4"><p class="text-sm leading-6 text-muted">{{ item.description }}</p><span class="text-xs font-semibold text-faint">Belum tersedia</span></div>
      </AppPanel>
    </div>
  </div>
</template>
