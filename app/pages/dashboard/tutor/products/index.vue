<script setup lang="ts">
import type { TutorProductDetail, TutorProductSummary } from '#shared/types/tutor-product'
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
const route = useRoute()

/* --------------------------------------------------------------------------
 * Penyerahan paket admin → tutor.
 *
 * Halaman ini melayani dua peran (roles di definePageMeta), jadi kedua sisi
 * penyerahan tinggal di sini: seorang admin menawarkan draft yang ia ketikkan,
 * seorang tutor menjawab tawaran yang ditujukan kepadanya. Yang dilihat
 * masing-masing ditentukan perannya, bukan halaman yang berbeda.
 * ------------------------------------------------------------------------ */

const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')

const {
  data: transferOffers,
  refresh: refreshOffers,
  accept: acceptOffer,
  decline: declineOffer,
} = useProductTransferOffers()

const { data: adminTutors, pending: adminTutorsPending, refresh: refreshAdminTutors } = useAdminTutors()
const { byProductId: outgoingOffers, refresh: refreshOutgoing } = useOutgoingProductTransfers()

/** Paket yang sedang ditawarkan lewat modal; null saat modal tertutup. */
const transferTarget = ref<TutorProductSummary | null>(null)
const transferOpen = ref(false)
const transferSubmitting = ref(false)
/** Id tawaran yang sedang dijawab, agar hanya kartunya yang terkunci. */
const offerBusyId = ref('')

// Client-only fetch: the session cookie never reaches the Nuxt server, so the
// list resolves after hydration (see useTutorProducts).
onMounted(async () => {
  await refresh()
  // Tawaran dimuat untuk semua peran: seorang admin pun bisa menjadi penerima
  // penyerahan dari admin lain. Direktori tutor hanya untuk admin — bagi tutor
  // biasa endpoint-nya dijawab 403.
  await refreshOffers()
  if (isAdmin.value) await Promise.all([refreshAdminTutors(), refreshOutgoing()])
  // Ringkasan can hand over a selection (?pilih=id,id): the tutor ticked rows
  // in the preview there and asked to manage them here. Unknown ids are
  // dropped by the pruning watcher below; the query is cleared so a reload
  // does not re-select what the tutor has since cleared.
  const handed = typeof route.query.pilih === 'string' ? route.query.pilih.split(',').filter(Boolean) : []
  if (handed.length) {
    selected.value = handed
    await navigateTo({ path: route.path, query: {} }, { replace: true })
  }
})

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
  searchFields: product => [product.title, product.category, product.subcategory, PRODUCT_TYPE_LABEL[product.type]],
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

// DashboardTable's cell slots hand back `item`/`value` as Record<string, any>/any
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
// rather than trusting DashboardTable's erased `item`.
function findProduct(id: string): TutorProductSummary | undefined {
  return rows.value.find(product => product.id === id)
}

/** Which row's action is in flight, so only that row's buttons lock. */
const busyId = ref('')
const toast = useToast()

/** Belum pernah tayang: masih bebas diubah dan masih perlu diajukan. */
const isUnpublished = (product: TutorProductSummary) =>
  product.status === 'draft' || product.status === 'rejected'

/**
 * Produk tayang ikut bisa dibuka — hanya harganya yang boleh berubah, sisanya
 * dikunci oleh wizard (lihat isFieldEditable di TutorProductWizard). Labelnya
 * tetap "Edit"; halaman edit sendiri yang menjelaskan apa saja yang terkunci.
 */
const canEdit = (product: TutorProductSummary) =>
  isUnpublished(product) || product.status === 'live'

/** Delete is permanent — everything except live and review (admin's queue). */
const canDelete = (product: TutorProductSummary) =>
  product.status !== 'live' && product.status !== 'review'

/**
 * "Ajukan tayang" hanya saat lengkap — target soal terpenuhi (single) atau
 * bundle. Sengaja lewat isUnpublished, bukan canEdit: yang sudah tayang boleh
 * dibuka untuk ubah harga tapi tentu tidak perlu diajukan lagi.
 */
const canSubmit = (product: TutorProductSummary) =>
  isUnpublished(product)
  && (product.type === 'bundle' || product.questionCount >= product.questionTarget)

