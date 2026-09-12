<script setup lang="ts">
import type { AdminTutorDetail } from '#shared/types/admin-tutor'
import type { TutorShareChange, TutorShareMutationInput, TutorSharePreview } from '#shared/types/tutor-share'

/**
 * Profil tutor (admin) — identitas, profil publik yang tutor isi sendiri
 * (bio, pengalaman, spesialisasi, sosial media), dan setiap produk yang
 * pernah dia buat, apa pun statusnya. Baca saja: keputusan atas produk masih
 * lewat halaman Moderasi produk, bukan di sini.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const accountId = computed(() => String(route.params.id ?? ''))
const { user } = useAuth()
const canManageShareSchedule = computed(() => user.value?.canManageShareSchedule === true)
const {
  data: shareSchedule,
  pending: sharePending,
  error: shareError,
  refresh: refreshShareSchedule,
} = useAdminTutorShareSchedule(accountId)

const detail = ref<AdminTutorDetail | null>(null)
// Starts true so SSR and first client paint both show the skeleton — the
// fetch itself only runs after mount (HttpOnly session cookie).
const detailPending = ref(true)
const detailError = ref('')

useHead({
  title: () => detail.value ? `${detail.value.name} | Zenko` : 'Profil Tutor | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

async function loadDetail() {
  detailPending.value = true
  detailError.value = ''
  try {
    detail.value = await fetchAdminTutor(accountId.value)
  }
  catch (cause) {
    detailError.value = tutorApiMessage(cause, 'Tutor tidak ditemukan atau belum berhasil dimuat.')
  }
  finally {
    detailPending.value = false
  }
}

onMounted(() => {
  loadDetail()
  if (canManageShareSchedule.value) refreshShareSchedule()
})

watch(canManageShareSchedule, (allowed) => {
  if (allowed && !shareSchedule.value && !sharePending.value) refreshShareSchedule()
})

const breadcrumbs = computed(() => [
  { label: 'Tutor', to: '/dashboard/admin/tutors' },
  { label: detail.value?.name ?? 'Profil tutor', truncate: true },
])

const initial = computed(() => detail.value?.name.trim().charAt(0).toUpperCase() || '?')

/* --------------------------------------------------------------------------
 * Tab — Profil dan Produk tadinya ditumpuk jadi dua panel berurutan; tutor
 * dengan banyak produk membuat profilnya ikut tergulung jauh ke atas. Pola
 * yang sama dengan /akun/profil.
 * ------------------------------------------------------------------------ */

const TABS = computed(() => [
  { id: 'profil', label: 'Profil' },
  { id: 'produk', label: 'Produk' },
  ...(canManageShareSchedule.value ? [{ id: 'bagi-hasil', label: 'Bagi hasil' }] : []),
])
const activeTab = ref('profil')

/* ------------------------------------------------------------- bagi hasil -- */

const shareEditorOpen = ref(false)
const shareEditorStep = ref<'edit' | 'confirm'>('edit')
const sharePercent = ref<number | string>(75)
const useStandardPercent = ref(false)
const shareStartsAt = ref('')
const shareEndsAt = ref('')
const shareInternalReason = ref('')
const shareNoteForTutor = ref('')
const sharePreview = ref<TutorSharePreview | null>(null)
const sharePreviewPending = ref(false)
const shareSaving = ref(false)
const shareFormError = ref('')
const shareStepUpPassword = ref('')
const shareIdempotencyKey = ref('')
const cancelOpen = ref(false)
const cancelChange = ref<TutorShareChange | null>(null)
const cancelInternalReason = ref('')
const cancelNoteForTutor = ref('Jadwal bagi hasil mendatang dibatalkan.')
const cancelPending = ref(false)
const cancelError = ref('')
const cancelStepUpPassword = ref('')
const cancelIdempotencyKey = ref('')

