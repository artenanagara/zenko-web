<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Buat Produk Tutor | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<template>
  <TutorProductWizard :admin="true" />
</template>
