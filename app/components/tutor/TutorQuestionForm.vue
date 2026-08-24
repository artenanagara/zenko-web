<script setup lang="ts">
import { TutorOptionField } from '#components'
import type {
  QuestionDraft,
  QuestionKind,
  QuestionOption,
  TutorQuestion,
} from '#shared/types/tutor-product'

/**
 * Editor satu soal (kontrak §6 — "Editor Soal & Ergonomi Tutor 10/10").
 * Bentuk formnya mengikuti `kind`, yang selalu sama dengan `defaultKind`
 * subtes ini — server mengunci tiap soal ke `defaultKind` section-nya, jadi
 * form ini tidak lagi menawarkan pilihan tipe soal, hanya menampilkannya:
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
  /** Only "Custom" exam types mix question kinds across sections — elsewhere every section already follows one fixed template, so the locked-kind note is noise. */
  isCustom?: boolean
  saving: boolean
  productId: string
  sectionId: string
}>()

const emit = defineEmits<{
  save: [draft: QuestionDraft]
  saveAndNext: [draft: QuestionDraft]
  cancel: []
}>()

const uid = useId()
const formRef = ref<HTMLFormElement | null>(null)

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
  { value: 'weighted', label: 'Berbobot (semua opsi bernilai, gaya TKP)' },
  { value: 'true_false', label: 'Benar/Salah (daftar pernyataan)' },
  { value: 'short_answer', label: 'Isian singkat' },
]

// `kind` selalu sama dengan `defaultKind` subtes — server mengunci ini, tidak
// ada lagi pilihan bebas per soal (lihat komentar berkas di atas).
const kind = ref<QuestionKind>(props.defaultKind)
const kindLabel = computed(() => KIND_OPTIONS.find(option => option.value === props.defaultKind)?.label ?? props.defaultKind)
const stimulus = ref(props.initial?.stimulus ?? '')
const stimulusOpen = ref(!!props.initial?.stimulus)
const prompt = ref(props.initial?.prompt ?? '')
const explanation = ref(props.initial?.explanation ?? '')

/* Per-kind state, hydrated from `initial` where the kind matches. */

function initialOptions(): QuestionOption[] {
  return props.initial?.options ?? []
}

