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
 * Mirrors the ExamFamily constants in zenko-api. The labels live here because
 * they are display copy; which family an exam belongs to comes from the server.
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
  return family ? FAMILY_LABELS.get(family) ?? '' : ''
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

/** A section's timer in whole minutes, reading the exact value when set. */
export function sectionMinutes(section: Pick<SectionTemplate, 'durationMinutes' | 'durationSeconds'>): number {
  return section.durationSeconds ? Math.round(section.durationSeconds / 60) : section.durationMinutes
}

/** "30 soal · 65 menit" — one section's shape, as every list of them shows it. */
export function sectionSummary(section: SectionTemplate): string {
  return `${section.questionTarget} soal · ${sectionMinutes(section)} menit`
}
