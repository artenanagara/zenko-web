import type { QuestionKind } from '#shared/types/tutor-product'

/**
 * Posisi Zenko sejak rework kategori SKD/TKA (docs/konsep-kategori-skd-tka.md
 * §2.2/§6): 9 jenis soal adalah jenis internal platform. Tiga di antaranya
 * dipetakan ke bentuk resmi TKA dan diberi badge "Format Resmi TKA":
 *
 * - Pilihan Ganda            → `single_choice`
 * - PGK Multiple Choice Multiple Answer → `multiple_choice`
 * - PGK Kategori (Benar/Salah) → `true_false`
 *
 * Enam sisanya adalah fitur custom Zenko — boleh dipakai tutor, tapi UI tidak
 * boleh menyebutnya bentuk resmi TKA.
 */
export const TKA_OFFICIAL_KINDS: readonly QuestionKind[] = [
  'single_choice',
  'multiple_choice',
  'true_false',
]

/**
 * Exam type slugs kategori TKA. Empat slug pertama adalah seed pasca-rework
 * (tka-sd/smp/sma/smk); `tka` dan `tka-sma-pilihan` adalah slug lama yang
 * masih menempel di produk legacy. tka-saintek/tka-soshum sengaja tetap di
 * luar: itu template ujian mandiri yang kebetulan memakai prefiks "tka".
 */
const TKA_EXAM_TYPE_SLUGS = new Set(['tka-sd', 'tka-smp', 'tka-sma', 'tka-smk', 'tka', 'tka-sma-pilihan'])

export function isTkaExamType(examTypeSlug: string | null | undefined): boolean {
  return TKA_EXAM_TYPE_SLUGS.has(examTypeSlug ?? '')
}

/** Apakah jenis soal ini termasuk 3 format resmi TKA. */
export function isOfficialTkaKind(kind: QuestionKind): boolean {
  return TKA_OFFICIAL_KINDS.includes(kind)
}

/**
 * Badge/keterangan jenis soal untuk paket TKA: "Format Resmi TKA" untuk tiga
 * jenis yang dipetakan ke bentuk resmi, "Fitur custom Zenko" untuk sisanya.
 * Null saat paketnya bukan TKA — tidak ada yang perlu dilabeli.
 */
export function tkaKindBadge(
  examTypeSlug: string | null | undefined,
  kind: QuestionKind,
): 'Format Resmi TKA' | 'Fitur custom Zenko' | null {
  if (!isTkaExamType(examTypeSlug)) return null
  return isOfficialTkaKind(kind) ? 'Format Resmi TKA' : 'Fitur custom Zenko'
}

/**
 * Catatan saat paket TKA memakai jenis custom — sekadar informasi, bukan
 * blokir: jenis custom sah dipakai, hanya tidak boleh disebut bentuk resmi.
 */
export function nonTkaKindWarning(
  examTypeSlug: string | null | undefined,
  kind: QuestionKind,
): string | null {
  if (!isTkaExamType(examTypeSlug)) return null
  if (isOfficialTkaKind(kind)) return null
  return 'Jenis soal ini fitur custom Zenko — bukan salah satu dari 3 bentuk soal resmi TKA '
    + '(Pilihan Ganda, PGK MCMA, PGK Kategori).'
}