/**
 * 422 dari submit: judul produk + daftar masalahnya, dirender sebagai list.
 * Stays on the page rather than in a toast — it is a checklist the tutor works
 * through, not a one-line outcome.
 */
const submitProblems = ref<{ title: string, problems: string[] }[]>([])

/* --------------------------------------------------------------------------
 * Seleksi massal. The table stores ids; everything below derives from them.
 * A selection only ever names products that still exist — the watcher prunes
 * ids the list no longer has, so a delete or a refetch cannot leave a phantom
 * count in the bar.
 * ------------------------------------------------------------------------ */

const selected = ref<string[]>([])

watch(products, (list) => {
  const known = new Set(list.map(product => product.id))
  if (selected.value.some(id => !known.has(id))) {
    selected.value = selected.value.filter(id => known.has(id))
  }
})

const selectedProducts = computed(() => {
  const chosen = new Set(selected.value)
  return products.value.filter(product => chosen.has(product.id))
})

/** Per action, the subset of the selection it applies to — the rest is left alone. */
const submitTargets = computed(() => selectedProducts.value.filter(canSubmit))
const archiveTargets = computed(() => selectedProducts.value.filter(product => product.status === 'live'))
const deleteTargets = computed(() => selectedProducts.value.filter(canDelete))

/** Which bulk action is running, so the three buttons lock together. */
const bulkBusy = ref<'' | 'submit' | 'archive' | 'delete'>('')

/**
 * Runs one action over its targets in sequence — the API has no batch
 * endpoint, and firing a dozen submits at once would only race the refresh.
 * Failures are collected, not thrown: the tutor gets one toast with the tally
 * and the rows that failed stay selected so they can be retried.
 */
async function runBulk(
  kind: 'submit' | 'archive' | 'delete',
  targets: TutorProductSummary[],
  act: (product: TutorProductSummary) => Promise<void>,
  done: { title: string, description: (ok: number) => string },
  failed: { title: string },
) {
  bulkBusy.value = kind
  submitProblems.value = []
  const succeeded: string[] = []
  const failures: string[] = []
  try {
    for (const product of targets) {
      try {
        await act(product)
        succeeded.push(product.id)
      }
      catch (cause) {
        const problems = kind === 'submit' ? tutorSubmitProblems(cause) : []
        if (problems.length) submitProblems.value = [...submitProblems.value, { title: product.title, problems }]
        failures.push(product.title)
      }
    }
    await refresh()
    selected.value = selected.value.filter(id => !succeeded.includes(id))
    if (succeeded.length) toast.success(done.title, done.description(succeeded.length))
    if (failures.length) {
      toast.error(failed.title, `${failures.length} produk gagal: ${failures.join(', ')}.`)
    }
  }
  finally {
    bulkBusy.value = ''
  }
}

async function bulkSubmit() {
  const targets = submitTargets.value
  if (!targets.length) return
  const ok = await confirm({
    title: `Ajukan ${targets.length} produk untuk tayang?`,
    description: 'Setiap paket akan ditinjau admin sebelum tayang di katalog. Paket yang belum lengkap akan ditolak dan daftar masalahnya muncul di atas tabel.',
    confirmLabel: 'Ajukan semua',
  })
  if (!ok) return
  await runBulk('submit', targets, product => submitTutorProduct(product.id),
    { title: 'Produk diajukan.', description: ok => `${ok} produk menunggu tinjauan admin.` },
    { title: 'Sebagian produk belum bisa diajukan.' })
}

async function bulkArchive() {
  const targets = archiveTargets.value
  if (!targets.length) return
  const ok = await confirm({
    title: `Arsipkan ${targets.length} produk?`,
    description: 'Paket-paket ini tidak akan tampil lagi di katalog publik Zenko. Siswa yang sudah membeli tetap bisa mengerjakannya.',
    confirmLabel: 'Arsipkan semua',
  })
  if (!ok) return
  await runBulk('archive', targets, product => archiveTutorProduct(product.id),
    { title: 'Produk diarsipkan.', description: ok => `${ok} produk tidak tampil lagi di katalog.` },
    { title: 'Sebagian produk belum berhasil diarsipkan.' })
}

