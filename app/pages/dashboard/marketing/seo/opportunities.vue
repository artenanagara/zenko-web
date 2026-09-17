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
    <AppPanel header="Daftar peluang" :collapsible="false">
      <div class="overflow-x-auto"><table class="w-full min-w-[680px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Peluang</th><th class="px-4 py-3 font-semibold">Deskripsi</th><th class="px-4 py-3 font-semibold">Status</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="item in opportunities" :key="item.title"><td class="px-4 py-4 font-semibold text-ink">{{ item.title }}</td><td class="px-4 py-4 text-muted">{{ item.description }}</td><td class="px-4 py-4"><AppBadge>Belum tersedia</AppBadge></td></tr></tbody></table></div>
    </AppPanel>
  </div>
</template>
