import type {
  BankAccount,
  PayoutStatus,
  ShareStatus,
  TutorBalance,
  TutorPayout,
  TutorSale,
  TutorSalesSummary,
  TutorSalesResponse,
} from '#shared/types/tutor-earnings'

/**
 * Penghasilan tutor: riwayat penjualan, saldo, rekening bank, dan pencairan.
 *
 * Mirrors docs/tutor-flow-contract.md. Everything under /tutor/* carries the
 * session cookie and follows the client-only pattern of useTutorProducts:
 * the cookie is HttpOnly on the API origin, so asking during SSR would always
 * answer "none" and then contradict itself on hydration. Call `refresh()`
 * from onMounted.
 */

export interface TutorSalesQuery {
  /** Unix seconds, inklusif. */
  from?: number
  to?: number
  productId?: string
}

/** GET /tutor/sales — summary + rows; server melakukan filter via query. */
export function useTutorSales() {
  const { public: config } = useRuntimeConfig()

  const summary = ref<TutorSalesSummary>({ count: 0, gross: 0, share: 0 })
  const sales = ref<TutorSale[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh(query: TutorSalesQuery = {}) {
    pending.value = true
    error.value = ''
    try {
      // $fetch drops undefined query values, so an empty filter sends none.
      const response = await $fetch<TutorSalesResponse>('/tutor/sales', {
        baseURL: config.apiBase,
        credentials: 'include',
        query,
      })
      summary.value = response.summary
      sales.value = response.sales
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat riwayat penjualan.')
    }
    finally {
      pending.value = false
    }
  }

  return { summary, sales, pending, error, refresh }
}

/** GET /tutor/balance — agregat ledger. */
export function useTutorBalance() {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorBalance>({ available: 0, held: 0, totalPaidOut: 0 })
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<TutorBalance>('/tutor/balance', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat saldo.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/**
 * GET /tutor/bank-account. 404 is the ordinary "belum ada rekening" answer,
 * so it resolves to null rather than an error (mirrors useMyTutorApplication).
 */
export function useTutorBankAccount() {
  const { public: config } = useRuntimeConfig()

  const data = ref<BankAccount | null>(null)
  const pending = ref(false)

  async function refresh() {
    pending.value = true
    try {
      data.value = await $fetch<BankAccount>('/tutor/bank-account', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch {
      data.value = null
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, refresh }
}

/** PUT /tutor/bank-account — simpan/ubah. Throws on any non-2xx. */
export async function saveTutorBankAccount(account: BankAccount): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch('/tutor/bank-account', {
    baseURL: config.apiBase,
    method: 'PUT',
    body: account,
    credentials: 'include',
  })
}

/** GET /tutor/payouts — riwayat pencairan, terbaru di atas. */
export function useTutorPayouts() {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorPayout[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<TutorPayout[]>('/tutor/payouts', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat riwayat pencairan.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** POST /tutor/payouts — ≥ Rp50.000, ≤ saldo tersedia, rekening harus ada. */
export async function requestTutorPayout(amount: number): Promise<TutorPayout> {
  const { public: config } = useRuntimeConfig()

  return await $fetch<TutorPayout>('/tutor/payouts', {
    baseURL: config.apiBase,
    method: 'POST',
    body: { amount },
    credentials: 'include',
  })
}

/* --------------------------------------------------------------------------
 * Constants & UI labels — one place, so a status never renders as its wire
 * value and both dashboards agree on the same words.
 * ------------------------------------------------------------------------ */

/** Minimum pencairan per kontrak. */
export const PAYOUT_MINIMUM = 50_000

/**
 * Bank umum Indonesia untuk pilihan rekening. The contract stores
 * bankCode + bankLabel verbatim, so this list only has to cover the common
 * choices — extending it later breaks nothing.
 */
export const BANK_OPTIONS: { code: string, label: string }[] = [
  { code: 'bca', label: 'BCA' },
  { code: 'bri', label: 'BRI' },
  { code: 'bni', label: 'BNI' },
  { code: 'mandiri', label: 'Bank Mandiri' },
  { code: 'bsi', label: 'Bank Syariah Indonesia (BSI)' },
  { code: 'btn', label: 'BTN' },
  { code: 'cimb', label: 'CIMB Niaga' },
  { code: 'permata', label: 'PermataBank' },
  { code: 'danamon', label: 'Bank Danamon' },
  { code: 'ocbc', label: 'OCBC Indonesia' },
  { code: 'jago', label: 'Bank Jago' },
  { code: 'seabank', label: 'SeaBank' },
]

type BadgeTone = 'neutral' | 'success' | 'warning' | 'brand' | 'danger'

export const SHARE_STATUS_LABEL: Record<ShareStatus, string> = {
  held: 'Tertahan',
  available: 'Tersedia',
  paid_out: 'Dicairkan',
}

export const SHARE_STATUS_TONE: Record<ShareStatus, BadgeTone> = {
  held: 'warning',
  available: 'success',
  paid_out: 'neutral',
}

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  requested: 'Diajukan',
  processing: 'Diproses',
  transferred: 'Ditransfer',
  rejected: 'Ditolak',
}

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, BadgeTone> = {
  requested: 'warning',
  processing: 'brand',
  transferred: 'success',
  rejected: 'danger',
}
