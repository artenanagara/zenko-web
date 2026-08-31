<script setup lang="ts">
import { TutorOptionField } from '#components'
import type {
  QuestionDraft,
  QuestionKind,
  QuestionOption,
  TutorPassage,
  TutorQuestion,
  MatchingData,
} from '#shared/types/tutor-product'
import { MAX_QUESTIONS_PER_PASSAGE } from '#shared/types/tutor-product'
import { buildQuestionDraft, type QuestionDraftState } from '~/utils/questionDraft'

/**
 * Editor satu soal (kontrak §6 — "Editor Soal & Ergonomi Tutor 10/10").
 * Bentuk formnya mengikuti `kind`, which starts from the section default but
 * can be changed for each question:
 * - single_choice: opsi A–E + pilih kunci jawaban
 * - weighted: opsi A–E + bobot 0–5 per opsi (gaya TKP)
 * - true_false: daftar pernyataan dengan toggle Benar/Salah
 * - short_answer: daftar jawaban yang diterima
 * Pembahasan selalu wajib — server menolak submit tanpa itu. Wacana
 * (stimulus) selalu opsional, dipakai kelompok soal literasi/studi kasus.
 *
 * Emits the validated draft; the parent owns the API call, so this form works
 * the same for create and edit. `save-and-next` asks the parent to also open
 * a fresh blank form right after — the continuous-entry flow the contract
 * calls "Simpan & Buat Soal Berikutnya".
 */
const props = defineProps<{
  initial: TutorQuestion | null
  defaultKind: QuestionKind
  /** Section default used as the initial suggestion for new questions. */
  isCustom?: boolean
  saving: boolean
  productId: string
  sectionId: string
  /** Exam type of the paket, used to label the official TKA formats. */
  examTypeSlug?: string
  /**
   * Jenis soal yang diizinkan subtes ini (dari template jenis ujian). Absen/
   * kosong = semua jenis boleh. Tepat satu jenis (SKD) = pemilih jenis soal
   * disembunyikan — jenisnya mengikuti subtes.
   */
  allowedKinds?: QuestionKind[] | null
  /**
   * Bentuk ketat CAT BKN (produk SKD): pilihan ganda/TKP wajib tepat 5 opsi,
   * bobot TKP 1–5 — lihat questionDraft.ts.
   */
  skdStrict?: boolean
  /** Wacana subtes ini yang bisa ditautkan (fitur TKA); absen = tanpa pemilih wacana. */
  passages?: TutorPassage[] | null
  /**
   * Jumlah soal LAIN yang sudah menautkan tiap wacana (soal yang sedang
   * diedit tidak dihitung) — untuk menegakkan batas 5 soal/wacana di client.
   */
  passageUsage?: Record<string, number>
}>()

const emit = defineEmits<{
  save: [draft: QuestionDraft]
  saveAndNext: [draft: QuestionDraft]
  cancel: []
}>()

const uid = useId()

/**
 * Ref per baris opsi (choiceRows ATAU statements — cuma satu yang pernah
 * dirender sekaligus karena `kind` tetap sepanjang umur form ini), dipakai
 * jumpBetweenOptions untuk memindah fokus lewat `focus()` yang diekspos
 * TutorOptionField, bukan lagi query DOM `<textarea>` (lihat komentar di
 * fungsi itu).
 */
const optionFieldRefs = ref<(InstanceType<typeof TutorOptionField> | null)[]>([])

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

const KIND_OPTIONS: { value: QuestionKind, label: string }[] = [
  { value: 'single_choice', label: 'Pilihan ganda (A–E, satu benar)' },
  { value: 'multiple_choice', label: 'Pilihan ganda kompleks (minimal dua benar)' },
  { value: 'weighted', label: 'Berbobot (semua opsi bernilai, gaya TKP)' },
  { value: 'true_false', label: 'Benar/Salah (daftar pernyataan)' },
  { value: 'short_answer', label: 'Isian singkat' },
  { value: 'assertion_reason', label: 'Sebab-akibat (A–E)' },
  { value: 'associative_choice', label: 'Asosiatif (1, 2, 3, 4)' },
  { value: 'matching', label: 'Menjodohkan' },
  { value: 'ordering', label: 'Mengurutkan langkah' },
]

/**
 * Kunci jenis per subtes (rework SKD/TKA): allowedKinds berisi tepat satu
 * jenis pada subtes SKD — pemilih disembunyikan, jenisnya milik subtes, bukan
 * pilihan tutor. Daftar lebih panjang memfilter opsi pemilih; absen/kosong
 * membuka semuanya (TKA & produk legacy).
 */
const lockedKind = computed<QuestionKind | null>(() =>
  props.allowedKinds?.length === 1 ? props.allowedKinds[0]! : null,
)

const kind = ref<QuestionKind>(lockedKind.value ?? props.initial?.kind ?? props.defaultKind)

/**
 * Opsi pemilih jenis: difilter allowedKinds, dan pada paket TKA hanya format
 * resmi yang diberi badge. Jenis custom tetap tersedia bila diizinkan, tetapi
 * tidak diberi label tambahan di UI.
 */
const kindOptions = computed(() => {
  const allowed = props.allowedKinds?.length ? props.allowedKinds : null
  return KIND_OPTIONS
    .filter(option => !allowed || allowed.includes(option.value))
    .map((option) => {
      const badge = tkaKindBadge(props.examTypeSlug, option.value) === 'Format Resmi TKA'
        ? 'Format Resmi TKA'
        : undefined
      return badge ? { ...option, badge } : option
    })
})

