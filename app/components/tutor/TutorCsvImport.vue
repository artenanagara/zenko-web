<script setup lang="ts">
import type { QuestionDraft, QuestionImportDraft, TutorSection } from '#shared/types/tutor-product'
import type { CsvPassageGroup } from '~/utils/questionCsv'

type ImportMode = 'section' | 'combined'

/**
 * Impor CSV soal — dua mode:
 * - `section`: parse di client (app/utils/questionCsv.ts), kirim batch ke
 *   POST .../sections/:sectionId/questions untuk subtes aktif.
 * - `combined` (§7.4 kontrak): satu file berisi kolom `subtes` tambahan,
 *   dikirim ke POST .../questions/import — server mencocokkan tiap baris ke
 *   section produk ini dan melaporkan baris yang gagal cocok/valid di
 *   `problems`, tanpa membatalkan baris lain yang valid.
 *
 * Modenya datang dari pemanggil (modal "Impor soal" di TutorSectionEditor.vue),
 * bukan dari tab di dalam panel ini: pilihannya sudah dijawab sebelum panel
 * ini muncul, dan tab yang menjawab pertanyaan yang sama untuk kedua kalinya
 * hanya menambah kesempatan mengunggah file dengan bentuk yang salah.
 *
 * Lihat docs/tutor-flow-contract.md §6 dan §7.4.
 */
const props = defineProps<{
  productId: string
  section: TutorSection
  /** Semua subtes produk ini — dipakai mode gabungan untuk template + kuota. */
  sections: TutorSection[]
  /** Cakupan impor, dipilih di modal pemanggil. */
  mode: ImportMode
  /**
   * Fitur grup wacana (produk TKA): kolom `wacana` yang identik pada baris
   * BERURUTAN otomatis menjadi satu wacana bersama (maksimal 5 soal per
   * wacana), dibuat lewat endpoint passages sebelum soalnya dikirim. Tanpa
   * flag ini kolom `wacana` tetap jadi stimulus per soal seperti sebelumnya.
   */
  groupPassages?: boolean
  workspace?: ProductWorkspace
}>()

const emit = defineEmits<{
  refresh: []
  /**
   * Emitted only when every row landed. A run that skipped rows keeps the
   * dialog open, because the list of what was skipped is rendered here and
   * closing over it would throw away the only report of it.
   */
  imported: []
}>()

const uid = useId()

const mode = computed(() => props.mode)

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const parsed = ref<QuestionDraft[]>([])
const combinedParsed = ref<QuestionImportDraft[]>([])
const parseErrors = ref<string[]>([])
const importing = ref(false)
/**
 * Baris bermasalah dari respons server (`problems`) — hanya mode gabungan.
 * Stays on the panel rather than going to a toast: it is a list the tutor has
 * to work through row by row, not a one-line outcome.
 */
const importProblems = ref<string[]>([])
const toast = useToast()

/** Ganti mode = mulai dari nol; file yang sudah dipilih tidak cocok lagi. */
watch(mode, reset)

/** Grup wacana hasil parse (fitur TKA) — dibuat lewat API saat impor. */
const passageGroups = ref<CsvPassageGroup[]>([])

async function onFileChange(event: Event) {
  importProblems.value = []
  parsed.value = []
  combinedParsed.value = []
  parseErrors.value = []
  passageGroups.value = []

  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileName.value = file.name
  const text = await file.text()

  if (mode.value === 'combined') {
    const result = parseCombinedQuestionCsv(text, props.sections)
    combinedParsed.value = result.questions
    parseErrors.value = result.errors
    if (props.groupPassages) {
      const grouped = groupCsvPassages(combinedParsed.value)
      combinedParsed.value = grouped.questions
      passageGroups.value = grouped.groups
    }
  }
  else {
    const result = parseQuestionCsv(text, props.section)
    parsed.value = result.questions
    parseErrors.value = result.errors
    if (props.groupPassages) {
      const grouped = groupCsvPassages(parsed.value)
      parsed.value = grouped.questions
      passageGroups.value = grouped.groups
    }
  }
}

/** Satu wacana yang dibuat pada run impor ini — kunci rollback saat gagal. */
interface CreatedPassage {
  sectionId: string
  passageId: string
}

