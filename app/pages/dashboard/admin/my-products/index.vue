<script setup lang="ts">
import type { TableControlOption } from '~/composables/useTableControls'
import type { TutorProductSummary } from '#shared/types/tutor-product'

definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Produk Saya | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: products, pending, error, refresh } = useTutorProducts()
const { data: adminTutors, pending: tutorsPending, refresh: refreshTutors } = useAdminTutors()
const { byProductId: outgoingOffers, refresh: refreshOutgoing } = useOutgoingProductTransfers()
const toast = useToast()

const loaded = ref(false)
const transferOpen = ref(false)
const transferTarget = ref<TutorProductSummary | null>(null)
const transferSubmitting = ref(false)
const transferBusyId = ref('')

onMounted(async () => {
  await Promise.all([refresh(), refreshTutors(), refreshOutgoing()])
  loaded.value = true
})

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'live', label: 'Tayang' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru diperbarui' },
  { value: 'oldest', label: 'Terlama diperbarui' },
  { value: 'title', label: 'Judul A–Z' },
  { value: 'title-desc', label: 'Judul Z–A' },
]

const {
  search,
  filter,
  sort,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<TutorProductSummary>(() => products.value, {
  searchFields: product => [product.title, product.category, product.subcategory],
  filters: {
    all: () => true,
    pending: product => outgoingOffers.value.has(product.id),
    draft: product => product.status === 'draft',
    rejected: product => product.status === 'rejected',
    live: product => product.status === 'live',
  },
  sorts: {
    newest: (a, b) => b.updatedAt - a.updatedAt,
    oldest: (a, b) => a.updatedAt - b.updatedAt,
    title: (a, b) => a.title.localeCompare(b.title, 'id'),
    'title-desc': (a, b) => b.title.localeCompare(a.title, 'id'),
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

function statusLabel(product: TutorProductSummary) {
  return outgoingOffers.value.has(product.id) ? 'Menunggu' : PRODUCT_STATUS_LABEL[product.status]
}

function statusTone(product: TutorProductSummary) {
  return outgoingOffers.value.has(product.id) ? 'warning' : PRODUCT_STATUS_TONE[product.status]
}

function editPath(id: string) {
  return '/dashboard/admin/my-products/' + id + '/edit'
}

function findProduct(id: string) {
  return rows.value.find(product => product.id === id)
}

function typeLabel(type: TutorProductSummary['type']) {
  return PRODUCT_TYPE_LABEL[type]
}

function canTransfer(product: TutorProductSummary) {
  return product.status === 'draft'
    && product.type === 'single'
    && product.visibility !== 'bimbel'
    && !outgoingOffers.value.has(product.id)
}

function openTransfer(product: TutorProductSummary) {
  transferTarget.value = product
  transferOpen.value = true
}

async function submitTransfer(toAccountId: string) {
  const product = transferTarget.value
  if (!product || transferSubmitting.value) return
  transferSubmitting.value = true
  try {
    await offerProductTransfer(product.id, toAccountId)
    await Promise.all([refresh(), refreshOutgoing()])
    transferOpen.value = false
    toast.success('Paket ditawarkan ke tutor.', 'Statusnya sekarang Menunggu jawaban tutor.')
  }
  catch (cause) {
    toast.error('Paket belum berhasil diserahkan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    transferSubmitting.value = false
  }
}

async function withdrawTransfer(product: TutorProductSummary) {
  transferBusyId.value = product.id
  try {
    await withdrawProductTransfer(product.id)
    await Promise.all([refresh(), refreshOutgoing()])
    toast.success('Tawaran ditarik.')
  }
  catch (cause) {
    toast.error('Tawaran belum berhasil ditarik.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    transferBusyId.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Produk saya" description="Paket yang kamu susun sendiri sebagai admin. Salah satu yang bisa dilakukan padanya: menyerahkannya ke tutor penulis soalnya.">
      <template #actions>
        <AppButton to="/dashboard/admin/my-products/new" size="sm">Buat produk</AppButton>
      </template>
    </AppPageHeader>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="5" label="Memuat produk..." />
      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refresh">Coba lagi</button>
      </div>
      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="filter"
          v-model:sort="sort"
          search-id="admin-my-products-search"
          search-label="Cari produk"
          search-placeholder="Cari judul atau kategori..."
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          filter-label="Status"
          :result-count="rows.length"
          :total-count="total"
          item-noun="produk"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Belum ada produk"
          description="Buat produk pertama yang akan ditawarkan kepada tutor."
          action-label="Buat produk"
          @action="navigateTo('/dashboard/admin/my-products/new')"
        />
        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada produk yang cocok dengan pencarian atau filter."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="[
          { key: 'title', label: 'Produk' },
          { key: 'type', label: 'Tipe' },
          { key: 'price', label: 'Harga', align: 'right' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Aksi', align: 'right' },
        ]" :data="rows" primary-key="title">
          <template #cell(title)="{ item }">
            <NuxtLink :to="editPath(item.id)" class="font-semibold text-ink hover:text-primary hover:underline">{{ item.title }}</NuxtLink>
            <span class="block text-xs text-muted">{{ item.category }}<template v-if="item.subcategory"> · {{ item.subcategory }}</template></span>
          </template>
          <template #cell(type)="{ value }">{{ typeLabel(value) }}</template>
          <template #cell(price)="{ value }">
            <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
            <span v-else class="font-semibold text-success-ink">Gratis</span>
          </template>
          <template #cell(status)="{ item }">
            <template v-for="product in [findProduct(item.id)]" :key="item.id">
              <DashboardBadge v-if="product" :tone="statusTone(product)">{{ statusLabel(product) }}</DashboardBadge>
            </template>
          </template>
          <template #cell(actions)="{ item }">
            <template v-for="product in [findProduct(item.id)]" :key="item.id">
              <span v-if="product" class="inline-flex items-center gap-3 whitespace-nowrap">
                <AppIconButton v-if="canTransfer(product)" variant="ghost" size="sm" aria-label="Serahkan ke tutor" ariaLabel="Serahkan ke tutor" title="Serahkan ke tutor" @click="openTransfer(product)">
                  <AppIcon name="handshake" :size="17" aria-hidden="true" />
                </AppIconButton>
                <AppIconButton v-else-if="outgoingOffers.has(product.id)" variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" :disabled="transferBusyId === product.id" aria-label="Tarik tawaran" ariaLabel="Tarik tawaran" title="Tarik tawaran" @click="withdrawTransfer(product)">
                  <AppIcon name="x" :size="17" aria-hidden="true" />
                </AppIconButton>
                <AppIconButton :to="editPath(product.id)" variant="ghost" size="sm" aria-label="Edit produk" ariaLabel="Edit produk" title="Edit produk">
                  <AppIcon name="pencil-simple" :size="17" aria-hidden="true" />
                </AppIconButton>
              </span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <TutorTransferModal
      v-model:open="transferOpen"
      :product="transferTarget"
      :tutors="adminTutors"
      :tutors-pending="tutorsPending"
      :submitting="transferSubmitting"
      @submit="submitTransfer"
    />
  </div>
</template>
