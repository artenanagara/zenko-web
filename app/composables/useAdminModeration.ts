import type {
  AdminBankAccount,
  AdminBankAccountChangeRequest,
  AdminPayout,
  AdminProductDetail,
  AdminProductSummary,
  BankAccountChangeDecisionRequest,
  PayoutDecisionRequest,
  ProductDecisionRequest,
} from '#shared/types/admin-moderation'

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
      data.value = await $fetch<AdminProductSummary[]>('/admin/products', {
        baseURL: config.apiBase,
        credentials: 'include',
        query: { status: 'review' },
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat antrean moderasi.')
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

  return await $fetch<AdminProductDetail>(`/admin/products/${id}`, {
    baseURL: config.apiBase,
    credentials: 'include',
  })
}

/** POST /admin/products/:id/decision — approve → live, reject wajib reason. */
export async function decideAdminProduct(id: string, decision: ProductDecisionRequest): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch(`/admin/products/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
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
      data.value = await $fetch<AdminPayout[]>('/admin/payouts', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat antrean pencairan.')
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

  await $fetch(`/admin/payouts/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
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
      data.value = await $fetch<AdminBankAccount[]>('/admin/bank-accounts', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat daftar rekening bank.')
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

  await $fetch(`/admin/bank-accounts/${accountId}/verify`, {
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
      data.value = await $fetch<AdminBankAccountChangeRequest[]>('/admin/bank-account-change-requests', {
        baseURL: config.apiBase,
        credentials: 'include',
        query: { status: 'pending' },
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat pengajuan perubahan rekening.')
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

  await $fetch(`/admin/bank-account-change-requests/${id}/decision`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: decision,
    credentials: 'include',
  })
}
