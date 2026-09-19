<script setup lang="ts">
import type { TutorProductSummary } from '#shared/types/tutor-product'
import type { TableControlOption } from '~/composables/useTableControls'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Paket Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const workspace = { bimbelId }
const { data: products, pending, error, refresh } = useTutorProducts(workspace)
const { data: memberships, refresh: refreshMemberships } = useBimbelMemberships()
const toast = useToast()
const { confirm } = useConfirm()

onMounted(() => Promise.all([refresh(), refreshMemberships()]))

const membership = computed(() => memberships.value.find(item => item.bimbelId === bimbelId))
const canManageMarketplace = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')

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
  searchFields: product => [
    product.title,
    product.category,
    product.subcategory,
    PRODUCT_TYPE_LABEL[product.type],
    product.visibility === 'public' ? 'Marketplace' : 'Privat',
  ],
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
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

const actionableCount = computed(() =>
  products.value.filter(product => product.status === 'draft' || product.status === 'rejected').length,
)

const productColumns = [
  { key: 'title', label: 'Paket' },
  { key: 'category', label: 'Kategori' },
  { key: 'questionCount', label: 'Soal' },
  { key: 'status', label: 'Status' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

function productStatusTone(status: TutorProductSummary['status']) {
  return PRODUCT_STATUS_TONE[status]
}

function productStatusLabel(status: TutorProductSummary['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}

function findProduct(id: string): TutorProductSummary | undefined {
  return rows.value.find(product => product.id === id)
}

const busyId = ref('')
const problems = ref<string[]>([])

const canEdit = (product: TutorProductSummary) =>
  product.status === 'draft' || product.status === 'rejected' || product.status === 'live'

const canPublish = (product: TutorProductSummary) =>
  product.visibility === 'bimbel'
  && (product.status === 'draft' || product.status === 'rejected')
  && (product.type === 'bundle' || product.questionCount >= product.questionTarget)

const canDelete = (product: TutorProductSummary) =>
  product.status !== 'live' && product.status !== 'review'

/** Satu paket privat dapat memiliki tepat satu salinan marketplace. */
const marketplaceCopyFor = (product: TutorProductSummary) =>
  products.value.find(candidate => candidate.sourceProductId === product.id && candidate.status !== 'archived')

const canToggleMarketplace = (product: TutorProductSummary) =>
  canManageMarketplace.value && product.visibility === 'bimbel' && product.status === 'live'

async function run(product: TutorProductSummary, action: 'publish' | 'marketplace' | 'archive' | 'delete') {
  problems.value = []

  if (action === 'delete') {
    const approved = await confirm({
      title: `Hapus "${product.title}" permanen?`,
      description: 'Seluruh soal dan konfigurasi paket akan dihapus permanen dan tidak dapat dikembalikan.',
      confirmLabel: 'Hapus permanen',
    })
    if (!approved) return
  }

  if (action === 'archive') {
    const approved = await confirm({
      title: `Arsipkan "${product.title}"?`,
      description: product.visibility === 'bimbel'
        ? 'Paket tidak akan tersedia lagi untuk siswa bimbel.'
        : 'Paket tidak akan tampil lagi di marketplace Zenko.',
      confirmLabel: 'Arsipkan',
    })
    if (!approved) return
  }

  busyId.value = product.id
  try {
    if (action === 'publish') await submitTutorProduct(product.id, workspace, 'bimbel')
    if (action === 'marketplace') await submitBimbelProductPublic(bimbelId, product.id)
    if (action === 'archive') await archiveTutorProduct(product.id, workspace)
    if (action === 'delete') await deleteTutorProduct(product.id, workspace)
    await refresh()
    toast.success(
      action === 'marketplace'
        ? 'Salinan marketplace diajukan.'
        : action === 'publish'
          ? 'Paket tayang untuk siswa bimbel.'
          : action === 'archive'
            ? 'Paket diarsipkan.'
            : 'Paket dihapus.',
    )
  }
  catch (cause) {
    problems.value = tutorSubmitProblems(cause)
    toast.error('Tindakan belum berhasil.', tutorApiMessage(cause, 'Periksa paket lalu coba lagi.'))
  }
  finally {
    busyId.value = ''
  }
}

async function toggleMarketplace(product: TutorProductSummary, enabled: boolean) {
  if (!canManageMarketplace.value) return
  const approved = await confirm({
    title: enabled ? `Jual "${product.title}" di marketplace?` : `Hentikan penjualan "${product.title}"?`,
    description: enabled
      ? 'Zenko akan membuat salinan marketplace untuk ditinjau. Paket privat siswa tetap aman.'
      : 'Salinan marketplace akan diarsipkan dan tidak menerima pembelian baru.',
    confirmLabel: enabled ? 'Ya, jual di marketplace' : 'Hentikan penjualan',
    confirmVariant: enabled ? 'primary' : 'danger',
  })
  if (!approved) return
  await run(product, enabled ? 'marketplace' : 'archive')
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Paket"
      description="Kelola paket privat untuk siswa bimbel dan salinan yang diajukan ke marketplace Zenko."
    >
      <template #actions>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/products/new`" size="sm">Buat paket baru</AppButton>
      </template>
    </AppPageHeader>

    <AppSectionMessage v-if="problems.length" appearance="error" title="Paket belum siap">
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="item in problems" :key="item">{{ item }}</li>
      </ul>
    </AppSectionMessage>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat paket…" />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refresh">
          Coba lagi
        </button>
      </div>

      <AppEmptyState
        v-else-if="products.length === 0"
        title="Belum ada paket"
        description="Buat paket pertama, isi soalnya, lalu tayangkan untuk seluruh siswa bimbel."
        action-label="Buat paket baru"
        @action="navigateTo(`/dashboard/bimbel/${bimbelId}/products/new`)"
      />

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="bimbel-products-search"
          search-label="Cari paket"
          search-placeholder="Cari judul, kategori, akses, atau tipe…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="paket"
          :actionable-count="actionableCount"
          actionable-label="perlu tindakan"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada paket yang sesuai dengan kata kunci atau filter status yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="productColumns" :data="rows" primary-key="title" action-key="aksi">
          <template #cell(title)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.title }}</span>
            <span v-if="item.type === 'bundle'" class="mt-1 block text-[0.82rem] text-muted">Paket gabungan</span>
            <span v-if="item.status === 'rejected' && item.rejectReason" class="mt-1 block text-[0.82rem] text-danger-ink">
              Catatan revisi: {{ item.rejectReason }}
            </span>
          </template>

          <template #cell(category)="{ value, item }">
            {{ item.subcategory ? `${value} · ${item.subcategory}` : (value || 'Umum') }}
          </template>

          <template #cell(questionCount)="{ item }">
            <span v-if="item.type === 'single'" class="tabular-nums">{{ item.questionCount }}/{{ item.questionTarget }} soal</span>
            <span v-else class="text-muted">Paket gabungan</span>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="productStatusTone(item.status)">{{ productStatusLabel(item.status) }}</DashboardBadge>
          </template>

          <template #cell(marketplace)="{ item }">
            <template v-for="product in [findProduct(item.id)]" :key="item.id">
              <AppSwitch
                v-if="product && canToggleMarketplace(product)"
                :model-value="Boolean(marketplaceCopyFor(product))"
                :disabled="busyId === product.id"
                :aria-label="`${marketplaceCopyFor(product) ? 'Sembunyikan dari' : 'Tampilkan di'} marketplace: ${product.title}`"
                @update:model-value="toggleMarketplace(product, $event)"
              />
              <span v-else-if="product?.visibility === 'public'" class="text-[0.82rem] text-muted">Salinan marketplace</span>
              <span v-else class="text-[0.82rem] text-faint">—</span>
            </template>
          </template>

          <template #cell(aksi)="{ item }">
            <template v-for="product in [findProduct(item.id)]" :key="item.id">
              <span v-if="product" class="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-2 whitespace-nowrap">
                <AppIconButton v-if="canEdit(product)" :to="`/dashboard/bimbel/${bimbelId}/products/${product.id}/edit`" variant="ghost" size="sm" aria-label="Edit paket" ariaLabel="Edit paket" title="Edit paket"><AppIcon name="pencil-simple" :size="17" aria-hidden="true" /></AppIconButton>
                <AppIconButton v-if="canPublish(product)" variant="ghost" size="sm" :disabled="busyId === product.id" aria-label="Tayangkan paket" ariaLabel="Tayangkan paket" title="Tayangkan paket" @click="run(product, 'publish')"><AppIcon name="upload-simple" :size="17" aria-hidden="true" /></AppIconButton>
                <AppIconButton v-if="product.visibility === 'bimbel' && (product.status === 'live' || product.status === 'archived')" :to="`/dashboard/bimbel/${bimbelId}/products/${product.id}/hasil`" variant="ghost" size="sm" aria-label="Lihat hasil" ariaLabel="Lihat hasil" title="Lihat hasil"><AppIcon name="eye" :size="17" aria-hidden="true" /></AppIconButton>
                <AppIconButton v-if="product.visibility === 'public' && (product.status === 'draft' || product.status === 'rejected') && canManageMarketplace" variant="ghost" size="sm" :disabled="busyId === product.id" aria-label="Ajukan ulang ke marketplace" ariaLabel="Ajukan ulang ke marketplace" title="Ajukan ulang ke marketplace" @click="run(product, 'marketplace')"><AppIcon name="upload-simple" :size="17" aria-hidden="true" /></AppIconButton>
                <AppIconButton v-if="product.status === 'live'" variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" :disabled="busyId === product.id" aria-label="Arsipkan paket" ariaLabel="Arsipkan paket" title="Arsipkan paket" @click="run(product, 'archive')"><AppIcon name="x-circle" :size="17" aria-hidden="true" /></AppIconButton>
                <AppIconButton v-if="canDelete(product)" variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" :disabled="busyId === product.id" aria-label="Hapus paket" ariaLabel="Hapus paket" title="Hapus paket" @click="run(product, 'delete')"><AppIcon name="trash" :size="17" aria-hidden="true" /></AppIconButton>
              </span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>
  </div>
</template>
