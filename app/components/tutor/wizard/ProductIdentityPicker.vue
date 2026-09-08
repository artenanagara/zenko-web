<script setup lang="ts">
import type {
  EducationLevel,
  ExamFamily,
  ExamType,
  ProductMode,
  SchoolPractice,
} from '#shared/types/tutor-product'

/**
 * "Identitas paket" — what a package is, chosen once and never changed after
 * the draft exists.
 *
 * The wizard used to ask for this as four dropdowns stacked down the page,
 * each one appearing only once the one above it was answered. That layout has
 * two problems: the page grows and shifts under the cursor as you answer it,
 * and the choices are only ever read once — they do not deserve permanent
 * space on a step you come back to. So the choosing happens in a dialog, one
 * question per screen, and the step itself keeps a summary that stays still.
 *
 * The branch mirrors docs/taksonomi-kategori-ujian.md §4 exactly: an exam
 * package is identified by rumpun → program → mode → bagian, and a school
 * exercise by jenjang → kelas → mapel → bab.
 */
export interface ProductIdentity {
  examTypeSlug: string
  mode: ProductMode
  sectionTitle: string
  schoolPractice: SchoolPractice | null
}

const props = defineProps<{
  identity: ProductIdentity
  examTypes: ExamType[]
  /** Edit mode: identity is fixed server-side, so the dialog never opens. */
  locked?: boolean
  /**
   * Asked before a change that would reset dependent answers. Returning false
   * abandons the change — the wizard owns that conversation, since only it
   * knows what has been filled in since.
   */
  confirmChange?: () => boolean
}>()

const emit = defineEmits<{ apply: [identity: ProductIdentity] }>()

const subjects = useSchoolSubjects()

/** One choice a step offers. */
interface Choice {
  value: string
  label: string
  description?: string
  note?: string
}

/** Local working shape: topic is always a string here, so the free-text field
 *  binds to it directly; it becomes optional again only on the way out. */
type PracticeDraft = Required<SchoolPractice>

const PRACTICE_DEFAULT: PracticeDraft = { level: 'SD', grade: 1, subject: '', topic: '' }

const open = ref(false)
const stepIndex = ref(0)
const search = ref('')

/** Working copy — nothing reaches the wizard until "Gunakan pilihan". */
const draft = reactive<ProductIdentity>({ ...props.identity })
const practice = reactive<PracticeDraft>({ ...PRACTICE_DEFAULT })
const family = ref<ExamFamily | ''>('')

const isPractice = computed(() => draft.mode === 'latihan')
const draftExam = computed(() => props.examTypes.find(exam => exam.slug === draft.examTypeSlug) ?? null)
const savedExam = computed(() => props.examTypes.find(exam => exam.slug === props.identity.examTypeSlug) ?? null)

/* ------------------------------------------------------------------ steps */

const EXAM_STEPS = ['Bentuk paket', 'Rumpun', 'Program', 'Mode', 'Bagian'] as const
const PRACTICE_STEPS = ['Bentuk paket', 'Jenjang & kelas', 'Mata pelajaran', 'Bab atau topik'] as const

const steps = computed<readonly string[]>(() => {
  if (isPractice.value) return PRACTICE_STEPS
  // The section step only exists when the package is one section: every mini
  // tryout, and every blueprint sold one section at a time.
  return needsSectionChoice(draftExam.value, draft.mode)
    ? EXAM_STEPS
    : EXAM_STEPS.slice(0, -1)
})

const currentStep = computed(() => steps.value[stepIndex.value] ?? steps.value[0]!)
const isLastStep = computed(() => stepIndex.value === steps.value.length - 1)

/* ---------------------------------------------------------------- choices */

const availableFamilies = computed(() =>
  EXAM_FAMILIES.filter(item => props.examTypes.some(exam => examFamilyOf(exam) === item.value)),
)

const gradeChoices = computed(() => gradesFor(practice.level))
const subjectChoices = computed(() => subjectsFor(subjects.data.value, practice.level, practice.grade))