const shareInput = computed<TutorShareMutationInput | null>(() => {
  const startsAt = parseWibInput(shareStartsAt.value)
  const endsAt = shareEndsAt.value ? parseWibInput(shareEndsAt.value) : null
  const percent = useStandardPercent.value ? null : Number(sharePercent.value)
  if (
    !startsAt
    || (endsAt !== null && !endsAt)
    || (!useStandardPercent.value && (percent === null || !Number.isInteger(percent) || percent < 70 || percent > 90))
  ) return null
  return {
    percent,
    startsAt,
    endsAt,
    internalReason: shareInternalReason.value.trim(),
    noteForTutor: shareNoteForTutor.value.trim(),
  }
})

const shareFormValid = computed(() => {
  const input = shareInput.value
  return Boolean(input && input.internalReason && (!input.endsAt || input.endsAt > input.startsAt))
})

function openShareEditor() {
  const tomorrowWib = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  sharePercent.value = shareSchedule.value?.effectivePercent ?? 75
  useStandardPercent.value = false
  shareStartsAt.value = wibInputValue(tomorrowWib, 9)
  shareEndsAt.value = ''
  shareInternalReason.value = ''
  shareNoteForTutor.value = ''
  sharePreview.value = null
  shareFormError.value = ''
  shareStepUpPassword.value = ''
  shareIdempotencyKey.value = crypto.randomUUID()
  shareEditorStep.value = 'edit'
  shareEditorOpen.value = true
}

async function previewShareChange() {
  if (!shareFormValid.value || !shareInput.value) {
    shareFormError.value = 'Lengkapi tarif, jadwal, dan alasan internal dengan benar.'
    return
  }
  sharePreviewPending.value = true
  shareFormError.value = ''
  try {
    sharePreview.value = await previewTutorShareSchedule(accountId.value, shareInput.value)
    if (sharePreview.value.valid === false) {
      shareFormError.value = 'Jadwal ini tidak memenuhi aturan pemberitahuan.'
      return
    }
    shareEditorStep.value = 'confirm'
  }
  catch (cause) {
    shareFormError.value = tutorApiMessage(cause, 'Pratinjau jadwal belum berhasil dibuat.')
  }
  finally {
    sharePreviewPending.value = false
  }
}

async function saveShareChange() {
  if (!shareInput.value || !shareSchedule.value || !shareStepUpPassword.value) return
  shareSaving.value = true
  shareFormError.value = ''
  try {
    const { stepUpToken } = await stepUpTutorShareSchedule(shareStepUpPassword.value)
    shareSchedule.value = await createTutorShareSchedule(
      accountId.value,
      shareSchedule.value.scheduleVersion,
      stepUpToken,
      shareIdempotencyKey.value,
      shareInput.value,
    )
    shareEditorOpen.value = false
    shareStepUpPassword.value = ''
    shareIdempotencyKey.value = ''
  }
  catch (cause) {
    if (tutorShareErrorCode(cause) === 'schedule_version_conflict' || apiStatus(cause) === 409) {
      shareFormError.value = 'Jadwal telah berubah di sesi lain. Data terbaru sudah dimuat; buat pratinjau ulang sebelum menyimpan.'
      shareEditorStep.value = 'edit'
      sharePreview.value = null
      await refreshShareSchedule()
      return
    }
    shareFormError.value = tutorApiMessage(cause, 'Perubahan bagi hasil belum berhasil disimpan.')
  }
  finally {
    shareSaving.value = false
  }
}

function openCancelChange(change: TutorShareChange) {
  cancelChange.value = change
  cancelInternalReason.value = ''
  cancelNoteForTutor.value = 'Jadwal bagi hasil mendatang dibatalkan.'
  cancelError.value = ''
  cancelStepUpPassword.value = ''
  cancelIdempotencyKey.value = crypto.randomUUID()
  cancelOpen.value = true
}

