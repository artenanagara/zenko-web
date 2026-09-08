import type {
  CreateProductRequest,
  ExamType,
  PassageDraft,
  ProductMode,
  ProductStatus,
  ProductType,
  QuestionDraft,
  QuestionImportDraft,
  QuestionImportResult,
  TutorPricingEligibility,
  TutorProductDetail,
  TutorProductSummary,
  TutorQuestion,
  UpdateProductRequest,
} from '#shared/types/tutor-product'

export interface ProductWorkspace {
  bimbelId?: string
}

function workspaceRoot(workspace?: ProductWorkspace): string {
  return workspace?.bimbelId ? `/bimbel/${workspace.bimbelId}` : '/tutor'
}

function productsRoot(workspace?: ProductWorkspace): string {
  return `${workspaceRoot(workspace)}/products`
}

/**
 * Produk tutor: exam types, daftar/detail produk, soal per subtes, dan submit.
 *
 * Mirrors docs/tutor-flow-contract.md. Everything under /tutor/* carries the
 * session cookie and follows the client-only pattern of useMyTutorApplication:
 * the cookie is HttpOnly on the API origin, so asking during SSR would always
 * answer "none" and then contradict itself on hydration.
 */

/** GET /exam-types — public, so a plain useFetch (SSR-safe) is fine. */
export function useExamTypes() {
  const { public: config } = useRuntimeConfig()

  const { data, pending, error } = useFetch<ExamType[]>('/exam-types', {
    baseURL: config.apiBase,
    default: () => [],
  })

  const sortedData = computed(() => data.value.slice().sort((left, right) => left.label.localeCompare(right.label, 'id')))

  return { data: sortedData, pending, error }
}