/**
 * AppSelect works in plain string|number; narrow its `update:modelValue` back
 * onto the typed field instead of casting (same guard TutorCustomSections.vue
 * uses for the section-level "Tipe soal bawaan" select).
 */
function isQuestionKind(value: string | number): value is QuestionKind {
  return kindOptions.value.some(option => option.value === value)
}

/** Label statis jenis terkunci (SKD) — pengganti pemilih yang disembunyikan. */
const lockedKindLabel = computed(() => {
  if (!lockedKind.value) return ''
  return KIND_OPTIONS.find(option => option.value === lockedKind.value)?.label ?? lockedKind.value
})

/** Badge aktif hanya untuk format resmi TKA. Jenis custom tidak ditampilkan. */
const activeKindBadge = computed(() =>
  tkaKindBadge(props.examTypeSlug, kind.value) === 'Format Resmi TKA' ? 'Format Resmi TKA' : null,
)
const stimulus = ref(props.initial?.stimulus ?? '')
const stimulusOpen = ref(!!props.initial?.stimulus)
const prompt = ref(props.initial?.prompt ?? '')
const explanation = ref(props.initial?.explanation ?? '')

/* -------------------------------------------------------------------------
 * Wacana bersama (grup stimulus, fitur TKA) — soal ini boleh menautkan satu
 * wacana subtes; teksnya tampil di panel bacaan tetap saat siswa mengerjakan.
 * '' berarti soal berdiri sendiri (dan melepas tautan saat PATCH).
 * ---------------------------------------------------------------------- */

const passageId = ref(props.initial?.passageId ?? '')

const hasPassagePicker = computed(() => (props.passages?.length ?? 0) > 0)

const passageOptions = computed(() => [
  { value: '', label: 'Tanpa wacana (soal berdiri sendiri)' },
  ...(props.passages ?? []).map((passage, index) => {
    const used = props.passageUsage?.[passage.id] ?? 0
    const name = passage.title.trim() || `Wacana ${index + 1}`
    const full = used >= MAX_QUESTIONS_PER_PASSAGE && passage.id !== passageId.value
    return {
      value: passage.id,
      label: `${name} (${used}/${MAX_QUESTIONS_PER_PASSAGE} soal)${full ? ' — penuh' : ''}`,
    }
  }),
])

/** Batas 5 soal/wacana ditegakkan di client juga — server tetap penjaga akhir. */
function selectPassage(value: string | number) {
  const id = String(value)
  if (id && id !== props.initial?.passageId) {
    const used = props.passageUsage?.[id] ?? 0
    if (used >= MAX_QUESTIONS_PER_PASSAGE) {
      toast.error('Wacana penuh.', `Satu wacana maksimal ${MAX_QUESTIONS_PER_PASSAGE} soal.`)
      return
    }
  }
  passageId.value = id
}

/* Per-kind state, hydrated from `initial` where the kind matches. */

function initialOptions(): QuestionOption[] {
  return props.initial?.options ?? []
}

// single_choice & weighted: lima baris tetap A–E; baris kosong tidak dikirim.
const choiceRows = ref(OPTION_LETTERS.map((letter, index) => {
  const source = props.initial && !['true_false', 'matching', 'short_answer'].includes(props.initial.kind)
    ? initialOptions()[index]
    : undefined
  return {
    letter,
    text: source?.text ?? '',
    weight: source?.weight ?? null as number | null,
    imageUrl: source?.imageUrl ?? '',
  }
}))

const correctIndex = ref(
  ['single_choice', 'assertion_reason', 'associative_choice'].includes(props.initial?.kind ?? '')
    ? initialOptions().findIndex(option => option.isCorrect)
    : -1,
)

const correctIndexes = ref(
  props.initial?.kind === 'multiple_choice'
    ? initialOptions().flatMap((option, index) => option.isCorrect ? [index] : [])
    : [],
)

// true_false: pernyataan + kuncinya.
const statements = ref(
  props.initial?.kind === 'true_false'
    ? initialOptions().map(option => ({ text: option.text, isCorrect: option.isCorrect === true, imageUrl: option.imageUrl ?? '' }))
    : [{ text: '', isCorrect: true, imageUrl: '' }, { text: '', isCorrect: false, imageUrl: '' }],
)

// short_answer: daftar jawaban yang diterima.
const answers = ref(
  props.initial?.kind === 'short_answer' && props.initial.answers?.length
    ? [...props.initial.answers]
    : [''],
)

const matchingLeftRows = ref(Array.from({ length: 5 }, (_, index) => ({
  label: String(index + 1),
  text: props.initial?.kind === 'matching' ? initialOptions()[index]?.text ?? '' : '',
})))
const matchingItems = ref<MatchingData['items']>(props.initial?.kind === 'matching' ? [...(props.initial.matching?.items ?? [])] : [{ id: 'a', text: '' }, { id: 'b', text: '' }])
const matchingPairs = ref<Record<string, string>>(props.initial?.kind === 'matching' ? { ...(props.initial.matching?.pairs ?? {}) } : {})
/**
 * `ordering` menyimpan IDENTITAS BARIS (huruf tetap baris A–E, sama dengan
 * yang tertulis di sebelah kotak teksnya), bukan label yang dikirim ke server.
 *
 * Keduanya berbeda karena menyimpan melabeli ulang opsi berdasarkan posisi,
 * supaya baris kosong di tengah tidak menyisakan celah di mata siswa (lihat
 * komentar di buildDraft). Jadi baris A, B, D yang terisi tersimpan sebagai
 * opsi A, B, C. Dulu editor mengirim huruf barisnya apa adanya ("D") ke
 * validasi yang sudah berpikir posisional ("C"), pilihan itu terbuang, dan
 * tutor kena "Tentukan urutan semua item." tanpa ada cara memenuhinya.
 *
 * Perbaikannya menaruh penerjemahan di batas simpan (orderingAsLabels), bukan
 * di tampilan: huruf yang dilihat tutor tetap huruf barisnya, tidak ikut
 * bergeser saat baris lain dikosongkan, dan pilihan yang sudah dibuat tetap
 * menempel pada item yang sama.
 */
