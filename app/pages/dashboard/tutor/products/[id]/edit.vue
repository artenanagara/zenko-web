<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Edit Paket Soal | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const route = useRoute()

/** :id dijamin string tunggal oleh bentuk path-nya. */
const productId = computed(() => String(route.params.id))
</script>

<template>
  <!-- key: pindah antar produk harus me-reset seluruh state wizard. -->
  <TutorProductWizard :key="productId" :product-id="productId" />
</template>
