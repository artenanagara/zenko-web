<script setup lang="ts">
import type { QuestionDraft, QuestionImportDraft, TutorSection } from '#shared/types/tutor-product'

/**
 * Impor CSV soal — dua mode:
 * - "Per subtes" (default): parse di client (app/utils/questionCsv.ts),
 *   kirim batch ke POST .../sections/:sectionId/questions untuk subtes aktif.
 * - "Semua subtes sekaligus" (§7.4 kontrak): satu file berisi kolom `subtes`
 *   tambahan, dikirim ke POST .../questions/import — server mencocokkan tiap
 *   baris ke section produk ini dan melaporkan baris yang gagal cocok/valid
 *   di `problems`, tanpa membatalkan baris lain yang valid.
 *
 * Produk mini_tryout selalu punya tepat satu subtes (ditegakkan server) —
 * mode gabungan tidak ada gunanya di sana (kolom `subtes` ekstra hanya
 * membingungkan tutor untuk satu-satunya subtes yang ada), jadi picker dua
 * tab disembunyikan total dan hanya form "per subtes" yang dirender. Dideteksi
 * dari `sections.length <= 1` — bukan lewat prop `mode` terpisah, karena
 * `sections` (daftar semua subtes produk ini) sudah tersedia di sini.
 *
 * Dirender sebagai isi tab "Impor CSV/Excel" di TutorSectionEditor.vue — lihat
 * docs/tutor-flow-contract.md §6 dan §7.4.
 */
const props = defineProps<{
  productId: string
  section: TutorSection
  /** Semua subtes produk ini — dipakai mode gabungan untuk template + kuota, dan untuk mendeteksi produk mini_tryout (1 subtes). */
  sections: TutorSection[]
}>()

/** mini_tryout: selalu tepat 1 subtes (§7.2 kontrak) — picker mode disembunyikan dan `mode` tidak pernah berpindah dari 'section'. */
const isSingleSection = computed(() => props.sections.length <= 1)

const emit = defineEmits<{ refresh: [] }>()

const uid = useId()

type ImportMode = 'section' | 'combined'
const mode = ref<ImportMode>('section')

const MODE_TABS: { id: ImportMode, label: string }[] = [
  { id: 'section', label: 'Impor per subtes' },
  { id: 'combined', label: 'Impor semua subtes sekaligus' },
]

// AppTabs works in plain strings; narrow its `update:modelValue` back onto
// ImportMode instead of casting.
function isImportMode(id: string): id is ImportMode {
  return id === 'section' || id === 'combined'
}
function selectMode(id: string) {
  if (isImportMode(id)) switchMode(id)
}

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const parsed = ref<QuestionDraft[]>([])
const combinedParsed = ref<QuestionImportDraft[]>([])
const parseErrors = ref<string[]>([])
const importing = ref(false)
const importError = ref('')
const importedCount = ref(0)
/** Baris bermasalah dari respons server (`problems`) — hanya mode gabungan. */
const importProblems = ref<string[]>([])

function switchMode(next: ImportMode) {
  if (mode.value === next) return
  mode.value = next
  reset()
  importError.value = ''
  importedCount.value = 0
  importProblems.value = []
}

async function onFileChange(event: Event) {
  importError.value = ''
  importedCount.value = 0
  importProblems.value = []
  parsed.value = []
  combinedParsed.value = []
  parseErrors.value = []

  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileName.value = file.name
  const text = await file.text()

  if (mode.value === 'combined') {
    const result = parseCombinedQuestionCsv(text, props.sections)
    combinedParsed.value = result.questions
    parseErrors.value = result.errors
  }
  else {
    const result = parseQuestionCsv(text, props.section)
    parsed.value = result.questions
    parseErrors.value = result.errors
  }
}

const rowCount = computed(() => mode.value === 'combined' ? combinedParsed.value.length : parsed.value.length)

const overTarget = computed(() => {
  if (mode.value === 'combined') return false
  const room = props.section.questionTarget - props.section.questions.length
  return parsed.value.length > room
})