const choices = computed<Choice[]>(() => {
  switch (currentStep.value) {
    case 'Bentuk paket':
      return [
        {
          value: 'ujian',
          label: 'Simulasi ujian',
          description: 'Ikuti format sebuah ujian: bagian, jumlah soal, durasi, dan cara penilaiannya.',
        },
        {
          value: 'latihan',
          label: 'Latihan mata pelajaran',
          description: 'Latihan sekolah yang kamu susun sendiri, berdasarkan kelas dan mata pelajaran.',
        },
      ]
    case 'Rumpun':
      return availableFamilies.value.map(item => ({
        value: item.value,
        label: item.label,
        description: item.description,
      }))
    case 'Program':
      return props.examTypes
        .filter(exam => examFamilyOf(exam) === family.value)
        .map(exam => ({
          value: exam.slug,
          label: exam.label,
          description: exam.description,
          note: exam.fidelity === 'practice' ? 'Susunan latihan Zenko' : undefined,
        }))
    case 'Mode':
      return [
        {
          value: 'simulasi',
          label: draftExam.value?.simulationScope === 'section' ? 'Satu bagian penuh' : 'Simulasi lengkap',
          description: isConfigLocked(draftExam.value, 'simulasi')
            ? 'Jumlah soal, durasi, dan penilaian mengikuti standar resmi dan terkunci.'
            : 'Seluruh bagian program ini, dengan jumlah soal dan durasi bawaan.',
        },
        {
          value: 'mini_tryout',
          label: 'Mini tryout',
          description: 'Satu bagian saja, dengan jumlah soal dan durasi yang boleh kamu atur.',
        },
      ]
    case 'Mata pelajaran':
      return subjectChoices.value.map(subject => ({ value: subject.slug, label: subject.label }))
    case 'Bagian':
      return (draftExam.value?.sections ?? []).map(section => ({
        value: section.title,
        label: section.title,
        description: sectionSummary(section),
      }))
    default:
      return []
  }
})

/** Search only earns its place on a list too long to scan — TKA SMA has 22. */
const searchable = computed(() => choices.value.length > 8)

const visibleChoices = computed(() => {
  if (!searchable.value || !search.value.trim()) return choices.value
  const needle = search.value.trim().toLowerCase()
  return choices.value.filter(choice => choice.label.toLowerCase().includes(needle))
})

const selectedValue = computed(() => {
  switch (currentStep.value) {
    case 'Bentuk paket': return isPractice.value ? 'latihan' : 'ujian'
    case 'Rumpun': return family.value
    case 'Program': return draft.examTypeSlug
    case 'Mode': return draft.mode
    case 'Mata pelajaran': return practice.subject
    case 'Bagian': return draft.sectionTitle
    default: return ''
  }
})

/** A step blocks Lanjut until it has an answer; free-text steps never do. */
const canContinue = computed(() => {
  switch (currentStep.value) {
    case 'Rumpun': return Boolean(family.value)
    case 'Program': return Boolean(draftExam.value)
    case 'Mata pelajaran': return subjectChoices.value.some(subject => subject.slug === practice.subject)
    case 'Bagian': return Boolean(draft.sectionTitle)
    default: return true
  }
})

/* ------------------------------------------------------------- selecting */

function select(value: string) {
  switch (currentStep.value) {
    case 'Bentuk paket':
      if (isPractice.value === (value === 'latihan')) return
      draft.mode = value === 'latihan' ? 'latihan' : 'simulasi'
      draft.examTypeSlug = ''
      draft.sectionTitle = ''
      family.value = ''
      break
    case 'Rumpun':
      if (family.value === value) return
      family.value = value as ExamFamily
      draft.examTypeSlug = ''
      draft.sectionTitle = ''
      break
    case 'Program':
      if (draft.examTypeSlug === value) return
      draft.examTypeSlug = value
      draft.sectionTitle = ''
      break
    case 'Mode':
      if (draft.mode === value) return
      draft.mode = value as ProductMode
      draft.sectionTitle = ''
      break
    case 'Mata pelajaran':
      practice.subject = value
      break
    case 'Bagian':
      draft.sectionTitle = value
      break
  }
}

