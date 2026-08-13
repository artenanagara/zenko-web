<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Pencairan — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: balance, pending: balancePending, error: balanceError, refresh: refreshBalance } = useTutorBalance()
const { data: bankAccount, pending: bankPending, refresh: refreshBankAccount } = useTutorBankAccount()
const { data: payouts, pending: payoutsPending, error: payoutsError, refresh: refreshPayouts } = useTutorPayouts()

// Client-only fetches: the session cookie never reaches the Nuxt server, so
// everything resolves after hydration (see useTutorEarnings).
onMounted(() => {
  refreshBalance()
  refreshBankAccount()
  refreshPayouts()
})

const stats = computed(() => [
  { label: 'Saldo tersedia', value: formatRupiah(balance.value.available), hint: 'Bisa diajukan untuk dicairkan.' },
  { label: 'Tertahan', value: formatRupiah(balance.value.held), hint: 'Cair otomatis 7 hari setelah pembayaran.' },
  { label: 'Total dicairkan', value: formatRupiah(balance.value.totalPaidOut), hint: 'Sepanjang waktu.' },
])

/* --------------------------------------------------------------------------
 * Rekening bank — GET menampilkan yang tersimpan, PUT menyimpan.
 * ------------------------------------------------------------------------ */

const bankForm = reactive({ bankCode: '', accountNumber: '', holderName: '' })
const bankSaving = ref(false)
const bankError = ref('')
const bankSaved = ref(false)

// Isi form begitu rekening tersimpan tiba (fetch resolves after mount).
watch(bankAccount, (account) => {
  if (!account) return
  bankForm.bankCode = account.bankCode
  bankForm.accountNumber = account.accountNumber
  bankForm.holderName = account.holderName
})

const bankFormValid = computed(() =>
  bankForm.bankCode !== ''
  && bankForm.accountNumber.trim() !== ''
  && bankForm.holderName.trim() !== '',
)

async function saveBankAccount() {
  bankError.value = ''
  bankSaved.value = false

  const bank = BANK_OPTIONS.find(option => option.code === bankForm.bankCode)
  if (!bank) {
    bankError.value = 'Pilih bank terlebih dahulu.'
    return
  }

  bankSaving.value = true
  try {
    await saveTutorBankAccount({
      bankCode: bank.code,
      bankLabel: bank.label,
      accountNumber: bankForm.accountNumber.trim(),
      holderName: bankForm.holderName.trim(),
    })
    bankSaved.value = true
    await refreshBankAccount()
  }
  catch (cause) {
    bankError.value = tutorApiMessage(cause, 'Gagal menyimpan rekening. Coba lagi sebentar lagi.')
  }
  finally {
    bankSaving.value = false
  }
}

/* --------------------------------------------------------------------------
 * Ajukan pencairan — minimum Rp100.000, maksimum saldo tersedia, dan rekening
 * harus sudah tersimpan. The server re-validates all three.
 * ------------------------------------------------------------------------ */

const amount = ref<number | ''>('')
const payoutSubmitting = ref(false)
const payoutError = ref('')
const payoutSuccess = ref('')

