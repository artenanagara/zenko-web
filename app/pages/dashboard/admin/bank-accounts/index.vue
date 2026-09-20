<script setup lang="ts">
import type { AdminBankAccount } from '#shared/types/admin-moderation'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Rekening bank › Pengajuan — antrean verifikasi rekening tutor (satu arah,
 * idempoten, admin_bank_accounts.go Verify). Satu tabel, satu dataset;
 * DashboardTableToolbar yang memfilter, persis pola
 * applications/products/payouts.
 *
 * Halaman saudaranya (Perubahan) menyetujui penggantian rekening, dan itu
 * ME-RESET verifikasi — barisnya mendarat kembali di sini. Kedua halaman
 * tidak berbagi state, jadi yang menjaga konsistensi adalah fetch di
 * onMounted: pindah menu ke sini selalu me-mount ulang dan menarik data baru.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Pengajuan Rekening | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Client-only fetch — the session cookie is HttpOnly on the API origin
// (see useAdminModeration).
const { data: accounts, pending, error, refresh } = useAdminBankAccounts()
const { refresh: refreshSummary } = useAdminSummary()

// Skeleton is for the first load only (design spec §3.6); the refetch after a
// verification keeps the stale table rendered until fresh data lands.
const loaded = ref(false)
onMounted(async () => {
  await refresh()
  loaded.value = true
})

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter status verifikasi, urutkan. Filter membuka di "Belum
 * diverifikasi", subset yang persis dipegang tab default dulu.
 *
 * Tidak ada sortir berbasis waktu di sini: baris rekening hanya menyimpan
 * `verifiedAt`, jadi urutannya berdasarkan nama.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'unverified', label: 'Belum diverifikasi' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'all', label: 'Semua status' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'tutor-asc', label: 'Nama tutor A–Z' },
  { value: 'tutor-desc', label: 'Nama tutor Z–A' },
  { value: 'newest', label: 'Terbaru diverifikasi' },
  { value: 'oldest', label: 'Terlama diverifikasi' },
  { value: 'bank-asc', label: 'Bank A–Z' },
]

/**
 * verifiedAt is the only timestamp a saved bank account carries, so "time"
 * here means when an admin verified it. Rows still waiting sink to the
 * bottom in both directions — they have no date to sort by, and an admin
 * looking for the newest verification does not want the unverified on top.
 */
function verifiedAtOf(account: AdminBankAccount): number {
  return account.verifiedAt ?? 0
}

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<AdminBankAccount>(() => accounts.value, {
  searchFields: account => [
    account.tutor.name,
    account.tutor.email,
    account.bankLabel,
    account.accountNumber,
    account.holderName,
  ],
  filters: {
    unverified: account => !account.verifiedAt,
    verified: account => Boolean(account.verifiedAt),
    all: () => true,
  },
  sorts: {
    'tutor-asc': (a, b) => a.tutor.name.localeCompare(b.tutor.name, 'id'),
    'tutor-desc': (a, b) => b.tutor.name.localeCompare(a.tutor.name, 'id'),
    'bank-asc': (a, b) => a.bankLabel.localeCompare(b.bankLabel, 'id'),
    newest: (a, b) => verifiedAtOf(b) - verifiedAtOf(a),
    oldest: (a, b) => {
      const left = verifiedAtOf(a)
      const right = verifiedAtOf(b)
      if (!left || !right) return (left ? 0 : 1) - (right ? 0 : 1)
      return left - right
    },
  },
  defaultFilter: 'unverified',
  defaultSort: 'tutor-asc',
})

// The count the old "Belum diverifikasi" tab pill carried; the sidebar and
// Ringkasan badges still carry it too.
const unverifiedCount = computed(() =>
  accounts.value.filter(account => !account.verifiedAt).length,
)

/* ---------------------------------------------------------------- table -- */