function selectLevel(value: string | number) {
  const level = value as EducationLevel
  if (level === practice.level) return
  practice.level = level
  practice.grade = gradesFor(level)[0] ?? 1
  practice.subject = ''
}

function selectGrade(value: string | number) {
  practice.grade = Number(value)
  practice.subject = ''
}

/* --------------------------------------------------------------- dialog */

function start() {
  Object.assign(draft, props.identity)
  Object.assign(practice, props.identity.schoolPractice ?? PRACTICE_DEFAULT)
  family.value = savedExam.value ? examFamilyOf(savedExam.value) ?? '' : ''
  stepIndex.value = 0
  search.value = ''
  open.value = true
}

function move(offset: number) {
  stepIndex.value = Math.min(Math.max(stepIndex.value + offset, 0), steps.value.length - 1)
  search.value = ''
}

function apply() {
  if (props.confirmChange && !props.confirmChange()) return
  emit('apply', {
    examTypeSlug: isPractice.value ? '' : draft.examTypeSlug,
    mode: draft.mode,
    sectionTitle: isPractice.value || !needsSectionChoice(draftExam.value, draft.mode)
      ? ''
      : draft.sectionTitle,
    schoolPractice: isPractice.value
      ? { ...practice, topic: practice.topic.trim() || undefined }
      : null,
  })
  open.value = false
}

/* -------------------------------------------------------------- summary */

const subjectLabel = (slug: string) =>
  subjects.data.value.find(subject => subject.slug === slug)?.label ?? slug

/** The card's rows: what is decided, in the order it was decided. */
const summary = computed<{ label: string, value: string }[]>(() => {
  const school = props.identity.schoolPractice
  if (school) {
    return [
      { label: 'Bentuk', value: 'Latihan mata pelajaran' },
      { label: 'Jenjang & kelas', value: `${school.level} · Kelas ${school.grade}` },
      { label: 'Mata pelajaran', value: subjectLabel(school.subject) },
      { label: 'Bab atau topik', value: school.topic || 'Beberapa topik' },
    ]
  }

  const exam = savedExam.value
  const unset = 'Belum dipilih'
  if (!exam) {
    return [
      { label: 'Bentuk', value: props.identity.examTypeSlug ? 'Simulasi ujian' : unset },
      // A legacy product's blueprint may be gone; show what it stores.
      { label: 'Program', value: props.identity.examTypeSlug || unset },
      { label: 'Mode', value: unset },
      { label: 'Bagian', value: props.identity.sectionTitle || unset },
    ]
  }
  return [
    { label: 'Rumpun', value: examFamilyLabel(examFamilyOf(exam)) || unset },
    { label: 'Program', value: exam.label },
    {
      label: 'Mode',
      value: props.identity.mode === 'mini_tryout'
        ? 'Mini tryout'
        : exam.simulationScope === 'section' ? 'Satu bagian penuh' : 'Simulasi lengkap',
    },
    { label: 'Bagian', value: props.identity.sectionTitle || 'Seluruh bagian' },
  ]
})

const chosen = computed(() => Boolean(props.identity.examTypeSlug || props.identity.schoolPractice))
</script>

