<script setup lang="ts">
import type { AdminProductDetail } from '#shared/types/admin-moderation'

/**
 * Tinjau produk — halaman review penuh satu produk (design spec §4.4).
 * Status `review` memunculkan action bar setujui/tolak; status lain (dibuka
 * dari tab Semua, atau kalah cepat dari admin lain) tampil read-only dengan
 * badge status dan alasan penolakan tersimpan.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const productId = computed(() => String(route.params.id ?? ''))

const authors = useAdminProductAuthors()
const notice = useAdminProductsNotice()
const { refresh: refreshSummary } = useAdminSummary()

const detail = ref<AdminProductDetail | null>(null)
// Starts true so SSR and first client paint both show the skeleton — the
// fetch itself only runs after mount (HttpOnly session cookie).
const detailPending = ref(true)
const detailError = ref('')

useHead({
  title: () => detail.value ? `${detail.value.title} | Zenko` : 'Tinjau Produk | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

async function loadDetail() {
  detailPending.value = true
  detailError.value = ''
  try {
    const product = await fetchAdminProduct(productId.value)
    // Kalau detail tidak menyertakan author, pakai punya baris antrean.
    const rememberedAuthor = authors.value[product.id]
    if (!product.author && rememberedAuthor) product.author = rememberedAuthor
    detail.value = product
  }
  catch (cause) {
    detailError.value = tutorApiMessage(cause, 'Produk tidak ditemukan atau gagal dimuat.')
  }
  finally {
    detailPending.value = false
  }
}

onMounted(loadDetail)

const breadcrumbs = computed(() => [
  { label: 'Moderasi produk', to: '/dashboard/admin/products' },
  { label: detail.value?.title ?? 'Tinjau produk', truncate: true },
])

/** "{Tipe} · {Kategori} · {author} ({email})" — segmen yang kosong dilewati. */
const headerDescription = computed(() => {
  const product = detail.value
  if (!product) return ''
  return [
    PRODUCT_TYPE_LABEL[product.type],
    product.category,
    product.author ? `${product.author.name} (${product.author.email})` : '',
  ].filter(Boolean).join(' · ')
})

const inReview = computed(() => detail.value?.status === 'review')
const hasDiscount = computed(() =>
  detail.value !== null && detail.value.priceOriginal > detail.value.price,
)

/* --------------------------------------------------------------------------
 * "Ringkasan produk" — sama detailnya dengan langkah Review & ajukan di
 * wizard tutor (mode, durasi, ambang lulus, thumbnail), supaya admin
 * memutuskan dari data yang sama persis dengan yang tutor lihat sebelum
 * mengajukan, bukan cuma harga dan deskripsi.
 * ------------------------------------------------------------------------ */

const modeSummary = computed(() => {
  const product = detail.value
  if (!product || product.type !== 'single') return ''
  if (product.mode === 'mini_tryout') {
    return `${PRODUCT_MODE_LABEL.mini_tryout}: ${product.sections?.[0]?.title ?? 'Belum ditentukan'}`
  }
  return PRODUCT_MODE_LABEL.simulasi
})

const totalDurationMinutes = computed(() =>
  (detail.value?.sections ?? []).reduce((sum, section) => sum + section.durationMinutes, 0),
)

const passingGradeSections = computed(() =>
  (detail.value?.sections ?? []).filter(section => section.passingGrade != null),
)

/* --------------------------------------------------------------------------
 * Isi panel kedua — single: subtes + kelengkapan soal; bundle: isi bundling
 * dengan status per item (item non-live adalah red flag).
 * ------------------------------------------------------------------------ */

const SECTION_COLUMNS = [
  { key: 'title', label: 'Subtes' },
  { key: 'soal', label: 'Soal' },
  { key: 'durasi', label: 'Durasi' },
  { key: 'aksi', label: '', align: 'right' as const },
]

const sectionRows = computed(() => (detail.value?.sections ?? []).map(section => ({
  id: section.id,
  title: section.title,
  soal: `${section.questions.length}/${section.questionTarget} soal`,
  incomplete: section.questions.length < section.questionTarget,
  empty: section.questions.length === 0,
  durasi: formatDuration(section.durationMinutes),
})))

/* --------------------------------------------------------------------------
 * Isi soal — sampai sekarang halaman ini cuma menghitung soal, tidak pernah
 * memperlihatkan satu pun. Dua jalan masuk per subtes:
 *
 * - "Lihat soal": daftar + pratinjau per soal, komponen yang sama dengan
 *   langkah 4 wizard tutor (TutorQuestionSummaryTable sudah baca-saja —
 *   penghapusan/pengeditan soal memang tidak pernah ada di sana).
 * - "Simulasikan": subtesnya dijalankan penuh di ruang ujian, lewat
 *   /dashboard/admin/products/:id/simulasikan?section=…
 * ------------------------------------------------------------------------ */

const openSectionId = ref<string | null>(null)

const openSection = computed(() =>
  (detail.value?.sections ?? []).find(section => section.id === openSectionId.value) ?? null,
)

