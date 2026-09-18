import type {
  CreateProductRequest,
  ExamType,
  SchoolSubject,
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

/** Curriculum choices are served as data, not duplicated in the wizard. */
export function useSchoolSubjects() {
  const { public: config } = useRuntimeConfig()
  return useFetch<SchoolSubject[]>('/subjects', {
    baseURL: config.apiBase,
    default: () => [],
  })
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
      error.value = tutorApiMessage(cause, 'Daftar produk belum berhasil dimuat.')
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
      error.value = tutorApiMessage(cause, 'Produk belum berhasil dimuat.')
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
      error.value = tutorApiMessage(cause, 'Aturan harga belum berhasil dimuat.')
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
/**
 * POST a batch into one section. `replace` empties the section first, in the
 * same server write — the CSV importer's "timpa semua soal" path, atomic so a
 * batch the server rejects leaves the old questions in place.
 */
export async function createTutorQuestionBatch(
  productId: string,
  sectionId: string,
  questions: QuestionDraft[],
  workspace?: ProductWorkspace,
  options: { replace?: boolean } = {},
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: { questions, replace: options.replace === true },
    credentials: 'include',
  })
}

/** DELETE every question in one section; the section and its passages stay. */
export async function deleteAllTutorQuestions(
  productId: string,
  sectionId: string,
  workspace?: ProductWorkspace,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch(`${productsRoot(workspace)}/${productId}/sections/${sectionId}/questions`, {
    baseURL: config.apiBase,
    method: 'DELETE',
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

/**
 * POST /tutor/products/:id/questions/import-docx — impor bank soal Word.
 *
 * Berkasnya diurai di server (lihat internal/docximport di zenko-api):
 * .docx adalah arsip zip yang tidak bisa dibuka browser tanpa dependensi
 * baru, gambarnya harus lewat pipeline unggah, dan HTML hasil bacanya harus
 * disanitasi oleh policy yang sama dengan field soal lain. Jadi di sini tidak
 * ada parsing sama sekali — berkasnya dikirim apa adanya.
 *
 * `sectionId` membuat seluruh soal masuk ke satu subtes dan membuat baris
 * SUBTES di dokumen diabaikan; tanpa itu tiap tabel dicocokkan lewat baris
 * SUBTES-nya sendiri. Sama seperti impor CSV, tabel yang gagal masuk
 * `problems` dan tidak menggagalkan tabel lain.
 */
export async function importTutorQuestionsDocx(
  productId: string,
  file: File,
  options: { sectionId?: string } = {},
  workspace?: ProductWorkspace,
): Promise<QuestionImportResult> {
  const { public: config } = useRuntimeConfig()

  const body = new FormData()
  body.append('file', file)
  if (options.sectionId) body.append('sectionId', options.sectionId)

  return await useApiFetch<QuestionImportResult>(`${productsRoot(workspace)}/${productId}/questions/import-docx`, {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
}

/**
 * Unduh template soal produk ini, DOCX atau CSV.
 *
 * Keduanya dibuat server-side dari satu daftar contoh yang sama
 * (zenko-api/internal/docximport) dan dibentuk mengikuti kategori ujian produk
 * ini: contohnya hanya memuat jenis soal yang diterima subtesnya, dengan
 * jumlah opsi dan skala bobot yang dipakai kategori itu. Tutor tidak bisa
 * mengunduh contoh yang justru akan ditolak saat diimpor.
 *
 * `sectionId` mempersempit template ke satu subtes sekaligus menghilangkan
 * baris/kolom SUBTES — cakupannya sudah dijawab di modal impor.
 */
export async function downloadTutorQuestionTemplate(
  productId: string,
  options: { format: 'docx' | 'csv', sectionId?: string },
  workspace?: ProductWorkspace,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  const query: Record<string, string> = {}
  if (options.sectionId) query.sectionId = options.sectionId

  // $fetch langsung, bukan useApiFetch: helper itu diketik untuk respons JSON
  // (FetchOptions<'json'>) sementara yang diunduh di sini adalah berkas. Tidak
  // ada yang hilang — token CSRF hanya dipasang untuk method yang mengubah
  // data, dan ini GET.
  const response = await $fetch.raw<Blob>(
    `${productsRoot(workspace)}/${productId}/questions/template.${options.format}`,
    { baseURL: config.apiBase, method: 'GET', query, responseType: 'blob', credentials: 'include' },
  )

  const blob = response._data
  if (!blob) throw new Error('Template kosong')

  saveBlob(blob, filenameFromResponse(response.headers) ?? `template-soal.${options.format}`)
}

/**
 * Nama berkas dari header Content-Disposition, supaya nama yang tersimpan sama
 * dengan yang ditentukan server (mengandung jenis soal dan judul produk).
 * Null kalau headernya tidak terbaca — beberapa proxy membuangnya.
 */
function filenameFromResponse(headers: Headers): string | null {
  const disposition = headers.get('content-disposition')
  const match = disposition?.match(/filename="?([^";]+)"?/i)
  return match?.[1] ?? null
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
  changeSummary?: string,
): Promise<void> {
  const { public: config } = useRuntimeConfig()

  const action = workspace?.bimbelId
    ? (visibility === 'bimbel' ? 'publish' : 'submit-public')
    : 'submit'
  await useApiFetch(`${productsRoot(workspace)}/${id}/${action}`, {
    baseURL: config.apiBase,
    method: 'POST',
    ...(changeSummary !== undefined ? { body: { changeSummary } } : {}),
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
  simulasi: 'Simulasi lengkap',
  mini_tryout: 'Mini tryout',
  latihan: 'Latihan mata pelajaran',
}
