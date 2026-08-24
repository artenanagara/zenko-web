<script setup lang="ts">
/**
 * Wizard mode create: langkah 1–2 dijalani di sini; begitu draft tersimpan di
 * server, wizard memindahkan URL ke /products/:id/edit untuk langkah 3–4.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Buat Paket Soal | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <TutorProductWizard />
</template>
