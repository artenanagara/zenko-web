import type { QuestionKind } from '#shared/types/tutor-product'

/**
 * Question kinds Kemendikdasmen's TKA actually uses. The exam is built from
 * pilihan ganda, pilihan ganda kompleks (both the MCMA and the kategori /
 * benar-salah model), isian singkat, and — at SD/SMP — a little menjodohkan
 * and mengurutkan.
 *
 * Blueprint and sources: docs/plan-produk-tka-lengkap.md §5.
 */
const TKA_QUESTION_KINDS: readonly QuestionKind[] = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'short_answer',
  'matching',
  'ordering',
]

/** Why each remaining kind does not belong in a paket labelled TKA. */
const NON_TKA_KIND_REASON: Partial<Record<QuestionKind, string>> = {
  assertion_reason: 'Format Sebab–Akibat tidak dipakai di TKA — itu pola ujian mandiri PTN.',
  associative_choice: 'Format asosiatif (1,2,3/1,3/2,4) tidak dipakai di TKA — itu pola SIMAK UI dan UTUL UGM.',
  weighted: 'Opsi berbobot tidak dipakai di TKA — itu pola TKP di SKD dan AKHLAK di BUMN.',
}

/** Exam type slugs whose paket claim to reproduce the official TKA. */
const TKA_EXAM_TYPE_SLUGS = new Set(['tka', 'tka-sd', 'tka-smp', 'tka-sma-pilihan'])

/**
 * The legacy tka-saintek/tka-soshum slugs are deliberately excluded: they are
 * ujian mandiri templates that kept their old slug (see zenko-api's
 * exam_types.go), and those paket may use the extra kinds freely.
 */
export function isTkaExamType(examTypeSlug: string | null | undefined): boolean {
  return TKA_EXAM_TYPE_SLUGS.has(examTypeSlug ?? '')
}

/**
 * A warning to show when a TKA paket is about to use a kind the real exam does
 * not have, or null when there is nothing to warn about. Deliberately advice
 * and not a block — a tutor may still want the drill, they just should not
 * discover on exam day that they practised a format that never appears.
 */
export function nonTkaKindWarning(
  examTypeSlug: string | null | undefined,
  kind: QuestionKind,
): string | null {
  if (!isTkaExamType(examTypeSlug)) return null
  if (TKA_QUESTION_KINDS.includes(kind)) return null
  return NON_TKA_KIND_REASON[kind] ?? 'Tipe soal ini tidak dipakai di TKA resmi.'
}
