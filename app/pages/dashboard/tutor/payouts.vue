<script setup lang="ts">
import type { TutorPayout } from '#shared/types/tutor-earnings'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Pencairan Dana | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: balance, pending: balancePending, error: balanceError, refresh: refreshBalance } = useTutorBalance()
// Read-only here — editing moved to /dashboard/tutor/settings. Still needed
// for the last-4 reference on the card and to gate the payout modal.
const { data: bankAccount, pending: bankPending, refresh: refreshBankAccount } = useTutorBankAccount()
const { data: payouts, pending: payoutsPending, error: payoutsError, refresh: refreshPayouts } = useTutorPayouts()
const { user } = useAuth()

// Client-only fetches: the session cookie never reaches the Nuxt server, so
// everything resolves after hydration (see useTutorEarnings).
onMounted(() => {
  refreshBalance()
  refreshBankAccount()
  refreshPayouts()
})

const tutorName = computed(() => user.value?.name.trim() || 'Tutor')

const payoutColumns = [
  { key: 'requestedAt', label: 'Diajukan' },
  { key: 'amount', label: 'Nominal' },
  { key: 'status', label: 'Status' },
  { key: 'keterangan', label: 'Keterangan' },
]

// DashboardTable's cell slots hand back `item` as Record<string, any> (it isn't a
// generic component), so the tone/label lookup goes through this typed
// accessor instead of indexing the `any` value directly.
function payoutStatusTone(status: TutorPayout['status']) {
  return PAYOUT_STATUS_TONE[status]
}
function payoutStatusLabel(status: TutorPayout['status']): string {
  return PAYOUT_STATUS_LABEL[status]
}

// Account-number-visibility toggle on the card — masks the reference for
// shoulder-surfing privacy, reveals the full account number on demand.
// Local-only, no need to persist across visits.
const accountNumberRevealed = ref(false)

// Last 4 digits of the saved bank account, shown as a reference on the
// balance card — never a card number. Nothing to show until a bank account
// is on file.
const bankAccountLast4 = computed(() => {
  const digits = bankAccount.value?.accountNumber.trim() ?? ''
  return digits.length >= 4 ? digits.slice(-4) : null
})

/* --------------------------------------------------------------------------
 * Ajukan pencairan — minimum Rp100.000, maksimum saldo tersedia, dan rekening
 * harus sudah tersimpan. The server re-validates all three. Lives in
 * PayoutModal now; this page just owns the state and the request.
 * ------------------------------------------------------------------------ */

const payoutModalOpen = ref(false)
const amount = ref<number | null>(null)
const payoutSubmitting = ref(false)
const toast = useToast()

function openPayoutModal() {
  amount.value = null
  payoutModalOpen.value = true
}

const amountError = computed(() => {
  if (amount.value === null) return ''
  if (amount.value < PAYOUT_MINIMUM) {
    return `Minimum pencairan ${formatRupiah(PAYOUT_MINIMUM)}.`
  }
  if (amount.value > balance.value.available) {
    return `Melebihi saldo tersedia (${formatRupiah(balance.value.available)}).`
  }
  return ''
})

const canRequestPayout = computed(() =>
  bankAccount.value !== null
  && amount.value !== null
  && amountError.value === ''
  && !payoutSubmitting.value,
)