// single_choice & weighted: lima baris tetap A–E; baris kosong tidak dikirim.
const choiceRows = ref(OPTION_LETTERS.map((letter, index) => {
  const source = props.initial && props.initial.kind !== 'true_false'
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
  props.initial?.kind === 'single_choice'
    ? initialOptions().findIndex(option => option.isCorrect)
    : -1,
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

const errorMessage = ref('')

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

/**
 * Validasi ringan sesuai aturan kind; server tetap sumber kebenaran.
 * Pembahasan boleh kosong di sini — server hanya mewajibkannya saat submit
 * produk (lihat internal/handler/tutor_products.go, buildQuestion), supaya
 * tutor bisa menulis semua soal dulu lalu mengisi pembahasan belakangan. Itu
 * yang membuat status 🟡 "belum ada pembahasan" di grid navigasi berarti.
 */
function buildDraft(): QuestionDraft | null {
  if (!stripHtmlToText(prompt.value)) {
    errorMessage.value = 'Tulis pertanyaannya dulu.'
    return null
  }

  const trimmedStimulus = stripHtmlToText(stimulus.value) ? stimulus.value.trim() : ''
  const base = {
    kind: kind.value,
    prompt: prompt.value.trim(),
    explanation: explanation.value.trim(),
    ...(trimmedStimulus ? { stimulus: trimmedStimulus } : {}),
  }

  if (kind.value === 'single_choice' || kind.value === 'weighted') {
    // stripHtmlToText, bukan row.text.trim(): text sekarang HTML, dan
    // ".trim()" pada string HTML tidak lagi berarti "kosong" — sebuah
    // paragraf berisi cuma spasi tetap dianggap non-kosong oleh Tiptap
    // (isEmpty hanya collapse ke '' untuk dok yang benar-benar kosong),
    // jadi ".trim()" pada HTML-nya tidak menangkap kasus itu.
    const filled = choiceRows.value
      .map((row, index) => ({ ...row, index }))
      .filter(row => stripHtmlToText(row.text))

    if (filled.length < 2) {
      errorMessage.value = 'Isi minimal dua opsi.'
      return null
    }

    if (kind.value === 'single_choice') {
      if (!filled.some(row => row.index === correctIndex.value)) {
        errorMessage.value = 'Pilih kunci jawaban dari opsi yang terisi.'
        return null
      }
      return {
        ...base,
        // Relabel berurutan supaya opsi kosong di tengah tidak menyisakan celah.
        options: filled.map((row, at) => ({
          label: OPTION_LETTERS[at]!,
          text: row.text.trim(),
          isCorrect: row.index === correctIndex.value,
          ...(row.imageUrl.trim() ? { imageUrl: row.imageUrl.trim() } : {}),
        })),
      }
    }

    const missingWeight = filled.some(
      row => row.weight === null || !Number.isInteger(row.weight) || row.weight < 0,
    )
    if (missingWeight) {
      errorMessage.value = 'Isi bobot (bilangan bulat ≥ 0) untuk tiap opsi yang terisi.'
      return null
    }
    return {
      ...base,
      options: filled.map((row, at) => ({
        label: OPTION_LETTERS[at]!,
        text: row.text.trim(),
        weight: row.weight!,
        ...(row.imageUrl.trim() ? { imageUrl: row.imageUrl.trim() } : {}),
      })),
    }
  }

  if (kind.value === 'true_false') {
    const filled = statements.value.filter(statement => stripHtmlToText(statement.text))
    if (filled.length === 0) {
      errorMessage.value = 'Tulis minimal satu pernyataan.'
      return null
    }
    return {
      ...base,
      options: filled.map((statement, at) => ({
        label: String(at + 1),
        text: statement.text.trim(),
        isCorrect: statement.isCorrect,
        ...(statement.imageUrl.trim() ? { imageUrl: statement.imageUrl.trim() } : {}),
      })),
    }
  }

  const accepted = answers.value.map(answer => answer.trim()).filter(Boolean)
  if (accepted.length === 0) {
    errorMessage.value = 'Isi minimal satu jawaban yang diterima.'
    return null
  }
  return { ...base, answers: accepted }
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

  if (kind.value === 'single_choice' || kind.value === 'weighted') {
    return {
      ...base,
      options: choiceRows.value
        .filter(row => stripHtmlToText(row.text))
        .map((row, at) => ({
          label: OPTION_LETTERS[at]!,
          text: row.text,
          ...(kind.value === 'single_choice'
            ? { isCorrect: choiceRows.value.indexOf(row) === correctIndex.value }
            : { weight: row.weight ?? 0 }),
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

  return { ...base, answers: answers.value.filter(Boolean) }
})

defineExpose({ previewDraft })

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
      prompt: prompt.value,
      explanation: explanation.value,
      choiceRows: choiceRows.value,
      correctIndex: correctIndex.value,
      statements: statements.value,
      answers: answers.value,
    }
    window.localStorage.setItem(draftKey.value, JSON.stringify(snapshot))
  }, 2000)
}

watch(
  [kind, stimulus, prompt, explanation, choiceRows, correctIndex, statements, answers],
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
      prompt?: string
      explanation?: string
      choiceRows?: typeof choiceRows.value
      correctIndex?: number
      statements?: typeof statements.value
      answers?: string[]
    }
    // `kind` tidak dipulihkan dari draft lama — selalu mengikuti `defaultKind`
    // subtes saat ini, bahkan kalau draft tersimpan sebelum kind dikunci.
    stimulus.value = snapshot.stimulus ?? ''
    if (stripHtmlToText(stimulus.value)) stimulusOpen.value = true
    prompt.value = snapshot.prompt ?? ''
    explanation.value = snapshot.explanation ?? ''
    if (snapshot.choiceRows) choiceRows.value = snapshot.choiceRows
    if (typeof snapshot.correctIndex === 'number') correctIndex.value = snapshot.correctIndex
    if (snapshot.statements) statements.value = snapshot.statements
    if (snapshot.answers) answers.value = snapshot.answers
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
  errorMessage.value = ''
  const draft = buildDraft()
  if (!draft) return
  clearDraft()
  if (mode === 'save') emit('save', draft)
  else emit('saveAndNext', draft)
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
    ref="formRef"
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

    <!-- Hanya relevan untuk exam type "Custom": subtesnya beda-beda kind,
         jadi tutor perlu diingatkan tipe soal di sini terkunci. Untuk
         template baku (SNBT/SKD/dst) semua subtes sudah satu kind yang
         sama, jadi catatan ini cuma noise. -->
    <div v-if="isCustom">
      <span :class="FIELD_LABEL_CLASS">Tipe soal</span>
      <p class="flex items-center gap-1.5 text-[0.9rem] text-muted">
        <AppIcon name="lock-simple" :size="14" class="shrink-0 text-faint" />
        <span>{{ kindLabel }}</span>
      </p>
      <p class="mt-1 text-[0.78rem] text-faint">
        Tipe soal mengikuti pengaturan subtes ini dan tidak bisa diganti per soal.
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

    <div>
      <span :class="FIELD_LABEL_CLASS">Pertanyaan</span>
      <RichTextEditor
        v-model="prompt"
        aria-label="Pertanyaan"
        placeholder="Tulis pertanyaan atau instruksi soal. Gunakan tabel untuk data, atau format teks untuk penekanan."
      />
    </div>

    <!-- single_choice & weighted: opsi A–E -->
    <fieldset v-if="kind === 'single_choice' || kind === 'weighted'" class="grid gap-3">
      <legend :class="FIELD_LABEL_CLASS">
        {{ kind === 'single_choice' ? 'Opsi jawaban — tandai kunci yang benar' : 'Opsi jawaban + bobot (umumnya 1–5)' }}
      </legend>

      <div v-for="(row, index) in choiceRows" :key="row.letter" class="flex items-start gap-2.5">
        <template v-if="kind === 'single_choice'">
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
          :placeholder="`Opsi ${row.letter}${index > 1 ? ' (opsional)' : ''}`"
          class="flex-1"
        />
      </div>
    </fieldset>

    <!-- true_false: daftar pernyataan -->
    <fieldset v-else-if="kind === 'true_false'" class="grid gap-3">
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
    <fieldset v-else class="grid gap-2.5">
      <legend :class="FIELD_LABEL_CLASS">Jawaban yang diterima</legend>

      <div v-for="(answer, index) in answers" :key="index" class="flex items-center gap-2.5">
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

    <AppInlineMessage v-if="errorMessage" type="error">{{ errorMessage }}</AppInlineMessage>

    <div class="flex flex-wrap items-center gap-3">
      <AppButton type="submit" size="sm" :disabled="saving">
        {{ saving ? 'Menyimpan...' : 'Simpan' }}
      </AppButton>
      <AppButton type="button" variant="outline" size="sm" :disabled="saving" @click="submit('save-and-next')">
        Simpan &amp; Buat Soal Berikutnya
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
