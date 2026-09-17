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
      <ul class="divide-y divide-hairline">
        <li v-for="check in checks" :key="check.label" class="grid gap-2 py-4 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><p class="font-semibold text-ink">{{ check.label }}</p><p class="mt-1 text-sm leading-6 text-muted">{{ check.detail }}</p></div><span class="rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-muted">{{ check.state }}</span></li>
      </ul>
    </AppPanel>
  </div>
</template>
