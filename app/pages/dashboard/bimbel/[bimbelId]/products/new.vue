<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Buat Paket Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const bimbelId = String(useRoute().params.bimbelId)
</script>
<template><TutorProductWizard :bimbel-id="bimbelId" /></template>
