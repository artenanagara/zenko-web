import type {
  EducationLevel,
  ExamFamily,
  ExamType,
  ProductMode,
  SchoolSubject,
  SectionTemplate,
} from '#shared/types/tutor-product'

/**
 * The catalogue's top grouping, in the order the wizard offers it. Families are
 * organised by what a student is preparing for rather than by which agency runs
 * the exam — a school leaver looking for work finds "Karier & Kerja" without
 * needing to know the difference between BKN and FHCI.
 *
 * The split with zenko-api is deliberate and stays: the server owns which
 * family an exam belongs to (behaviour), this file owns what that family is
 * called (display copy) — the same split PRODUCT_MODE_LABEL follows. Making
 * families a seeded table was considered and rejected in
 * docs/taksonomi-kategori-ujian.md §6: their members are defined in code
 * regardless, and a fetch would put a spinner and a failure path on the first
 * step of the identity dialog for a list that changes about once a year.
 *
 * The order here is the offer order. A family the server introduces before
 * this list knows it still appears — see familiesOf — just under its raw name.
 */
export const EXAM_FAMILIES: { value: ExamFamily, label: string, description: string }[] = [
  { value: 'school', label: 'Sekolah', description: 'Tes Kemampuan Akademik untuk jenjang SD sampai SMK.' },
  { value: 'university', label: 'Masuk PTN', description: 'Seleksi masuk perguruan tinggi negeri.' },
  { value: 'asn', label: 'ASN', description: 'SKD CPNS, sekolah kedinasan, dan seleksi kompetensi PPPK.' },
  { value: 'military-police', label: 'TNI & Polri', description: 'Materi akademik dan kemampuan kognitif seleksi casis.' },
  { value: 'career', label: 'Karier & Kerja', description: 'Rekrutmen Bersama BUMN dan psikotes kerja.' },
  { value: 'language', label: 'Bahasa', description: 'Latihan TOEFL ITP dan IELTS.' },
]

const FAMILY_LABELS = new Map(EXAM_FAMILIES.map(family => [family.value, family.label]))

/**
 * The family an exam belongs to. Products created before the taxonomy have no
 * family stored, so their two known categories are mapped here — without it a
 * legacy package would disappear from every family facet.
 */
export function examFamilyOf(exam: Pick<ExamType, 'family' | 'category'>): ExamFamily | undefined {
  if (exam.family) return exam.family
  if (exam.category === 'TKA') return 'school'
  if (exam.category === 'SKD') return 'asn'
  return undefined
}

export function examFamilyLabel(family: ExamFamily | undefined): string {
  if (!family) return ''
  // Falls back to the raw key rather than an empty string: a family added
  // server-side before this file learns its name must still be readable and
  // selectable, not render as a blank row.
  return FAMILY_LABELS.get(family) ?? family
}

/**
 * The families actually present in a set of exams, in the order this file
 * lists them, with anything unrecognised appended rather than dropped.
 *
 * Filtering the known list alone would make a family the server introduces
 * invisible in the wizard — every exam under it unreachable, with nothing to
 * indicate why.
 */
export function familiesOf(exams: Pick<ExamType, 'family' | 'category'>[]): { value: ExamFamily, label: string, description: string }[] {
  const present = new Set<ExamFamily>()
  for (const exam of exams) {
    const family = examFamilyOf(exam)
    if (family) present.add(family)
  }
  const known = EXAM_FAMILIES.filter(item => present.has(item.value))
  const unknown = [...present]
    .filter(value => !EXAM_FAMILIES.some(item => item.value === value))
    .map(value => ({ value, label: value, description: '' }))
  return [...known, ...unknown]
}

/** Jenjang, and the grades taught at each. */
export const EDUCATION_LEVELS: { value: EducationLevel, firstGrade: number, lastGrade: number }[] = [
  { value: 'SD', firstGrade: 1, lastGrade: 6 },
  { value: 'SMP', firstGrade: 7, lastGrade: 9 },
  { value: 'SMA', firstGrade: 10, lastGrade: 12 },
  { value: 'SMK', firstGrade: 10, lastGrade: 12 },
]

export function gradesFor(level: EducationLevel): number[] {
  const range = EDUCATION_LEVELS.find(item => item.value === level)
  if (!range) return []
  return Array.from({ length: range.lastGrade - range.firstGrade + 1 }, (_, i) => range.firstGrade + i)
}

export function subjectsFor(subjects: SchoolSubject[], level: EducationLevel, grade: number): SchoolSubject[] {
  return subjects.filter(subject =>
    subject.active
    && subject.levels.includes(level)
    && grade >= subject.minGrade
    && grade <= subject.maxGrade,
  )
}

/**
 * Whether a package built from this blueprint is exactly one section.
 *
 * True for every mini tryout, and for a blueprint whose simulation covers a
 * single section in both modes — TKA, which is sat and scored one mapel at a
 * time. Mirrors creationSectionTemplates in zenko-api; the wizard must ask for
 * the same section the server will expect.
 */
export function needsSectionChoice(exam: ExamType | null, mode: ProductMode): boolean {
  if (!exam || mode === 'latihan') return false
  return mode === 'mini_tryout' || exam.simulationScope === 'section'
}

/**
 * Whether question counts and durations follow the published standard and
 * cannot be edited. Only an official blueprint has published numbers to be
 * faithful to; a practice blueprint leaves them to the tutor.
 */
export function isConfigLocked(exam: ExamType | null, mode: ProductMode): boolean {
  return mode === 'simulasi' && exam?.fidelity === 'official'
}

/** "30 soal · 65 menit" — one section's shape, as every list of them shows it. */
export function sectionSummary(section: SectionTemplate): string {
  return `${section.questionTarget} soal · ${sectionDurationLabel(section)}`
}