function initialOrdering(): string[] {
  if (props.initial?.kind !== 'ordering') return []
  // Opsi tersimpan sudah rapat, jadi posisinya = baris tempat ia dimuat.
  const savedLabels = initialOptions().map(option => option.label)
  return (props.initial.ordering ?? []).map((label) => {
    const at = savedLabels.indexOf(label)
    // Label yang tidak dikenal (soal lama/impor yang datanya tidak sinkron)
    // jadi posisi kosong, bukan pilihan hantu: tutor melihat satu dropdown
    // yang belum terisi, bukan error saat baru membuka soalnya.
    return at >= 0 ? OPTION_LETTERS[at] ?? '' : ''
  })
}

const ordering = ref<string[]>(initialOrdering())

/**
 * Baris opsi yang sudah ada isinya. Dipakai kind `ordering` untuk dua hal
 * sekaligus — berapa posisi yang perlu diisi, dan apa saja kandidat tiap
 * posisi — yang sebelumnya masing-masing memfilter ulang di template.
 */
const filledChoiceRows = computed(() => choiceRows.value.filter(row => stripHtmlToText(row.text)))

/**
 * Kandidat isi tiap posisi urutan. `value` adalah identitas baris supaya
 * pilihan tetap menempel pada itemnya, `label` memakai huruf baris + teksnya
 * supaya cocok dengan apa yang tertulis di editor opsi tepat di atasnya.
 */
const orderingOptions = computed(() => filledChoiceRows.value.map(row => ({
  value: row.letter,
  label: `${row.letter} — ${stripHtmlToText(row.text)}`,
})))

/** Huruf yang akan tersimpan untuk tiap baris terisi: A, B, C, ... rapat. */
const orderingLabelByRow = computed(
  // Tuple eksplisit: tanpa ini kunci Map mewarisi tipe literal 'A'|..|'E' dari
  // OPTION_LETTERS, dan `ordering` yang bertipe string[] tidak bisa mencarinya.
  () => new Map(filledChoiceRows.value.map((row, at) => [row.letter, OPTION_LETTERS[at]!] as [string, string])),
)

/** Pilihan tutor diterjemahkan ke label posisional — bentuk yang dikirim. */
function orderingAsLabels(): string[] {
  return ordering.value
    .slice(0, filledChoiceRows.value.length)
    .flatMap((rowLetter) => {
      const label = orderingLabelByRow.value.get(rowLetter)
      return label ? [label] : []
    })
}

/**
 * Menjaga satu invarian: `ordering` hanya boleh berisi baris yang masih ada
 * isinya. Tanpa ini, mengosongkan satu baris meninggalkan pilihan yang
 * menunjuk item yang sudah tidak ada di dropdown — bug yang sama lewat pintu
 * lain.
 *
 * Sisanya dirapatkan, bukan dikosongkan: jawaban `ordering` itu SEBUAH URUTAN,
 * dan yang berarti di situ adalah item mana sebelum item mana. Menghapus satu
 * item memang menggeser semua nomor sesudahnya — jadi "A, B, D" yang kehilangan
 * B menjadi "A, D" utuh dan bisa langsung disimpan, bukan menyisakan posisi
 * kosong yang harus tutor isi ulang dengan jawaban yang sama.
 */
function pruneOrdering() {
  const available = new Set<string>(filledChoiceRows.value.map(row => row.letter))
  ordering.value = ordering.value
    .filter(rowLetter => available.has(rowLetter))
    .slice(0, filledChoiceRows.value.length)
}

// Dipicu hanya saat KUMPULAN baris terisi berubah, bukan tiap ketukan huruf.
watch(() => filledChoiceRows.value.map(row => row.letter).join(','), pruneOrdering)

/**
 * Item kanan yang bisa dipasangkan ke tiap item kiri. Item yang belum diberi
 * teks tetap terdaftar dengan id-nya sebagai label, sama seperti sebelumnya:
 * tutor kadang menyusun pasangannya lebih dulu, baru menulis teksnya.
 */
const matchingItemOptions = computed(() => matchingItems.value.map(item => ({
  value: item.id,
  label: item.text || item.id,
})))

/**
 * Which block a validation failure belongs to, so submit() can put the tutor
 * in front of it. This form is long — nine question kinds, each with its own
 * editor — and "Isi minimal dua opsi." shown at the very bottom told them
 * nothing about where to scroll.
 */
type ValidationAnchor = 'prompt' | 'choices' | 'statements' | 'matching' | 'answers'

const promptBlockRef = ref<HTMLElement | null>(null)
const choicesBlockRef = ref<HTMLElement | null>(null)
const statementsBlockRef = ref<HTMLElement | null>(null)
const matchingBlockRef = ref<HTMLElement | null>(null)
const answersBlockRef = ref<HTMLElement | null>(null)