/** The caller's own products. Call `refresh()` from onMounted. */
export function useTutorProducts(workspace?: ProductWorkspace) {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorProductSummary[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TutorProductSummary[]>(productsRoot(workspace), {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat daftar produk.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** One product in full. Call `refresh()` from onMounted; re-call after edits. */
export function useTutorProductDetail(id: string, workspace?: ProductWorkspace) {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorProductDetail | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TutorProductDetail>(`${productsRoot(workspace)}/${id}`, {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat produk.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/**
 * GET /tutor/product-pricing — aturan harga sebagaimana berlaku untuk pemanggil
 * saat ini. Dipanggil wizard supaya langkah harga bisa menunjukkan kelayakan
 * paket gratis sejak awal, bukan baru ketahuan saat submit ditolak.
 *
 * Client-only seperti sisa /tutor/*: cookie sesi HttpOnly di origin API, jadi
 * bertanya saat SSR selalu dijawab "belum masuk". Gagal memuat sengaja tidak
 * memblokir wizard — `data` tetap null dan checklist jatuh ke aturan longgar,
 * karena server tetap penjaga sebenarnya saat submit.
 */
export function useTutorPricingEligibility(workspace?: ProductWorkspace) {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorPricingEligibility | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TutorPricingEligibility>(`${workspaceRoot(workspace)}/product-pricing`, {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat aturan harga.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** POST /tutor/products → draft baru. Throws on any non-2xx. */
export async function createTutorProduct(body: CreateProductRequest, workspace?: ProductWorkspace): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorProductDetail>(productsRoot(workspace), {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
}

/** PATCH /tutor/products/:id — partial; hanya draft/rejected yang diterima. */
export async function updateTutorProduct(id: string, patch: UpdateProductRequest, workspace?: ProductWorkspace): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorProductDetail>(`${productsRoot(workspace)}/${id}`, {
    baseURL: config.apiBase,
    method: 'PATCH',
    body: patch,
    credentials: 'include',
  })
}

/** POST satu soal ke subtes. Position diberikan server. */
export async function createTutorQuestion(
  productId: string,
  sectionId: string,
  question: QuestionDraft,
  workspace?: ProductWorkspace,
): Promise<TutorQuestion> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorQuestion>(
    `${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions`,
    { baseURL: config.apiBase, method: 'POST', body: question, credentials: 'include' },
  )
}

/**
 * POST multipart /tutor/uploads — gambar yang disisipkan lewat toolbar editor
 * soal (Pertanyaan/Pembahasan/Wacana) atau lewat unggah gambar per opsi
 * jawaban. Mengembalikan URL publiknya.
 */
export async function uploadTutorImage(file: File): Promise<string> {
  const { public: config } = useRuntimeConfig()

  const body = new FormData()
  body.append('image', file)

  const result = await useApiFetch<{ url: string }>('/uploads', {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
  return result.url
}

/** Batch untuk impor CSV: body `{questions: [...]}` di endpoint yang sama. */
export async function createTutorQuestionBatch(
  productId: string,
  sectionId: string,
  questions: QuestionDraft[],
  workspace?: ProductWorkspace,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: { questions },
    credentials: 'include',
  })
}

/**
 * POST /tutor/products/:id/questions/import — impor gabungan lintas subtes:
 * tiap baris bawa `subtes` sendiri, dicocokkan ke section produk ini di
 * server (trim, case-insensitive). Baris yang gagal cocok/valid masuk ke
 * `problems` di response, tidak melempar — hanya network/auth error yang
 * throw di sini.
 */
export async function importTutorQuestions(
  productId: string,
  questions: QuestionImportDraft[],
  workspace?: ProductWorkspace,
): Promise<QuestionImportResult> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<QuestionImportResult>(`${productsRoot(workspace)}/${productId}/questions/import`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: { questions },
    credentials: 'include',
  })
}

/** PATCH satu soal — full replace isi soal, bentuk sama dengan create. */
export async function updateTutorQuestion(
  productId: string,
  sectionId: string,
  questionId: string,
  question: QuestionDraft,
  workspace?: ProductWorkspace,
): Promise<TutorQuestion> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorQuestion>(
    `${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions/${questionId}`,
    { baseURL: config.apiBase, method: 'PATCH', body: question, credentials: 'include' },
  )
}

export async function deleteTutorQuestion(
  productId: string,
  sectionId: string,
  questionId: string,
  workspace?: ProductWorkspace,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions/${questionId}`, {
    baseURL: config.apiBase,
    method: 'DELETE',
    credentials: 'include',
  })
}

/**
 * POST /tutor/products/:id/sections/:sectionId/passages — wacana baru di
 * ujung daftar. Respons 201 berisi aggregate produk terbaru; wacana barunya
 * adalah entri terakhir `passages` pada section tersebut (id dari server).
 */
export async function createTutorPassage(
  productId: string,
  sectionId: string,
  passage: PassageDraft,
  workspace?: ProductWorkspace,
): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorProductDetail>(
    `${productsRoot(workspace)}/${productId}/sections/${sectionId}/passages`,
    { baseURL: config.apiBase, method: 'POST', body: passage, credentials: 'include' },
  )
}

/** PATCH .../passages/:passageId — full replace judul + isi wacana. */
export async function updateTutorPassage(
  productId: string,
  sectionId: string,
  passageId: string,
  passage: PassageDraft,
  workspace?: ProductWorkspace,
): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorProductDetail>(
    `${productsRoot(workspace)}/${productId}/sections/${sectionId}/passages/${passageId}`,
    { baseURL: config.apiBase, method: 'PATCH', body: passage, credentials: 'include' },
  )
}

/**
 * DELETE .../passages/:passageId — 204. Soal yang menunjuk wacana ini dilepas
 * tautannya oleh server (passageId dikosongkan), tidak ikut terhapus.
 */
export async function deleteTutorPassage(
  productId: string,
  sectionId: string,
  passageId: string,
  workspace?: ProductWorkspace,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${productId}/sections/${sectionId}/passages/${passageId}`, {
    baseURL: config.apiBase,
    method: 'DELETE',
    credentials: 'include',
  })
}

/**
 * PUT .../questions/reorder — grid navigator kirim seluruh urutan baru soal
 * dalam satu subtes (id lengkap, bukan delta). Server menolak kalau daftar id
 * tidak persis sama dengan isi subtes saat ini.
 */
export async function reorderTutorQuestions(
  productId: string,
  sectionId: string,
  questionIds: string[],
  workspace?: ProductWorkspace,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions/reorder`, {
    baseURL: config.apiBase,
    method: 'PUT',
    body: { questionIds },
    credentials: 'include',
  })
}

/**
 * POST /tutor/products/:id/submit — validasi server lalu status `review`.
 * A 422 carries `problems: string[]`; read them with tutorSubmitProblems.
 */
export async function submitTutorProduct(
  id: string,
  workspace?: ProductWorkspace,
  visibility: 'public' | 'bimbel' = 'public',
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  const action = workspace?.bimbelId
    ? (visibility === 'bimbel' ? 'publish' : 'submit-public')
    : 'submit'
  await useApiFetch(`${productsRoot(workspace)}/${id}/${action}`, {
    baseURL: config.apiBase,
    method: 'POST',
    credentials: 'include',
  })
}

/**
 * Mengarsipkan produk live. The contract lists the `archived` status but not
 * its endpoint; this mirrors the /submit shape and must be confirmed against
 * zenko-api once that side lands.
 */
export async function archiveTutorProduct(id: string, workspace?: ProductWorkspace): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${id}/archive`, {
    baseURL: config.apiBase,
    method: 'POST',
    credentials: 'include',
  })
}

/**
 * DELETE /tutor/products/:id — permanent. Only draft, rejected, and archived
 * products qualify; live must be archived first, and an archived product with
 * existing buyers is refused too (409). See tutor_products.go Delete.
 */
export async function deleteTutorProduct(id: string, workspace?: ProductWorkspace): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${id}`, {
    baseURL: config.apiBase,
    method: 'DELETE',
    credentials: 'include',
  })
}

/** zenko-api renders errors as { error, requestId }; fall back for the rest. */
export function tutorApiMessage(cause: unknown, fallback: string): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || fallback
}

/** Daftar masalah dari 422 submit: { error, problems: [...] }. */
export function tutorSubmitProblems(cause: unknown): string[] {
  const problems = (cause as { data?: { problems?: string[] } })?.data?.problems
  return Array.isArray(problems) ? problems : []
}

/* --------------------------------------------------------------------------
 * UI labels — one place, so a status never renders as its wire value.
 * ------------------------------------------------------------------------ */

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Draft',
  review: 'Ditinjau',
  live: 'Tayang',
  rejected: 'Ditolak',
  archived: 'Diarsipkan',
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'brand' | 'danger'

export const PRODUCT_STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  draft: 'neutral',
  review: 'warning',
  live: 'success',
  rejected: 'danger',
  archived: 'neutral',
}

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  single: 'Tunggal',
  bundle: 'Bundling',
}

/**
 * Label mode netral lintas kategori: simulasi SKD memang semua subtes, tapi
 * simulasi TKA tetap satu mapel — yang membedakan mode adalah terkunci atau
 * tidaknya jumlah soal & durasi, bukan cakupan subtesnya.
 */
export const PRODUCT_MODE_LABEL: Record<ProductMode, string> = {
  simulasi: 'Simulasi (standar resmi, terkunci)',
  mini_tryout: 'Mini Try Out (jumlah soal & durasi bebas diatur)',
}
