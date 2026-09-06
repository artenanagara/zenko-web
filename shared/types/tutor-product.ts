/**
 * Alur tutor: produk, subtes, dan soal. Mirrors
 * docs/tutor-flow-contract.md — the contract the backend is being built
 * against. JSON camelCase, timestamps Unix seconds, IDs strings.
 */

export type ProductType = 'single' | 'bundle'

/** simulasi = semua subtes diisi (default). mini_tryout = satu subtes saja. */
export type ProductMode = 'simulasi' | 'mini_tryout'

/** draft → review → live | rejected (→ draft again after edits) → archived */
export type ProductStatus = 'draft' | 'review' | 'live' | 'rejected' | 'archived'
export type ProductVisibility = 'public' | 'bimbel'

export type QuestionKind =
  | 'single_choice'
  | 'multiple_choice'
  | 'weighted'
  | 'true_false'
  | 'short_answer'
  | 'assertion_reason'
  | 'associative_choice'
  | 'matching'
  | 'ordering'

export type ScoringMode = 'flat' | 'weighted'

/** Bagaimana timer produk dari jenis ujian ini berjalan di ruang ujian. */
export type TimerPolicy = 'flat' | 'sequential'

/** Chrome CBT resmi yang dipakai ruang ujian — lihat model.Theme* di zenko-api. */
export type ExamTheme = 'catbkn' | 'tka' | 'zenko'

/** One subtes template inside an exam type (and the editable shape for custom). */
export interface SectionTemplate {
  title: string
  questionTarget: number
  durationMinutes: number
  scoringMode: ScoringMode
  pointsCorrect: number
  passingGrade?: number
  defaultKind: QuestionKind
  /**
   * Jenis soal yang diizinkan subtes ini. Absen/kosong berarti semua 9 jenis
   * boleh (TKA); SKD mengunci TWK/TIU ke single_choice dan TKP ke weighted.
   */
  allowedKinds?: QuestionKind[]
}

/** GET /exam-types — jenis ujian + template subtesnya, seeded server-side. */
export interface ExamType {
  slug: string
  label: string
  description: string
  /**
   * Kategori katalog yang dipakai produk dengan kategori ujian ini. Satu-satunya
   * sumbernya: wizard tidak lagi punya field kategori, jadi server yang
   * mengisinya dari sini.
   */
  category: string
  /** Level facet kedua: CPNS/Kedinasan untuk SKD, jenjang untuk TKA. */
  subcategory: string
  timerPolicy: TimerPolicy
  theme: ExamTheme
  /** False untuk SKD — editor menyembunyikan field level kognitif. */
  cognitiveLevelEnabled: boolean
  /**
   * Durasi total produk simulasi saat berbeda dari jumlah durasi subtes —
   * SKD: 100 menit untuk 110 soal dalam satu timer. Absen berarti dijumlah.
   */
  simulasiTotalMinutes?: number
  sections: SectionTemplate[]
}

export interface QuestionOption {
  label: string
  text: string
  /** single_choice: exactly one true. true_false: the key per statement. */
  isCorrect?: boolean
  /** weighted only: integer ≥ 0 (typically 1–5). */
  weight?: number
  /** Figural/pattern options (e.g. TIU visual series); most options have none. */
  imageUrl?: string
}

export interface MatchingItem {
  id: string
  text: string
}

export interface MatchingData {
  items: MatchingItem[]
  pairs: Record<string, string>
}

export interface TutorQuestion {
  id: string
  kind: QuestionKind
  /** Legacy per-question reading text; passageId (grup wacana) is the newer mechanism. */
  stimulus?: string
  /** Id wacana milik section ini yang dipakai bersama; absen = soal berdiri sendiri. */
  passageId?: string
  prompt: string
  /** Pembahasan — must be non-empty before submit. */
  explanation: string
  position: number
  options?: QuestionOption[]
  /** short_answer only: accepted answers. */
  answers?: string[]
  matching?: MatchingData
  ordering?: string[]
}

/** Wire shape for creating/replacing a question; id/position are server-assigned. */
export interface QuestionDraft {
  kind: QuestionKind
  stimulus?: string
  /**
   * Id wacana (grup stimulus) subtes yang dituju. String kosong pada PATCH
   * melepas tautan — patch soal adalah full replace di server.
   */
  passageId?: string
  prompt: string
  explanation: string
  options?: QuestionOption[]
  answers?: string[]
  matching?: MatchingData
  ordering?: string[]
}

/**
 * Satu wacana (grup stimulus) di dalam subtes: tutor menulis teksnya sekali,
 * lalu menautkan maksimal 5 soal (MAX_QUESTIONS_PER_PASSAGE). Konten HTML
 * ter-sanitasi, kontrak sama dengan Question.prompt.
 */
export interface TutorPassage {
  id: string
  position: number
  title: string
  content: string
}

/** Batas soal per wacana — cermin model.MaxQuestionsPerPassage di zenko-api. */
export const MAX_QUESTIONS_PER_PASSAGE = 5

/** Wire shape POST/PATCH .../passages — title opsional, content wajib. */
export interface PassageDraft {
  title?: string
  content: string
}

/**
 * One row of the combined cross-subtes CSV import — a QuestionDraft plus the
 * subtes name it belongs to. POST /tutor/products/:id/questions/import
 * matches `subtes` (trim, case-insensitive) to this product's section
 * titles server-side; rows that don't match land in the response's
 * `problems` list instead of failing the whole batch.
 */
