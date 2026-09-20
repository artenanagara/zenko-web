import type {
  AdminBankAccount,
  AdminBankAccountChangeRequest,
  AdminPayout,
  AdminProductDetail,
  AdminProductSummary,
  AdminPaymentProof,
  AdminSummary,
  BankAccountChangeDecisionRequest,
  PaymentProofDecisionRequest,
  PayoutDecisionRequest,
  ProductDecisionRequest,
} from '#shared/types/admin-moderation'
import type { ApplicationStatus } from '#shared/types/tutor-application'

/**
 * Panel admin: antrean moderasi produk dan antrean pencairan.
 *
 * Mirrors the /admin/* section of docs/tutor-flow-contract.md. Same
 * client-only pattern as useTutorProducts — the session cookie is HttpOnly on
 * the API origin, so these resolve after hydration. Call `refresh()` from
 * onMounted; the API answers 403 for any non-admin.
 */

/** GET /admin/products?status=review — antrean moderasi (default review). */
export function useAdminProductQueue() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminProductSummary[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminProductSummary[]>('/admin/products', {
        baseURL: config.apiBase,
        credentials: 'include',
        query: { status: 'review' },
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Antrean moderasi belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** GET /admin/products/:id — detail penuh, bentuk sama dengan detail tutor. */
export async function fetchAdminProduct(id: string): Promise<AdminProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<AdminProductDetail>(`/admin/products/${id}`, {
    baseURL: config.apiBase,
    credentials: 'include',
  })
}

/** POST /admin/products/:id/decision — approve → live, reject wajib reason. */
export async function decideAdminProduct(id: string, decision: ProductDecisionRequest): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`/admin/products/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
}

/** Admin-only destructive actions; the API also requires confirmation `HAPUS`. */
export async function deleteAdminStudent(id: string, confirmation = 'HAPUS'): Promise<void> {
  await deleteAdminResource(`/admin/students/${id}`, confirmation)
}

export async function deleteAdminTutor(id: string, confirmation = 'HAPUS'): Promise<void> {
  await deleteAdminResource(`/admin/tutors/${id}`, confirmation)
}

export async function deleteAdminProduct(id: string, confirmation = 'HAPUS'): Promise<void> {
  await deleteAdminResource(`/admin/products/${id}`, confirmation)
}

export async function deleteAdminBimbel(id: string, confirmation = 'HAPUS'): Promise<void> {
  await deleteAdminResource(`/admin/bimbels/${id}`, confirmation)
}

async function deleteAdminResource(path: string, confirmation: string): Promise<void> {
  const { public: config } = useRuntimeConfig()
  await useApiFetch(path, { baseURL: config.apiBase, method: 'DELETE', body: { confirmation }, credentials: 'include' })
}

/**
 * GET /admin/payouts — antrean pencairan. Dipanggil tanpa `status` sehingga
 * server mengembalikan semuanya; halaman memilah mana yang masih butuh aksi.
 */
export function useAdminPayoutQueue() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminPayout[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminPayout[]>('/admin/payouts', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Antrean pencairan belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** POST /admin/payouts/:id/decision — process/transfer/reject (+reason). */
export async function decideAdminPayout(id: string, decision: PayoutDecisionRequest): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`/admin/payouts/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
}

/**
 * GET /admin/payment-proofs — antrean bukti transfer QRIS manual.
 *
 * Satu fetch tanpa parameter status: halamannya sendiri yang memisahkan
 * antrean dari riwayat, sama seperti cara antrean pencairan dipanggil.
 */
export function useAdminPaymentProofs() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminPaymentProof[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminPaymentProof[]>('/admin/payment-proofs', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Antrean verifikasi pembayaran belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** POST /admin/payment-proofs/:id/decision — approve (+reference) atau reject (+reason). */
export async function decideAdminPaymentProof(
  id: string,
  decision: PaymentProofDecisionRequest,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`/admin/payment-proofs/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
}

/**
 * URL gambar bukti transfer. Bukan berkas statis: rute ini memeriksa sesi dan
 * peran admin, karena bukti transfer memuat nama dan nominal.
 */
export function adminPaymentProofImageUrl(id: string): string {
  const { public: config } = useRuntimeConfig()
  return `${config.apiBase}/admin/payment-proofs/${id}/image`
}

/** GET /admin/bank-accounts — rekening bank tersimpan tiap tutor, untuk verifikasi manual. */
export function useAdminBankAccounts() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminBankAccount[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminBankAccount[]>('/admin/bank-accounts', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Daftar rekening bank belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** POST /admin/bank-accounts/:accountId/verify — idempotent, tanpa body. */
export async function verifyAdminBankAccount(accountId: string): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`/admin/bank-accounts/${accountId}/verify`, {
    baseURL: config.apiBase,
    method: 'POST',
    credentials: 'include',
  })
}

/**
 * GET /admin/bank-account-change-requests?status=pending — dipanggil dengan
 * status=pending sehingga halaman langsung menampilkan yang butuh keputusan,
 * sama seperti antrean moderasi produk.
 */
export function useAdminBankAccountChangeRequests() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminBankAccountChangeRequest[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminBankAccountChangeRequest[]>('/admin/bank-account-change-requests', {
        baseURL: config.apiBase,
        credentials: 'include',
        query: { status: 'pending' },
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Pengajuan perubahan rekening belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** POST /admin/bank-account-change-requests/:id/decision — reason wajib saat reject. */
export async function decideAdminBankAccountChange(id: string, decision: BankAccountChangeDecisionRequest): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`/admin/bank-account-change-requests/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
}

/**
 * GET /admin/summary — lima jumlah antrean untuk badge sidebar dan kartu
 * Ringkasan. useState-backed so the dashboard layout and the overview page
 * share one fetch instead of firing twice; `refresh()` no-ops while a call is
 * already in flight for the same reason. Failure is graceful: `data` stays
 * null (badges simply hide) and `error` carries the message for the pages
 * that want to say something.
 */
export function useAdminSummary() {
  const { public: config } = useRuntimeConfig()

  const data = useState<AdminSummary | null>('admin-summary', () => null)
  const pending = useState<boolean>('admin-summary-pending', () => false)
  const error = useState<string>('admin-summary-error', () => '')

  async function refresh() {
    if (pending.value) return
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminSummary>('/admin/summary', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Jumlah antrean belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/* --------------------------------------------------------------------------
 * UI labels — satu tempat, agar status tidak pernah tampil sebagai wire value.
 * Aturan warna (design spec §2): warning = menunggu admin, brand = sedang
 * diproses admin, success = terminal positif, danger = terminal negatif,
 * neutral = inert. "Ditolak" selalu danger, di semua halaman.
 * ------------------------------------------------------------------------ */

type BadgeTone = 'neutral' | 'success' | 'warning' | 'brand' | 'danger'

/** Pengajuan tutor — juga dipakai pengajuan perubahan rekening (nilai & makna sama). */
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

/** Rekening bank: turunan boolean dari `verifiedAt` — lihat bankVerificationState(). */
export type BankVerificationState = 'verified' | 'unverified'

export const BANK_VERIFICATION_LABEL: Record<BankVerificationState, string> = {
  verified: 'Terverifikasi',
  unverified: 'Belum diverifikasi',
}

export const BANK_VERIFICATION_TONE: Record<BankVerificationState, BadgeTone> = {
  verified: 'success',
  unverified: 'warning',
}

/** Kunci map verifikasi dari `verifiedAt` (unix seconds, kosong = belum). */
export function bankVerificationState(verifiedAt: number | null | undefined): BankVerificationState {
  return verifiedAt ? 'verified' : 'unverified'
}