const columns = [
  { key: 'tutor', label: 'Tutor' },
  { key: 'bank', label: 'Rekening' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// DashboardTable's cell slots hand back `item` as Record<string, any>; typed rows
// are recovered by id and badge lookups go through typed accessors (pattern
// from tutor/products/index.vue).
function findAccount(accountId: string): AdminBankAccount | undefined {
  return accounts.value.find(account => account.accountId === accountId)
}
function verificationTone(verifiedAt: number | null | undefined) {
  return BANK_VERIFICATION_TONE[bankVerificationState(verifiedAt)]
}
function verificationLabel(verifiedAt: number | null | undefined): string {
  return BANK_VERIFICATION_LABEL[bankVerificationState(verifiedAt)]
}

/* --------------------------------------------------------------------------
 * Page-level notice — one slot under the header (design spec §3.4–3.5).
 * ------------------------------------------------------------------------ */

const successMessage = ref('')

const DECISION_FALLBACK = 'Keputusan belum berhasil disimpan. Coba lagi sebentar lagi.'

/* --------------------------------------------------------------------------
 * Verifikasi — lewat AdminConfirmModal: tidak bisa dibatalkan.
 * ------------------------------------------------------------------------ */

const verifyTarget = ref<AdminBankAccount | null>(null)
const verifyBusy = ref(false)
const verifyError = ref('')

function openVerify(account: AdminBankAccount) {
  successMessage.value = ''
  verifyError.value = ''
  verifyTarget.value = account
}

const verifyDescription = computed(() => {
  const t = verifyTarget.value
  if (!t) return ''
  return `Pastikan nama pemilik ${t.holderName} sudah dicocokkan dengan rekening ${t.bankLabel} · ${t.accountNumber}. Verifikasi tidak bisa dibatalkan.`
})

async function confirmVerify() {
  const target = verifyTarget.value
  if (!target) return

  verifyError.value = ''
  verifyBusy.value = true
  try {
    await verifyAdminBankAccount(target.accountId)
    verifyTarget.value = null
    successMessage.value = `Rekening ${target.bankLabel} milik ${target.tutor.name} terverifikasi.`
    await refresh()
    await refreshSummary()
  }
  catch (cause) {
    verifyError.value = tutorApiMessage(cause, DECISION_FALLBACK)
  }
  finally {
    verifyBusy.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Pengajuan rekening"
      description="Verifikasi rekening bank tutor sebelum pencairan dana dikirim ke sana."
    />

    <!-- :key remounts AppAlert per message — it hides itself internally after
         dismiss, so a fresh message needs a fresh instance. -->
    <AppAlert v-if="successMessage" :key="successMessage" variant="success" dismissible>
      {{ successMessage }}
    </AppAlert>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="4" label="Memuat rekening..." />

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
          search-id="admin-bank-accounts-search"
          search-label="Cari rekening"
          search-placeholder="Cari tutor, email, bank, atau nomor rekening…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="rekening"
          :actionable-count="unverifiedCount"
          actionable-label="belum diverifikasi"
          :active="isActive"
          @reset="reset"
        />

        <!-- Two empty states: an untouched toolbar over an empty table means
             the queue really is clear; anything else means the search or
             filter came up empty, and Reset is the way out. -->
        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Semua rekening sudah diverifikasi"
          description="Rekening baru dari tutor akan muncul di sini untuk diverifikasi."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada rekening yang cocok dengan pencarian atau filter yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="tutor" action-key="aksi">
          <template #cell(tutor)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.tutor.name }}</span>
            <span class="block text-[0.82rem] text-muted">{{ item.tutor.email }}</span>
          </template>

          <template #cell(bank)="{ item }">
            <span class="block tabular-nums">{{ item.bankLabel }} · {{ item.accountNumber }}</span>
            <span class="block text-[0.82rem] text-muted">a.n. {{ item.holderName }}</span>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="verificationTone(item.verifiedAt)">
              {{ verificationLabel(item.verifiedAt) }}
            </DashboardBadge>
          </template>

          <template #cell(aksi)="{ item }">
            <!-- v-for over a one-item array recovers the typed row from
                 `findAccount` as a template-scoped variable (see
                 tutor/products/index.vue for the pattern's rationale). -->
            <template v-for="account in [findAccount(item.accountId)]" :key="item.accountId">
              <AppIconButton
                v-if="account && !account.verifiedAt"
                variant="ghost"
                size="sm"
                @click="openVerify(account)"
                aria-label="Verifikasi rekening"
                ariaLabel="Verifikasi rekening"
                title="Verifikasi rekening"
              ><AppIcon name="check-circle" :size="17" aria-hidden="true" /></AppIconButton>
              <span v-else class="text-[0.86rem] text-muted">-</span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <AdminConfirmModal
      :open="verifyTarget !== null"
      title="Verifikasi rekening ini?"
      :description="verifyDescription"
      confirm-label="Verifikasi rekening"
      confirm-variant="primary"
      :busy="verifyBusy"
      :error="verifyError"
      @update:open="value => { if (!value) verifyTarget = null }"
      @confirm="confirmVerify"
    />
  </div>
</template>