const amountError = computed(() => {
  if (amount.value === '') return ''
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
  && amount.value !== ''
  && amountError.value === ''
  && !payoutSubmitting.value,
)

async function submitPayout() {
  if (!canRequestPayout.value || amount.value === '') return

  payoutError.value = ''
  payoutSuccess.value = ''
  payoutSubmitting.value = true
  try {
    await requestTutorPayout(amount.value)
    payoutSuccess.value = 'Pengajuan pencairan terkirim. Kami memprosesnya dalam 1–3 hari kerja.'
    amount.value = ''
    await Promise.all([refreshBalance(), refreshPayouts()])
  }
  catch (cause) {
    payoutError.value = tutorApiMessage(cause, 'Gagal mengajukan pencairan. Coba lagi sebentar lagi.')
  }
  finally {
    payoutSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Pencairan</h1>
      <p class="mt-1.5 text-muted">
        Saldo penghasilanmu, rekening tujuan, dan riwayat pencairan.
      </p>
    </header>

    <p
      v-if="balanceError"
      role="alert"
      class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
    >
      {{ balanceError }}
    </p>

    <DashboardSkeleton v-if="balancePending" variant="stats" :count="3" :columns="3" label="Memuat saldo..." />
    <DashboardStats v-else :items="stats" :columns="3" />

    <div class="grid gap-6 xl:grid-cols-2">
      <DashboardPanel
        id="rekening"
        title="Rekening bank"
        description="Tujuan transfer pencairan. Pastikan nama pemilik sesuai buku tabungan."
      >
        <DashboardSkeleton v-if="bankPending" :count="3" label="Memuat rekening..." />

        <form v-else class="grid gap-5" @submit.prevent="saveBankAccount">
          <div>
            <label for="bank-code" :class="FIELD_LABEL_CLASS">Bank</label>
            <select id="bank-code" v-model="bankForm.bankCode" :class="FIELD_CLASS" required>
              <option value="" disabled>Pilih bank</option>
              <option v-for="option in BANK_OPTIONS" :key="option.code" :value="option.code">
                {{ option.label }}
              </option>
            </select>
          </div>

          <FormField
            id="bank-account-number"
            v-model="bankForm.accountNumber"
            label="Nomor rekening"
            type="tel"
            placeholder="1234567890"
            autocomplete="off"
          />

          <FormField
            id="bank-holder-name"
            v-model="bankForm.holderName"
            label="Nama pemilik rekening"
            placeholder="Sesuai buku tabungan"
            autocomplete="name"
          />

          <p v-if="bankError" role="alert" class="text-[0.82rem] text-red-600">{{ bankError }}</p>
          <p v-else-if="bankSaved" role="status" class="text-[0.82rem] font-semibold text-success-ink">
            Rekening tersimpan.
          </p>

          <div>
            <AppButton type="submit" size="sm" :disabled="!bankFormValid || bankSaving">
              {{ bankSaving ? 'Menyimpan...' : bankAccount ? 'Perbarui rekening' : 'Simpan rekening' }}
            </AppButton>
          </div>
        </form>
      </DashboardPanel>

      <DashboardPanel
        id="ajukan"
        title="Ajukan pencairan"
        :description="`Minimum ${formatRupiah(PAYOUT_MINIMUM)}. Saldo tersedia berkurang begitu pengajuan dibuat.`"
      >
        <!-- No bank account yet: explain instead of a silently dead form. -->
        <p
          v-if="!bankPending && !bankAccount"
          class="mb-5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
        >
          Simpan rekening bank terlebih dahulu — pencairan butuh rekening tujuan
          transfer.
        </p>

        <form class="grid gap-5" @submit.prevent="submitPayout">
          <div>
            <label for="payout-amount" :class="FIELD_LABEL_CLASS">Nominal (Rp)</label>
            <input
              id="payout-amount"
              v-model.number="amount"
              type="number"
              :min="PAYOUT_MINIMUM"
              step="1000"
              placeholder="100000"
              :class="FIELD_CLASS"
              :disabled="!bankAccount"
              :aria-invalid="Boolean(amountError)"
              :aria-describedby="amountError ? 'payout-amount-error' : undefined"
            >
            <p v-if="amountError" id="payout-amount-error" class="mt-2 text-[0.82rem] text-red-600">
              {{ amountError }}
            </p>
            <p v-else class="mt-2 text-[0.82rem] text-muted">
              Saldo tersedia: {{ formatRupiah(balance.available) }}
            </p>
          </div>

          <p v-if="payoutError" role="alert" class="text-[0.82rem] text-red-600">{{ payoutError }}</p>
          <p v-else-if="payoutSuccess" role="status" class="text-[0.82rem] font-semibold text-success-ink">
            {{ payoutSuccess }}
          </p>

          <div>
            <AppButton type="submit" size="sm" :disabled="!canRequestPayout">
              {{ payoutSubmitting ? 'Mengajukan...' : 'Ajukan pencairan' }}
            </AppButton>
          </div>
        </form>
      </DashboardPanel>
    </div>

    <DashboardPanel
      id="riwayat"
      title="Riwayat pencairan"
      description="Terbaru di atas. Pencairan ditolak dikembalikan ke saldo tersedia."
    >
      <DashboardSkeleton v-if="payoutsPending" :count="4" label="Memuat riwayat pencairan..." />

      <div v-else-if="payoutsError" class="py-6 text-center">
        <p class="text-muted">{{ payoutsError }}</p>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refreshPayouts">
          Coba lagi
        </button>
      </div>

      <p v-else-if="payouts.length === 0" class="py-6 text-center text-muted">
        Belum ada pencairan. Ajukan yang pertama begitu saldo tersediamu mencapai
        {{ formatRupiah(PAYOUT_MINIMUM) }}.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-140 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Diajukan</th>
              <th class="pb-3 font-bold">Nominal</th>
              <th class="pb-3 font-bold">Status</th>
              <th class="pb-3 font-bold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payout in payouts" :key="payout.id" class="border-t border-hairline align-top">
              <td class="py-3.5 pr-4 text-[0.9rem] whitespace-nowrap text-muted">
                {{ formatDate(payout.requestedAt) }}
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] font-semibold tabular-nums">
                {{ formatRupiah(payout.amount) }}
              </td>
              <td class="py-3.5 pr-4">
                <DashboardBadge :tone="PAYOUT_STATUS_TONE[payout.status]">
                  {{ PAYOUT_STATUS_LABEL[payout.status] }}
                </DashboardBadge>
              </td>
              <td class="max-w-80 py-3.5 text-[0.86rem] text-muted">
                <template v-if="payout.status === 'rejected' && payout.rejectReason">
                  {{ payout.rejectReason }}
                </template>
                <template v-else-if="payout.processedAt">
                  Diproses {{ formatDate(payout.processedAt) }}
                </template>
                <template v-else>—</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  </div>
</template>