async function confirmCancelChange() {
  if (!shareSchedule.value || !cancelChange.value || !cancelInternalReason.value.trim() || !cancelStepUpPassword.value) return
  cancelPending.value = true
  cancelError.value = ''
  try {
    const { stepUpToken } = await stepUpTutorShareSchedule(cancelStepUpPassword.value)
    shareSchedule.value = await cancelTutorShareSchedule(
      accountId.value,
      cancelChange.value.id,
      shareSchedule.value.scheduleVersion,
      stepUpToken,
      cancelIdempotencyKey.value,
      {
        internalReason: cancelInternalReason.value.trim(),
        noteForTutor: cancelNoteForTutor.value.trim(),
      },
    )
    cancelOpen.value = false
    cancelStepUpPassword.value = ''
    cancelIdempotencyKey.value = ''
  }
  catch (cause) {
    cancelError.value = tutorApiMessage(cause, 'Jadwal mendatang belum berhasil dibatalkan.')
    await refreshShareSchedule()
  }
  finally {
    cancelPending.value = false
  }
}

function parseWibInput(value: string): number {
  if (!value) return 0
  return Math.floor(new Date(`${value}:00+07:00`).getTime() / 1000)
}

function wibInputValue(seconds: number, hour?: number): string {
  const shifted = new Date((seconds + 7 * 60 * 60) * 1000)
  if (hour !== undefined) shifted.setUTCHours(hour, 0, 0, 0)
  return shifted.toISOString().slice(0, 16)
}

function formatWibDateTime(seconds?: number | null): string {
  if (!seconds) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(seconds * 1000) + ' WIB'
}

function sharePercentLabel(percent: number | null): string {
  return percent === null ? '70% (standar)' : `${percent}%`
}

function apiStatus(cause: unknown): number | undefined {
  return (cause as { statusCode?: number, status?: number })?.statusCode
    ?? (cause as { status?: number })?.status
    ?? (cause as { response?: { status?: number } })?.response?.status
}

function notificationLabel(status: string): string {
  const labels: Record<string, string> = {
    published: 'Dipublikasikan', dashboard_published: 'Dipublikasikan',
    email_pending: 'Email menunggu', email_sent: 'Email terkirim', email_failed: 'Email gagal',
  }
  return labels[status] ?? status.replaceAll('_', ' ')
}

/** Tautan sosial media/portofolio yang terisi, dengan label dan ikon Phosphor-nya. */
const socialLinks = computed(() => {
  const profile = detail.value?.profile
  if (!profile) return []
  return [
    { label: 'Portofolio', url: profile.portfolioUrl, icon: 'link' },
    { label: 'Instagram', url: profile.instagramUrl, icon: 'instagram-logo' },
    { label: 'TikTok', url: profile.tiktokUrl, icon: 'tiktok-logo' },
    { label: 'LinkedIn', url: profile.linkedinUrl, icon: 'linkedin-logo' },
    { label: 'YouTube', url: profile.youtubeUrl, icon: 'youtube-logo' },
    { label: 'Website', url: profile.websiteUrl, icon: 'globe' },
  ].filter(link => link.url)
})

/* ---------------------------------------------------------------- produk -- */

