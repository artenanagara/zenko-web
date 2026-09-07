<script setup lang="ts">
import type { AssignmentResults } from '#shared/types/bimbel'

/**
 * Hasil kelompok satu penugasan.
 *
 * Dulu panel `v-if` di dasar halaman Penugasan, tanpa scrollIntoView: dari HP,
 * "Lihat hasil" terlihat seperti tombol mati. Sebagai route sendiri ia bisa
 * dibagikan ke sesama pengajar dan punya tombol back yang benar.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const assignmentId = String(route.params.assignmentId)
const listPath = `/dashboard/bimbel/${bimbelId}/assignments`

const results = ref<AssignmentResults | null>(null)
// Mulai true supaya render pertama menampilkan skeleton — fetch-nya sendiri
// baru berjalan setelah mount (session cookie milik origin API).
const pending = ref(true)
const error = ref('')

useHead({
  title: () => results.value ? `Hasil ${results.value.assignment.title} | Zenko` : 'Hasil Penugasan | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const breadcrumbs = computed(() => [
  { label: 'Penugasan', to: listPath },
  { label: results.value?.assignment.title ?? 'Hasil penugasan', truncate: true },
])

const stats = computed(() => {
  const summary = results.value?.summary
  return [
    { label: 'Ditugaskan', value: String(summary?.assigned ?? 0) },
    { label: 'Sudah mengerjakan', value: String(summary?.submitted ?? 0) },
    { label: 'Rata-rata', value: String(summary?.average ?? 0) },
    { label: 'Tertinggi', value: String(summary?.highest ?? 0) },
  ]
})

const resultColumns = [
  { key: 'rank', label: 'Peringkat' },
  { key: 'name', label: 'Siswa' },
  { key: 'status', label: 'Status' },
  { key: 'score', label: 'Skor', align: 'right' as const },
]

async function load() {
  pending.value = true
  error.value = ''
  try {
    results.value = await getBimbelAssignmentResults(bimbelId, assignmentId)
  }
  catch (cause) {
    error.value = tutorApiMessage(cause, 'Hasil penugasan belum bisa dimuat.')
  }
  finally {
    pending.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      :title="results?.assignment.title || 'Hasil penugasan'"
      :description="results
        ? `${formatDateTime(results.assignment.opensAt)} – ${formatDateTime(results.assignment.closesAt)} · ${results.assignment.maxAttempts}× percobaan`
        : 'Peringkat dan skor siswa untuk penugasan ini.'"
    >
      <template #breadcrumbs>
        <AppBreadcrumbs :items="breadcrumbs" />
      </template>
      <template #actions>
        <AppButton :to="listPath" size="sm" variant="outline">Kembali</AppButton>
      </template>
    </AppPageHeader>

    <DashboardSkeleton v-if="pending" variant="stats" :count="4" label="Memuat ringkasan hasil…" />

    <div v-else-if="error" class="rounded-md border border-line bg-surface px-5 py-6 text-center shadow-xs">
      <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
      <div class="mt-3 flex flex-wrap items-center justify-center gap-4">
        <button type="button" class="font-semibold text-primary hover:underline" @click="load">Coba lagi</button>
        <NuxtLink :to="listPath" class="text-[0.86rem] font-semibold text-primary hover:underline">
          Kembali ke Penugasan
        </NuxtLink>
      </div>
    </div>

    <template v-else-if="results">
      <DashboardStats :items="stats" :columns="4" />

      <DashboardPanel title="Hasil per siswa">
        <DashboardTable
          v-if="results.results.length"
          :columns="resultColumns"
          :data="results.results"
          primary-key="name"
        >
          <template #cell(rank)="{ item }">
            <span class="tabular-nums">{{ item.rank || '—' }}</span>
          </template>
          <template #cell(name)="{ item }">
            <span class="font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span>
          </template>
          <template #cell(status)="{ item }">
            <DashboardBadge :tone="item.status === 'selesai' ? 'success' : 'neutral'">
              {{ item.status === 'selesai' ? 'Selesai' : 'Belum mengerjakan' }}
            </DashboardBadge>
          </template>
          <template #cell(score)="{ item }">
            <span class="font-semibold tabular-nums">{{ item.status === 'selesai' ? item.score : '—' }}</span>
          </template>
        </DashboardTable>

        <AppEmptyState
          v-else
          title="Belum ada siswa yang ditugaskan"
          description="Penugasan ini belum menjangkau satu siswa pun. Periksa sasarannya, atau tambahkan siswa ke bimbel."
          action-label="Kelola siswa"
          @action="navigateTo(`/dashboard/bimbel/${bimbelId}/members`)"
        />
      </DashboardPanel>
    </template>
  </div>
</template>