async function submitPayout() {
  if (!canRequestPayout.value || amount.value === null) return

  payoutSubmitting.value = true
  try {
    await requestTutorPayout(amount.value)
    amount.value = null
    // Closes straight away now the confirmation is a toast: the old code held
    // the dialog open for 1.4s so an inline message had time to be read, which
    // only delayed the balance card and history table already updating behind it.
    payoutModalOpen.value = false
    toast.success(
      'Pengajuan pencairan terkirim.',
      'Tim kami memproses transfernya dalam 1 sampai 3 hari kerja.',
    )
    await Promise.all([refreshBalance(), refreshPayouts()])
  }
  catch (cause) {
    toast.error('Gagal mengajukan pencairan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    payoutSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Pencairan"
      description="Pantau saldo penghasilan, rekening tujuan pencairan, dan riwayat penarikan dana."
    />

    <AppInlineMessage v-if="balanceError" type="error">{{ balanceError }}</AppInlineMessage>

    <div v-if="balancePending" class="flex flex-col gap-4 md:flex-row md:items-stretch" role="status">
      <span class="sr-only">Memuat saldo...</span>
      <!-- Sized wrapper + AppSkeleton filling it: AppSkeleton's own default
           size classes can't be reliably overridden by trailing utility
           classes (this app has no tailwind-merge), so the wrapper owns the
           exact dimensions and the skeleton just fills it. -->
      <div class="w-full rounded-xl md:flex-1" style="min-height: 17rem;" aria-hidden="true">
        <AppSkeleton type="rect" className="h-full! w-full! rounded-xl!" />
      </div>
      <div class="min-h-32 flex-1" aria-hidden="true">
        <AppSkeleton type="rect" className="h-full! w-full! rounded-lg!" />
      </div>
    </div>

    <div v-else class="flex flex-col gap-4 md:flex-row md:items-stretch">
      <!-- Balance-card banner. Earlier draft used a debit-card-style chip +
           texture; this reads better against the dashboard's flat surfaces and
           matches the "merchant balance" pattern (brand gradient + panel-inset
           3D depth per the Zenko style guide's CTA Depth Treatment, subtle
           decorative rings, one primary action). -->
      <div
        class="panel-inset relative flex w-full flex-col gap-6 overflow-hidden rounded-xl bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-6 py-7 text-white min-h-68 md:flex-1"
      >
        <!-- Decorative rings: subtle, concentric, bleeding off the right edge. -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 right-0 h-72 w-72 -translate-y-1/2 translate-x-1/3 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 right-0 h-44 w-44 -translate-y-1/2 translate-x-1/4 rounded-full border border-white/10"
        />

        <p class="relative w-fit text-[0.76rem] font-bold tracking-[0.12em] text-white/75 uppercase">
          Saldo siap dicairkan
        </p>

        <p class="relative text-[2.75rem] leading-none font-extrabold tracking-[-0.045em] tabular-nums">
          {{ formatRupiah(balance.available) }}
        </p>

        <div class="relative flex items-center justify-between gap-3">
          <p class="truncate text-[0.9rem] font-semibold tracking-[-0.02em]">{{ tutorName }}</p>
          <button
            v-if="bankAccountLast4"
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-xs text-[0.82rem] tracking-[0.08em] text-white/75 tabular-nums transition-colors hover:text-white focus-visible:text-white focus-visible:outline-white"
            :aria-pressed="accountNumberRevealed"
            :aria-label="accountNumberRevealed ? 'Sembunyikan nomor rekening' : 'Tampilkan nomor rekening'"
            @click="accountNumberRevealed = !accountNumberRevealed"
          >
            {{ accountNumberRevealed ? (bankAccount?.accountNumber ?? '') : `•••• ${bankAccountLast4}` }}
            <IconEye :off="accountNumberRevealed" class="h-4 w-4 shrink-0" />
          </button>
        </div>

        <AppButton
          type="button"
          variant="light"
          class="relative mt-1 w-full rounded-pill"
          @click="openPayoutModal"
        >
          <IconWallet class="mr-2 h-4.5 w-4.5 shrink-0" />
          Tarik Saldo
        </AppButton>
      </div>

      <div class="flex flex-1 flex-col gap-4">
        <div class="flex flex-1 flex-col justify-between rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs">
          <AppMetricText :value="formatRupiah(balance.totalPaidOut)" label="Total berhasil dicairkan" />
          <p class="mt-2 text-[0.78rem] text-muted">Akumulasi dana yang telah masuk ke rekeningmu.</p>
        </div>

        <!-- Held balance now lives here as its own matrix card, same white
             surface as "Total dicairkan" — kept visually consistent per the
             matrix, not singled out. -->
        <div class="flex flex-1 flex-col justify-between rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs">
          <AppMetricText :value="formatRupiah(balance.held)" label="Saldo tertahan" />
          <p class="mt-2 text-[0.78rem] text-muted">Siap dicairkan 7 hari setelah transaksi terverifikasi.</p>
        </div>
      </div>
    </div>

    <!-- Bank account is read-only here now — editing lives in Settings. -->
    <p v-if="!bankPending" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.86rem] text-muted">
      <template v-if="bankAccount">
        <span>
          Rekening: <span class="font-semibold text-ink">{{ bankAccount.bankLabel }} •••• {{ bankAccountLast4 }}</span>
        </span>
        <span>·</span>
        <NuxtLink to="/dashboard/tutor/settings#rekening" class="font-semibold text-primary hover:underline">
          Kelola rekening di Pengaturan
        </NuxtLink>
      </template>
      <template v-else>
        <span>Belum ada rekening bank yang tersimpan.</span>
        <NuxtLink to="/dashboard/tutor/settings#rekening" class="font-semibold text-primary hover:underline">
          Tambahkan rekening di Pengaturan
        </NuxtLink>
      </template>
    </p>

    <PayoutModal
      v-model:open="payoutModalOpen"
      v-model:amount="amount"
      :has-bank-account="bankAccount !== null"
      :available-balance="balance.available"
      :minimum="PAYOUT_MINIMUM"
      :amount-error="amountError"
      :submitting="payoutSubmitting"
      :can-submit="canRequestPayout"
      @submit="submitPayout"
    />

    <DashboardPanel
      id="riwayat"
      title="Riwayat pencairan"
      description="Daftar pengajuan pencairan dana. Pengajuan yang belum disetujui akan otomatis dikembalikan ke saldo aktifmu."
    >
      <DashboardSkeleton v-if="payoutsPending" :count="4" label="Memuat riwayat pencairan..." />

      <div v-else-if="payoutsError" class="py-6 text-center">
        <AppInlineMessage type="error">{{ payoutsError }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refreshPayouts">
          Coba lagi
        </button>
      </div>

      <p v-else-if="payouts.length === 0" class="py-6 text-center text-muted">
        Belum ada riwayat penarikan dana. Kamu dapat mengajukan pencairan setelah saldo aktif mencapai minimum
        {{ formatRupiah(PAYOUT_MINIMUM) }}.
      </p>

      <DashboardTable v-else :columns="payoutColumns" :data="payouts" primary-key="amount">
        <template #cell(requestedAt)="{ value }">
          <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
        </template>
        <template #cell(amount)="{ value }">
          <span class="font-semibold tabular-nums">{{ formatRupiah(value) }}</span>
        </template>
        <template #cell(status)="{ item }">
          <DashboardBadge :tone="payoutStatusTone(item.status)">
            {{ payoutStatusLabel(item.status) }}
          </DashboardBadge>
        </template>
        <template #cell(keterangan)="{ item }">
          <template v-if="item.status === 'rejected' && item.rejectReason">
            {{ item.rejectReason }}
          </template>
          <template v-else-if="item.processedAt">
            Selesai diproses pada {{ formatDate(item.processedAt) }}
          </template>
          <template v-else>Menunggu proses</template>
        </template>
      </DashboardTable>
    </DashboardPanel>
  </div>
</template>
