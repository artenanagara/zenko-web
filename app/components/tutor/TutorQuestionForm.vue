<script setup lang="ts">
import type {
  QuestionDraft,
  QuestionKind,
  QuestionOption,
  TutorQuestion,
} from '#shared/types/tutor-product'

/**
 * Editor satu soal. Bentuk formnya mengikuti `kind`:
 * - single_choice: opsi A–E + pilih kunci jawaban
 * - weighted: opsi A–E + bobot 0–5 per opsi (gaya TKP)
 * - true_false: daftar pernyataan dengan toggle Benar/Salah
 * - short_answer: daftar jawaban yang diterima
 * Pembahasan selalu wajib — server menolak submit tanpa itu.
 *
 * Emits the validated draft; the parent owns the API call, so this form works
 * the same for create and edit.
 */
const props = defineProps<{
  initial: TutorQuestion | null
  defaultKind: QuestionKind
  saving: boolean
}>()

const emit = defineEmits<{
  save: [draft: QuestionDraft]
  cancel: []
}>()

const uid = useId()

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

const KIND_OPTIONS: { value: QuestionKind, label: string }[] = [
  { value: 'single_choice', label: 'Pilihan ganda (A–E, satu benar)' },
  { value: 'weighted', label: 'Berbobot (semua opsi bernilai, gaya TKP)' },
  { value: 'true_false', label: 'Benar/Salah (daftar pernyataan)' },
  { value: 'short_answer', label: 'Isian singkat' },
]

const kind = ref<QuestionKind>(props.initial?.kind ?? props.defaultKind)
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
    ? initialOptions().map(option => ({ text: option.text, isCorrect: option.isCorrect === true }))
    : [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
)

// short_answer: daftar jawaban yang diterima.
const answers = ref(
  props.initial?.kind === 'short_answer' && props.initial.answers?.length
    ? [...props.initial.answers]
    : [''],
)

const errorMessage = ref('')

