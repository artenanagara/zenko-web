<script setup lang="ts">
import type { ProductStatus, TutorProductSummary } from '#shared/types/tutor-product'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})  

useHead({
  title: 'Produk saya — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: products, pending, error, refresh } = useTutorProducts()
const { confirm } = useConfirm()

// Client-only fetch: the session cookie never reaches the Nuxt server, so the
// list resolves after hydration (see useTutorProducts).
onMounted(refresh)

type FilterKey = 'all' | ProductStatus

const FILTERS: { key: FilterKey, label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'Ditinjau' },
  { key: 'live', label: 'Tayang' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'archived', label: 'Diarsipkan' },
]

const activeFilter = ref<FilterKey>('all')

const filtered = computed(() =>
  activeFilter.value === 'all'
    ? products.value
    : products.value.filter(product => product.status === activeFilter.value),
)

function countFor(key: FilterKey): number {
  return key === 'all'
    ? products.value.length
    : products.value.filter(product => product.status === key).length
}

// AppTabs works in plain strings; narrow its `update:modelValue` back onto
// FilterKey instead of casting.
const filterTabs = computed(() => FILTERS.map(filter => ({
  id: filter.key,
  label: filter.label,
  count: pending.value ? undefined : countFor(filter.key),
})))
function isFilterKey(id: string): id is FilterKey {
  return FILTERS.some(filter => filter.key === id)
}
function selectFilter(id: string) {
  if (isFilterKey(id)) activeFilter.value = id
}

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
// field) looks the row back up in the already-typed `filtered` array by id
// rather than trusting AppTable's erased `item`.
function findProduct(id: string): TutorProductSummary | undefined {
  return filtered.value.find(product => product.id === id)
}

/** Which row's action is in flight, so only that row's buttons lock. */
const busyId = ref('')
const actionError = ref('')

/** 422 dari submit: judul produk + daftar masalahnya, dirender sebagai list. */
const submitProblems = ref<{ title: string, problems: string[] } | null>(null)
const submitProblemsTitle = computed(() => submitProblems.value ? `"${submitProblems.value.title}" belum bisa diajukan:` : '')

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
    description: 'Produk tidak lagi tampil di katalog.',
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
    description: 'Tindakan ini tidak bisa dibatalkan.',
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
    <AppPageHeader title="Produk saya" description="Try-out tunggal dan bundling yang kamu jual di Zenko.">
      <template #actions>
        <AppButton to="/dashboard/tutor/products/new" size="sm">Buat produk</AppButton>
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

    <DashboardPanel title="Daftar produk" description="Kelola draft, ajukan untuk tayang, atau arsipkan.">
      <template #action>
        <AppTabs
          :tabs="filterTabs"
          :model-value="activeFilter"
          aria-label="Filter status produk"
          @update:model-value="selectFilter"
        />
      </template>

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

      <!-- Empty state: friendly and pointed straight at the wizard. -->
      <AppEmptyState
        v-else-if="products.length === 0"
        title="Belum ada produk"
        description="Mulai dari satu try-out tunggal: pilih jenis ujian, susun soal per subtes, lalu ajukan untuk tayang di katalog Zenko."
        action-label="Buat produk"
        @action="() => navigateTo('/dashboard/tutor/products/new')"
      />

      <p v-else-if="filtered.length === 0" class="py-8 text-center text-muted">
        Tidak ada produk dengan status ini.
      </p>

      <AppTable v-else :columns="productColumns" :data="filtered">
        <template #cell(title)="{ item }">
          <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.title }}</span>
          <span
            v-if="item.status === 'rejected' && item.rejectReason"
            class="mt-1 block text-[0.82rem] text-danger-ink"
          >
            Alasan penolakan: {{ item.rejectReason }}
          </span>
        </template>
        <template #cell(type)="{ value }">{{ productTypeLabel(value) }}</template>
        <template #cell(category)="{ value }">{{ value || '—' }}</template>
        <template #cell(price)="{ value }">
          <span class="tabular-nums">{{ value > 0 ? formatRupiah(value) : '—' }}</span>
        </template>
        <template #cell(questionCount)="{ item }">
          <span v-if="item.type === 'single'" class="tabular-nums">
            {{ item.questionCount }}/{{ item.questionTarget }} soal
          </span>
          <span v-else class="text-muted">—</span>
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
              >—</span>
            </span>
          </template>
        </template>
      </AppTable>
    </DashboardPanel>
  </div>
</template>
