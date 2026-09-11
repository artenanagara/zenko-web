<script setup lang="ts">
import type { AdminPayout } from '#shared/types/admin-moderation'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Pencairan — antrean pencairan dana tutor (product spec §4.5, design spec
 * §4.5). Alur status di server (admin_payouts.go): requested → processing →
 * transferred, dengan reject (wajib alasan) dari kedua status non-terminal.
 * "Proses" satu-satunya keputusan tanpa modal (reversibel — masih bisa
 * ditolak); "Tandai ditransfer" dan "Tolak…" sama-sama lewat AdminReasonModal
 * — keduanya menuntut satu kalimat wajib dari admin (nomor referensi transfer
 * dan alasan penolakan).
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Pencairan Dana | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Client-only fetch — the session cookie is HttpOnly on the API origin (see
// useAdminModeration). One fetch, no status param: the page splits queue vs
// history itself, which is exactly how the handler expects to be called.
const { data: payouts, pending, error, refresh } = useAdminPayoutQueue()
const { refresh: refreshSummary } = useAdminSummary()

// Skeleton is for the first load only (design spec §3.6): refetches after a
// decision keep the stale table rendered until fresh data lands.
const loaded = ref(false)
onMounted(async () => {
  await refresh()
  loaded.value = true
})

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter status, urutkan. Filter membuka di "Perlu tindakan"
 * (requested + processing), subset yang persis dipegang tab Antrean dulu.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'queue', label: 'Perlu tindakan' },
  { value: 'requested', label: 'Diajukan' },
  { value: 'processing', label: 'Diproses' },
  { value: 'transferred', label: 'Ditransfer' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua status' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru diajukan' },
  { value: 'oldest', label: 'Terlama diajukan' },
  { value: 'amount-desc', label: 'Nominal terbesar' },
  { value: 'amount-asc', label: 'Nominal terkecil' },
]

function isActionable(payout: AdminPayout): boolean {
  return payout.status === 'requested' || payout.status === 'processing'
}

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<AdminPayout>(() => payouts.value, {
  searchFields: payout => [
    payout.tutor.name,
    payout.tutor.email,
    payout.bankAccount.bankLabel,
    payout.bankAccount.accountNumber,
    payout.bankAccount.holderName,
  ],
  filters: {
    queue: isActionable,
    requested: payout => payout.status === 'requested',
    processing: payout => payout.status === 'processing',
    transferred: payout => payout.status === 'transferred',
    rejected: payout => payout.status === 'rejected',
    all: () => true,
  },
  sorts: {
    newest: (a, b) => b.requestedAt - a.requestedAt,
    oldest: (a, b) => a.requestedAt - b.requestedAt,
    'amount-desc': (a, b) => b.amount - a.amount,
    'amount-asc': (a, b) => a.amount - b.amount,
  },
  defaultFilter: 'queue',
  defaultSort: 'newest',
})

// The count the old "Antrean" tab pill carried; the sidebar and Ringkasan
// badges still carry it too.
const actionableCount = computed(() => payouts.value.filter(isActionable).length)

