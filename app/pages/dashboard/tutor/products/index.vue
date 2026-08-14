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

/** Which row's action is in flight, so only that row's buttons lock. */
const busyId = ref('')
const actionError = ref('')

/** 422 dari submit: judul produk + daftar masalahnya, dirender sebagai list. */
const submitProblems = ref<{ title: string, problems: string[] } | null>(null)

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
  if (!window.confirm(`Arsipkan "${product.title}"? Produk tidak lagi tampil di katalog.`)) return

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
  if (!window.confirm(`Hapus "${product.title}" permanen? Tindakan ini tidak bisa dibatalkan.`)) return

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
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Produk saya</h1>
        <p class="mt-1.5 text-muted">Try-out tunggal dan bundling yang kamu jual di Zenko.</p>
      </div>
      <AppButton to="/dashboard/tutor/products/new" size="sm">Buat produk</AppButton>
    </header>

    <p
      v-if="actionError"
      role="alert"
      class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
    >
      {{ actionError }}
    </p>

    <div
      v-if="submitProblems"
      role="alert"
      class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
    >
      <p class="font-semibold">"{{ submitProblems.title }}" belum bisa diajukan:</p>
      <ul class="mt-2 grid list-disc gap-1 pl-5">
        <li v-for="problem in submitProblems.problems" :key="problem">{{ problem }}</li>
      </ul>
    </div>

    <DashboardPanel title="Daftar produk" description="Kelola draft, ajukan untuk tayang, atau arsipkan.">
      <template #action>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter status produk">
          <button
            v-for="filter in FILTERS"
            :key="filter.key"
            type="button"
            class="rounded-pill px-3 py-1.5 text-[0.8rem] font-semibold whitespace-nowrap transition-colors"
            :class="activeFilter === filter.key
              ? 'bg-primary-soft text-primary'
              : 'text-muted hover:bg-surface-sunken hover:text-ink'"
            :aria-pressed="activeFilter === filter.key"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
            <span v-if="!pending" class="tabular-nums">({{ countFor(filter.key) }})</span>
          </button>
        </div>
      </template>

      <DashboardSkeleton v-if="pending" :count="5" label="Memuat produk..." />

      <div v-else-if="error" class="py-8 text-center">
        <p class="text-muted">{{ error }}</p>
        <button
          type="button"
          class="mt-3 font-semibold text-primary hover:underline"
          @click="refresh"
        >
          Coba lagi
        </button>
      </div>

      <!-- Empty state: friendly and pointed straight at the wizard. -->
      <div v-else-if="products.length === 0" class="py-10 text-center">
        <h2 class="text-[1.2rem] font-bold tracking-[-0.03em]">Belum ada produk</h2>
        <p class="mx-auto mt-2 max-w-105 leading-[1.7] text-muted">
          Mulai dari satu try-out tunggal: pilih jenis ujian, susun soal per
          subtes, lalu ajukan untuk tayang di katalog Zenko.
        </p>
        <AppButton to="/dashboard/tutor/products/new" class="mt-6">Buat produk</AppButton>
      </div>

      <p v-else-if="filtered.length === 0" class="py-8 text-center text-muted">
        Tidak ada produk dengan status ini.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-200 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Produk</th>
              <th class="pb-3 font-bold">Tipe</th>
              <th class="pb-3 font-bold">Kategori</th>
              <th class="pb-3 font-bold">Harga</th>
              <th class="pb-3 font-bold">Soal</th>
              <th class="pb-3 font-bold">Status</th>
              <th class="pb-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filtered" :key="product.id" class="border-t border-hairline align-top">
              <td class="max-w-72 py-3.5 pr-4">
                <span class="block font-semibold tracking-[-0.02em]">{{ product.title }}</span>
                <span
                  v-if="product.status === 'rejected' && product.rejectReason"
                  class="mt-1 block text-[0.82rem] text-red-700"
                >
                  Alasan penolakan: {{ product.rejectReason }}
                </span>
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">
                {{ PRODUCT_TYPE_LABEL[product.type] }}
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ product.category || '—' }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] tabular-nums">
                {{ product.price > 0 ? formatRupiah(product.price) : '—' }}
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] tabular-nums">
                <template v-if="product.type === 'single'">
                  {{ product.questionCount }}/{{ product.questionTarget }} soal
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="py-3.5 pr-4">
                <DashboardBadge :tone="PRODUCT_STATUS_TONE[product.status]">
                  {{ PRODUCT_STATUS_LABEL[product.status] }}
                </DashboardBadge>
              </td>
              <td class="py-3.5 text-right">
                <span class="inline-flex items-center gap-3 whitespace-nowrap">
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
                    class="text-[0.86rem] font-semibold text-red-600 hover:underline disabled:opacity-50"
                    :disabled="busyId === product.id"
                    @click="archiveProduct(product)"
                  >
                    Arsipkan
                  </button>
                  <button
                    v-if="canDelete(product)"
                    type="button"
                    class="text-[0.86rem] font-semibold text-red-600 hover:underline disabled:opacity-50"
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  </div>
</template>
