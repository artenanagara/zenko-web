<script setup lang="ts">
import type { TutorProductSummary } from '#shared/types/tutor-product'
import type { TableControlOption } from '~/composables/useTableControls'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})  

useHead({
  title: 'Produk Saya | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: products, pending, error, refresh } = useTutorProducts()
const { confirm } = useConfirm()

// Client-only fetch: the session cookie never reaches the Nuxt server, so the
// list resolves after hydration (see useTutorProducts).
onMounted(refresh)

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter status, urutkan. Same shape as the five admin tables
 * (DashboardTableToolbar + useTableControls), so every dashboard table is
 * driven identically.
 *
 * The one deliberate difference: this table opens on "Semua status", not on an
 * actionable subset. The admin queues are queues — an admin comes to decide
 * what is waiting. This is a tutor's own inventory, and the old default tab was
 * "Semua"; landing on Draft (or Ditolak) would hide the live products the tutor
 * came to check and change what the page means. The actionable signal the tabs'
 * counts carried rides in the toolbar summary instead, as `actionableCount`.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Ditinjau' },
  { value: 'live', label: 'Tayang' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'archived', label: 'Diarsipkan' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru diperbarui' },
  { value: 'oldest', label: 'Terlama diperbarui' },
  { value: 'title', label: 'Judul A–Z' },
  { value: 'price-desc', label: 'Harga tertinggi' },
  { value: 'price-asc', label: 'Harga terendah' },
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<TutorProductSummary>(() => products.value, {
  // The type is searched by its rendered label ("Tunggal"/"Bundling"), not by
  // the wire value — the tutor searches for what the table shows them.
  searchFields: product => [product.title, product.category, PRODUCT_TYPE_LABEL[product.type]],
  filters: {
    all: () => true,
    draft: product => product.status === 'draft',
    review: product => product.status === 'review',
    live: product => product.status === 'live',
    rejected: product => product.status === 'rejected',
    archived: product => product.status === 'archived',
  },
  sorts: {
    newest: (a, b) => b.updatedAt - a.updatedAt,
    oldest: (a, b) => a.updatedAt - b.updatedAt,
    title: (a, b) => a.title.localeCompare(b.title, 'id'),
    'price-desc': (a, b) => b.price - a.price,
    'price-asc': (a, b) => a.price - b.price,
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

/**
 * What is actually waiting on the tutor: a draft to finish and submit, or a
 * rejection to revise. Everything else (review, live, archived) is just a
 * state, not a task.
 */
const actionableCount = computed(() =>
  products.value.filter(product => product.status === 'draft' || product.status === 'rejected').length,
)

const productColumns = [
  { key: 'title', label: 'Produk' },
  { key: 'type', label: 'Tipe' },
  { key: 'category', label: 'Kategori' },
  { key: 'price', label: 'Harga' },
  { key: 'questionCount', label: 'Soal' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// AppTable's cell slots hand back `item`/`value` as Record<string, any>/any
// (it isn't a generic component). Label/tone lookups go through these typed
// accessors instead of indexing the `any` value directly...
function productTypeLabel(type: TutorProductSummary['type']): string {
  return PRODUCT_TYPE_LABEL[type]
}
function productStatusTone(status: TutorProductSummary['status']) {
  return PRODUCT_STATUS_TONE[status]
}
function productStatusLabel(status: TutorProductSummary['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}
// ...and the action column (which needs the *whole* typed row, not just a
// field) looks the row back up in the already-typed `rows` array by id
// rather than trusting AppTable's erased `item`.
function findProduct(id: string): TutorProductSummary | undefined {
  return rows.value.find(product => product.id === id)
}

/** Which row's action is in flight, so only that row's buttons lock. */
const busyId = ref('')
const actionError = ref('')

/** 422 dari submit: judul produk + daftar masalahnya, dirender sebagai list. */
const submitProblems = ref<{ title: string, problems: string[] } | null>(null)
const submitProblemsTitle = computed(() => submitProblems.value ? `Paket "${submitProblems.value.title}" belum dapat diajukan:` : '')

const canEdit = (product: TutorProductSummary) =>
  product.status === 'draft' || product.status === 'rejected'

/** Delete is permanent — everything except live and review (admin's queue). */
const canDelete = (product: TutorProductSummary) =>
  product.status !== 'live' && product.status !== 'review'

/** "Ajukan tayang" hanya saat lengkap — target soal terpenuhi (single) atau bundle. */
const canSubmit = (product: TutorProductSummary) =>
  canEdit(product)
  && (product.type === 'bundle' || product.questionCount >= product.questionTarget)

async function submitProduct(product: TutorProductSummary) {
  actionError.value = ''
  submitProblems.value = null
  busyId.value = product.id
  try {
    await submitTutorProduct(product.id)
    await refresh()
  }
  catch (cause) {
    const problems = tutorSubmitProblems(cause)
    if (problems.length) {
      submitProblems.value = { title: product.title, problems }
    }
    else {
      actionError.value = tutorApiMessage(cause, 'Gagal mengajukan produk. Coba lagi sebentar lagi.')
    }
  }
  finally {
    busyId.value = ''
  }
}

async function archiveProduct(product: TutorProductSummary) {
  const ok = await confirm({
    title: `Arsipkan "${product.title}"?`,
    description: 'Paket ini tidak akan tampil lagi di katalog publik Zenko.',
    confirmLabel: 'Arsipkan',
  })
  if (!ok) return

  actionError.value = ''
  submitProblems.value = null
  busyId.value = product.id
  try {
    await archiveTutorProduct(product.id)
    await refresh()
  }
  catch (cause) {
    actionError.value = tutorApiMessage(cause, 'Gagal mengarsipkan produk. Coba lagi sebentar lagi.')
  }
  finally {
    busyId.value = ''
  }
}

async function deleteProduct(product: TutorProductSummary) {
  const ok = await confirm({
    title: `Hapus "${product.title}" permanen?`,
    description: 'Seluruh data soal dan konfigurasi paket akan dihapus permanen dan tidak bisa dibatalkan.',
    confirmLabel: 'Hapus Permanen',
  })
  if (!ok) return

  actionError.value = ''
  submitProblems.value = null
  busyId.value = product.id
  try {
    await deleteTutorProduct(product.id)
    await refresh()
  }
  catch (cause) {
    actionError.value = tutorApiMessage(cause, 'Gagal menghapus produk. Coba lagi sebentar lagi.')
  }
  finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Produk saya" description="Kelola paket try out mandiri dan bundling yang kamu sediakan untuk siswa.">
      <template #actions>
        <AppButton to="/dashboard/tutor/products/new" size="sm">Buat paket baru</AppButton>
      </template>
    </AppPageHeader>

    <AppInlineMessage v-if="actionError" type="error">{{ actionError }}</AppInlineMessage>

    <AppSectionMessage
      v-if="submitProblems"
      appearance="error"
      :title="submitProblemsTitle"
    >
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in submitProblems.problems" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat produk..." />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button
          type="button"
          class="mt-3 font-semibold text-primary hover:underline"
          @click="refresh"
        >
          Coba lagi
        </button>
      </div>

      <!-- Empty state: friendly and pointed straight at the wizard. Checked
           before the toolbar renders — with no products at all there is
           nothing to search, filter, or sort. -->
      <AppEmptyState
        v-else-if="products.length === 0"
        title="Belum ada paket soal"
        description="Mulai dengan membuat try out mandiri: tentukan kategori ujian, susun soal per subtes, lalu ajukan ke tim kurasi agar tayang di katalog Zenko."
        action-label="Buat paket baru"
        @action="() => navigateTo('/dashboard/tutor/products/new')"
      />

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="tutor-products-search"
          search-label="Cari produk"
          search-placeholder="Cari judul, kategori, atau tipe…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="produk"
          :actionable-count="actionableCount"
          actionable-label="perlu tindakan"
          :active="isActive"
          @reset="reset"
        />

        <!-- The tutor has products, so an empty table here can only mean the
             search or filter came up empty — Reset is the way out. -->
        <AppEmptyState
          v-if="rows.length === 0"
          title="Tidak ada hasil"
          description="Tidak ada paket soal yang sesuai dengan kata kunci pencarian atau filter status yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <AppTable v-else :columns="productColumns" :data="rows">
          <template #cell(title)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.title }}</span>
            <span
              v-if="item.status === 'rejected' && item.rejectReason"
              class="mt-1 block text-[0.82rem] text-danger-ink"
            >
              Catatan revisi: {{ item.rejectReason }}
            </span>
          </template>
          <template #cell(type)="{ value }">{{ productTypeLabel(value) }}</template>
          <template #cell(category)="{ value }">{{ value || 'Umum' }}</template>
          <template #cell(price)="{ value }">
            <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
            <span v-else class="font-semibold text-success-ink">Gratis</span>
          </template>
          <template #cell(questionCount)="{ item }">
            <span v-if="item.type === 'single'" class="tabular-nums">
              {{ item.questionCount }}/{{ item.questionTarget }} soal
            </span>
            <span v-else class="text-muted">Paket gabungan</span>
          </template>
          <template #cell(status)="{ item }">
            <DashboardBadge :tone="productStatusTone(item.status)">
              {{ productStatusLabel(item.status) }}
            </DashboardBadge>
          </template>
          <template #cell(aksi)="{ item }">
            <!-- v-for over a one-item array recovers the typed row from
                 `findProduct` as a template-scoped variable, narrowed by the
                 v-if below — avoids passing AppTable's untyped `item` straight
                 into functions that expect the real TutorProductSummary shape. -->
            <template v-for="product in [findProduct(item.id)]" :key="item.id">
              <span v-if="product" class="inline-flex items-center gap-3 whitespace-nowrap">
                <NuxtLink
                  v-if="canEdit(product)"
                  :to="`/dashboard/tutor/products/${product.id}/edit`"
                  class="text-[0.86rem] font-semibold text-primary hover:underline"
                >
                  Edit
                </NuxtLink>
                <button
                  v-if="canSubmit(product)"
                  type="button"
                  class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                  :disabled="busyId === product.id"
                  @click="submitProduct(product)"
                >
                  {{ busyId === product.id ? 'Mengajukan...' : 'Ajukan tayang' }}
                </button>
                <button
                  v-if="product.status === 'live'"
                  type="button"
                  class="text-[0.86rem] font-semibold text-danger hover:underline disabled:opacity-50"
                  :disabled="busyId === product.id"
                  @click="archiveProduct(product)"
                >
                  Arsipkan
                </button>
                <button
                  v-if="canDelete(product)"
                  type="button"
                  class="text-[0.86rem] font-semibold text-danger hover:underline disabled:opacity-50"
                  :disabled="busyId === product.id"
                  @click="deleteProduct(product)"
                >
                  {{ busyId === product.id ? 'Menghapus...' : 'Hapus' }}
                </button>
                <span
                  v-if="!canEdit(product) && !canSubmit(product) && !canDelete(product)"
                  class="text-[0.86rem] text-muted"
                >-</span>
              </span>
            </template>
          </template>
        </AppTable>
      </div>
    </DashboardPanel>
  </div>
</template>