/**
 * Wacana yang boleh dipakai ulang alih-alih membuat baru: konten persis sama
 * DAN belum ditautkan ke soal mana pun (yatim — biasanya sisa run impor
 * sebelumnya yang gagal setelah wacananya terlanjur dibuat). Wacana berisi
 * anggota tidak pernah dipakai ulang: menambahkan grup baru ke sana bisa
 * menembus batas 5 soal per wacana.
 *
 * Kuncinya `${sectionId}\n${content}`; tiap kandidat hanya bisa diklaim satu
 * grup (pop), supaya dua grup berbeda dengan teks sama tidak menumpuk di satu
 * wacana.
 */
function orphanPassagePool(): Map<string, string[]> {
  const pool = new Map<string, string[]>()
  for (const section of props.sections) {
    const linked = new Set(section.questions.map(question => question.passageId).filter(Boolean))
    for (const passage of section.passages ?? []) {
      if (linked.has(passage.id)) continue
      const key = `${section.id}\n${passage.content}`
      pool.set(key, [...(pool.get(key) ?? []), passage.id])
    }
  }
  return pool
}

/**
 * Buat (atau pakai ulang) wacana-wacana hasil pengelompokan lewat POST
 * .../passages, lalu isi `passageId` tiap soal anggotanya. Respons
 * endpoint-nya aggregate produk terbaru — wacana baru adalah entri terakhir
 * daftar passages subtes itu. Dipanggil tepat sebelum soalnya dikirim, jadi
 * id yang dirujuk selalu ada.
 *
 * Mengembalikan daftar wacana yang benar-benar DIBUAT run ini (yang dipakai
 * ulang tidak termasuk), untuk rollback kalau pengiriman soalnya gagal —
 * batch per subtes bersifat all-or-nothing di server, dan wacana yang
 * persist duluan tanpa soal akan jadi yatim (lalu terduplikasi tiap retry).
 */
async function createGroupedPassages(
  questions: { passageId?: string, subtes?: string }[],
): Promise<CreatedPassage[]> {
  const created: CreatedPassage[] = []
  const reusable = orphanPassagePool()

  for (const group of passageGroups.value) {
    const targetSection = group.subtes
      ? props.sections.find(candidate => candidate.title.trim().toLowerCase() === group.subtes.toLowerCase())
      : props.section
    // Nama subtes yang tidak cocok akan dilaporkan server per baris soal —
    // wacananya tidak dibuat, dan baris anggotanya ikut gagal di `problems`.
    if (!targetSection) continue

    const key = `${targetSection.id}\n${group.content}`
    let passageId = reusable.get(key)?.shift()

    if (!passageId) {
      const product = await createTutorPassage(props.productId, targetSection.id, { content: group.content }, props.workspace)
      const updated = product.sections?.find(candidate => candidate.id === targetSection.id)
      const newest = updated?.passages?.[updated.passages.length - 1]
      if (!newest) continue
      passageId = newest.id
      created.push({ sectionId: targetSection.id, passageId })
    }

    for (const index of group.questionIndexes) {
      const question = questions[index]
      if (question) question.passageId = passageId
    }
  }
  return created
}

/**
 * Rollback best-effort: hapus wacana yang baru dibuat run ini karena
 * pengiriman soalnya gagal. Kegagalan hapus ditelan — sisa yatim akan
 * dipakai ulang oleh retry berikutnya (orphanPassagePool) dan tetap
 * ketahuan di validasi submit ("wacana belum ditautkan").
 */
async function rollbackCreatedPassages(created: CreatedPassage[]): Promise<void> {
  for (const passage of created) {
    try {
      await deleteTutorPassage(props.productId, passage.sectionId, passage.passageId, props.workspace)
    }
    catch {
      // Best-effort saja.
    }
  }
}

const rowCount = computed(() => mode.value === 'combined' ? combinedParsed.value.length : parsed.value.length)

const overTarget = computed(() => {
  if (mode.value === 'combined') return false
  const room = props.section.questionTarget - props.section.questions.length
  return parsed.value.length > room
})