const ANCHOR_REFS: Record<ValidationAnchor, Ref<HTMLElement | null>> = {
  prompt: promptBlockRef,
  choices: choicesBlockRef,
  statements: statementsBlockRef,
  matching: matchingBlockRef,
  answers: answersBlockRef,
}

interface ValidationFailure {
  message: string
  anchor: ValidationAnchor
}

/** Set by buildDraft() on the way out; read by submit() to raise the toast. */
let validationFailure: ValidationFailure | null = null

/** Records why the draft is invalid and returns null, the shape buildDraft() wants. */
function fail(message: string, anchor: ValidationAnchor): null {
  validationFailure = { message, anchor }
  return null
}

/**
 * Read-and-clear. Going through a function rather than reading the variable
 * directly also keeps TypeScript honest: at the call site it has just seen
 * `validationFailure = null` and would otherwise narrow the type to `null`,
 * blind to buildDraft() having written to it in between.
 */
function takeValidationFailure(): ValidationFailure | null {
  const failure = validationFailure
  validationFailure = null
  return failure
}

const toast = useToast()

function addStatement() {
  statements.value.push({ text: '', isCorrect: true, imageUrl: '' })
}

function removeStatement(index: number) {
  statements.value.splice(index, 1)
}

function addAnswer() {
  answers.value.push('')
}

function removeAnswer(index: number) {
  answers.value.splice(index, 1)
}

function addMatchingItem() {
  matchingItems.value.push({ id: `item-${matchingItems.value.length + 1}`, text: '' })
}

function removeMatchingItem(index: number) {
  const removed = matchingItems.value[index]
  if (!removed) return
  matchingItems.value.splice(index, 1)
  for (const left of Object.keys(matchingPairs.value)) {
    if (matchingPairs.value[left] === removed.id) delete matchingPairs.value[left]
  }
}

function choiceKind(value: QuestionKind) {
  return ['single_choice', 'multiple_choice', 'weighted', 'assertion_reason', 'associative_choice', 'ordering'].includes(value)
}

function correctChoiceKind(value: QuestionKind) {
  return ['single_choice', 'multiple_choice', 'assertion_reason', 'associative_choice'].includes(value)
}

function buildDraft(): QuestionDraft | null {
  const result = buildQuestionDraft({
    kind: kind.value,
    prompt: prompt.value,
    explanation: explanation.value,
    stimulus: stimulus.value,
    passageId: passageId.value,
    skdStrict: props.skdStrict,
    choiceRows: choiceRows.value,
    correctIndex: correctIndex.value,
    correctIndexes: correctIndexes.value,
    statements: statements.value,
    answers: answers.value,
    matchingLeftRows: matchingLeftRows.value,
    matchingItems: matchingItems.value,
    matchingPairs: matchingPairs.value,
    ordering: ordering.value,
  } satisfies QuestionDraftState)

  if ('error' in result) return fail(result.error.message, result.error.anchor)
  return result.draft
}

/* -------------------------------------------------------------------------
 * Pratinjau tampilan siswa — best-effort dari state saat ini, tidak divalidasi
 * (tutor boleh mengecek tampilan sebelum soal lengkap).
 * ---------------------------------------------------------------------- */

const previewDraft = computed<QuestionDraft>(() => {
  const trimmedStimulus = stripHtmlToText(stimulus.value) ? stimulus.value : ''
  const base = {
    kind: kind.value,
    prompt: prompt.value,
    explanation: explanation.value,
    ...(trimmedStimulus ? { stimulus: trimmedStimulus } : {}),
  }

  if (choiceKind(kind.value)) {
    return {
      ...base,
      options: choiceRows.value
        .filter(row => stripHtmlToText(row.text))
        .map((row, at) => ({
          label: OPTION_LETTERS[at]!,
          text: row.text,
          ...(correctChoiceKind(kind.value)
            ? { isCorrect: kind.value === 'multiple_choice' ? correctIndexes.value.includes(choiceRows.value.indexOf(row)) : choiceRows.value.indexOf(row) === correctIndex.value }
            : kind.value === 'weighted' ? { weight: row.weight ?? 0 } : {}),
          ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
        })),
    }
  }

  if (kind.value === 'true_false') {
    return {
      ...base,
      options: statements.value
        .filter(statement => stripHtmlToText(statement.text))
        .map((statement, at) => ({
          label: String(at + 1),
          text: statement.text,
          isCorrect: statement.isCorrect,
          ...(statement.imageUrl ? { imageUrl: statement.imageUrl } : {}),
        })),
    }
  }

  if (kind.value === 'matching') {
    return {
      ...base,
      options: matchingLeftRows.value.filter(row => stripHtmlToText(row.text)).map(row => ({ label: row.label, text: row.text })),
      matching: { items: matchingItems.value.filter(item => stripHtmlToText(item.text)), pairs: matchingPairs.value },
    }
  }

  if (kind.value === 'ordering') {
    return {
      ...base,
      options: filledChoiceRows.value.map((row, at) => ({ label: OPTION_LETTERS[at]!, text: row.text })),
      // Lewat penerjemah yang sama seperti simpan: pratinjau memakai opsi yang
      // sudah dilabeli ulang, jadi urutannya harus bicara bahasa yang sama.
      ordering: orderingAsLabels(),
    }
  }

  return { ...base, answers: answers.value.filter(Boolean) }
})

