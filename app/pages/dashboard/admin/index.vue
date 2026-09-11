<script setup lang="ts">
/**
 * Ringkasan admin — "what needs me" in one glance (design spec §4.1).
 * Deliberately thin: no tables, just one linking queue card per antrean.
 * The queues themselves live on the sibling pages (applications, products,
 * payouts, bank-accounts).
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Ringkasan Admin | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Shared (useState-backed) with the layout's sidebar badges, so the numbers
// always agree and GET /admin/summary is hit once. Client-only fetch — the
// session cookie is HttpOnly on the API origin (see useAdminModeration).
const { data: summary, pending, error, refresh } = useAdminSummary()

onMounted(() => {
  refresh()
})

interface QueueCard {
  to: string
  label: string
  icon: string
  count: number | null
}

// Card order = sidebar order = decision-flow order. `count: null` (summary
// failed/absent) keeps every card rendered as a working link with an em-dash.
//
// Rekening bank is two pages, so it is two cards: every card's number is the
// queue on the page it links to, never a total spanning two destinations.
const cards = computed<QueueCard[]>(() => {
  const s = summary.value

  return [
    {
      to: '/dashboard/admin/applications',
      label: 'Pengajuan tutor',
      icon: 'user-circle-plus',
      count: s ? s.pendingTutorApplications : null,
    },
    {
      to: '/dashboard/admin/products',
      label: 'Moderasi produk',
      icon: 'eye',
      count: s ? s.pendingProducts : null,
    },
    {
      to: '/dashboard/admin/payments',
      label: 'Verifikasi pembayaran',
      icon: 'receipt',
      // Kedua paruh antrean, sama seperti badge di sidebar — kartu yang
      // menghitung setengahnya akan berselisih dengan daftar yang dibuka.
      count: s ? (s.pendingPaymentProofs ?? 0) + (s.pendingBimbelPaymentProofs ?? 0) : null,
    },
    {
      to: '/dashboard/admin/payouts',
      label: 'Pencairan',
      icon: 'wallet',
      count: s ? s.pendingPayouts : null,
    },
    {
      to: '/dashboard/admin/bank-accounts',
      label: 'Pengajuan rekening',
      icon: 'seal-check',
      count: s ? s.pendingBankVerifications : null,
    },
    {
      to: '/dashboard/admin/bank-accounts/changes',
      label: 'Perubahan rekening',
      icon: 'arrows-left-right',
      count: s ? s.pendingBankChangeRequests : null,
    },
  ]
})

const allClear = computed(() =>
  summary.value !== null && cards.value.every(card => card.count === 0),
)

/**
 * Headcount stats, shown above the queue grid. `totalStudents`/`totalTutors`
 * are optional on the wire (older API responses may predate them), so an
 * absent field renders as an em-dash instead of "undefined" or a false 0.
 */
const EM_DASH = '—'

function formatCount(value: number | undefined): string {
  return value === undefined ? EM_DASH : value.toLocaleString('id-ID')
}

const headcountStats = computed(() => [
  { label: 'Jumlah Siswa', value: formatCount(summary.value?.totalStudents) },
  { label: 'Jumlah Tutor', value: formatCount(summary.value?.totalTutors) },
])
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Ringkasan"
      description="Daftar tugas dan antrean moderasi yang memerlukan tindakanmu hari ini."
    />

    <!-- Skeleton on first load only; refetches keep the cards rendered. -->
    <!-- count/columns track the card grid below, so the cards land in the
         space the skeleton was already holding. -->
    <DashboardSkeleton
      v-if="pending && !summary"
      variant="stats"
      :count="5"
      :columns="3"
      label="Memuat antrean..."
    />

    <template v-else>
      <div v-if="error && !summary" class="flex flex-wrap items-center gap-3">
        <AppInlineMessage type="error">Jumlah antrean belum berhasil dimuat.</AppInlineMessage>
        <button
          type="button"
          class="text-[0.82rem] font-semibold text-primary hover:underline"
          @click="refresh()"
        >
          Muat ulang
        </button>
      </div>

      <!-- Headcounts: sourced from the same summary fetch as the queue cards
           below, so no extra request. Always rendered, same as the cards —
           an em-dash covers both a failed fetch and a backend that has not
           shipped these fields yet, rather than hiding the section. -->
      <DashboardStats :items="headcountStats" :columns="2" />

      <!-- Five cards: 3 columns, so the last row is a pair rather than the
           lone orphan a 4-column row would leave. -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminQueueCard
          v-for="card in cards"
          :key="card.to"
          :to="card.to"
          :label="card.label"
          :icon="card.icon"
          :count="card.count"
        />
      </div>

      <AppEmptyState
        v-if="allClear"
        title="Semua antrean selesai"
        description="Semua antrean sudah tertangani. Periksa kembali nanti untuk tugas baru."
      />
    </template>
  </div>
</template>