function addStatement() {
  statements.value.push({ text: '', isCorrect: true })
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

/** Validasi ringan sesuai aturan kind; server tetap sumber kebenaran. */
function buildDraft(): QuestionDraft | null {
  if (!prompt.value.trim()) {
    errorMessage.value = 'Tulis pertanyaannya dulu.'
    return null
  }
  if (!explanation.value.trim()) {
    errorMessage.value = 'Pembahasan wajib diisi.'
    return null
  }

  const base = {
    kind: kind.value,
    prompt: prompt.value.trim(),
    explanation: explanation.value.trim(),
  }

  if (kind.value === 'single_choice' || kind.value === 'weighted') {
    const filled = choiceRows.value
      .map((row, index) => ({ ...row, index }))
      .filter(row => row.text.trim())

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
      })),
    }
  }

  if (kind.value === 'true_false') {
    const filled = statements.value.filter(statement => statement.text.trim())
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

function onSubmit() {
  errorMessage.value = ''
  const draft = buildDraft()
  if (draft) emit('save', draft)
}
</script>

<template>
  <form
    class="grid gap-4 rounded-md border border-hairline-strong bg-surface p-4 md:p-5"
    novalidate
    @submit.prevent="onSubmit"
  >
    <h4 class="font-bold tracking-[-0.02em]">
      {{ initial ? 'Ubah soal' : 'Tambah soal' }}
    </h4>

    <div>
      <label :for="`${uid}-kind`" :class="FIELD_LABEL_CLASS">Tipe soal</label>
      <select :id="`${uid}-kind`" v-model="kind" :class="FIELD_CLASS">
        <option v-for="option in KIND_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div>
      <label :for="`${uid}-prompt`" :class="FIELD_LABEL_CLASS">Pertanyaan</label>
      <textarea
        :id="`${uid}-prompt`"
        v-model="prompt"
        rows="3"
        placeholder="Tulis pertanyaan atau instruksi soal."
        class="resize-y"
        :class="FIELD_CLASS"
      />
    </div>

    <!-- single_choice & weighted: opsi A–E -->
    <fieldset v-if="kind === 'single_choice' || kind === 'weighted'" class="grid gap-2.5">
      <legend :class="FIELD_LABEL_CLASS">
        {{ kind === 'single_choice' ? 'Opsi jawaban — tandai kunci yang benar' : 'Opsi jawaban + bobot (umumnya 1–5)' }}
      </legend>

      <div v-for="(row, index) in choiceRows" :key="row.letter" class="flex items-center gap-2.5">
        <template v-if="kind === 'single_choice'">
          <input
            :id="`${uid}-correct-${row.letter}`"
            v-model="correctIndex"
            type="radio"
            :name="`${uid}-correct`"
            :value="index"
            :disabled="!row.text.trim()"
            class="h-4 w-4 shrink-0 accent-primary"
          >
          <label :for="`${uid}-correct-${row.letter}`" class="sr-only">
            Kunci jawaban opsi {{ row.letter }}
          </label>
        </template>

        <span class="w-5 shrink-0 text-[0.86rem] font-bold text-muted">{{ row.letter }}.</span>
        <input
          v-model="row.text"
          type="text"
          :placeholder="`Opsi ${row.letter}${index > 1 ? ' (opsional)' : ''}`"
          :aria-label="`Teks opsi ${row.letter}`"
          :class="FIELD_CLASS"
        >

        <template v-if="kind === 'weighted'">
          <label :for="`${uid}-weight-${row.letter}`" class="sr-only">Bobot opsi {{ row.letter }}</label>
          <input
            :id="`${uid}-weight-${row.letter}`"
            v-model.number="row.weight"
            type="number"
            min="0"
            max="5"
            placeholder="1–5"
            class="w-24 shrink-0"
            :class="FIELD_CLASS"
          >
        </template>
      </div>
    </fieldset>

    <!-- true_false: daftar pernyataan -->
    <fieldset v-else-if="kind === 'true_false'" class="grid gap-2.5">
      <legend :class="FIELD_LABEL_CLASS">Pernyataan — tentukan kuncinya Benar atau Salah</legend>

      <div v-for="(statement, index) in statements" :key="index" class="flex items-center gap-2.5">
        <span class="w-5 shrink-0 text-[0.86rem] font-bold text-muted tabular-nums">{{ index + 1 }}.</span>
        <input
          v-model="statement.text"
          type="text"
          placeholder="Tulis pernyataan"
          :aria-label="`Pernyataan ${index + 1}`"
          :class="FIELD_CLASS"
        >
        <span class="inline-flex shrink-0 overflow-hidden rounded-sm border border-line" role="group" :aria-label="`Kunci pernyataan ${index + 1}`">
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
            :class="!statement.isCorrect ? 'bg-red-50 text-red-700' : 'bg-surface text-muted hover:text-ink'"
            :aria-pressed="!statement.isCorrect"
            @click="statement.isCorrect = false"
          >
            Salah
          </button>
        </span>
        <button
          v-if="statements.length > 1"
          type="button"
          class="shrink-0 text-[0.82rem] font-semibold text-red-600 hover:underline"
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
          class="shrink-0 text-[0.82rem] font-semibold text-red-600 hover:underline"
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
      <label :for="`${uid}-explanation`" :class="FIELD_LABEL_CLASS">Pembahasan</label>
      <textarea
        :id="`${uid}-explanation`"
        v-model="explanation"
        rows="3"
        placeholder="Jelaskan cara menjawabnya — wajib diisi sebelum produk bisa diajukan."
        class="resize-y"
        :class="FIELD_CLASS"
      />
    </div>

    <p v-if="errorMessage" role="alert" class="text-[0.86rem] font-semibold text-red-600">
      {{ errorMessage }}
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <AppButton type="submit" size="sm" :disabled="saving">
        {{ saving ? 'Menyimpan...' : 'Simpan soal' }}
      </AppButton>
      <button
        type="button"
        class="text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink"
        @click="emit('cancel')"
      >
        Batal
      </button>
    </div>
  </form>
</template>