function toggleSectionQuestions(sectionId: string) {
  openSectionId.value = openSectionId.value === sectionId ? null : sectionId
}

function simulateHref(sectionId: string): string {
  return `/dashboard/admin/products/${productId.value}/simulasikan?section=${encodeURIComponent(sectionId)}`
}

const BUNDLE_COLUMNS = [
  { key: 'title', label: 'Produk' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'status', label: 'Status' },
]

const bundleRows = computed(() => (detail.value?.items ?? []).map(item => ({
  id: item.productId,
  title: item.title,
  price: item.price,
  status: item.status,
})))

function statusLabel(status: AdminProductDetail['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}
function statusTone(status: AdminProductDetail['status']) {
  return PRODUCT_STATUS_TONE[status]
}

/* --------------------------------------------------------------------------
 * Keputusan — modal konfirmasi (setujui) / modal alasan (tolak). Sukses
 * kembali ke antrean dan menaruh banner di sana (design spec §3.5).
 * ------------------------------------------------------------------------ */

const approveOpen = ref(false)
const rejectOpen = ref(false)
const decisionBusy = ref(false)
const decisionError = ref('')
/** 409: keputusan keburu diambil admin lain — halaman jadi read-only. */
const conflictText = ref('')

function openApprove() {
  decisionError.value = ''
  approveOpen.value = true
}

function openReject() {
  decisionError.value = ''
  rejectOpen.value = true
}

async function decide(approve: boolean, reason?: string) {
  const product = detail.value
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
        ? `Produk «${product.title}» disetujui dan tayang di katalog.`
        : `Produk «${product.title}» ditolak — alasan terkirim ke tutor.`,
    }
    refreshSummary()
    await navigateTo('/dashboard/admin/products')
  }
  catch (cause) {
    if (isAdminProductConflict(cause)) {
      approveOpen.value = false
      rejectOpen.value = false
      conflictText.value = ADMIN_PRODUCT_CONFLICT_TEXT
      refreshSummary()
      await loadDetail()
    }
    else {
      decisionError.value = tutorApiMessage(cause, 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.')
    }
  }
  finally {
    decisionBusy.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Loading: skeletons that hold the page shape (header zone + panel). -->
    <template v-if="detailPending">
      <DashboardSkeleton variant="stats" :count="2" :columns="2" label="Memuat produk..." />
      <div class="rounded-md border border-line bg-surface px-5 py-4 shadow-xs md:px-6 md:py-5">
        <DashboardSkeleton :count="4" />
      </div>
    </template>

    <!-- 404 / load failure: message + way back, no panels. -->
    <template v-else-if="detailError || !detail">
      <AppPageHeader title="Tinjau produk">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>
      <div class="flex flex-wrap items-center gap-3">
        <AppInlineMessage type="error">Produk tidak ditemukan atau gagal dimuat.</AppInlineMessage>
        <NuxtLink
          to="/dashboard/admin/products"
          class="text-[0.86rem] font-semibold text-primary hover:underline"
        >
          Kembali ke Moderasi produk
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <AppPageHeader :title="detail.title" :description="headerDescription">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>

      <AppInlineMessage v-if="conflictText" type="warning">{{ conflictText }}</AppInlineMessage>

      <DashboardPanel title="Ringkasan produk">
        <div class="grid gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-[1.05rem] font-bold tabular-nums" :class="detail.price > 0 ? '' : 'text-success-ink'">
              {{ detail.price > 0 ? formatRupiah(detail.price) : 'Gratis' }}
              <s v-if="hasDiscount" class="ml-1.5 text-[0.86rem] font-normal text-muted">
                {{ formatRupiah(detail.priceOriginal) }}
              </s>
            </p>
            <DashboardBadge v-if="!inReview" :tone="statusTone(detail.status)">
              {{ statusLabel(detail.status) }}
            </DashboardBadge>
          </div>

          <dl class="grid gap-4 sm:grid-cols-2">
            <div v-if="detail.type === 'single'">
              <dt class="text-[0.8rem] text-muted">Mode</dt>
              <dd class="mt-0.5 font-semibold">{{ modeSummary }}</dd>
            </div>
            <div v-if="detail.type === 'single'">
              <dt class="text-[0.8rem] text-muted">Durasi</dt>
              <dd class="mt-0.5 font-semibold">
                {{ totalDurationMinutes > 0 ? formatDuration(totalDurationMinutes) : 'Belum diatur' }}
              </dd>
            </div>
            <div v-if="passingGradeSections.length" class="sm:col-span-2">
              <dt class="text-[0.8rem] text-muted">Ambang Lulus</dt>
              <dd class="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                <span v-for="section in passingGradeSections" :key="section.id">
                  {{ section.title }}: {{ section.passingGrade }}
                </span>
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-[0.8rem] text-muted">Thumbnail</dt>
              <dd class="mt-1.5">
                <img
                  v-if="detail.thumbnailUrl"
                  :src="detail.thumbnailUrl"
                  alt=""
                  class="aspect-16/10 h-24 w-auto rounded-sm border border-hairline object-cover"
                >
                <span v-else class="text-[0.88rem] text-muted">Belum ada thumbnail</span>
              </dd>
            </div>
          </dl>

          <div>
            <p v-if="detail.description" class="max-w-prose text-sm leading-[1.7] whitespace-pre-line text-muted">
              {{ detail.description }}
            </p>
            <p v-else class="text-sm text-muted">Tidak ada deskripsi.</p>
          </div>

          <AppAlert
            v-if="detail.status === 'rejected' && detail.rejectReason"
            variant="warning"
            title="Alasan penolakan sebelumnya"
          >
            {{ detail.rejectReason }}
          </AppAlert>
        </div>
      </DashboardPanel>

      <DashboardPanel
        v-if="detail.type === 'single'"
        title="Subtes"
        description="Kelengkapan soal per subtes — target yang belum terpenuhi ditandai."
      >
        <p v-if="sectionRows.length === 0" class="py-6 text-center text-muted">
          Belum ada subtes pada produk ini.
        </p>
        <DashboardTable v-else :columns="SECTION_COLUMNS" :data="sectionRows" primary-key="title" action-key="aksi">
          <template #cell(title)="{ value }">
            <span class="font-semibold tracking-[-0.02em] text-ink">{{ value }}</span>
          </template>
          <template #cell(soal)="{ item }">
            <DashboardBadge v-if="item.incomplete" tone="warning">
              <span class="tabular-nums">{{ item.soal }}</span>
            </DashboardBadge>
            <span v-else class="tabular-nums">{{ item.soal }}</span>
          </template>
          <template #cell(durasi)="{ value }">
            <span class="whitespace-nowrap text-muted">{{ value }}</span>
          </template>
          <template #cell(aksi)="{ item }">
            <span class="inline-flex items-center gap-3 whitespace-nowrap">
              <button
                v-if="!item.empty"
                type="button"
                class="text-[0.86rem] font-semibold text-primary hover:underline"
                :aria-expanded="openSectionId === item.id"
                @click="toggleSectionQuestions(String(item.id))"
              >
                {{ openSectionId === item.id ? 'Tutup soal' : 'Lihat soal' }}
              </button>
              <NuxtLink
                v-if="!item.incomplete && !item.empty"
                :to="simulateHref(String(item.id))"
                class="text-[0.86rem] font-semibold text-primary hover:underline"
              >
                Simulasikan
              </NuxtLink>
              <span
                v-else
                class="text-[0.86rem] text-faint"
                title="Subtes belum memenuhi target soal, jadi belum bisa disimulasikan."
              >
                Simulasikan
              </span>
            </span>
          </template>
        </DashboardTable>
      </DashboardPanel>

      <DashboardPanel
        v-else
        title="Isi bundling"
        description="Item yang belum Tayang adalah red flag sebelum bundling disetujui."
      >
        <p v-if="bundleRows.length === 0" class="py-6 text-center text-muted">
          Bundling ini belum punya isi.
        </p>
        <DashboardTable v-else :columns="BUNDLE_COLUMNS" :data="bundleRows" primary-key="title">
          <template #cell(title)="{ value }">
            <span class="font-semibold tracking-[-0.02em] text-ink">{{ value }}</span>
          </template>
          <template #cell(price)="{ value }">
            <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
            <span v-else class="font-semibold text-success-ink">Gratis</span>
          </template>
          <template #cell(status)="{ value }">
            <DashboardBadge :tone="statusTone(value)">{{ statusLabel(value) }}</DashboardBadge>
          </template>
        </DashboardTable>
      </DashboardPanel>

      <!-- Isi soal satu subtes, dibuka dari baris tabel Subtes di atas —
           daftar yang sama dengan yang tutor lihat di langkah Review,
           termasuk modal pratinjau per soal. Panel terpisah (bukan disisipkan
           di antara panel Subtes dan Isi bundling) supaya rantai
           v-if/v-else keduanya tetap bersebelahan. -->
      <DashboardPanel
        v-if="openSection"
        :title="`Soal — ${openSection.title}`"
        description="Klik satu baris untuk membuka pratinjau soalnya."
      >
        <template #action>
          <AppButton variant="ghost" size="sm" @click="openSectionId = null">Tutup</AppButton>
        </template>
        <TutorQuestionSummaryTable :sections="[openSection]" />
      </DashboardPanel>

      <!-- Sticky action bar — only while the product still awaits a decision. -->
      <div
        v-if="inReview"
        class="sticky bottom-0 z-10 -mx-4 border-t border-hairline bg-surface/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8"
      >
        <div class="flex flex-wrap items-center justify-end gap-3">
          <AppButton variant="danger" size="sm" @click="openReject">Tolak…</AppButton>
          <AppButton variant="primary" size="sm" @click="openApprove">Setujui & tayangkan</AppButton>
        </div>
      </div>
    </template>

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