const columns = [
  { key: 'tutor', label: 'Tutor' },
  { key: 'bank', label: 'Rekening' },
  { key: 'amount', label: 'Nominal', align: 'right' as const },
  { key: 'requestedAt', label: 'Diajukan' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// DashboardTable's cell slots hand back `item` as Record<string, any> (it isn't a
// generic component), so tone/label lookups go through typed accessors and
// the action cell recovers the typed row by id (pattern from
// tutor/products/index.vue).
function payoutStatusTone(status: AdminPayout['status']) {
  return PAYOUT_STATUS_TONE[status]
}
function payoutStatusLabel(status: AdminPayout['status']): string {
  return PAYOUT_STATUS_LABEL[status]
}
function findPayout(id: string): AdminPayout | undefined {
  return payouts.value.find(payout => payout.id === id)
}

/* --------------------------------------------------------------------------
 * Page-level notices — one slot under the header (design spec §3.4–3.5):
 * success banner, 409 warning, or the modal-less "Proses" failure. One at a
 * time; every new action clears the previous one.
 * ------------------------------------------------------------------------ */

const successMessage = ref('')
const conflictMessage = ref('')
const actionError = ref('')

function clearNotices() {
  successMessage.value = ''
  conflictMessage.value = ''
  actionError.value = ''
}

/** 409 = another admin decided first; the list refetch is the truth. */
const CONFLICT_NOTICE = 'Item ini baru saja diputuskan (mungkin oleh admin lain). Daftar dimuat ulang.'
const DECISION_FALLBACK = 'Keputusan belum berhasil disimpan. Coba lagi sebentar lagi.'

function isConflict(cause: unknown): boolean {
  return (cause as { statusCode?: number } | null)?.statusCode === 409
}

/** Refetch the list and drop the sidebar/overview counts after a decision. */
async function refreshAll() {
  await refresh()
  await refreshSummary()
}

/* --------------------------------------------------------------------------
 * Proses — requested → processing. No modal (design spec §3.3): reversible in
 * effect, so it fires directly with per-row busy state.
 * ------------------------------------------------------------------------ */

const busyId = ref('')

async function processPayout(payout: AdminPayout) {
  clearNotices()
  busyId.value = payout.id
  try {
    await decideAdminPayout(payout.id, { action: 'process' })
    successMessage.value = `Pencairan ${payout.tutor.name} sedang diproses — transfer dananya, lalu tandai ditransfer.`
    await refreshAll()
  }
  catch (cause) {
    if (isConflict(cause)) {
      conflictMessage.value = CONFLICT_NOTICE
      await refreshAll()
    }
    else {
      actionError.value = tutorApiMessage(cause, DECISION_FALLBACK)
    }
  }
  finally {
    busyId.value = ''
  }
}

/* --------------------------------------------------------------------------
 * Tandai ditransfer — processing → transferred, final. Confirm modal names
 * the amount and destination account so the admin verifies the right money
 * moved before asserting it.
 * ------------------------------------------------------------------------ */

const transferTarget = ref<AdminPayout | null>(null)
const transferBusy = ref(false)
const transferError = ref('')

function openTransfer(payout: AdminPayout) {
  clearNotices()
  transferError.value = ''
  transferTarget.value = payout
}

const transferDescription = computed(() => {
  const t = transferTarget.value
  if (!t) return ''
  return `${formatRupiah(t.amount)} ke ${t.bankAccount.bankLabel} · ${t.bankAccount.accountNumber} a.n. ${t.bankAccount.holderName}. Pastikan dana sudah berhasil ditransfer. Status ini bersifat final.`
})

async function confirmTransfer(reference: string) {
  const target = transferTarget.value
  if (!target) return

  transferError.value = ''
  transferBusy.value = true
  try {
    await decideAdminPayout(target.id, { action: 'transfer', reference })
    transferTarget.value = null
    successMessage.value = `Pencairan ${target.tutor.name} (${formatRupiah(target.amount)}) berhasil ditandai sudah ditransfer.`
    await refreshAll()
  }
  catch (cause) {
    if (isConflict(cause)) {
      transferTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refreshAll()
    }
    else {
      transferError.value = tutorApiMessage(cause, DECISION_FALLBACK)
    }
  }
  finally {
    transferBusy.value = false
  }
}

/* --------------------------------------------------------------------------
 * Tolak — legal dari requested dan processing; alasan wajib (server refuses
 * without it) karena alasan itulah yang tampil di riwayat pencairan tutor.
 * ------------------------------------------------------------------------ */

const rejectTarget = ref<AdminPayout | null>(null)
const rejectBusy = ref(false)
const rejectError = ref('')

function openReject(payout: AdminPayout) {
  clearNotices()
  rejectError.value = ''
  rejectTarget.value = payout
}

async function confirmReject(reason: string) {
  const target = rejectTarget.value
  if (!target) return

  rejectError.value = ''
  rejectBusy.value = true
  try {
    await decideAdminPayout(target.id, { action: 'reject', reason })
    rejectTarget.value = null
    successMessage.value = `Pencairan ${target.tutor.name} telah ditolak dan saldo telah dikembalikan ke akun tutor.`
    await refreshAll()
  }
  catch (cause) {
    if (isConflict(cause)) {
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
      title="Pencairan"
      description="Verifikasi dan kelola permohonan transfer pencairan penghasilan tutor."
    />

    <!-- :key remounts AppAlert per message — it hides itself internally after
         dismiss, so a fresh message needs a fresh instance. -->
    <AppAlert v-if="successMessage" :key="successMessage" variant="success" dismissible>
      {{ successMessage }}
    </AppAlert>
    <AppInlineMessage v-if="conflictMessage" type="warning">{{ conflictMessage }}</AppInlineMessage>
    <AppInlineMessage v-if="actionError" type="error">{{ actionError }}</AppInlineMessage>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="5" label="Memuat pencairan..." />

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
          search-id="admin-payouts-search"
          search-label="Cari pencairan"
          search-placeholder="Cari tutor, email, bank, atau nomor rekening…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="pencairan"
          :actionable-count="actionableCount"
          actionable-label="perlu tindakan"
          :active="isActive"
          @reset="reset"
        />

        <!-- Two empty states: an untouched toolbar over an empty table means
             the queue really is clear; anything else means the search or
             filter came up empty, and Reset is the way out. -->
        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Tidak ada pencairan yang menunggu"
          description="Permintaan pencairan baru dari tutor akan muncul di sini."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada pencairan yang cocok dengan pencarian atau filter yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="tutor" action-key="aksi">
          <template #cell(tutor)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.tutor.name }}</span>
            <span class="block text-[0.82rem] text-muted">{{ item.tutor.email }}</span>
          </template>

          <template #cell(bank)="{ item }">
            <span class="block tabular-nums">{{ item.bankAccount.bankLabel }} · {{ item.bankAccount.accountNumber }}</span>
            <span class="block text-[0.82rem] text-muted">a.n. {{ item.bankAccount.holderName }}</span>
          </template>

          <template #cell(amount)="{ value }">
            <span class="font-semibold tabular-nums">{{ formatRupiah(value) }}</span>
          </template>

          <template #cell(requestedAt)="{ value }">
            <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="payoutStatusTone(item.status)">
              {{ payoutStatusLabel(item.status) }}
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
                 `findPayout` as a template-scoped variable (see
                 tutor/products/index.vue for the pattern's rationale). -->
            <template v-for="payout in [findPayout(item.id)]" :key="item.id">
              <span
                v-if="payout && payout.status === 'requested'"
                class="inline-flex items-center gap-3 whitespace-nowrap"
              >
                <button
                  type="button"
                  class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                  :disabled="busyId === payout.id"
                  @click="processPayout(payout)"
                >
                  {{ busyId === payout.id ? 'Memproses…' : 'Proses' }}
                </button>
                <button
                  type="button"
                  class="text-[0.86rem] font-semibold text-danger hover:underline disabled:opacity-50"
                  :disabled="busyId === payout.id"
                  @click="openReject(payout)"
                >
                  Tolak…
                </button>
              </span>

              <span
                v-else-if="payout && payout.status === 'processing'"
                class="inline-flex items-center gap-3 whitespace-nowrap"
              >
                <button
                  type="button"
                  class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                  :disabled="busyId === payout.id"
                  @click="openTransfer(payout)"
                >
                  Tandai ditransfer
                </button>
                <button
                  type="button"
                  class="text-[0.86rem] font-semibold text-danger hover:underline disabled:opacity-50"
                  :disabled="busyId === payout.id"
                  @click="openReject(payout)"
                >
                  Tolak…
                </button>
              </span>

              <span v-else class="text-[0.86rem] text-muted">-</span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <!--
      Nomor referensi transfer wajib: server menolak menandai pencairan selesai
      tanpa itu, karena referensi itulah yang menghubungkan pencairan dengan
      transaksi bank yang membawanya saat direkonsiliasi berbulan-bulan
      kemudian.
    -->
    <AdminReasonModal
      :open="transferTarget !== null"
      title="Tandai sudah ditransfer?"
      :description="transferDescription"
      label="Nomor referensi transfer"
      placeholder="Mis. BCA/20260909/0012345"
      hint="Nomor transaksi dari mutasi bank."
      confirm-label="Tandai ditransfer"
      :busy="transferBusy"
      :error="transferError"
      @update:open="value => { if (!value) transferTarget = null }"
      @confirm="confirmTransfer"
    />

    <AdminReasonModal
      :open="rejectTarget !== null"
      title="Tolak pencairan ini?"
      description="Saldo tutor dikembalikan otomatis dan tutor melihat alasanmu di riwayat pencairannya."
      placeholder="Mis. nomor rekening tidak valid."
      hint="Saldo tutor dikembalikan otomatis saat pengajuan ditolak."
      confirm-label="Tolak pencairan"
      :busy="rejectBusy"
      :error="rejectError"
      @update:open="value => { if (!value) rejectTarget = null }"
      @confirm="confirmReject"
    />
  </div>
</template>
