<script setup lang="ts">
import type { AdminProductSummary } from '#shared/types/admin-moderation'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Moderasi produk — antrean review (design spec §4.3). Satu tabel dengan
 * DashboardTableToolbar di atasnya: filter berhenti di "Ditinjau" saat halaman
 * dibuka, jadi yang tampil pertama tetap antrean keputusan. "Tinjau" membuka
 * halaman detail; baris antrean juga bisa langsung disetujui/ditolak lewat
 * modal keputusan yang sama dengan halaman detail.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Moderasi Produk | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const queue = useAdminProductQueue()
const all = useAdminProductsAll()
const authors = useAdminProductAuthors()
const notice = useAdminProductsNotice()
const { refresh: refreshSummary } = useAdminSummary()

// Client-only fetch — the session cookie is HttpOnly on the API origin
// (see useAdminModeration). `loaded` keeps the skeleton to the first load, so
// a later refetch never blanks the toolbar (design spec §3.6).
const loaded = ref(false)
onMounted(async () => {
  await queue.refresh()
  loaded.value = true
})

// The detail page falls back to these when GET /admin/products/:id omits the
// author (the contract only promises it on list rows).
watch([queue.data, all.data], ([queued, everything]) => {
  for (const row of [...queued, ...everything]) authors.value[row.id] = row.author
})

// One message at a time; leaving the page clears it so it never leaks onto a
// later visit (design spec §3.5 — "navigation clears it").
onUnmounted(() => {
  notice.value = null
})

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter status, urutkan.
 *
 * Unlike the other four queues this page has two fetches behind it: the pinned
 * `status=review` queue (what the toolbar opens on) and the full list. Any
 * status other than Ditinjau needs the full list, which loads on first use —
 * the old "Semua" tab's lazy fetch, now triggered by the filter.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'review', label: 'Ditinjau' },
  { value: 'draft', label: 'Draft' },
  { value: 'live', label: 'Tayang' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'archived', label: 'Diarsipkan' },
  { value: 'all', label: 'Semua status' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru diperbarui' },
  { value: 'oldest', label: 'Terlama diperbarui' },
  { value: 'title', label: 'Judul A–Z' },
  { value: 'title-desc', label: 'Judul Z–A' },
  { value: 'price-desc', label: 'Harga tertinggi' },
  { value: 'price-asc', label: 'Harga terendah' },
]

const allRequested = ref(false)
/** Which fetch backs the table right now. */
const scope = ref<'queue' | 'all'>('queue')
const source = computed(() => (scope.value === 'queue' ? queue.data.value : all.data.value))

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<AdminProductSummary>(() => source.value, {
  searchFields: product => [product.title, product.category, product.subcategory, product.author.name, product.author.email],
  filters: {
    // `review` is served by the pinned queue fetch, so every row already
    // qualifies; the predicate still holds for the full list behind Semua.
    review: product => product.status === 'review',
    draft: product => product.status === 'draft',
    live: product => product.status === 'live',
    rejected: product => product.status === 'rejected',
    archived: product => product.status === 'archived',
    all: () => true,
  },
  sorts: {
    newest: (a, b) => b.updatedAt - a.updatedAt,
    oldest: (a, b) => a.updatedAt - b.updatedAt,
    title: (a, b) => a.title.localeCompare(b.title, 'id'),
    'title-desc': (a, b) => b.title.localeCompare(a.title, 'id'),
    'price-desc': (a, b) => b.price - a.price,
    'price-asc': (a, b) => a.price - b.price,
  },
  defaultFilter: 'review',
  defaultSort: 'newest',
})

watch(statusFilter, (value) => {
  scope.value = value === 'review' ? 'queue' : 'all'
  if (scope.value === 'all' && !allRequested.value) {
    allRequested.value = true
    all.refresh()
  }
})

// The count the old "Antrean" tab pill carried; the sidebar and Ringkasan
// badges still carry it too.
const queueCount = computed(() => queue.data.value.length)

