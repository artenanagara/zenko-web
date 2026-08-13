/**
 * Alur tutor: produk, subtes, dan soal. Mirrors
 * docs/tutor-flow-contract.md — the contract the backend is being built
 * against. JSON camelCase, timestamps Unix seconds, IDs strings.
 */

export type ProductType = 'single' | 'bundle'

/** draft → review → live | rejected (→ draft again after edits) → archived */
export type ProductStatus = 'draft' | 'review' | 'live' | 'rejected' | 'archived'

export type QuestionKind = 'single_choice' | 'weighted' | 'true_false' | 'short_answer'

export type ScoringMode = 'flat' | 'weighted'

/** One subtes template inside an exam type (and the editable shape for custom). */
export interface SectionTemplate {
  title: string
  questionTarget: number
  durationMinutes: number
  scoringMode: ScoringMode
  pointsCorrect: number
  passingGrade?: number
  defaultKind: QuestionKind
}

/** GET /exam-types — jenis ujian + template subtesnya, seeded server-side. */
export interface ExamType {
  slug: string
  label: string
  description: string
  sections: SectionTemplate[]
}

export interface QuestionOption {
  label: string
  text: string
  /** single_choice: exactly one true. true_false: the key per statement. */
  isCorrect?: boolean
  /** weighted only: integer ≥ 0 (typically 1–5). */
  weight?: number
}

export interface TutorQuestion {
  id: string
  kind: QuestionKind
  prompt: string
  /** Pembahasan — must be non-empty before submit. */
  explanation: string
  position: number
  options?: QuestionOption[]
  /** short_answer only: accepted answers. */
  answers?: string[]
}

/** Wire shape for creating/replacing a question; id/position are server-assigned. */
export interface QuestionDraft {
  kind: QuestionKind
  prompt: string
  explanation: string
  options?: QuestionOption[]
  answers?: string[]
}

export interface TutorSection extends SectionTemplate {
  id: string
  position: number
  questions: TutorQuestion[]
}

/** Row shape of GET /tutor/products. */
export interface TutorProductSummary {
  id: string
  type: ProductType
  title: string
  slug: string
  category: string
  thumbnailUrl: string
  price: number
  priceOriginal: number
  status: ProductStatus
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
  /** single only: exam type slug (`snbt`, `cpns-skd`, `custom`, …). */
  examType?: string
  durationMinutes?: number
  sections?: TutorSection[]
  items?: BundleItem[]
}

/** POST /tutor/products — examTypeSlug wajib untuk single. */
export interface CreateProductRequest {
  type: ProductType
  title: string
  examTypeSlug?: string
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
  price?: number
  priceOriginal?: number
  durationMinutes?: number
  /** custom exam type only: the full replacement list of subtes. */
  sections?: SectionInput[]
  /** bundle only: member product IDs in display order. */
  items?: string[]
}