const PRODUCT_COLUMNS = [
  { key: 'title', label: 'Produk' },
  { key: 'type', label: 'Tipe' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

function typeLabel(type: 'single' | 'bundle'): string {
  return PRODUCT_TYPE_LABEL[type]
}
function statusLabel(status: AdminTutorDetail['products'][number]['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}
function statusTone(status: AdminTutorDetail['products'][number]['status']) {
  return PRODUCT_STATUS_TONE[status]
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Loading: skeletons that hold the page shape (header zone + panel). -->
    <template v-if="detailPending">
      <DashboardSkeleton variant="stats" :count="2" :columns="2" label="Memuat profil tutor..." />
      <div class="rounded-md border border-line bg-surface px-5 py-4 shadow-xs md:px-6 md:py-5">
        <DashboardSkeleton :count="4" />
      </div>
    </template>

    <!-- 404 / load failure: message + way back, no panels. -->
    <template v-else-if="detailError || !detail">
      <AppPageHeader title="Profil tutor">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>
      <div class="flex flex-wrap items-center gap-3">
        <AppInlineMessage type="error">{{ detailError || 'Tutor tidak ditemukan.' }}</AppInlineMessage>
        <NuxtLink
          to="/dashboard/admin/tutors"
          class="text-[0.86rem] font-semibold text-primary hover:underline"
        >
          Kembali ke Tutor
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <AppPageHeader :title="detail.name" :description="detail.email">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>

      <AppTabs v-model="activeTab" :tabs="TABS" aria-label="Bagian profil tutor" />

      <div v-show="activeTab === 'profil'" id="panel-profil" role="tabpanel" aria-labelledby="tab-profil">
        <DashboardPanel title="Profil">
          <div class="flex flex-col gap-4 rounded-md border border-hairline bg-linear-to-br from-surface-alt to-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
            <span class="relative inline-flex shrink-0 self-start rounded-full bg-linear-to-br from-primary-light to-primary p-0.5 shadow-lift sm:self-center">
              <img
                v-if="detail.avatarUrl"
                :src="detail.avatarUrl"
                alt=""
                referrerpolicy="no-referrer"
                class="h-16 w-16 rounded-full border-2 border-white object-cover"
              >
              <span
                v-else
                aria-hidden="true"
                class="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-surface-alt text-[1.3rem] font-bold text-muted"
              >{{ initial }}</span>
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-[1.2rem] font-bold tracking-[-0.03em]">{{ detail.name }}</p>
                <DashboardBadge tone="brand">Tutor</DashboardBadge>
              </div>
              <p class="mt-0.5 truncate text-[0.9rem] text-muted">{{ detail.email }}</p>
              <div class="mt-3">
                <DashboardBadge :tone="detail.verified ? 'success' : 'warning'">
                  {{ detail.verified ? 'Email terverifikasi' : 'Email belum terverifikasi' }}
                </DashboardBadge>
              </div>
            </div>
          </div>

          <div class="mt-5 grid gap-5">
            <div v-if="detail.profile.bio">
              <p class="text-[0.8rem] font-semibold text-muted">Bio</p>
              <p class="mt-1 max-w-prose text-sm leading-[1.7] whitespace-pre-line">{{ detail.profile.bio }}</p>
            </div>

            <div v-if="detail.profile.experience">
              <p class="text-[0.8rem] font-semibold text-muted">Pengalaman mengajar</p>
              <p class="mt-1 max-w-prose text-sm leading-[1.7] whitespace-pre-line">{{ detail.profile.experience }}</p>
            </div>

            <div v-if="detail.profile.specializations.length > 0">
              <p class="text-[0.8rem] font-semibold text-muted">Spesialisasi</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="tag in detail.profile.specializations"
                  :key="tag"
                  class="inline-flex items-center rounded-pill bg-primary-soft px-3 py-1 text-[0.82rem] font-semibold text-primary"
                >{{ tag }}</span>
              </div>
            </div>

            <div v-if="detail.profile.education">
              <p class="text-[0.8rem] font-semibold text-muted">Pendidikan</p>
              <p class="mt-1 text-sm">{{ detail.profile.education }}</p>
            </div>

            <div v-if="socialLinks.length > 0">
              <p class="text-[0.8rem] font-semibold text-muted">Tautan</p>
              <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                <a
                  v-for="link in socialLinks"
                  :key="link.label"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="inline-flex items-center gap-1.5 text-[0.86rem] font-semibold text-primary hover:underline"
                >
                  <AppIcon :name="link.icon" :size="15" />
                  {{ link.label }}
                </a>
              </div>
            </div>

            <p
              v-if="!detail.profile.bio && !detail.profile.experience && detail.profile.specializations.length === 0 && !detail.profile.education && socialLinks.length === 0"
              class="text-sm text-muted"
            >
              Tutor ini belum mengisi profil publiknya.
            </p>
          </div>
        </DashboardPanel>
      </div>

      <div v-show="activeTab === 'produk'" id="panel-produk" role="tabpanel" aria-labelledby="tab-produk">
        <DashboardPanel
          title="Produk"
          :description="`${detail.products.length} produk dibuat, apa pun statusnya.`"
        >
          <p v-if="detail.products.length === 0" class="py-6 text-center text-muted">
            Tutor ini belum membuat produk.
          </p>
          <DashboardTable v-else :columns="PRODUCT_COLUMNS" :data="detail.products" primary-key="title" action-key="aksi">
            <template #cell(title)="{ value }">
              <span class="block font-semibold tracking-[-0.02em] text-ink">{{ value }}</span>
            </template>
            <template #cell(type)="{ value }">{{ typeLabel(value) }}</template>
            <template #cell(price)="{ value }">
              <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
              <span v-else class="font-semibold text-success-ink">Gratis</span>
            </template>
            <template #cell(status)="{ value }">
              <DashboardBadge :tone="statusTone(value)">{{ statusLabel(value) }}</DashboardBadge>
            </template>
            <template #cell(aksi)="{ item }">
              <NuxtLink
                :to="`/dashboard/admin/products/${item.id}`"
                class="text-[0.86rem] font-semibold text-primary hover:underline"
              >
                Lihat
              </NuxtLink>
            </template>
          </DashboardTable>
        </DashboardPanel>
      </div>

      <div
        v-if="canManageShareSchedule"
        v-show="activeTab === 'bagi-hasil'"
        id="panel-bagi-hasil"
        role="tabpanel"
        aria-labelledby="tab-bagi-hasil"
      >
        <DashboardPanel title="Bagi hasil" description="Jadwal komersial privat untuk tutor ini.">
          <template #action>
            <AppButton
              variant="primary"
              size="sm"
              :disabled="sharePending"
              @click="openShareEditor"
            >
              Atur tarif
            </AppButton>
          </template>

          <DashboardSkeleton v-if="sharePending && !shareSchedule" :count="3" label="Memuat jadwal bagi hasil..." />

          <div v-else-if="shareError && !shareSchedule" class="grid justify-items-start gap-3">
            <AppInlineMessage type="error">{{ shareError }}</AppInlineMessage>
            <AppButton variant="outline" size="sm" @click="refreshShareSchedule">Coba lagi</AppButton>
          </div>

          <div v-else-if="shareSchedule" class="grid gap-6">
            <AppInlineMessage v-if="shareSchedule.termsAccepted === false" type="info">
              Tutor belum menerima Syarat Tutor versi {{ shareSchedule.termsVersion || 'aktif' }}.
              Jadwal tetap dapat diatur; tutor diminta menyetujui syarat saat membuka dashboard penjualan.
            </AppInlineMessage>

            <div class="rounded-md border border-hairline bg-surface-alt p-5">
              <p class="text-[0.78rem] font-semibold uppercase tracking-wider text-muted">Tarif sekarang</p>
              <p class="mt-1 text-3xl font-bold tracking-[-0.05em] text-ink">
                {{ shareSchedule.effectivePercent }}%
                <span v-if="shareSchedule.effectivePercent === 70" class="text-base font-semibold text-muted">(standar)</span>
              </p>
              <p class="mt-2 text-sm text-muted">
                <template v-if="shareSchedule.effectiveSince">Berlaku sejak {{ formatWibDateTime(shareSchedule.effectiveSince) }}.</template>
                <template v-if="shareSchedule.nextChange">
                  Berikutnya {{ shareSchedule.nextChange.effectivePercent }}% mulai {{ formatWibDateTime(shareSchedule.nextChange.startsAt) }}.
                </template>
              </p>
              <DashboardBadge v-if="shareSchedule.notificationStatus" class="mt-3" tone="neutral">
                {{ notificationLabel(shareSchedule.notificationStatus) }}
              </DashboardBadge>
            </div>

            <div>
              <h3 class="text-sm font-bold text-ink">Riwayat perubahan</h3>
              <p v-if="shareSchedule.changeHistory.length === 0" class="mt-3 text-sm text-muted">
                Belum ada tarif khusus untuk tutor ini.
              </p>
              <ol v-else class="mt-3 grid gap-3">
                <li
                  v-for="change in shareSchedule.changeHistory"
                  :key="change.id"
                  class="rounded-sm border border-line p-4"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="font-bold text-ink">{{ sharePercentLabel(change.percent) }}</p>
                      <p class="mt-1 text-sm text-muted">
                        {{ formatWibDateTime(change.startsAt) }}
                        <template v-if="change.endsAt">– {{ formatWibDateTime(change.endsAt) }}</template>
                      </p>
                    </div>
                    <DashboardBadge :tone="change.cancelledAt ? 'neutral' : change.startsAt > shareSchedule.serverTime ? 'warning' : 'brand'">
                      {{ change.cancelledAt ? 'Dibatalkan' : change.startsAt > shareSchedule.serverTime ? 'Dijadwalkan' : 'Berlaku' }}
                    </DashboardBadge>
                  </div>
                  <dl class="mt-3 grid gap-2 text-sm">
                    <div v-if="change.internalReason">
                      <dt class="font-semibold text-muted">Alasan internal</dt>
                      <dd class="mt-0.5 whitespace-pre-line text-ink">{{ change.internalReason }}</dd>
                    </div>
                    <div v-if="change.noteForTutor">
                      <dt class="font-semibold text-muted">Catatan untuk tutor</dt>
                      <dd class="mt-0.5 whitespace-pre-line text-ink">{{ change.noteForTutor }}</dd>
                    </div>
                  </dl>
                  <AppButton
                    v-if="!change.cancelledAt && change.startsAt > shareSchedule.serverTime && change.resultingVersion === shareSchedule.scheduleVersion"
                    class="mt-4"
                    variant="outline"
                    size="sm"
                    @click="openCancelChange(change)"
                  >
                    Batalkan jadwal
                  </AppButton>
                </li>
              </ol>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </template>

    <AppModal
      v-model="shareEditorOpen"
      :title="shareEditorStep === 'confirm' ? 'Konfirmasi perubahan bagi hasil' : 'Atur tarif bagi hasil'"
      :description="shareEditorStep === 'confirm' ? `Periksa kembali perubahan untuk ${detail?.name || 'tutor'}.` : 'Waktu ditampilkan dalam WIB dan tanggal akhir bersifat eksklusif.'"
    >
      <form v-if="shareEditorStep === 'edit'" class="grid gap-5" @submit.prevent="previewShareChange">
        <fieldset :disabled="sharePreviewPending" class="grid gap-3">
          <legend class="text-[0.9rem] font-semibold text-ink">Persentase tutor</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in [75, 80, 85, 90]"
              :key="preset"
              type="button"
              class="min-h-11 rounded-sm border px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="!useStandardPercent && Number(sharePercent) === preset ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink'"
              @click="useStandardPercent = false; sharePercent = preset"
            >
              {{ preset }}%
            </button>
            <button
              type="button"
              class="min-h-11 rounded-sm border px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="useStandardPercent ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink'"
              @click="useStandardPercent = true"
            >
              Standar 70%
            </button>
          </div>
          <AppInput
            v-if="!useStandardPercent"
            id="share-percent"
            v-model="sharePercent"
            type="number"
            label="Persentase lain"
            :min="70"
            :max="90"
            :step="1"
            hint="Bilangan bulat antara 70 dan 90."
            required
          />
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput id="share-starts-at" v-model="shareStartsAt" type="datetime-local" label="Mulai berlaku (WIB)" required />
          <AppInput id="share-ends-at" v-model="shareEndsAt" type="datetime-local" label="Berakhir pada (WIB, opsional)" />
        </div>
        <AppTextarea
          id="share-internal-reason"
          v-model="shareInternalReason"
          label="Alasan internal"
          hint="Wajib. Tidak akan ditampilkan kepada tutor."
          :maxlength="1000"
          required
        />
        <AppTextarea
          id="share-note-for-tutor"
          v-model="shareNoteForTutor"
          label="Catatan untuk tutor"
          hint="Dipublikasikan pada dashboard tutor."
          :maxlength="1000"
        />

        <AppInlineMessage v-if="shareFormError" type="error" role="alert">{{ shareFormError }}</AppInlineMessage>
        <AppInlineMessage v-if="sharePreview?.earliestDecreaseAt" type="warning">
          Penurunan paling cepat dapat berlaku {{ formatWibDateTime(sharePreview.earliestDecreaseAt) }}.
        </AppInlineMessage>
      </form>

      <div v-else class="grid gap-4">
        <dl class="grid gap-3 rounded-md border border-line bg-surface-alt p-4 text-sm">
          <div><dt class="font-semibold text-muted">Tutor</dt><dd class="mt-0.5 font-bold text-ink">{{ detail?.name }}</dd></div>
          <div><dt class="font-semibold text-muted">Tarif</dt><dd class="mt-0.5 font-bold text-ink">{{ sharePercentLabel(shareInput?.percent ?? null) }}</dd></div>
          <div><dt class="font-semibold text-muted">Mulai</dt><dd class="mt-0.5 text-ink">{{ formatWibDateTime(shareInput?.startsAt) }}</dd></div>
          <div v-if="shareInput?.endsAt"><dt class="font-semibold text-muted">Berakhir</dt><dd class="mt-0.5 text-ink">{{ formatWibDateTime(shareInput.endsAt) }}</dd></div>
          <div v-if="sharePreview?.example">
            <dt class="font-semibold text-muted">Contoh pembagian</dt>
            <dd class="mt-0.5 text-ink">
              Paket {{ formatRupiah(sharePreview.example.price) }} → tutor {{ formatRupiah(sharePreview.example.tutorShare) }}, Zenko {{ formatRupiah(sharePreview.example.zenkoShare) }}
            </dd>
          </div>
        </dl>
        <AppInput
          id="share-step-up-password"
          v-model="shareStepUpPassword"
          type="password"
          label="Konfirmasi kata sandi pemilik"
          autocomplete="current-password"
          hint="Diperlukan untuk perubahan finansial. Kata sandi tidak disimpan."
          :disabled="shareSaving"
          required
        />
        <AppInlineMessage v-if="shareFormError" type="error" role="alert">{{ shareFormError }}</AppInlineMessage>
      </div>

      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="shareSaving" @click="shareEditorStep === 'confirm' ? shareEditorStep = 'edit' : shareEditorOpen = false">
          {{ shareEditorStep === 'confirm' ? 'Kembali' : 'Batal' }}
        </AppButton>
        <AppButton
          v-if="shareEditorStep === 'edit'"
          variant="primary"
          size="sm"
          :loading="sharePreviewPending"
          :disabled="!shareFormValid || sharePreviewPending"
          @click="previewShareChange"
        >
          Tinjau perubahan
        </AppButton>
        <AppButton v-else variant="primary" size="sm" :loading="shareSaving" :disabled="shareSaving || !shareStepUpPassword" @click="saveShareChange">
          Simpan jadwal
        </AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model="cancelOpen"
      title="Batalkan jadwal mendatang"
      :description="cancelChange ? `${sharePercentLabel(cancelChange.percent)} mulai ${formatWibDateTime(cancelChange.startsAt)}` : ''"
    >
      <form class="grid gap-4" @submit.prevent="confirmCancelChange">
        <AppTextarea
          id="share-cancel-internal-reason"
          v-model="cancelInternalReason"
          label="Alasan internal"
          hint="Wajib. Tidak ditampilkan kepada tutor."
          :disabled="cancelPending"
          :maxlength="1000"
          required
        />
        <AppTextarea
          id="share-cancel-note"
          v-model="cancelNoteForTutor"
          label="Catatan untuk tutor"
          :disabled="cancelPending"
          :maxlength="1000"
        />
        <AppInput
          id="share-cancel-step-up-password"
          v-model="cancelStepUpPassword"
          type="password"
          label="Konfirmasi kata sandi pemilik"
          autocomplete="current-password"
          hint="Diperlukan untuk membatalkan perubahan finansial."
          :disabled="cancelPending"
          required
        />
        <AppInlineMessage v-if="cancelError" type="error" role="alert">{{ cancelError }}</AppInlineMessage>
      </form>
      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="cancelPending" @click="cancelOpen = false">Batal</AppButton>
        <AppButton
          variant="danger"
          size="sm"
          :loading="cancelPending"
          :disabled="cancelPending || !cancelInternalReason.trim() || !cancelStepUpPassword"
          @click="confirmCancelChange"
        >
          Batalkan jadwal
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
