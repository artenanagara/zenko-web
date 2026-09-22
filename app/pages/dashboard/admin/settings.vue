<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pengaturan Admin | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
onMounted(() => navigateTo('/dashboard/tutor/settings', { replace: true }))
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Pengaturan" description="Membuka pengaturan tutor yang dipakai bersama oleh admin dan tutor." />
    <DashboardSkeleton :count="3" label="Membuka pengaturan..." />
  </div>
</template>