defineExpose({ previewDraft, getDraft: getDraftForParent })

/* -------------------------------------------------------------------------
 * Draft lokal (localStorage) — penyelamat kalau koneksi putus atau laptop
 * mati di tengah mengetik. Autosave setiap ~2 detik; dihapus begitu soal
 * berhasil disubmit ke server.
 * ---------------------------------------------------------------------- */

const draftKey = computed(() => `zenko:tutor:qdraft:${props.productId}:${props.sectionId}:${props.initial?.id ?? 'new'}`)
const restoreAvailable = ref(false)
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    if (typeof window === 'undefined') return
    const snapshot = {
      kind: kind.value,
      stimulus: stimulus.value,
      passageId: passageId.value,
      prompt: prompt.value,
      explanation: explanation.value,
      choiceRows: choiceRows.value,
      correctIndex: correctIndex.value,
      correctIndexes: correctIndexes.value,
      statements: statements.value,
      answers: answers.value,
      matchingLeftRows: matchingLeftRows.value,
      matchingItems: matchingItems.value,
      matchingPairs: matchingPairs.value,
      ordering: ordering.value,
    }
    window.localStorage.setItem(draftKey.value, JSON.stringify(snapshot))
  }, 2000)
}

watch(
  [kind, stimulus, prompt, explanation, choiceRows, correctIndex, correctIndexes, statements, answers, matchingLeftRows, matchingItems, matchingPairs, ordering],
  scheduleAutosave,
  { deep: true },
)

onMounted(() => {
  if (window.localStorage.getItem(draftKey.value)) restoreAvailable.value = true
})

onBeforeUnmount(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
})

function restoreDraft() {
  const raw = window.localStorage.getItem(draftKey.value)
  restoreAvailable.value = false
  if (!raw) return
  try {
    const snapshot = JSON.parse(raw) as {
      kind?: QuestionKind
      stimulus?: string
      passageId?: string
      prompt?: string
      explanation?: string
      choiceRows?: typeof choiceRows.value
      correctIndex?: number
      correctIndexes?: number[]
      statements?: typeof statements.value
      answers?: string[]
      matchingLeftRows?: typeof matchingLeftRows.value
      matchingItems?: typeof matchingItems.value
      matchingPairs?: Record<string, string>
      ordering?: string[]
    }
    if (!lockedKind.value && snapshot.kind && kindOptions.value.some(option => option.value === snapshot.kind)) {
      kind.value = snapshot.kind
    }
    // Wacana yang sudah tidak ada (dihapus sejak draft ditulis) tidak dipulihkan.
    if (snapshot.passageId !== undefined) {
      passageId.value = (props.passages ?? []).some(passage => passage.id === snapshot.passageId)
        ? snapshot.passageId
        : ''
    }
    stimulus.value = snapshot.stimulus ?? ''
    if (stripHtmlToText(stimulus.value)) stimulusOpen.value = true
    prompt.value = snapshot.prompt ?? ''
    explanation.value = snapshot.explanation ?? ''
    if (snapshot.choiceRows) choiceRows.value = snapshot.choiceRows
    if (typeof snapshot.correctIndex === 'number') correctIndex.value = snapshot.correctIndex
    if (snapshot.correctIndexes) correctIndexes.value = snapshot.correctIndexes
    if (snapshot.statements) statements.value = snapshot.statements
    if (snapshot.answers) answers.value = snapshot.answers
    if (snapshot.matchingLeftRows) matchingLeftRows.value = snapshot.matchingLeftRows
    if (snapshot.matchingItems) matchingItems.value = snapshot.matchingItems
    if (snapshot.matchingPairs) matchingPairs.value = snapshot.matchingPairs
    if (snapshot.ordering) ordering.value = snapshot.ordering
    // Draft lama bisa menyimpan pilihan yang barisnya sudah dikosongkan sejak
    // itu (termasuk draft yang ditulis sebelum perbaikan ini) — samakan dulu
    // dengan invariannya sebelum tutor melihatnya.
    pruneOrdering()
  }
  catch {
    // Entri rusak — abaikan saja, biarkan form mulai kosong seperti biasa.
  }
}

function discardDraft() {
  window.localStorage.removeItem(draftKey.value)
  restoreAvailable.value = false
}

function clearDraft() {
  window.localStorage.removeItem(draftKey.value)
}

/* -------------------------------------------------------------------------
 * Submit & pintasan keyboard.
 * ---------------------------------------------------------------------- */

function submit(mode: 'save' | 'save-and-next') {
  validationFailure = null
  const draft = buildDraft()
  if (!draft) {
    const failure = takeValidationFailure()
    if (failure) {
      focusField(ANCHOR_REFS[failure.anchor].value)
      toast.error('Soal belum bisa disimpan.', failure.message)
    }
    return
  }
  clearDraft()
  if (mode === 'save') emit('save', draft)
  else emit('saveAndNext', draft)
}

/**
 * Used by the wizard before it unmounts this form while moving to another
 * step. Without this bridge, a tutor could edit a question and click the
 * step-4 action while the draft was still only in this component's local
 * state; the editor would disappear and the change would never reach the API.
 */
function getDraftForParent(): QuestionDraft | null {
  validationFailure = null
  const draft = buildDraft()
  if (!draft) {
    const failure = takeValidationFailure()
    if (failure) {
      focusField(ANCHOR_REFS[failure.anchor].value)
      toast.error('Soal belum bisa disimpan.', failure.message)
    }
    return null
  }
  clearDraft()
  return draft
}

