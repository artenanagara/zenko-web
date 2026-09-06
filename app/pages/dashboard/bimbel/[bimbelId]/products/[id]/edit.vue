<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Edit Paket Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const productId = String(route.params.id)
</script>
<template><TutorProductWizard :key="productId" :bimbel-id="bimbelId" :product-id="productId" /></template>