<template>
  <section class="overflow-hidden rounded-md border border-hairline bg-surface" aria-labelledby="package-identity-title">
    <div class="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
      <h3 id="package-identity-title" class="text-[0.9rem] font-semibold text-ink">Identitas paket</h3>
      <AppButton v-if="!locked" variant="outline" size="sm" @click="start">
        {{ chosen ? 'Ubah' : 'Pilih' }}
      </AppButton>
      <span v-else class="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted">
        <AppIcon name="lock-simple" :size="14" aria-hidden="true" />
        Terkunci
      </span>
    </div>

    <dl class="divide-y divide-hairline px-4">
      <div
        v-for="row in summary"
        :key="row.label"
        class="grid gap-0.5 py-3 text-[0.9rem] sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
      >
        <dt class="text-muted">{{ row.label }}</dt>
        <dd class="font-medium text-ink">{{ row.value }}</dd>
      </div>
    </dl>
  </section>

  <AppModal
    v-model="open"
    :title="currentStep"
    :description="`Langkah ${stepIndex + 1} dari ${steps.length} · Identitas paket`"
  >
    <div class="grid gap-4">
      <!-- Jenjang & kelas: two bound dropdowns, not a list — the answer is a
           pair, and kelas depends on jenjang. -->
      <template v-if="currentStep === 'Jenjang & kelas'">
        <AppSelect
          label="Jenjang"
          :model-value="practice.level"
          :options="EDUCATION_LEVELS.map(item => ({ value: item.value, label: item.value }))"
          @update:model-value="selectLevel"
        />
        <AppSelect
          label="Kelas"
          :model-value="practice.grade"
          :options="gradeChoices.map(grade => ({ value: grade, label: `Kelas ${grade}` }))"
          @update:model-value="selectGrade"
        />
      </template>

      <!-- Bab: free text on purpose. A picker would need every chapter of
           every subject of every grade, and would be stale within a year. -->
      <template v-else-if="currentStep === 'Bab atau topik'">
        <FormField
          id="practice-topic"
          v-model="practice.topic"
          label="Bab atau topik"
          placeholder="Contoh: Persamaan linear satu variabel"
        />
        <p class="text-[0.84rem] leading-[1.6] text-muted">
          Boleh dikosongkan kalau paket ini mencakup beberapa bab dalam satu mata pelajaran.
        </p>
      </template>

      <template v-else>
        <FormField
          v-if="searchable"
          id="identity-search"
          v-model="search"
          label="Cari"
          placeholder="Ketik nama program atau mata pelajaran"
        />

        <p v-if="currentStep === 'Mata pelajaran' && subjects.pending.value" role="status" class="py-8 text-center text-[0.9rem] text-muted">
          Memuat mata pelajaran...
        </p>
        <AppAlert
          v-else-if="currentStep === 'Mata pelajaran' && subjects.error.value"
          variant="danger"
          title="Daftar mata pelajaran belum bisa dimuat"
        >
          <AppButton size="sm" variant="outline" class="mt-2" @click="subjects.refresh()">Coba lagi</AppButton>
        </AppAlert>

        <!-- max-h keeps a 22-mapel list inside the viewport; AppModal itself
             does not constrain its body height. -->
        <div v-else class="grid max-h-[min(24rem,55vh)] gap-2 overflow-y-auto" role="radiogroup" :aria-label="currentStep">
          <button
            v-for="choice in visibleChoices"
            :key="choice.value"
            type="button"
            role="radio"
            :aria-checked="selectedValue === choice.value"
            class="flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            :class="selectedValue === choice.value
              ? 'border-primary bg-primary-soft'
              : 'border-hairline bg-surface hover:border-line hover:bg-surface-alt'"
            @click="select(choice.value)"
          >
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-2">
                <span class="text-[0.92rem] font-semibold text-ink">{{ choice.label }}</span>
                <span
                  v-if="choice.note"
                  class="rounded-pill bg-surface-sunken px-2 py-0.5 text-[0.7rem] font-semibold text-muted"
                >{{ choice.note }}</span>
              </span>
              <span v-if="choice.description" class="mt-1 block text-[0.82rem] leading-[1.55] text-muted">
                {{ choice.description }}
              </span>
            </span>
            <AppIcon
              v-if="selectedValue === choice.value"
              name="check-circle"
              :size="20"
              class="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
          </button>

          <p v-if="!visibleChoices.length" role="status" class="py-8 text-center text-[0.9rem] text-muted">
            Tidak ada pilihan yang cocok.
          </p>
        </div>
      </template>
    </div>

    <template #footer>
      <AppButton variant="ghost" size="sm" @click="stepIndex ? move(-1) : (open = false)">
        {{ stepIndex ? 'Kembali' : 'Batal' }}
      </AppButton>
      <AppButton v-if="!isLastStep" size="sm" :disabled="!canContinue" @click="move(1)">
        Lanjut
      </AppButton>
      <AppButton v-else size="sm" :disabled="!canContinue" @click="apply">
        Gunakan pilihan
      </AppButton>
    </template>
  </AppModal>
</template>
