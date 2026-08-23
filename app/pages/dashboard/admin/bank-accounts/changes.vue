<script setup lang="ts">
import type { AdminBankAccountChangeRequest } from '#shared/types/admin-moderation'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Rekening bank › Perubahan — pengajuan perubahan rekening tutor. Satu tabel,
 * satu dataset; DashboardTableToolbar yang memfilter, persis pola
 * applications/products/payouts.
 *
 * Menyetujui perubahan mengganti rekening live DAN me-reset verifikasinya
 * (admin_bank_accounts.go Decide), jadi rekening barunya muncul lagi sebagai
 * belum-terverifikasi di halaman Pengajuan. Halaman itu punya state-nya
 * sendiri dan menariknya ulang saat di-mount, jadi dari sini cukup me-refresh
 * dataset ini plus jumlah antrean di sidebar.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Perubahan rekening — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { public: config } = useRuntimeConfig()
const { refresh: refreshSummary } = useAdminSummary()

/**
 * Fetched here rather than via useAdminBankAccountChangeRequests: that
 * composable pins `status=pending`, and the filter needs the decided ones too.
 * Same shape, same client-only pattern (the session cookie is HttpOnly on the
 * API origin — see useAdminModeration), `status=all` instead.
 */
const changeRequests = ref<AdminBankAccountChangeRequest[]>([])
const pending = ref(false)
const error = ref('')

async function refresh() {
  pending.value = true
  error.value = ''
  try {
    changeRequests.value = await $fetch<AdminBankAccountChangeRequest[]>('/admin/bank-account-change-requests', {
      baseURL: config.apiBase,
      credentials: 'include',
      query: { status: 'all' },
    })
  }
  catch (cause) {
    error.value = tutorApiMessage(cause, 'Gagal memuat pengajuan perubahan rekening.')
  }
  finally {
    pending.value = false
  }
}

// Skeleton is for the first load only (design spec §3.6); refetches after a
// decision keep the stale table rendered until fresh data lands.
const loaded = ref(false)
onMounted(async () => {
  await refresh()
  loaded.value = true
})

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter status, urutkan. Filter membuka di "Menunggu",
 * subset yang persis dipegang tab default dulu.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua status' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru diajukan' },
  { value: 'oldest', label: 'Terlama diajukan' },
  { value: 'tutor-asc', label: 'Nama tutor A–Z' },
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<AdminBankAccountChangeRequest>(() => changeRequests.value, {
  searchFields: request => [
    request.tutor.name,
    request.tutor.email,
    request.currentAccount.bankLabel,
    request.currentAccount.accountNumber,
    request.currentAccount.holderName,
    request.newAccount.bankLabel,
    request.newAccount.accountNumber,
    request.newAccount.holderName,
  ],
  filters: {
    pending: request => request.status === 'pending',
    approved: request => request.status === 'approved',
    rejected: request => request.status === 'rejected',
    all: () => true,
  },
  sorts: {
    newest: (a, b) => b.requestedAt - a.requestedAt,
    oldest: (a, b) => a.requestedAt - b.requestedAt,
    'tutor-asc': (a, b) => a.tutor.name.localeCompare(b.tutor.name, 'id'),
  },
  defaultFilter: 'pending',
  defaultSort: 'newest',
})

// The count the old "Menunggu" tab pill carried; the sidebar and Ringkasan
// badges still carry it too.
const pendingCount = computed(() =>
  changeRequests.value.filter(request => request.status === 'pending').length,
)

/* ---------------------------------------------------------------- table -- */

