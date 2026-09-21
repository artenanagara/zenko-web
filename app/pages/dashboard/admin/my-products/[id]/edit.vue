<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Edit Produk Saya | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const productId = computed(() => String(route.params.id))
</script>

<template>
  <TutorProductWizard :key="productId" :product-id="productId" :admin="true" />
</template>
