<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Dashboard Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const classes = useBimbelClasses(bimbelId)
const assignments = useBimbelAssignments(bimbelId)
const products = useTutorProducts({ bimbelId })
onMounted(() => Promise.all([bimbel.refresh(), classes.refresh(), assignments.refresh(), products.refresh()]))
const privateProducts = computed(() => products.data.value.filter(item => item.visibility === 'bimbel'))
const ongoing = computed(() => assignments.data.value.filter(item => item.phase === 'ongoing').length)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader :title="bimbel.data.value?.name || 'Dashboard bimbel'" description="Kelola siswa, ubah latihan kertas menjadi online, dan pantau hasil dari satu tempat.">
      <template #actions><AppButton :to="`/dashboard/bimbel/${bimbelId}/assignments`" size="sm">Buat penugasan</AppButton></template>
    </AppPageHeader>
    <AppSectionMessage v-if="bimbel.data.value?.status === 'grace' || bimbel.data.value?.status === 'suspended'" appearance="warning" title="Langganan perlu diperpanjang">Data tetap aman dan dapat dibaca, tetapi pembuatan materi atau tugas baru dibatasi.</AppSectionMessage>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AccountStat tone="primary" label="Siswa aktif" :value="String(bimbel.data.value?.seatsUsed ?? 0)"><template #icon><IconUsers class="h-5 w-5" /></template></AccountStat>
      <AccountStat tone="success" label="Paket privat" :value="String(privateProducts.length)"><template #icon><IconGrid class="h-5 w-5" /></template></AccountStat>
      <AccountStat tone="primary" label="Kelas" :value="String(classes.data.value.length)"><template #icon><IconUsers class="h-5 w-5" /></template></AccountStat>
      <AccountStat tone="star" label="Tugas berlangsung" :value="String(ongoing)"><template #icon><IconTarget class="h-5 w-5" /></template></AccountStat>
    </div>
    <div class="grid gap-6 lg:grid-cols-2">
      <DashboardPanel title="Mulai dari bank soal" description="Susun soal sekali, lalu gunakan untuk banyak kelas dan jadwal.">
        <p class="text-sm leading-relaxed text-muted">Buat paket dari template SKD, SNBT, TKA, TOEFL, mapel sekolah, atau format kustom. Paket privat tidak muncul di marketplace.</p>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/products/new`" class="mt-5" size="sm">Buat paket soal</AppButton>
      </DashboardPanel>
      <DashboardPanel title="Kapasitas siswa" description="Hanya siswa aktif yang memakai kursi langganan.">
        <div class="flex items-end justify-between"><strong class="text-2xl">{{ bimbel.data.value?.seatsUsed ?? 0 }}</strong><span class="text-sm text-muted">dari {{ bimbel.data.value?.seatQuota ?? 0 }} kursi</span></div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken"><div class="h-full rounded-full bg-primary" :style="{ width: `${Math.min(100, ((bimbel.data.value?.seatsUsed ?? 0) / Math.max(1, bimbel.data.value?.seatQuota ?? 1)) * 100)}%` }" /></div>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/members`" class="mt-5" variant="secondary" size="sm">Kelola siswa</AppButton>
      </DashboardPanel>
    </div>
  </div>
</template>