/** Only the very first queue fetch hides the toolbar behind a skeleton. */
const firstLoadPending = computed(() => queue.pending.value && !loaded.value)
const listPending = computed(() => (scope.value === 'queue' ? queue.pending.value : all.pending.value))
const listError = computed(() => (scope.value === 'queue' ? queue.error.value : all.error.value))

function reloadActive() {
  if (scope.value === 'queue') queue.refresh()
  else all.refresh()
}

interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

// Status column only once the full list is in play — the review queue is all
// `review` by definition, so the column would repeat one value.
const columns = computed<Column[]>(() => [
  { key: 'title', label: 'Produk' },
  { key: 'type', label: 'Tipe' },
  { key: 'author', label: 'Author' },
  { key: 'price', label: 'Harga', align: 'right' },
  ...(scope.value === 'all' ? [{ key: 'status', label: 'Status' } satisfies Column] : []),
  { key: 'aksi', label: 'Aksi', align: 'right' },
])

// DashboardTable's cell slots hand back `item` as Record<string, any>; label/tone
// lookups go through typed accessors, and the action cell recovers the whole
// typed row by id (same discipline as tutor/products/index.vue).
function typeLabel(type: AdminProductSummary['type']): string {
  return PRODUCT_TYPE_LABEL[type]
}
function statusLabel(status: AdminProductSummary['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}
function statusTone(status: AdminProductSummary['status']) {
  return PRODUCT_STATUS_TONE[status]
}
function findProduct(id: string): AdminProductSummary | undefined {
  return source.value.find(product => product.id === id)
}

/* --------------------------------------------------------------------------
 * Keputusan langsung dari baris antrean — modal & copy identik dengan halaman
 * detail, hasilnya pun sama (design spec §3).
 * ------------------------------------------------------------------------ */

const target = ref<AdminProductSummary | null>(null)
const approveOpen = ref(false)
const rejectOpen = ref(false)
const decisionBusy = ref(false)
const decisionError = ref('')

function openApprove(product: AdminProductSummary) {
  target.value = product
  decisionError.value = ''
  approveOpen.value = true
}

function openReject(product: AdminProductSummary) {
  target.value = product
  decisionError.value = ''
  rejectOpen.value = true
}

async function afterDecision() {
  refreshSummary()
  const refetches = [queue.refresh()]
  if (allRequested.value) refetches.push(all.refresh())
  await Promise.all(refetches)
}

async function decide(approve: boolean, reason?: string) {
  const product = target.value
  if (!product || decisionBusy.value) return

  decisionError.value = ''
  decisionBusy.value = true
  try {
    await decideAdminProduct(product.id, { approve, reason })
    approveOpen.value = false
    rejectOpen.value = false
    notice.value = {
      type: 'success',
      text: approve
        ? `Paket "${product.title}" telah disetujui dan kini aktif di katalog.`
        : `Paket "${product.title}" telah ditolak. Catatan perbaikan berhasil dikirim ke tutor.`,
    }
    await afterDecision()
  }
  catch (cause) {
    if (isAdminProductConflict(cause)) {
      approveOpen.value = false
      rejectOpen.value = false
      notice.value = { type: 'warning', text: ADMIN_PRODUCT_CONFLICT_TEXT }
      await afterDecision()
    }
    else {
      decisionError.value = tutorApiMessage(cause, 'Keputusan belum berhasil disimpan. Coba lagi sebentar lagi.')
    }
  }
  finally {
    decisionBusy.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Moderasi produk"
      description="Tinjau dan kurasi kualitas paket soal yang diajukan tutor sebelum tayang di katalog Zenko."
    />

    <!-- :key remounts AppAlert per message — it hides itself after a dismiss. -->
    <AppAlert
      v-if="notice?.type === 'success'"
      :key="notice.text"
      variant="success"
      dismissible
    >
      {{ notice.text }}
    </AppAlert>
    <AppInlineMessage v-else-if="notice" type="warning">{{ notice.text }}</AppInlineMessage>

    <DashboardPanel>
      <!-- Skeleton on first load only; refetches keep the stale table rendered. -->
      <DashboardSkeleton
        v-if="firstLoadPending"
        :count="5"
        label="Memuat produk..."
      />

      <!-- Unlike the other four queues, the toolbar sits ABOVE the error and
           the loading state here: picking a status other than Ditinjau fires
           the full-list fetch, and the control that fired it has to stay put
           (and stay resettable) while that fetch runs or fails. -->
      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="admin-products-search"
          search-label="Cari produk"
          search-placeholder="Cari judul, kategori, tutor, atau email…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="produk"
          :actionable-count="queueCount"
          actionable-label="menunggu ditinjau"
          :active="isActive"
          @reset="reset"
        />

        <div v-if="listError" class="py-8 text-center">
          <AppInlineMessage type="error">{{ listError }}</AppInlineMessage>
          <button
            type="button"
            class="mt-3 font-semibold text-primary hover:underline"
            @click="reloadActive"
          >
            Muat ulang
          </button>
        </div>

        <!-- The full list loading for the first time after a filter change. -->
        <DashboardSkeleton
          v-else-if="listPending && total === 0"
          :count="5"
          label="Memuat produk..."
        />

        <!-- Two empty states: an untouched toolbar over an empty table means
             the queue really is clear; anything else means the search or
             filter came up empty, and Reset is the way out. -->
        <AppEmptyState
          v-else-if="rows.length === 0 && !isActive"
          title="Antrean kosong"
          description="Tidak ada produk yang menunggu ditinjau."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="title" action-key="aksi">
          <template #cell(title)="{ value }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ value }}</span>
          </template>
          <template #cell(type)="{ value }">{{ typeLabel(value) }}</template>
          <template #cell(author)="{ item }">
            <span class="block text-[0.9rem]">{{ item.author.name }}</span>
            <span class="block text-[0.82rem] text-muted">{{ item.author.email }}</span>
          </template>
          <template #cell(price)="{ value }">
            <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
            <span v-else class="font-semibold text-success-ink">Gratis</span>
          </template>
          <template #cell(status)="{ value }">
            <DashboardBadge :tone="statusTone(value)">{{ statusLabel(value) }}</DashboardBadge>
          </template>
          <template #cell(aksi)="{ item }">
            <!-- v-for over a one-item array recovers the typed row (tutor/products pattern). -->
            <template v-for="product in [findProduct(item.id)]" :key="item.id">
              <span v-if="product" class="inline-flex items-center gap-3 whitespace-nowrap">
                <NuxtLink
                  :to="`/dashboard/admin/products/${product.id}`"
                  class="text-[0.86rem] font-semibold text-primary hover:underline"
                >
                  Tinjau
                </NuxtLink>
                <template v-if="product.status === 'review'">
                  <button
                    type="button"
                    class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                    :disabled="decisionBusy"
                    @click="openApprove(product)"
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    class="text-[0.86rem] font-semibold text-danger hover:underline disabled:opacity-50"
                    :disabled="decisionBusy"
                    @click="openReject(product)"
                  >
                    Tolak…
                  </button>
                </template>
              </span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <AdminConfirmModal
      v-model:open="approveOpen"
      title="Tayangkan produk ini?"
      description="Produk langsung muncul di katalog publik dan bisa dibeli siswa."
      confirm-label="Setujui & tayangkan"
      confirm-variant="primary"
      :busy="decisionBusy"
      :error="decisionError"
      @confirm="decide(true)"
    />

    <AdminReasonModal
      v-model:open="rejectOpen"
      title="Tolak produk ini?"
      description="Tutor melihat alasanmu di dashboard-nya dan bisa memperbaiki lalu mengajukan ulang."
      placeholder="Jelaskan apa yang perlu diperbaiki tutor."
      hint="Alasan ini tampil di dashboard tutor."
      confirm-label="Tolak produk"
      :busy="decisionBusy"
      :error="decisionError"
      @confirm="reason => decide(false, reason)"
    />
  </div>
</template>
