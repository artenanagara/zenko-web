<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Sitemap & Tautan | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const checks = [
  { label: 'Sitemap publik', detail: 'Validasi otomatis URL paket, artikel, kategori, dan profil tutor.', state: 'Belum dipantau' },
  { label: 'Robots.txt', detail: 'Pastikan crawler menemukan sitemap dan kebijakan AI tercatat.', state: 'Perlu verifikasi' },
  { label: 'Tautan rusak', detail: 'Pindai tautan internal pada artikel yang mengarah ke 404.', state: 'Belum dipantau' },
  { label: 'Redirect 301', detail: 'Kelola perubahan slug artikel agar tautan lama tetap aman.', state: 'Belum tersedia' },
]
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Sitemap & Tautan" description="Jaga jalur crawl dan tautan konten tetap sehat." />
    <AppSectionMessage title="Monitoring teknis belum terhubung">Checklist ini menjadi kontrak awal untuk health monitor. Pemeriksaan otomatis membutuhkan sitemap source, crawler internal, dan redirect store.</AppSectionMessage>
    <AppPanel header="Checklist kesehatan SEO" :collapsible="false">
      <div class="overflow-x-auto"><table class="w-full min-w-[680px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Pemeriksaan</th><th class="px-4 py-3 font-semibold">Detail</th><th class="px-4 py-3 font-semibold">Status</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="check in checks" :key="check.label"><td class="px-4 py-4 font-semibold text-ink">{{ check.label }}</td><td class="px-4 py-4 text-muted">{{ check.detail }}</td><td class="px-4 py-4"><AppBadge>{{ check.state }}</AppBadge></td></tr></tbody></table></div>
    </AppPanel>
  </div>
</template>
