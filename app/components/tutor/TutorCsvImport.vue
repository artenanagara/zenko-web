<script setup lang="ts">
import type { QuestionDraft, TutorSection } from '#shared/types/tutor-product'

/**
 * Impor CSV per subtes: parse di client (app/utils/questionCsv.ts), tampilkan
 * hasil + baris yang bermasalah, lalu kirim batch ke endpoint questions.
 */
const props = defineProps<{
  productId: string
  section: TutorSection
}>()

const emit = defineEmits<{ refresh: [] }>()

const uid = useId()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const parsed = ref<QuestionDraft[]>([])
const parseErrors = ref<string[]>([])
const importing = ref(false)
const importError = ref('')
const importedCount = ref(0)

async function onFileChange(event: Event) {
  importError.value = ''
  importedCount.value = 0
  parsed.value = []
  parseErrors.value = []

  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileName.value = file.name
  const result = parseQuestionCsv(await file.text())
  parsed.value = result.questions
  parseErrors.value = result.errors
}

const overTarget = computed(() => {
  const room = props.section.questionTarget - props.section.questions.length
  return parsed.value.length > room
})

async function importQuestions() {
  if (parsed.value.length === 0) return

  importing.value = true
  importError.value = ''
  try {
    await createTutorQuestionBatch(props.productId, props.section.id, parsed.value)
    importedCount.value = parsed.value.length
    reset()
    emit('refresh')
  }
  catch (cause) {
    importError.value = tutorApiMessage(cause, 'Gagal mengimpor soal. Coba lagi.')
  }
  finally {
    importing.value = false
  }
}

function reset() {
  parsed.value = []
  parseErrors.value = []
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <details class="rounded-md border border-hairline bg-surface">
    <summary class="cursor-pointer px-4 py-3 text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink">
      Impor CSV ke subtes ini
    </summary>

    <div class="grid gap-3 border-t border-hairline px-4 py-4">
      <p class="text-[0.84rem] leading-[1.7] text-muted">
        Header yang dikenali:
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">kind,prompt,explanation,optionA..optionE,correct,weightA..weightE,answers</code>.
        Kolom yang tidak terpakai boleh kosong. <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">correct</code>
        berisi huruf A–E untuk pilihan ganda, atau daftar B/S dipisah ";" untuk
        soal Benar/Salah. <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">answers</code>
        dipisah ";" untuk isian singkat.
      </p>

      <div>
        <label :for="`${uid}-file`" class="sr-only">Pilih file CSV</label>
        <input
          :id="`${uid}-file`"
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="block w-full text-[0.88rem] text-muted file:mr-3 file:cursor-pointer file:rounded-xs file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-[0.84rem] file:font-semibold file:text-primary"
          @change="onFileChange"
        >
      </div>

      <div
        v-if="parseErrors.length"
        role="alert"
        class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.84rem] text-amber-900"
      >
        <p class="font-semibold">Beberapa baris dilewati:</p>
        <ul class="mt-2 grid list-disc gap-1 pl-5">
          <li v-for="problem in parseErrors" :key="problem">{{ problem }}</li>
        </ul>
      </div>

      <p
        v-if="importError"
        role="alert"
        class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.84rem] text-amber-900"
      >
        {{ importError }}
      </p>

      <p v-if="importedCount" role="status" class="text-[0.86rem] font-semibold text-success-ink">
        {{ importedCount }} soal berhasil diimpor.
      </p>

      <div v-if="parsed.length" class="flex flex-wrap items-center gap-3">
        <AppButton type="button" size="sm" :disabled="importing" @click="importQuestions">
          {{ importing ? 'Mengimpor...' : `Impor ${parsed.length} soal` }}
        </AppButton>
        <span class="text-[0.84rem] text-muted">dari {{ fileName }}</span>
        <button
          type="button"
          class="text-[0.84rem] font-semibold text-muted transition-colors hover:text-ink"
          @click="reset"
        >
          Batal
        </button>
      </div>

      <p v-if="overTarget" class="text-[0.82rem] text-amber-800">
        Perhatikan: jumlah soal akan melebihi target {{ section.questionTarget }}
        subtes ini — hapus kelebihannya sebelum mengajukan produk.
      </p>
    </div>
  </details>
</template>