/** Ctrl/Cmd+Enter = simpan & lanjut; Tab di opsi A–E loncat antar-opsi. */
function onFormKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    submit('save-and-next')
    return
  }
  if (event.key === 'Tab') jumpBetweenOptions(event)
}

/**
 * Loncat Tab antar-opsi A–E (kontrak §6, "Pintasan Keyboard"). TutorOptionField
 * membungkus RichTextEditor — ProseMirror contenteditable, bukan
 * `<textarea>` — jadi ini dulu mengecek `event.target instanceof
 * HTMLTextAreaElement`. `.rte-content` (kelas non-scoped RichTextEditor
 * menandai area edit sungguhannya, lihat editorProps di sana) menggantikan
 * pengecekan tipe elemen itu: cuma Tab yang ditekan SAAT KURSOR ADA DI TEKS
 * opsi yang dicegat, bukan saat fokus ada di input bobot/gambar di sebelahnya
 * atau di input popover toolbar RichTextEditor (mis. field Kode LaTeX rumus)
 * — sama seperti perilaku lama, cuma elemen ankernya beda.
 *
 * `[data-option-row]` di elemen akar TutorOptionField masih dipakai untuk
 * tahu baris ke berapa yang sedang fokus (bukan lewat query), tapi PEMINDAHAN
 * fokusnya sendiri lewat `focus()` yang diekspos komponen tujuan — metode itu
 * tahu cara memfokuskan instance Tiptap di dalamnya, sesuatu yang tidak bisa
 * dilakukan `HTMLElement.focus()` biasa pada sebuah contenteditable ProseMirror.
 */
function jumpBetweenOptions(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.rte-content')) return

  const rowEl = target.closest<HTMLElement>('[data-option-row]')
  if (!rowEl || rowEl.dataset.optionRow === undefined) return

  const nextIndex = Number(rowEl.dataset.optionRow) + (event.shiftKey ? -1 : 1)
  const nextField = optionFieldRefs.value[nextIndex]
  if (nextField) {
    event.preventDefault()
    nextField.focus()
  }
}
</script>