const columns = [
  { key: 'tutor', label: 'Tutor' },
  { key: 'current', label: 'Rekening saat ini' },
  { key: 'proposed', label: 'Rekening baru' },
  { key: 'requestedAt', label: 'Diajukan' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// AppTable's cell slots hand back `item` as Record<string, any>; typed rows
// are recovered by id and badge lookups go through typed accessors (pattern
// from tutor/products/index.vue).
function findChange(id: string): AdminBankAccountChangeRequest | undefined {
  return changeRequests.value.find(request => request.id === id)
}
// Change requests reuse the application status maps — same three values,
// same meaning (design spec §2).
function changeStatusTone(status: AdminBankAccountChangeRequest['status']) {
  return APPLICATION_STATUS_TONE[status]
}
function changeStatusLabel(status: AdminBankAccountChangeRequest['status']): string {
  return APPLICATION_STATUS_LABEL[status]
}

/* --------------------------------------------------------------------------
 * Page-level notices — one slot under the header (design spec §3.4–3.5).
 * One at a time; each new action clears the last.
 * ------------------------------------------------------------------------ */

const successMessage = ref('')
const conflictMessage = ref('')

function clearNotices() {
  successMessage.value = ''
  conflictMessage.value = ''
}

const CONFLICT_NOTICE = 'Item ini baru saja diputuskan (mungkin oleh admin lain). Daftar dimuat ulang.'
const DECISION_FALLBACK = 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.'

/**
 * Decided-race on a change request surfaces as 404 ("…tidak ditemukan atau
 * sudah diputuskan", admin_bank_accounts.go Decide) rather than the payout
 * queue's 409 — both mean the same thing here: someone else got there first,
 * refetch is the truth.
 */
function isDecisionRace(cause: unknown): boolean {
  const status = (cause as { statusCode?: number } | null)?.statusCode
  return status === 409 || status === 404
}

/** Refetch the list and drop the sidebar/overview counts after a decision. */
async function refreshAll() {
  await refresh()
  await refreshSummary()
}

/* --------------------------------------------------------------------------
 * Setujui — mengganti rekening live dan me-reset verifikasinya.
 * ------------------------------------------------------------------------ */

const approveTarget = ref<AdminBankAccountChangeRequest | null>(null)
const approveBusy = ref(false)
const approveError = ref('')

function openApprove(request: AdminBankAccountChangeRequest) {
  clearNotices()
  approveError.value = ''
  approveTarget.value = request
}

async function confirmApprove() {
  const target = approveTarget.value
  if (!target) return

  approveError.value = ''
  approveBusy.value = true
  try {
    await decideAdminBankAccountChange(target.id, { approve: true })
    approveTarget.value = null
    successMessage.value = `Perubahan rekening ${target.tutor.name} disetujui — verifikasi ulang rekening barunya di halaman Pengajuan.`
    await refreshAll()
  }
  catch (cause) {
    if (isDecisionRace(cause)) {
      approveTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refreshAll()
    }
    else {
      approveError.value = tutorApiMessage(cause, DECISION_FALLBACK)
    }
  }
  finally {
    approveBusy.value = false
  }
}

/* --------------------------------------------------------------------------
 * Tolak — rekening live tidak tersentuh; alasan wajib menurut server.
 * ------------------------------------------------------------------------ */

const rejectTarget = ref<AdminBankAccountChangeRequest | null>(null)
const rejectBusy = ref(false)
const rejectError = ref('')

function openReject(request: AdminBankAccountChangeRequest) {
  clearNotices()
  rejectError.value = ''
  rejectTarget.value = request
}

async function confirmReject(reason: string) {
  const target = rejectTarget.value
  if (!target) return

  rejectError.value = ''
  rejectBusy.value = true
  try {
    await decideAdminBankAccountChange(target.id, { approve: false, reason })
    rejectTarget.value = null
    successMessage.value = `Pengajuan perubahan rekening ${target.tutor.name} ditolak.`
    await refreshAll()
  }
  catch (cause) {
    if (isDecisionRace(cause)) {
      rejectTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refreshAll()
    }
    else {
      rejectError.value = tutorApiMessage(cause, DECISION_FALLBACK)
    }
  }
  finally {
    rejectBusy.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Perubahan rekening"
      description="Tinjau pengajuan perubahan rekening dari tutor sebelum rekening barunya dipakai."
    />

    <!-- :key remounts AppAlert per message — it hides itself internally after
         dismiss, so a fresh message needs a fresh instance. -->
    <AppAlert v-if="successMessage" :key="successMessage" variant="success" dismissible>
      {{ successMessage }}
    </AppAlert>
    <AppInlineMessage v-if="conflictMessage" type="warning">{{ conflictMessage }}</AppInlineMessage>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="4" label="Memuat pengajuan perubahan..." />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button
          type="button"
          class="mt-3 font-semibold text-primary hover:underline"
          @click="refresh"
        >
          Muat ulang
        </button>
      </div>

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="admin-bank-changes-search"
          search-label="Cari pengajuan perubahan"
          search-placeholder="Cari tutor, email, bank, atau nomor rekening…"
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
          title="Tidak ada pengajuan perubahan"
          description="Pengajuan perubahan rekening dari tutor akan muncul di sini."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Tidak ada hasil"
          description="Tidak ada pengajuan yang cocok dengan pencarian atau filter ini."
          action-label="Reset pencarian"
          @action="reset"
        />

        <AppTable v-else :columns="columns" :data="rows">
          <template #cell(tutor)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.tutor.name }}</span>
            <span class="block text-[0.82rem] text-muted">{{ item.tutor.email }}</span>
          </template>

          <template #cell(current)="{ item }">
            <span class="block tabular-nums">{{ item.currentAccount.bankLabel }} · {{ item.currentAccount.accountNumber }}</span>
            <span class="block text-[0.82rem] text-muted">a.n. {{ item.currentAccount.holderName }}</span>
          </template>

          <template #cell(proposed)="{ item }">
            <span class="block tabular-nums">{{ item.newAccount.bankLabel }} · {{ item.newAccount.accountNumber }}</span>
            <span class="block text-[0.82rem] text-muted">a.n. {{ item.newAccount.holderName }}</span>
          </template>

          <template #cell(requestedAt)="{ value }">
            <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="changeStatusTone(item.status)">
              {{ changeStatusLabel(item.status) }}
            </DashboardBadge>
            <span
              v-if="item.status === 'rejected' && item.rejectReason"
              class="mt-1 block max-w-56 text-[0.82rem] text-danger-ink"
            >
              {{ item.rejectReason }}
            </span>
          </template>

          <template #cell(aksi)="{ item }">
            <!-- v-for over a one-item array recovers the typed row from
                 `findChange` as a template-scoped variable (see
                 tutor/products/index.vue for the pattern's rationale). -->
            <template v-for="request in [findChange(item.id)]" :key="item.id">
              <span
                v-if="request && request.status === 'pending'"
                class="inline-flex items-center gap-3 whitespace-nowrap"
              >
                <button
                  type="button"
                  class="text-[0.86rem] font-semibold text-primary hover:underline"
                  @click="openApprove(request)"
                >
                  Setujui
                </button>
                <button
                  type="button"
                  class="text-[0.86rem] font-semibold text-danger hover:underline"
                  @click="openReject(request)"
                >
                  Tolak…
                </button>
              </span>
              <span v-else class="text-[0.86rem] text-muted">—</span>
            </template>
          </template>
        </AppTable>
      </div>
    </DashboardPanel>

    <AdminConfirmModal
      :open="approveTarget !== null"
      title="Setujui perubahan rekening?"
      description="Rekening lama diganti dengan yang baru dan status verifikasinya di-reset — rekening baru harus diverifikasi ulang di halaman Pengajuan."
      confirm-label="Setujui perubahan"
      confirm-variant="primary"
      :busy="approveBusy"
      :error="approveError"
      @update:open="value => { if (!value) approveTarget = null }"
      @confirm="confirmApprove"
    />

    <AdminReasonModal
      :open="rejectTarget !== null"
      title="Tolak perubahan ini?"
      description="Rekening tutor tetap seperti sebelumnya dan tutor melihat alasanmu."
      placeholder="Mis. nama pemilik rekening tidak cocok."
      confirm-label="Tolak pengajuan"
      :busy="rejectBusy"
      :error="rejectError"
      @update:open="value => { if (!value) rejectTarget = null }"
      @confirm="confirmReject"
    />
  </div>
</template>