async function importQuestions() {
  // overTarget diblokir di sini juga (tombolnya sudah disabled): batch per
  // subtes bersifat all-or-nothing di server — mengirimkannya pasti 400,
  // dan wacana yang terlanjur dibuat sebelum 400 itu akan jadi yatim.
  if (rowCount.value === 0 || overTarget.value) return

  importing.value = true
  let createdPassages: CreatedPassage[] = []
  try {
    let imported: number
    if (mode.value === 'combined') {
      if (passageGroups.value.length) createdPassages = await createGroupedPassages(combinedParsed.value)
      const result = await importTutorQuestions(props.productId, combinedParsed.value, props.workspace)
      imported = result.imported
      importProblems.value = result.problems
    }
    else {
      if (passageGroups.value.length) createdPassages = await createGroupedPassages(parsed.value)
      await createTutorQuestionBatch(props.productId, props.section.id, parsed.value, props.workspace)
      imported = parsed.value.length
    }
    // Baris yang dilewati dihitung dari KEDUA daftar. Sebagian gugur di
    // parser sebelum apa pun dikirim (kunci kosong, tipe tak dikenal), dan
    // sebagian ditolak server per baris — bagi tutor keduanya sama saja:
    // soalnya tidak masuk, dan dia perlu tahu yang mana.
    const skipped = parseErrors.value.length + importProblems.value.length
    clearFileSelection()
    emit('refresh')
    toast.success(
      `${imported} soal terimpor.`,
      skipped ? `${skipped} baris dilewati — lihat daftarnya di panel impor.` : undefined,
    )
    // Menutup dialog hanya saat tidak ada yang perlu dibaca lagi. Daftar baris
    // yang dilewati dirender di panel ini, jadi menutupnya sendiri akan
    // membuang satu-satunya laporan yang pernah ada.
    if (!skipped) emit('imported')
  }
  catch (cause) {
    // Pengiriman soal gagal setelah wacananya persist: hapus lagi wacana
    // yang baru dibuat run ini supaya retry tidak menemui duplikat, lalu
    // refresh supaya daftar wacana di editor kembali sinkron dengan server.
    if (createdPassages.length) {
      await rollbackCreatedPassages(createdPassages)
      emit('refresh')
    }
    toast.error('Gagal mengimpor soal.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    importing.value = false
  }
}

/**
 * Melepas berkas dan baris yang sudah terbaca, supaya impor yang berhasil
 * tidak bisa terkirim dua kali. Diagnostiknya sengaja TIDAK ikut dibersihkan:
 * daftar baris yang dilewati baru berguna justru setelah impor selesai.
 */
function clearFileSelection() {
  parsed.value = []
  combinedParsed.value = []
  passageGroups.value = []
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

/** Kembali ke keadaan awal, termasuk diagnostik — dipakai saat memilih berkas baru. */
function reset() {
  clearFileSelection()
  parseErrors.value = []
  importProblems.value = []
}
</script>

<template>
  <div class="grid gap-3 rounded-md border border-hairline bg-surface px-4 py-4">
    <p v-if="mode === 'combined'" class="text-[0.82rem] leading-[1.6] text-muted">
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

    <AppSectionMessage v-if="importProblems.length" appearance="warning" title="Beberapa baris tidak diimpor:">
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in importProblems" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <AppInlineMessage v-if="passageGroups.length" type="info">
      {{ passageGroups.length }} wacana akan dibuat otomatis dari kolom
      <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">wacana</code>
      — baris berurutan dengan teks wacana sama menjadi satu grup (maksimal 5 soal per wacana).
    </AppInlineMessage>

    <div v-if="rowCount > 0" class="flex flex-wrap items-center gap-3">
      <!-- Diblokir saat melebihi target: server menolak seluruh batch (400),
           jadi mengizinkan klik hanya menjanjikan impor yang pasti gagal. -->
      <AppButton type="button" size="sm" :disabled="importing || overTarget" @click="importQuestions">
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
      Impor diblokir: file ini berisi {{ parsed.length }} soal, melebihi sisa target subtes
      ({{ Math.max(section.questionTarget - section.questions.length, 0) }} dari
      {{ section.questionTarget }}). Server menolak seluruh batch yang melebihi target —
      kurangi barisnya dulu, atau hapus soal yang sudah ada.
    </AppInlineMessage>
  </div>
</template>