<template>
  <form
    class="grid gap-4 rounded-md border border-hairline-strong bg-surface p-4 md:p-5"
    novalidate
    @submit.prevent="submit('save')"
    @keydown="onFormKeydown"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h4 class="font-bold tracking-[-0.02em]">
        {{ initial ? 'Ubah soal' : 'Tambah soal' }}
      </h4>
    </div>

    <AppSectionMessage v-if="restoreAvailable" appearance="warning">
      <span class="flex flex-wrap items-center justify-between gap-3">
        <span>Draft tersimpan otomatis ditemukan dari sesi sebelumnya.</span>
        <span class="flex shrink-0 items-center gap-3">
          <button type="button" class="font-semibold text-primary hover:underline" @click="restoreDraft">
            Pulihkan
          </button>
          <button type="button" class="font-semibold text-muted hover:text-ink" @click="discardDraft">
            Buang
          </button>
        </span>
      </span>
    </AppSectionMessage>

    <!-- SKD: jenis soal mengikuti subtes (TWK/TIU pilihan ganda, TKP
         berbobot) — tanpa pemilih, cukup keterangan jenisnya. -->
    <div v-if="lockedKind" class="max-w-xl">
      <span :class="FIELD_LABEL_CLASS">Tipe soal</span>
      <p class="rounded-sm border border-hairline bg-surface-alt px-3.5 py-2.5 text-[0.9rem] font-semibold">
        {{ lockedKindLabel }}
      </p>
      <p class="mt-2 text-[0.78rem] text-faint">
        Jenis soal subtes ini terkunci mengikuti format resmi CAT BKN.
      </p>
    </div>

    <div v-else class="max-w-xl">
      <!-- Same control and wording as the section-level "Tipe soal bawaan"
           (TutorCustomSections.vue), so the tutor reads the two as one
           setting: the subtes sets the default, the soal may override it. -->
      <AppSelect
        :options="kindOptions"
        :model-value="kind"
        label="Tipe soal"
        @update:model-value="(value) => { if (isQuestionKind(value)) kind = value }"
      />
      <p v-if="activeKindBadge" class="mt-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.74rem] font-bold"
          :class="activeKindBadge === 'Format Resmi TKA'
            ? 'bg-success-soft text-success-ink'
            : 'bg-surface-sunken text-muted'"
        >
          <AppIcon :name="activeKindBadge === 'Format Resmi TKA' ? 'seal-check' : 'puzzle-piece'" :size="13" />
          {{ activeKindBadge }}
        </span>
      </p>
    </div>

    <!-- Tautan wacana (grup stimulus, TKA): teks bacaannya dikelola di panel
         "Wacana subtes" — di sini soal cuma memilih ikut grup yang mana. -->
    <div v-if="hasPassagePicker" class="max-w-xl">
      <AppSelect
        :options="passageOptions"
        :model-value="passageId"
        label="Wacana subtes (opsional)"
        @update:model-value="selectPassage"
      />
      <p class="mt-2 text-[0.78rem] text-faint">
        Soal-soal dalam satu wacana membaca teks yang sama — maksimal
        {{ MAX_QUESTIONS_PER_PASSAGE }} soal per wacana.
      </p>
    </div>

    <div>
      <button
        v-if="!stimulusOpen"
        type="button"
        class="text-[0.86rem] font-semibold text-primary hover:underline"
        @click="stimulusOpen = true"
      >
        + Tambah wacana bacaan (opsional)
      </button>
      <div v-else>
        <div class="mb-2 flex items-center justify-between">
          <span :class="FIELD_LABEL_CLASS">Wacana (opsional)</span>
          <button
            type="button"
            class="text-[0.82rem] font-semibold text-muted transition-colors hover:text-ink"
            @click="stimulusOpen = false; stimulus = ''"
          >
            Hapus wacana
          </button>
        </div>
        <RichTextEditor
          v-model="stimulus"
          aria-label="Wacana"
          placeholder="Teks bacaan bersama untuk kelompok soal literasi/studi kasus."
        />
      </div>
    </div>

    <div ref="promptBlockRef" class="scroll-mt-24">
      <span :class="FIELD_LABEL_CLASS">Pertanyaan</span>
      <RichTextEditor
        v-model="prompt"
        aria-label="Pertanyaan"
        placeholder="Tulis pertanyaan atau instruksi soal. Gunakan tabel untuk data, atau format teks untuk penekanan."
      />
    </div>

    <!-- Choice-based kinds share the same option editor. -->
    <fieldset v-if="choiceKind(kind)" ref="choicesBlockRef" class="grid scroll-mt-24 gap-3">
      <legend :class="FIELD_LABEL_CLASS">
        {{ kind === 'weighted'
          ? (skdStrict ? 'Opsi jawaban TKP — bobot 1–5 per opsi, tanpa jawaban benar' : 'Opsi jawaban + bobot (umumnya 1–5)')
          : kind === 'multiple_choice' ? 'Opsi jawaban — tandai semua kunci yang benar' : kind === 'ordering' ? 'Item yang akan diurutkan' : 'Opsi jawaban — tandai kunci yang benar' }}
      </legend>
      <p v-if="skdStrict && (kind === 'single_choice' || kind === 'weighted')" class="-mt-1 text-[0.78rem] text-faint">
        {{ kind === 'weighted'
          ? 'Semua 5 opsi wajib terisi dan berbobot 1–5 (boleh sama) — setiap jawaban bernilai, tidak ada yang salah.'
          : 'Format CAT BKN: kelima opsi A–E wajib terisi dengan tepat satu kunci jawaban.' }}
      </p>

      <div v-for="(row, index) in choiceRows" :key="row.letter" class="flex items-start gap-2.5">
        <template v-if="kind === 'multiple_choice'">
          <input
            :id="`${uid}-correct-${row.letter}`"
            v-model="correctIndexes"
            type="checkbox"
            :value="index"
            :disabled="!stripHtmlToText(row.text)"
            class="mt-3 h-4 w-4 shrink-0 accent-primary"
          >
          <label :for="`${uid}-correct-${row.letter}`" class="sr-only">
            Kunci jawaban opsi {{ row.letter }}
          </label>
        </template>
        <template v-else-if="correctChoiceKind(kind)">
          <input
            :id="`${uid}-correct-${row.letter}`"
            v-model="correctIndex"
            type="radio"
            :name="`${uid}-correct`"
            :value="index"
            :disabled="!stripHtmlToText(row.text)"
            class="mt-3 h-4 w-4 shrink-0 accent-primary"
          >
          <label :for="`${uid}-correct-${row.letter}`" class="sr-only">
            Kunci jawaban opsi {{ row.letter }}
          </label>
        </template>

        <TutorOptionField
          :ref="(el) => { optionFieldRefs[index] = el as InstanceType<typeof TutorOptionField> | null }"
          v-model:text="row.text"
          v-model:weight="row.weight"
          v-model:image-url="row.imageUrl"
          :letter="row.letter"
          :row-index="index"
          :show-weight="kind === 'weighted'"
          :weight-as-select="kind === 'weighted' && skdStrict"
          :placeholder="`Opsi ${row.letter}${index > 1 && !(skdStrict && (kind === 'single_choice' || kind === 'weighted')) ? ' (opsional)' : ''}`"
          class="flex-1"
        />
      </div>

      <div v-if="kind === 'ordering'" class="grid gap-2">
        <span :class="FIELD_LABEL_CLASS">Urutan yang benar</span>
        <div v-for="(row, position) in filledChoiceRows" :key="`order-${row.letter}`" class="flex items-center gap-2">
          <span class="w-6 text-sm font-bold text-muted">{{ position + 1 }}.</span>
          <!-- Nama aksesibel sama persis dengan yang didengar siswa di
               TryoutQuestion.vue ("Item urutan 1"), supaya tutor dan siswa
               menyebut kontrol yang sama dengan istilah yang sama. -->
          <AppSelect
            :options="orderingOptions"
            :model-value="ordering[position] ?? ''"
            :aria-label="`Item urutan ${position + 1}`"
            placeholder="Pilih item"
            @update:model-value="(value) => { ordering[position] = String(value) }"
          />
        </div>
      </div>
    </fieldset>

    <!-- Matching pairs map each left prompt to one right-hand item. -->
    <fieldset v-else-if="kind === 'matching'" ref="matchingBlockRef" class="grid scroll-mt-24 gap-3">
      <legend :class="FIELD_LABEL_CLASS">Pasangan menjodohkan</legend>
      <div v-for="(row, index) in matchingLeftRows" :key="row.label" class="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TutorOptionField
          :ref="(el) => { optionFieldRefs[index] = el as InstanceType<typeof TutorOptionField> | null }"
          v-model:text="row.text"
          :letter="row.label"
          :row-index="index"
          :placeholder="`Item kiri ${row.label}`"
        />
        <AppSelect
          :options="matchingItemOptions"
          :model-value="matchingPairs[row.label] ?? ''"
          :aria-label="`Pasangan untuk item kiri ${row.label}`"
          placeholder="Pilih pasangan"
          @update:model-value="(value) => { matchingPairs[row.label] = String(value) }"
        />
      </div>
      <div class="grid gap-2">
        <span :class="FIELD_LABEL_CLASS">Item kanan</span>
        <div v-for="(item, index) in matchingItems" :key="item.id" class="flex items-center gap-2">
          <!-- aria-label, bukan cuma placeholder: placeholder hilang begitu
               diketik, dan pola ini sudah dipakai daftar "Jawaban diterima". -->
          <input
            v-model="item.text"
            type="text"
            :class="FIELD_CLASS"
            :aria-label="`Item kanan ${index + 1}`"
            :placeholder="`Item kanan ${index + 1}`"
          >
          <button v-if="matchingItems.length > 2" type="button" class="shrink-0 text-[0.82rem] font-semibold text-danger hover:underline" @click="removeMatchingItem(index)">Hapus</button>
        </div>
        <button type="button" class="justify-self-start text-[0.86rem] font-semibold text-primary hover:underline" @click="addMatchingItem">+ Tambah item kanan</button>
      </div>
    </fieldset>

    <!-- true_false: one key per statement. -->
    <fieldset v-else-if="kind === 'true_false'" ref="statementsBlockRef" class="grid scroll-mt-24 gap-3">
      <legend :class="FIELD_LABEL_CLASS">Pernyataan (tentukan kunci Benar atau Salah)</legend>

      <div v-for="(statement, index) in statements" :key="index" class="flex items-start gap-2.5">
        <TutorOptionField
          :ref="(el) => { optionFieldRefs[index] = el as InstanceType<typeof TutorOptionField> | null }"
          v-model:text="statement.text"
          v-model:image-url="statement.imageUrl"
          :letter="String(index + 1)"
          :row-index="index"
          placeholder="Tulis pernyataan"
          class="flex-1"
        />
        <span class="mt-1 inline-flex shrink-0 overflow-hidden rounded-sm border border-line" role="group" :aria-label="`Kunci pernyataan ${index + 1}`">
          <button
            type="button"
            class="px-3 py-2 text-[0.82rem] font-bold transition-colors"
            :class="statement.isCorrect ? 'bg-success-soft text-success-ink' : 'bg-surface text-muted hover:text-ink'"
            :aria-pressed="statement.isCorrect"
            @click="statement.isCorrect = true"
          >
            Benar
          </button>
          <button
            type="button"
            class="border-l border-line px-3 py-2 text-[0.82rem] font-bold transition-colors"
            :class="!statement.isCorrect ? 'bg-danger-soft text-danger-ink' : 'bg-surface text-muted hover:text-ink'"
            :aria-pressed="!statement.isCorrect"
            @click="statement.isCorrect = false"
          >
            Salah
          </button>
        </span>
        <button
          v-if="statements.length > 1"
          type="button"
          class="mt-1.5 shrink-0 text-[0.82rem] font-semibold text-danger hover:underline"
          @click="removeStatement(index)"
        >
          Hapus
        </button>
      </div>

      <button
        type="button"
        class="justify-self-start text-[0.86rem] font-semibold text-primary hover:underline"
        @click="addStatement"
      >
        + Tambah pernyataan
      </button>
    </fieldset>

    <!-- short_answer: daftar jawaban diterima -->
    <fieldset v-else ref="answersBlockRef" class="grid scroll-mt-24 gap-2.5">
      <legend :class="FIELD_LABEL_CLASS">Jawaban yang diterima</legend>

      <div v-for="(_, index) in answers" :key="index" class="flex items-center gap-2.5">
        <input
          v-model="answers[index]"
          type="text"
          placeholder="Contoh: 36"
          :aria-label="`Jawaban diterima ${index + 1}`"
          :class="FIELD_CLASS"
        >
        <button
          v-if="answers.length > 1"
          type="button"
          class="shrink-0 text-[0.82rem] font-semibold text-danger hover:underline"
          @click="removeAnswer(index)"
        >
          Hapus
        </button>
      </div>

      <button
        type="button"
        class="justify-self-start text-[0.86rem] font-semibold text-primary hover:underline"
        @click="addAnswer"
      >
        + Tambah jawaban
      </button>
    </fieldset>

    <div>
      <span :class="FIELD_LABEL_CLASS">Pembahasan</span>
      <RichTextEditor
        v-model="explanation"
        aria-label="Pembahasan"
        placeholder="Jelaskan cara menjawabnya — wajib diisi sebelum produk bisa diajukan."
      />
    </div>


    <div class="sticky bottom-20 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md md:-mx-5 md:px-5">
      <AppButton type="submit" size="sm" :disabled="saving">
        {{ saving ? 'Menyimpan...' : 'Simpan' }}
      </AppButton>
      <AppButton type="button" variant="outline" size="sm" :disabled="saving" @click="submit('save-and-next')">
        Simpan &amp; berikutnya
      </AppButton>
      <button
        type="button"
        class="text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink"
        @click="emit('cancel')"
      >
        Batal
      </button>
      <span class="text-[0.78rem] text-faint">Ctrl/Cmd + Enter untuk simpan &amp; lanjut</span>
    </div>
  </form>
</template>
