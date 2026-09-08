<script setup lang="ts">
definePageMeta({ layout: 'tryout', middleware: 'auth', path: '/dashboard/bimbel/:bimbelId()/products/:id()/simulasikan' })
useHead({ title: 'Simulasi Paket Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const route = useRoute()
const bimbelId = computed(() => String(route.params.bimbelId))
const productId = computed(() => String(route.params.id))
const sectionId = computed(() => String(route.query.section ?? ''))
</script>
<template>
  <TryoutSimulation :key="`${productId}-${sectionId}`" scope="tutor" :bimbel-id="bimbelId" :product-id="productId" :section-id="sectionId" :back-to="`/dashboard/bimbel/${bimbelId}/products/${productId}/edit?langkah=5`" back-label="Kembali ke paket" />
</template>