export interface QuestionImportDraft extends QuestionDraft {
  subtes: string
}

/** Response of POST /tutor/products/:id/questions/import. */
export interface QuestionImportResult {
  imported: number
  problems: string[]
}

export interface TutorSection extends SectionTemplate {
  id: string
  position: number
  /** Wacana milik subtes ini; absen/kosong saat semua soal berdiri sendiri. */
  passages?: TutorPassage[]
  questions: TutorQuestion[]
}

/** Row shape of GET /tutor/products. */
export interface TutorProductSummary {
  id: string
  type: ProductType
  title: string
  slug: string
  category: string
  /** Level facet kedua (SKD → CPNS/Kedinasan, TKA → jenjang); kosong untuk bundel/legacy. */
  subcategory: string
  thumbnailUrl: string
  price: number
  priceOriginal: number
  status: ProductStatus
  /** Public marketplace listing or a bimbel's private question-bank source. */
  visibility: ProductVisibility
  /** Present on a marketplace copy submitted from a private bimbel product. */
  sourceProductId?: string
  /** Present when status is `rejected`. */
  rejectReason?: string
  questionCount: number
  questionTarget: number
  /** Unix seconds. */
  updatedAt: number
}

/** Bundle membership as returned inside the bundle detail. */
export interface BundleItem {
  productId: string
  title: string
  price: number
  position: number
  status: ProductStatus
}

/**
 * GET /tutor/products/:id. A single carries examType + sections; a bundle
 * carries items. Both extend the summary fields.
 */
export interface TutorProductDetail extends TutorProductSummary {
  description: string
  /**
   * Checklist "Yang kamu dapatkan" yang diisi tutor sendiri, ditampilkan di
   * halaman detail publik. Kosong/absen berarti tutor belum mengisinya — API
   * publik memakai template kategori sebagai gantinya (lihat catalog.go).
   */
  includes?: string[]
  /** single only: exam type slug (`snbt`, `cpns-skd`, `custom`, …). */
  examType?: string
  durationMinutes?: number
  sections?: TutorSection[]
  items?: BundleItem[]
  /** single only: defaults to `simulasi` when omitted by the server. */
  mode?: ProductMode
  /**
   * single only: randomises each section's question order per student at
   * attempt time (seeded by account + product, stable across reloads).
   * Editor order (`position`) is unaffected. Defaults to `false`.
   */
  shuffleQuestions?: boolean
}

/**
 * GET /tutor/product-pricing — aturan harga sebagaimana berlaku untuk
 * pemanggilnya saat ini, supaya langkah harga wizard bisa mencerminkan
 * checklist submit alih-alih menunggu submit-nya gagal.
 *
 * Rp0 bukan lagi harga bebas. Untuk tutor, harga punya dua keadaan sah —
 * tepat Rp0 (paket gratis, dengan syaratnya sendiri) atau minimal
 * `minPrice` — dan paket gratis hanya boleh berdampingan dengan satu produk
 * berbayar yang sudah tayang, maksimal satu sekaligus. Produk yang ditulis
 * admin dikecualikan dari keduanya; servernya menyatakan itu lewat
 * `minPrice: 0`, jadi klien tidak perlu bercabang berdasarkan peran.
 */
export interface TutorPricingEligibility {
  /** Lantai harga produk berbayar, rupiah bulat. 0 berarti tanpa lantai (admin). */
  minPrice: number
  hasLivePaidProduct: boolean
  hasLiveFreeProduct: boolean
  /** Putusan untuk harga tepat Rp0. */
  canSubmitFreeProduct: boolean
  /**
   * Alasan `canSubmitFreeProduct` bernilai false — kalimatnya persis sama
   * dengan yang dikembalikan checklist submit untuk kasus itu (ada test di
   * backend yang mengunci kesamaannya), jadi tampilkan apa adanya dan jangan
   * menulis salinan copy-nya di sini. Absen saat putusannya true.
   */
  reason?: string
}

/** POST /tutor/products — examTypeSlug wajib untuk single. */
export interface CreateProductRequest {
  type: ProductType
  title: string
  examTypeSlug?: string
  /** single only: defaults to `simulasi` server-side when omitted. */
  mode?: ProductMode
  /**
   * Judul template subtes/mapel yang dipilih. Wajib saat mode `mini_tryout`,
   * dan wajib untuk SEMUA produk TKA (simulasi maupun mini) — produk TKA
   * selalu tepat satu mapel.
   */
  sectionTitle?: string
  /**
   * Override mini try-out; absen berarti default template. Server menjawab
   * 400 jika dikirim pada mode simulasi SKD/TKA — konfigurasinya terkunci.
   */
  questionTarget?: number
  durationMinutes?: number
}

/** Editable shape of one subtes for custom exam types; no id = new. */
export interface SectionInput extends SectionTemplate {
  id?: string
}

/** PATCH /tutor/products/:id — partial, only send what changed. */
export interface UpdateProductRequest {
  title?: string
  description?: string
  category?: string
  thumbnailUrl?: string
  /** "Yang kamu dapatkan" — lihat TutorProductDetail.includes. */
  includes?: string[]
  price?: number
  priceOriginal?: number
  durationMinutes?: number
  /** custom exam type only: the full replacement list of subtes. */
  sections?: SectionInput[]
  /** bundle only: member product IDs in display order. */
  items?: string[]
  /** single only: see TutorProductDetail.shuffleQuestions. */
  shuffleQuestions?: boolean
}