async function bulkDelete() {
  const targets = deleteTargets.value
  if (!targets.length) return
  const ok = await confirm({
    title: `Hapus ${targets.length} produk permanen?`,
    description: 'Seluruh data soal dan konfigurasi paket-paket ini akan dihapus permanen dan tidak bisa dibatalkan.',
    confirmLabel: 'Hapus Permanen',
  })
  if (!ok) return
  await runBulk('delete', targets, product => deleteTutorProduct(product.id),
    { title: 'Produk dihapus permanen.', description: ok => `${ok} produk dihapus.` },
    { title: 'Sebagian produk belum berhasil dihapus.' })
}

async function submitProduct(product: TutorProductSummary) {
  submitProblems.value = []
  busyId.value = product.id
  try {
    await submitTutorProduct(product.id)
    await refresh()
    toast.success('Produk diajukan.', 'Admin akan meninjaunya sebelum tayang di katalog.')
  }
  catch (cause) {
    const problems = tutorSubmitProblems(cause)
    if (problems.length) {
      submitProblems.value = [{ title: product.title, problems }]
      toast.error('Produk belum bisa diajukan.', `${problems.length} hal masih perlu dibereskan — daftarnya ada di atas tabel.`)
    }
    else {
      toast.error('Produk belum berhasil diajukan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
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

  submitProblems.value = []
  busyId.value = product.id
  try {
    await archiveTutorProduct(product.id)
    await refresh()
    toast.success('Produk diarsipkan.', 'Paket ini tidak tampil lagi di katalog publik.')
  }
  catch (cause) {
    toast.error('Produk belum berhasil diarsipkan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
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

  submitProblems.value = []
  busyId.value = product.id
  try {
    await deleteTutorProduct(product.id)
    await refresh()
    toast.success('Produk dihapus permanen.')
  }
  catch (cause) {
    toast.error('Produk belum berhasil dihapus.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    busyId.value = ''
  }
}
/* --------------------------------------------------------------------------
 * Sisi admin: menawarkan dan menarik kembali.
 * ------------------------------------------------------------------------ */

/**
 * Yang boleh diserahkan, persis seperti aturan yang ditegakkan server: draft
 * milik sendiri, tryout tunggal, bukan materi bimbel. Tombolnya disembunyikan
 * untuk apa pun di luar itu supaya admin tidak menabrak penolakan yang sudah
 * bisa diketahui dari barisnya sendiri.
 */
const canTransfer = (product: TutorProductSummary) =>
  isAdmin.value
  && product.status === 'draft'
  && product.type === 'single'
  && product.visibility !== 'bimbel'
  && !outgoingOffers.value.has(product.id)

/** Tawaran yang sedang menunggu untuk baris ini, kalau ada. */
const pendingOffer = (product: TutorProductSummary) => outgoingOffers.value.get(product.id)

function openTransfer(product: TutorProductSummary) {
  transferTarget.value = product
  transferOpen.value = true
}

async function submitTransfer(toAccountId: string) {
  const product = transferTarget.value
  if (!product) return

  transferSubmitting.value = true
  try {
    await offerProductTransfer(product.id, toAccountId)
    await Promise.all([refresh(), refreshOutgoing()])
    transferOpen.value = false
    const tutor = adminTutors.value.find(row => row.id === toAccountId)
    toast.success(
      'Paket ditawarkan ke tutor.',
      `Menunggu ${tutor?.name || tutor?.email || 'tutor'} menerimanya. Sampai saat itu paket ini masih milikmu.`,
    )
  }
  catch (cause) {
    toast.error('Paket belum berhasil diserahkan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    transferSubmitting.value = false
  }
}

async function withdrawTransfer(product: TutorProductSummary) {
  const ok = await confirm({
    title: `Tarik tawaran "${product.title}"?`,
    description: `Tawaran ke ${pendingOffer(product)?.toEmail || 'tutor'} akan dibatalkan. Paket tetap menjadi draft milikmu dan bisa ditawarkan lagi kapan saja.`,
    confirmLabel: 'Tarik tawaran',
  })
  if (!ok) return

  busyId.value = product.id
  try {
    await withdrawProductTransfer(product.id)
    await Promise.all([refresh(), refreshOutgoing()])
    toast.success('Tawaran ditarik.')
  }
  catch (cause) {
    toast.error('Tawaran belum berhasil ditarik.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    busyId.value = ''
  }
}

/* --------------------------------------------------------------------------
 * Sisi tutor: menjawab tawaran.
 * ------------------------------------------------------------------------ */

async function acceptTransfer(offer: TutorProductDetail) {
  const ok = await confirm({
    title: `Terima "${offer.title}" sebagai paketmu?`,
    description: 'Paket ini akan tercatat atas namamu — termasuk di katalog dan pembagian hasil penjualan. Pastikan soal di dalamnya memang tulisanmu.',
    confirmLabel: 'Terima paket',
  })
  if (!ok) return

  offerBusyId.value = offer.id
  try {
    await acceptOffer(offer.id)
    // Dua daftar berubah sekaligus: tawarannya hilang, paketnya muncul di rak.
    await Promise.all([refreshOffers(), refresh()])
    toast.success('Paket kini milikmu.', 'Kamu bisa mengeditnya lalu mengajukannya untuk tayang.')
  }
  catch (cause) {
    await refreshOffers()
    toast.error('Paket belum berhasil diterima.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    offerBusyId.value = ''
  }
}

async function declineTransfer(offer: TutorProductDetail) {
  const ok = await confirm({
    title: `Tolak "${offer.title}"?`,
    description: 'Tawaran ini akan hilang dari daftarmu. Paketnya tetap ada pada tim Zenko, jadi tidak ada pekerjaan yang terbuang.',
    confirmLabel: 'Tolak',
  })
  if (!ok) return

  offerBusyId.value = offer.id
  try {
    await declineOffer(offer.id)
    await refreshOffers()
    toast.success('Tawaran ditolak.')
  }
  catch (cause) {
    await refreshOffers()
    toast.error('Tawaran belum berhasil ditolak.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    offerBusyId.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Produk saya" description="Kelola paket tryout mandiri dan bundling yang kamu sediakan untuk siswa.">
      <template #actions>
        <AppButton to="/dashboard/tutor/products/new" size="sm">Buat paket baru</AppButton>
      </template>
    </AppPageHeader>


    <AppSectionMessage
      v-for="group in submitProblems"
      :key="group.title"
      appearance="error"
      :title="`Paket &quot;${group.title}&quot; belum dapat diajukan:`"
    >
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in group.problems" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <!-- Tawaran paket dari tim Zenko. Merender dirinya sendiri hanya saat ada,
         jadi bagi kebanyakan tutor bagian ini tidak pernah muncul. -->
    <TutorTransferOffers
      :offers="transferOffers"
      :busy-id="offerBusyId"
      @accept="acceptTransfer"
      @decline="declineTransfer"
    />

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
        description="Mulai dengan membuat tryout mandiri: tentukan kategori ujian, susun soal per subtes, lalu ajukan ke tim kurasi agar tayang di katalog Zenko."
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
          title="Hasil tidak ditemukan"
          description="Tidak ada paket soal yang sesuai dengan kata kunci pencarian atau filter status yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <template v-else>
          <!-- Each button names how many of the selection it applies to, so
               "3 dipilih · Ajukan tayang (1)" is honest about the two it
               will skip (already live, or not yet complete). -->
          <DashboardSelectionBar :count="selected.length" item-noun="produk" @clear="selected = []">
            <AppButton
              size="xs"
              :disabled="submitTargets.length === 0 || bulkBusy !== ''"
              :loading="bulkBusy === 'submit'"
              @click="bulkSubmit"
            >
              Ajukan tayang ({{ submitTargets.length }})
            </AppButton>
            <AppButton
              variant="outline"
              size="xs"
              :disabled="archiveTargets.length === 0 || bulkBusy !== ''"
              :loading="bulkBusy === 'archive'"
              @click="bulkArchive"
            >
              Arsipkan ({{ archiveTargets.length }})
            </AppButton>
            <AppButton
              variant="danger"
              size="xs"
              :disabled="deleteTargets.length === 0 || bulkBusy !== ''"
              :loading="bulkBusy === 'delete'"
              @click="bulkDelete"
            >
              Hapus ({{ deleteTargets.length }})
            </AppButton>
          </DashboardSelectionBar>

          <DashboardTable
            v-model:selected="selected"
            :columns="productColumns"
            :data="rows"
            primary-key="title"
            action-key="aksi"
            selectable
          >
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
            <template #cell(category)="{ value, item }">
              {{ item.subcategory ? `${value} · ${item.subcategory}` : (value || 'Umum') }}
            </template>
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
                   v-if below — avoids passing DashboardTable's untyped `item` straight
                   into functions that expect the real TutorProductSummary shape. -->
              <template v-for="product in [findProduct(item.id)]" :key="item.id">
                <span v-if="product" class="inline-flex items-center gap-3 whitespace-nowrap">
                  <AppIconButton v-if="canEdit(product)" :to="`/dashboard/tutor/products/${product.id}/edit`" variant="ghost" size="sm" aria-label="Edit produk" ariaLabel="Edit produk" title="Edit produk"><AppIcon name="pencil-simple" :size="17" aria-hidden="true" /></AppIconButton>
                  <AppIconButton v-if="canSubmit(product)" variant="ghost" size="sm" :disabled="busyId === product.id" aria-label="Ajukan tayang" ariaLabel="Ajukan tayang" title="Ajukan tayang" @click="submitProduct(product)"><AppIcon name="upload-simple" :size="17" aria-hidden="true" /></AppIconButton>
                  <AppIconButton v-if="product.status === 'live'" variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" :disabled="busyId === product.id" aria-label="Arsipkan produk" ariaLabel="Arsipkan produk" title="Arsipkan produk" @click="archiveProduct(product)"><AppIcon name="x-circle" :size="17" aria-hidden="true" /></AppIconButton>
                  <AppIconButton v-if="canDelete(product)" variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" :disabled="busyId === product.id" aria-label="Hapus produk" ariaLabel="Hapus produk" title="Hapus produk" @click="deleteProduct(product)"><AppIcon name="trash" :size="17" aria-hidden="true" /></AppIconButton>
                  <AppIconButton v-if="canTransfer(product)" variant="ghost" size="sm" aria-label="Serahkan ke tutor" ariaLabel="Serahkan ke tutor" title="Serahkan ke tutor" @click="openTransfer(product)"><AppIcon name="handshake" :size="17" aria-hidden="true" /></AppIconButton>
                  <!-- Tawaran yang belum dijawab: siapa yang ditunggu, dan
                       satu-satunya aksi yang tersisa sampai ia menjawab. -->
                  <template v-if="isAdmin && pendingOffer(product)">
                    <!-- Hanya "Menunggu": kolom aksi ini sticky di kanan, dan
                         satu alamat email di dalamnya cukup lebar untuk menutupi
                         kolom Soal dan Status di belakangnya. Siapa yang ditunggu
                         tetap terbaca lewat title, dan dialog penarikan
                         menyebutkannya utuh. -->
                    <span :title="`Menunggu ${pendingOffer(product)?.toEmail || 'tutor'} menerima paket ini`">
                      <DashboardBadge tone="warning">Menunggu</DashboardBadge>
                    </span>
                    <AppIconButton variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" :disabled="busyId === product.id" aria-label="Tarik tawaran" ariaLabel="Tarik tawaran" title="Tarik tawaran" @click="withdrawTransfer(product)"><AppIcon name="x" :size="17" aria-hidden="true" /></AppIconButton>
                  </template>
                  <span
                    v-if="!canEdit(product) && !canSubmit(product) && !canDelete(product) && !canTransfer(product)"
                    class="text-[0.86rem] text-muted"
                  >-</span>
                </span>
              </template>
            </template>
          </DashboardTable>
        </template>
      </div>
    </DashboardPanel>

    <TutorTransferModal
      v-model:open="transferOpen"
      :product="transferTarget"
      :tutors="adminTutors"
      :tutors-pending="adminTutorsPending"
      :submitting="transferSubmitting"
      @submit="submitTransfer"
    />
  </div>
</template>
