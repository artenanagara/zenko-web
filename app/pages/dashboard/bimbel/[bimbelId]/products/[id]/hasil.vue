<script setup lang="ts">
import type { BimbelProductResults } from '#shared/types/bimbel'

/**
 * Rekap satu paket lintas anggota bimbel.
 *
 * Menggantikan "Hasil kelompok" per penugasan: tanpa daftar sasaran, rekap
 * hanya bisa berpangkal pada paketnya sendiri. Karena itu barisnya hanya berisi
 * anggota yang benar-benar pernah mengerjakan — "siapa yang belum" tidak punya
 * himpunan pembanding dan sengaja tidak ditampilkan.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const productId = String(route.params.id)
const listPath = `/dashboard/bimbel/${bimbelId}/products`

const results = ref<BimbelProductResults | null>(null)
// Mulai true supaya render pertama menampilkan skeleton — fetch-nya sendiri
// baru berjalan setelah mount (session cookie milik origin API).
const pending = ref(true)
const error = ref('')

// Rekap tidak membawa judul paketnya, jadi diambil dari daftar bank soal yang
// sudah dipakai halaman induk — bukan detail produk, yang ikut menarik seluruh
// soalnya hanya untuk satu baris judul.
const products = useTutorProducts({ bimbelId })
const product = computed(() => products.data.value.find(item => item.id === productId) ?? null)

useHead({
  title: () => product.value ? `Hasil ${product.value.title} | Zenko` : 'Hasil Paket | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const breadcrumbs = computed(() => [
  { label: 'Bank soal', to: listPath },
  { label: product.value?.title ?? 'Hasil paket', truncate: true },
])

const stats = computed(() => {
  const summary = results.value?.summary
  return [
    { label: 'Sudah mengerjakan', value: String(summary?.attempted ?? 0) },
    { label: 'Rata-rata', value: String(summary?.average ?? 0) },
    { label: 'Tertinggi', value: String(summary?.highest ?? 0) },
    { label: 'Terendah', value: String(summary?.lowest ?? 0) },
  ]
})

const resultColumns = [
  { key: 'rank', label: 'Peringkat' },
  { key: 'name', label: 'Siswa' },
  { key: 'attemptsUsed', label: 'Percobaan' },
  { key: 'score', label: 'Skor', align: 'right' as const },
  // Kolom pembanding antarbaris; di kartu HP ia hanya menambah keramaian.
  { key: 'finishedAt', label: 'Selesai', hideOnMobile: true },
]

async function load() {
  pending.value = true
  error.value = ''
  try {
    results.value = await getBimbelProductResults(bimbelId, productId)
  }
  catch (cause) {
    error.value = tutorApiMessage(cause, 'Hasil paket belum bisa dimuat.')
  }
  finally {
    pending.value = false
  }
}

onMounted(() => Promise.all([load(), products.refresh()]))
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      :title="product?.title || 'Hasil paket'"
      :description="product
        ? `${product.category} · rekap dari anggota bimbel yang sudah mengerjakan paket ini.`
        : 'Rekap skor anggota bimbel yang sudah mengerjakan paket ini.'"
    >
      <template #breadcrumbs>
        <AppBreadcrumbs :items="breadcrumbs" />
      </template>
      <template #actions>
        <AppButton :to="listPath" size="sm" variant="outline">Kembali</AppButton>
      </template>
    </AppPageHeader>

    <DashboardSkeleton v-if="pending" variant="stats" :count="4" label="Memuat rekap hasil…" />

    <div v-else-if="error" class="rounded-md border border-line bg-surface px-5 py-6 text-center shadow-xs">
      <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
      <div class="mt-3 flex flex-wrap items-center justify-center gap-4">
        <button type="button" class="font-semibold text-primary hover:underline" @click="load">Coba lagi</button>
        <NuxtLink :to="listPath" class="text-[0.86rem] font-semibold text-primary hover:underline">
          Kembali ke Bank soal
        </NuxtLink>
      </div>
    </div>

    <template v-else-if="results">
      <DashboardStats :items="stats" :columns="4" />

      <DashboardPanel
        title="Hasil per siswa"
        description="Hanya anggota yang pernah mengerjakan paket ini yang muncul di sini."
      >
        <DashboardTable
          v-if="results.rows.length"
          :columns="resultColumns"
          :data="results.rows"
          primary-key="name"
        >
          <template #cell(rank)="{ item }">
            <span class="tabular-nums">{{ item.rank || '—' }}</span>
          </template>
          <template #cell(name)="{ item }">
            <span class="font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span>
          </template>
          <template #cell(attemptsUsed)="{ item }">
            <span class="tabular-nums">{{ item.attemptsUsed }}×</span>
          </template>
          <template #cell(score)="{ item }">
            <span class="font-semibold tabular-nums">{{ item.score }}</span>
          </template>
          <template #cell(finishedAt)="{ item }">
            <span class="text-muted">{{ item.finishedAt ? formatDateTime(item.finishedAt) : '—' }}</span>
          </template>
        </DashboardTable>

        <AppEmptyState
          v-else
          title="Belum ada yang mengerjakan"
          description="Paket ini terbuka untuk seluruh siswa bimbel, tetapi belum ada yang menyelesaikannya. Rekapnya muncul setelah percobaan pertama."
          action-label="Kelola siswa"
          @action="navigateTo(`/dashboard/bimbel/${bimbelId}/members`)"
        />
      </DashboardPanel>
    </template>
  </div>
</template>
