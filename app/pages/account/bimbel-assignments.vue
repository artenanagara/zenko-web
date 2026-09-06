<script setup lang="ts">
definePageMeta({ path: '/akun/tugas-bimbel', layout: 'account', middleware: 'auth' })
useHead({ title: 'Tugas Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const { data: assignments, pending, error, refresh } = useStudentAssignments()
onMounted(refresh)
const formatDate = (value: number) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value * 1000)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Tugas bimbel" description="Latihan dan try out yang diberikan pengajar bimbelmu." />
    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="4" label="Memuat tugas…" />
      <AccountError v-else-if="error" @retry="refresh">{{ error }}</AccountError>
      <div v-else-if="assignments.length" class="grid gap-3">
        <article v-for="item in assignments" :key="item.id" class="flex flex-col gap-4 rounded-md border border-hairline p-4 sm:flex-row sm:items-center">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ item.title }}</h2><DashboardBadge :tone="item.phase === 'ongoing' ? 'success' : 'neutral'">{{ item.phase === 'ongoing' ? 'Sedang berlangsung' : item.phase === 'scheduled' ? 'Terjadwal' : 'Selesai' }}</DashboardBadge></div>
            <p class="mt-1 text-sm text-muted">{{ item.bimbelName }} · {{ formatDate(item.opensAt) }}–{{ formatDate(item.closesAt) }}</p>
            <p class="mt-1 text-xs text-muted">Percobaan {{ item.attemptsUsed }}/{{ item.maxAttempts }}<template v-if="item.bestScore >= 0"> · Skor terbaik {{ item.bestScore }}</template></p>
          </div>
          <AppButton v-if="item.canStart" :to="`/akun/paket/${item.packageSlug}`" size="sm">Kerjakan</AppButton>
          <AppButton v-else-if="item.reviewOpen && item.attemptsUsed" :to="`/akun/paket/${item.packageSlug}`" size="sm" variant="secondary">Lihat hasil</AppButton>
        </article>
      </div>
      <AppEmptyState v-else title="Belum ada tugas" description="Tugas dari pengajar akan muncul di sini setelah dipublikasikan." />
    </DashboardPanel>
  </div>
</template>