async function importQuestions() {
  if (rowCount.value === 0) return

  importing.value = true
  importError.value = ''
  try {
    if (mode.value === 'combined') {
      const result = await importTutorQuestions(props.productId, combinedParsed.value)
      importedCount.value = result.imported
      importProblems.value = result.problems
    }
    else {
      await createTutorQuestionBatch(props.productId, props.section.id, parsed.value)
      importedCount.value = parsed.value.length
    }
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
  combinedParsed.value = []
  parseErrors.value = []
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="grid gap-3 rounded-md border border-hairline bg-surface px-4 py-4">
    <AppTabs v-if="!isSingleSection" :tabs="MODE_TABS" :model-value="mode" aria-label="Mode impor" @update:model-value="selectMode" />

    <p v-if="!isSingleSection && mode === 'combined'" class="text-[0.82rem] leading-[1.6] text-muted">
      Satu file CSV bisa berisi soal dari beberapa subtes produk ini sekaligus — kolom
      <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">subtes</code>
      di tiap baris menentukan section tujuannya (dicocokkan ke nama subtes produk ini,
      tidak peka huruf besar/kecil). Baris dengan nama subtes salah ketik dilaporkan
      sebagai error spesifik, bukan menggagalkan seluruh file.
    </p>

    <div class="flex flex-wrap items-start justify-between gap-3">
      <p v-if="mode === 'section'" class="max-w-2xl text-[0.84rem] leading-[1.7] text-muted">
        Header yang dikenali:
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">tipe,wacana,pertanyaan,pembahasan,opsiA..opsiE,gambarOpsiA..gambarOpsiE,kunci,bobotA..bobotE,jawabanIsian</code>.
        Kolom yang tidak terpakai boleh kosong. Kolom
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">tipe</code> harus
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">{{ TEMPLATE_KIND_CELL[section.defaultKind] }}</code>
        sebagai contoh awal. Tipe soal dapat berbeda di setiap baris.
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">kunci</code>
        berisi huruf A–E untuk pilihan ganda, atau daftar B/S dipisah ";" untuk
        soal Benar/Salah. <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">jawabanIsian</code>
        dipisah ";" untuk isian singkat. <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">wacana</code>
        dan <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">gambarOpsi*</code> opsional.
      </p>
      <p v-else class="max-w-2xl text-[0.84rem] leading-[1.7] text-muted">
        Header sama seperti template per subtes, ditambah kolom pertama
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">subtes</code> (wajib diisi).
        Kolom <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">tipe</code> tiap baris
        menentukan tipe jawaban untuk baris tersebut (lihat contoh di template).
      </p>
      <button
        type="button"
        class="shrink-0 text-[0.84rem] font-semibold text-primary hover:underline"
        @click="mode === 'combined' ? downloadCombinedCsvTemplate(props.sections) : downloadCsvTemplate(section)"
      >
        Unduh Template CSV
      </button>
    </div>

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

    <AppSectionMessage v-if="parseErrors.length" appearance="warning" title="Beberapa baris dilewati:">
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in parseErrors" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <AppSectionMessage v-if="importError" appearance="warning">{{ importError }}</AppSectionMessage>

    <AppInlineMessage v-if="importedCount" type="confirmation">
      {{ importedCount }} soal berhasil diimpor.
    </AppInlineMessage>

    <AppSectionMessage v-if="importProblems.length" appearance="warning" title="Beberapa baris tidak diimpor:">
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in importProblems" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <div v-if="rowCount > 0" class="flex flex-wrap items-center gap-3">
      <AppButton type="button" size="sm" :disabled="importing" @click="importQuestions">
        {{ importing ? 'Mengimpor...' : `Impor ${rowCount} soal` }}
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

    <AppInlineMessage v-if="overTarget" type="warning">
      Perhatikan: jumlah soal akan melebihi target {{ section.questionTarget }}
      subtes ini — hapus kelebihannya sebelum mengajukan produk.
    </AppInlineMessage>
  </div>
</template>
