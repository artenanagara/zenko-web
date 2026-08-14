import type {
  CreateProductRequest,
  ExamType,
  ProductStatus,
  ProductType,
  QuestionDraft,
  QuestionKind,
  TutorProductDetail,
  TutorProductSummary,
  TutorQuestion,
  UpdateProductRequest,
} from '#shared/types/tutor-product'

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

  return { data, pending, error }
}

/** The caller's own products. Call `refresh()` from onMounted. */
export function useTutorProducts() {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorProductSummary[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<TutorProductSummary[]>('/tutor/products', {
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
export function useTutorProductDetail(id: string) {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorProductDetail | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<TutorProductDetail>(`/tutor/products/${id}`, {
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

/** POST /tutor/products → draft baru. Throws on any non-2xx. */
export async function createTutorProduct(body: CreateProductRequest): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await $fetch<TutorProductDetail>('/tutor/products', {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
}

/** PATCH /tutor/products/:id — partial; hanya draft/rejected yang diterima. */
export async function updateTutorProduct(id: string, patch: UpdateProductRequest): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await $fetch<TutorProductDetail>(`/tutor/products/${id}`, {
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
): Promise<TutorQuestion> {
  const { public: config } = useRuntimeConfig()

  return await $fetch<TutorQuestion>(
    `/tutor/products/${productId}/sections/${sectionId}/questions`,
    { baseURL: config.apiBase, method: 'POST', body: question, credentials: 'include' },
  )
}

/** Batch untuk impor CSV: body `{questions: [...]}` di endpoint yang sama. */
export async function createTutorQuestionBatch(
  productId: string,
  sectionId: string,
  questions: QuestionDraft[],
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch(`/tutor/products/${productId}/sections/${sectionId}/questions`, {
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
): Promise<TutorQuestion> {
  const { public: config } = useRuntimeConfig()

  return await $fetch<TutorQuestion>(
    `/tutor/products/${productId}/sections/${sectionId}/questions/${questionId}`,
    { baseURL: config.apiBase, method: 'PATCH', body: question, credentials: 'include' },
  )
}

export async function deleteTutorQuestion(
  productId: string,
  sectionId: string,
  questionId: string,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch(`/tutor/products/${productId}/sections/${sectionId}/questions/${questionId}`, {
    baseURL: config.apiBase,
    method: 'DELETE',
    credentials: 'include',
  })
}

/**
 * POST /tutor/products/:id/submit — validasi server lalu status `review`.
 * A 422 carries `problems: string[]`; read them with tutorSubmitProblems.
 */
export async function submitTutorProduct(id: string): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch(`/tutor/products/${id}/submit`, {
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
export async function archiveTutorProduct(id: string): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch(`/tutor/products/${id}/archive`, {
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
export async function deleteTutorProduct(id: string): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch(`/tutor/products/${id}`, {
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

export const QUESTION_KIND_LABEL: Record<QuestionKind, string> = {
  single_choice: 'Pilihan ganda',
  weighted: 'Berbobot (TKP)',
  true_false: 'Benar/Salah',
  short_answer: 'Isian singkat',
}
