<script setup lang="ts">
/**
 * Wizard mode create: langkah 1–3 dijalani di sini; begitu draft tersimpan di
 * server, wizard memindahkan URL ke /products/:id/edit untuk langkah 4–5.
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
