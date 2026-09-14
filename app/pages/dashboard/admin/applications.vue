<script setup lang="ts">
import type { ApplicationStatus, TutorApplication } from '#shared/types/tutor-application'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Pengajuan tutor — antrean keputusan pengajuan calon tutor (product spec
 * §4.2, design spec §4.2). Satu tabel dengan DashboardTableToolbar di atasnya:
 * filter berhenti di "Menunggu" saat halaman dibuka, jadi yang tampil pertama
 * tetap yang butuh keputusan. Keputusan lewat AdminConfirmModal untuk KEDUA
 * arah — API keputusan hanya menerima { status }, tanpa alasan, jadi
 * penolakan pun memakai confirm modal (varian danger), bukan reason modal.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Pengajuan Tutor | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Client-only resolve: the session cookie is HttpOnly on the API origin, so
// the list only carries data after the refresh in onMounted (same constraint
// as every admin fetch — see useAdminModeration).
const { data: applications, pending, error, refresh } = useAdminTutorApplications()
// Sidebar badge + Ringkasan counts drop the moment a decision lands.
const { refresh: refreshSummary } = useAdminSummary()

onMounted(() => {
  refresh()
})

/* -------------------------------------------------------------- toolbar -- */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua status' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru diajukan' },
  { value: 'oldest', label: 'Terlama diajukan' },
  { value: 'name', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<TutorApplication>(() => applications.value, {
  searchFields: app => [app.name, app.email, app.expertise],
  filters: {
    pending: app => app.status === 'pending',
    approved: app => app.status === 'approved',
    rejected: app => app.status === 'rejected',
    all: () => true,
  },
  sorts: {
    // submittedAt is all the API stores — a decided row still sorts by when it
    // came in, which is the only timestamp there is.
    newest: (a, b) => b.submittedAt - a.submittedAt,
    oldest: (a, b) => a.submittedAt - b.submittedAt,
    name: (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
  },
  defaultFilter: 'pending',
  defaultSort: 'newest',
})

// The count the old "Menunggu" tab pill carried; the sidebar and Ringkasan
// badges still carry it too.
const pendingCount = computed(() =>
  applications.value.filter(app => app.status === 'pending').length,
)

/* ---------------------------------------------------------------- table -- */

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'expertise', label: 'Bidang' },
  { key: 'whatsapp', label: 'Kontak' },
  { key: 'submittedAt', label: 'Masuk' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// DashboardTable's cell slots hand back `item` as Record<string, any>; lookups go
// through these typed accessors instead (pattern from tutor/products).
function statusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_LABEL[status]
}
function statusTone(status: ApplicationStatus) {
  return APPLICATION_STATUS_TONE[status]
}
function findApplication(id: string): TutorApplication | undefined {
  return applications.value.find(app => app.id === id)
}

const loadErrorMessage = computed(() =>
  error.value ? tutorApiMessage(error.value, 'Data belum berhasil dimuat. Coba muat ulang.') : '',
)

/* --------------------------------------------------------- detail modal -- */

const detailOpen = ref(false)
const detailApp = ref<TutorApplication | null>(null)

function openDetail(id: string) {
  const app = findApplication(id)
  if (!app) return
  detailApp.value = app
  detailOpen.value = true
}

/* ------------------------------------------------------- decision flow -- */

type DecisionStatus = 'approved' | 'rejected'

const decisionApp = ref<TutorApplication | null>(null)
const decisionStatus = ref<DecisionStatus>('approved')
const confirmOpen = ref(false)
const decisionBusy = ref(false)
const decisionError = ref('')

/** Page-level feedback slot under the header: success banner or 409 notice. */
const successMessage = ref('')
const conflictNotice = ref('')

// Copy verbatim from design spec §6. Consequence named explicitly — approving
// grants the tutor role on the spot.
const confirmCopy = computed(() => {
  const name = decisionApp.value?.name ?? ''
  if (decisionStatus.value === 'approved') {
    return {
      title: 'Setujui pengajuan tutor?',
      description: `Akun ${name} langsung mendapat peran tutor dan akses ke dashboard tutor. Tindakan ini tidak bisa dibatalkan dari dashboard.`,
      confirmLabel: 'Setujui & jadikan tutor',
      variant: 'primary' as const,
    }
  }
  return {
    title: 'Tolak pengajuan ini?',
    description: 'Pemohon melihat status ditolak di halaman /jadi-tutor dan bisa mengajukan ulang.',
    confirmLabel: 'Tolak pengajuan',
    variant: 'danger' as const,
  }
})

/** Close the detail modal and open the confirm — never two stacked dialogs. */
function startDecision(app: TutorApplication, status: DecisionStatus) {
  successMessage.value = ''
  conflictNotice.value = ''
  decisionError.value = ''
  decisionApp.value = app
  decisionStatus.value = status
  detailOpen.value = false
  confirmOpen.value = true
}

/**
 * The application decision endpoint has no real conflict signal today — a
 * re-decide simply answers 200 (last write wins). 404 ("pengajuan tidak
 * ditemukan") means the row is gone from under a stale list; treat it like
 * the other queues' decided-race: close, refetch, explain. 409 is handled
 * for the day the API adds proper conflict detection.
 */
function isConflict(cause: unknown): boolean {
  const status = (cause as { statusCode?: number } | null)?.statusCode
  return status === 409 || status === 404
}

async function submitDecision() {
  const app = decisionApp.value
  if (!app || decisionBusy.value) return

  const { public: config } = useRuntimeConfig()
  decisionBusy.value = true
  decisionError.value = ''
  try {
    await useApiFetch(`/admin/tutor-applications/${app.id}/decision`, {
      baseURL: config.apiBase,
      method: 'POST',
      body: { status: decisionStatus.value },
      credentials: 'include',
    })
    confirmOpen.value = false
    successMessage.value = decisionStatus.value === 'approved'
      ? `Pengajuan ${app.name} telah disetujui. Akun berhasil diberikan akses sebagai tutor.`
      : `Pengajuan ${app.name} telah ditolak.`
    // Refetch-not-optimistic: the row leaves the queue when truth lands.
    await refresh()
    refreshSummary()
  }
  catch (cause) {
    if (isConflict(cause)) {
      confirmOpen.value = false
      conflictNotice.value = 'Status pengajuan ini telah diperbarui oleh admin lain. Data antrean dimuat ulang.'
      await refresh()
      refreshSummary()
    }
    else {
      // Modal stays open with the message in its body.
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
      title="Pengajuan tutor"
      description="Tinjau profil dan latar belakang calon tutor yang ingin bergabung di Zenko."
    />

    <!-- One feedback slot: success banner (remounts per message) or 409 notice. -->
    <AppAlert
      v-if="successMessage"
      :key="successMessage"
      variant="success"
      dismissible
    >
      {{ successMessage }}
    </AppAlert>
    <AppInlineMessage v-if="conflictNotice" type="warning">{{ conflictNotice }}</AppInlineMessage>

    <DashboardPanel>
      <!-- Skeleton on first load only; refetches keep the stale table rendered. -->
      <DashboardSkeleton
        v-if="pending && applications.length === 0"
        :count="5"
        label="Memuat pengajuan..."
      />

      <div v-else-if="loadErrorMessage && applications.length === 0" class="py-8 text-center">
        <AppInlineMessage type="error">{{ loadErrorMessage }}</AppInlineMessage>
        <button
          type="button"
          class="mt-3 font-semibold text-primary hover:underline"
          @click="refresh()"
        >
          Muat ulang
        </button>
      </div>

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="admin-applications-search"
          search-label="Cari pengajuan"
          search-placeholder="Cari nama, email, atau bidang…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="pengajuan"
          :actionable-count="pendingCount"
          actionable-label="menunggu keputusan"
          :active="isActive"
          @reset="reset"
        />

        <!-- Two empty states: an untouched toolbar over an empty table means
             the queue really is clear; anything else means the search or
             filter came up empty, and Reset is the way out. -->
        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Tidak ada pengajuan yang menunggu"
          description="Pengajuan baru dari /jadi-tutor akan muncul di sini."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada pengajuan yang cocok dengan pencarian atau filter yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="name" action-key="aksi">
          <template #cell(name)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span>
            <span class="block text-[0.82rem] text-muted">{{ item.email }}</span>
          </template>
          <template #cell(whatsapp)="{ value }">
            <span class="tabular-nums whitespace-nowrap">{{ value }}</span>
          </template>
          <template #cell(submittedAt)="{ value }">
            <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
          </template>
          <template #cell(status)="{ item }">
            <DashboardBadge :tone="statusTone(item.status)">
              {{ statusLabel(item.status) }}
            </DashboardBadge>
          </template>
          <template #cell(aksi)="{ item }">
            <button
              type="button"
              class="text-[0.86rem] font-semibold text-primary hover:underline"
              @click="openDetail(item.id)"
            >
              Tinjau
            </button>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <!-- Detail modal: the full application, including pengalaman dan
         portofolio yang di UI lama tidak pernah tampil. -->
    <AppModal
      v-if="detailApp"
      v-model="detailOpen"
      :title="detailApp.name"
      :description="`Pengajuan masuk ${formatDate(detailApp.submittedAt)}`"
    >
      <div class="grid gap-4">
        <div v-if="detailApp.status !== 'pending'">
          <DashboardBadge :tone="statusTone(detailApp.status)">
            {{ statusLabel(detailApp.status) }}
          </DashboardBadge>
        </div>

        <dl class="grid gap-3">
          <div>
            <dt class="text-[0.78rem] font-semibold uppercase tracking-wider text-faint">Email</dt>
            <dd class="mt-0.5 text-sm text-ink">{{ detailApp.email }}</dd>
          </div>
          <div>
            <dt class="text-[0.78rem] font-semibold uppercase tracking-wider text-faint">WhatsApp</dt>
            <dd class="mt-0.5 text-sm text-ink tabular-nums">{{ detailApp.whatsapp }}</dd>
          </div>
          <div>
            <dt class="text-[0.78rem] font-semibold uppercase tracking-wider text-faint">Bidang keahlian</dt>
            <dd class="mt-0.5 text-sm text-ink">{{ detailApp.expertise }}</dd>
          </div>
          <div>
            <dt class="text-[0.78rem] font-semibold uppercase tracking-wider text-faint">Pengalaman</dt>
            <dd class="mt-0.5 text-sm text-ink whitespace-pre-line">{{ detailApp.experience }}</dd>
          </div>
          <div>
            <dt class="text-[0.78rem] font-semibold uppercase tracking-wider text-faint">Portofolio</dt>
            <dd class="mt-0.5 text-sm">
              <a
                v-if="detailApp.portfolioUrl"
                :href="detailApp.portfolioUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-semibold text-primary hover:underline break-all"
              >
                {{ detailApp.portfolioUrl }}
                <AppIcon name="arrow-square-out" :size="14" />
              </a>
              <span v-else class="text-muted">-</span>
            </dd>
          </div>
        </dl>
      </div>

      <template #footer>
        <template v-if="detailApp.status === 'pending'">
          <AppButton variant="outline" size="sm" @click="startDecision(detailApp, 'rejected')">
            Tolak
          </AppButton>
          <AppButton variant="primary" size="sm" @click="startDecision(detailApp, 'approved')">
            Setujui
          </AppButton>
        </template>
        <AppButton v-else variant="outline" size="sm" @click="detailOpen = false">
          Tutup
        </AppButton>
      </template>
    </AppModal>

    <!-- Confirm untuk KEDUA keputusan: API menerima { status } saja, tanpa
         alasan, jadi penolakan tidak memakai AdminReasonModal (product spec §7). -->
    <AdminConfirmModal
      v-model:open="confirmOpen"
      :title="confirmCopy.title"
      :description="confirmCopy.description"
      :confirm-label="confirmCopy.confirmLabel"
      :confirm-variant="confirmCopy.variant"
      :busy="decisionBusy"
      :error="decisionError"
      @confirm="submitDecision"
    />
  </div>
</template>
