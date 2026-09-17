<script setup lang="ts">
import type { QuestionDraft, QuestionImportDraft, TutorSection } from '#shared/types/tutor-product'
import type { CsvPassageGroup } from '~/utils/questionCsv'

type ImportMode = 'section' | 'combined'

/**
 * Impor soal dari berkas — menerima dua format lewat satu input berkas:
 *
 * - **CSV**: diurai di client (app/utils/questionCsv.ts), lalu dikirim
 *   sebagai batch ke POST .../sections/:sectionId/questions (mode `section`)
 *   atau ke POST .../questions/import dengan kolom `subtes` per baris (mode
 *   `combined`, §7.4 kontrak).
 * - **DOCX**: TIDAK diurai di sini sama sekali — berkasnya dikirim apa adanya
 *   ke POST .../questions/import-docx. Sebuah .docx adalah arsip zip yang
 *   tidak bisa dibuka browser tanpa dependensi baru, gambar di dalamnya harus
 *   lewat pipeline unggah, dan HTML hasil bacanya harus disanitasi policy yang
 *   sama dengan field soal lain. Ketiganya ada di server, jadi parsernya juga.
 *
 * Konsekuensinya: untuk CSV panel ini bisa menghitung jumlah soal sebelum
 * mengirim (dan menawarkan "timpa" saat melebihi sisa target), untuk DOCX
 * tidak — jumlah dan kuota subtes baru diketahui dari respons server, yang
 * memakai bentuk laporan yang sama (`imported` + `problems`).
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
/**
 * Berkas Word yang dipilih, belum dikirim. Berbeda dengan CSV, isinya tidak
 * pernah dibaca di sini — lihat komentar berkas.
 */
const docxFile = ref<File | null>(null)
/**
 * Format berkas pada impor terakhir. Terpisah dari `docxFile` karena berkasnya
 * dilepas begitu impor selesai (supaya tidak bisa terkirim dua kali) sementara
 * laporan hasilnya justru baru dibaca setelah itu — dan laporan itu menyebut
 * "tabel" untuk DOCX, "baris" untuk CSV.
 */
const importedAsDocx = ref(false)
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

function isDocx(file: File): boolean {
  return file.name.toLowerCase().endsWith('.docx')
}

async function onFileChange(event: Event) {
  importProblems.value = []
  parsed.value = []
  combinedParsed.value = []
  parseErrors.value = []
  passageGroups.value = []
  docxFile.value = null

  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileName.value = file.name

  // Word: tidak ada yang bisa dibaca di sini, jadi berkasnya hanya ditahan
  // sampai tombol impor ditekan.
  if (isDocx(file)) {
    docxFile.value = file
    return
  }

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

/** Ada sesuatu yang siap dikirim — baris CSV yang terbaca, atau berkas Word. */
const canImport = computed(() => rowCount.value > 0 || docxFile.value !== null)

/**
 * Tiga keadaan untuk mode per subtes, dihitung dari sisa target:
 * - muat di sisa: impor biasa, soal ditambahkan di belakang;
 * - tidak muat di sisa tapi muat di target: impor hanya bisa jalan dengan
 *   MENIMPA semua soal yang ada — ditawarkan, dengan konfirmasi eksplisit;
 * - lebih besar dari target itu sendiri: diblokir, karena menimpa pun tidak
 *   cukup dan server pasti menolak seluruh batch (400).
 */
const existingCount = computed(() => props.section.questions.length)
const room = computed(() => Math.max(props.section.questionTarget - existingCount.value, 0))
// Keduanya hanya berlaku untuk CSV: jumlah soal di sebuah .docx baru
// diketahui server, yang menolak per tabel begitu target subtes tercapai dan
// melaporkannya di `problems` — tanpa membatalkan tabel yang sudah masuk.
const needsReplace = computed(() =>
  mode.value === 'section'
  && !docxFile.value
  && parsed.value.length > room.value
  && parsed.value.length <= props.section.questionTarget,
)
const overTarget = computed(() =>
  mode.value === 'section' && !docxFile.value && parsed.value.length > props.section.questionTarget,
)

/**
 * Konfirmasi timpa dirender di panel ini, bukan lewat useConfirm(): dialog
 * global itu di-mount di app.vue, sebelum modal impor, jadi ketika keduanya
 * terbuka ia tergambar DI BAWAH modal impor dan tidak pernah terlihat.
 */
const confirmingReplace = ref(false)

async function importQuestions() {
  // overTarget diblokir di sini juga (tombolnya sudah disabled): batch per
  // subtes bersifat all-or-nothing di server — mengirimkannya pasti 400,
  // dan wacana yang terlanjur dibuat sebelum 400 itu akan jadi yatim.
  if (!canImport.value || overTarget.value) return

  // Menimpa itu permanen dan menyapu soal yang mungkin ditulis tangan, jadi
  // klik pertama hanya membuka konfirmasi dengan angkanya; klik kedua (dari
  // blok konfirmasi) yang benar-benar mengirim.
  const replace = needsReplace.value
  if (replace && !confirmingReplace.value) {
    confirmingReplace.value = true
    return
  }
  confirmingReplace.value = false

  importing.value = true
  let createdPassages: CreatedPassage[] = []
  try {
    let imported: number
    importedAsDocx.value = docxFile.value !== null
    if (docxFile.value) {
      // Subtes tujuan ikut cakupan yang sudah dipilih tutor di modal: pada
      // mode per subtes baris SUBTES di dokumen sengaja diabaikan server.
      const result = await importTutorQuestionsDocx(
        props.productId,
        docxFile.value,
        mode.value === 'section' ? { sectionId: props.section.id } : {},
        props.workspace,
      )
      imported = result.imported
      importProblems.value = result.problems
    }
    else if (mode.value === 'combined') {
      if (passageGroups.value.length) createdPassages = await createGroupedPassages(combinedParsed.value)
      const result = await importTutorQuestions(props.productId, combinedParsed.value, props.workspace)
      imported = result.imported
      importProblems.value = result.problems
    }
    else {
      if (passageGroups.value.length) createdPassages = await createGroupedPassages(parsed.value)
      await createTutorQuestionBatch(props.productId, props.section.id, parsed.value, props.workspace, { replace })
      imported = parsed.value.length
    }
    // Baris yang dilewati dihitung dari KEDUA daftar. Sebagian gugur di
    // parser sebelum apa pun dikirim (kunci kosong, tipe tak dikenal), dan
    // sebagian ditolak server per baris — bagi tutor keduanya sama saja:
    // soalnya tidak masuk, dan dia perlu tahu yang mana.
    const skipped = parseErrors.value.length + importProblems.value.length
    const unit = importedAsDocx.value ? 'tabel' : 'baris'
    clearFileSelection()
    emit('refresh')
    toast.success(
      replace ? `${imported} soal terimpor, menggantikan soal sebelumnya.` : `${imported} soal terimpor.`,
      skipped ? `${skipped} ${unit} dilewati — lihat daftarnya di panel impor.` : undefined,
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
    toast.error('Soal belum berhasil diimpor.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
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
  confirmingReplace.value = false
  docxFile.value = null
  parsed.value = []
  combinedParsed.value = []
  passageGroups.value = []
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

/** Format yang sedang diunduh, atau null — menonaktifkan kedua tombolnya. */
const downloadingTemplate = ref<'docx' | 'csv' | null>(null)

/**
 * Unduh template produk ini. Isinya dibentuk server-side mengikuti kategori
 * ujian produk (lihat zenko-api/internal/docximport): contoh yang dimuat hanya
 * jenis soal yang diterima subtesnya, dengan jumlah opsi dan skala bobot
 * kategori itu. Tidak ada yang perlu dipilih di sini — kategori produk sudah
 * menjawabnya, dan menawarkan pilihan lain hanya akan menghasilkan contoh yang
 * ditolak saat diimpor.
 */
async function downloadTemplate(format: 'docx' | 'csv') {
  downloadingTemplate.value = format
  try {
    await downloadTutorQuestionTemplate(
      props.productId,
      { format, sectionId: mode.value === 'section' ? props.section.id : undefined },
      props.workspace,
    )
  }
  catch (cause) {
    toast.error('Template belum berhasil diunduh.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    downloadingTemplate.value = null
  }
}

/** Kembali ke keadaan awal, termasuk diagnostik — dipakai saat memilih berkas baru. */
function reset() {
  clearFileSelection()
  parseErrors.value = []
  importProblems.value = []
}
</script>

<template>
  <!-- min-w-0: panel ini hidup di dalam modal, dan nama berkas yang dipilih
       bisa jadi satu token tanpa spasi yang lebih lebar dari dialognya; tanpa
       ini grid melebar mengikuti token itu dan kartunya menembus tepi modal. -->
  <div class="grid min-w-0 gap-4 rounded-md border border-hairline bg-surface px-4 py-4">
    <!-- Satu penjelasan untuk kedua format, bukan satu blok per format.
         Yang berbeda di antara DOCX dan CSV adalah isi templatenya, bukan cara
         memakainya — menjelaskan keduanya terpisah membuat panel ini bertumpuk
         dan menyuruh tutor membaca hal yang sama dua kali. Aturan detail tiap
         jenis soal ada di dalam templatenya sendiri, tempat yang memang dibaca
         saat menulis soal. -->
    <p class="text-[0.84rem] leading-[1.7] text-muted">
      Satu soal per tabel (Word) atau per baris (CSV). Unduh templatenya, isi, lalu unggah
      kembali di bawah. Templatenya sudah disesuaikan dengan kategori ujian produk ini —
      berisi contoh terisi untuk tiap jenis soal yang diterima, lengkap dengan aturan kunci,
      jumlah opsi, dan skala bobotnya.
      <template v-if="mode === 'combined'">
        Satu berkas boleh memuat soal dari beberapa subtes sekaligus —
        <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">SUBTES</code>
        tiap soal yang menentukan tujuannya.
      </template>
      <template v-else>
        Semua soal masuk ke <strong class="font-semibold text-ink">{{ section.title }}</strong>.
      </template>
    </p>

    <div class="grid gap-3 rounded-md border border-hairline bg-surface-sunken/50 px-4 py-3.5">
      <!-- Dua tombol setara: formatnya pilihan tutor, bukan rekomendasi kami.
           Tidak ada pilihan lain di sini — isi templatenya sudah ditentukan
           kategori ujian produk ini. -->
      <div class="grid gap-2 sm:grid-cols-2">
        <AppButton
          type="button"
          size="sm"
          variant="outline"
          :disabled="downloadingTemplate !== null"
          @click="downloadTemplate('docx')"
        >
          <AppIcon name="file-doc" :size="16" aria-hidden="true" />
          {{ downloadingTemplate === 'docx' ? 'Menyiapkan...' : 'Template Word (.docx)' }}
        </AppButton>
        <AppButton
          type="button"
          size="sm"
          variant="outline"
          :disabled="downloadingTemplate !== null"
          @click="downloadTemplate('csv')"
        >
          <AppIcon name="file-csv" :size="16" aria-hidden="true" />
          {{ downloadingTemplate === 'csv' ? 'Menyiapkan...' : 'Template CSV' }}
        </AppButton>
      </div>

      <p class="text-[0.78rem] leading-[1.6] text-muted">
        Isi keduanya sama; yang berbeda cuma bentuknya. Pilih Word kalau soalmu memuat gambar,
        rumus, teks Arab, atau tabel — gambar disisipkan langsung ke dalam sel dan diunggah
        otomatis saat impor. CSV hanya memuat teks; gambarnya harus berupa URL.
      </p>
    </div>

    <div>
      <label :for="`${uid}-file`" class="sr-only">Pilih file DOCX atau CSV</label>
      <input
        :id="`${uid}-file`"
        ref="fileInput"
        type="file"
        accept=".docx,.csv,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        class="block w-full text-[0.88rem] text-muted file:mr-3 file:cursor-pointer file:rounded-xs file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-[0.84rem] file:font-semibold file:text-primary"
        @change="onFileChange"
      >
    </div>

    <AppSectionMessage v-if="parseErrors.length" appearance="warning" title="Beberapa baris dilewati:">
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in parseErrors" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <AppSectionMessage v-if="importProblems.length" appearance="warning" :title="importedAsDocx ? 'Beberapa tabel tidak diimpor:' : 'Beberapa baris tidak diimpor:'">
      <ul class="grid list-disc gap-1 pl-5">
        <li v-for="problem in importProblems" :key="problem">{{ problem }}</li>
      </ul>
    </AppSectionMessage>

    <AppInlineMessage v-if="passageGroups.length" type="info">
      {{ passageGroups.length }} wacana akan dibuat otomatis dari kolom
      <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">wacana</code>
      — baris berurutan dengan teks wacana sama menjadi satu grup (maksimal 5 soal per wacana).
    </AppInlineMessage>

    <!-- Langkah kedua timpa: pertanyaan dengan angkanya, di tempat yang
         sama, menggantikan tombol impor sampai dijawab. -->
    <AppSectionMessage
      v-if="confirmingReplace"
      appearance="error"
      :title="`Timpa ${existingCount} soal di ${section.title}?`"
    >
      <p>
        Semua {{ existingCount }} soal yang sudah ada di subtes ini akan dihapus dan diganti
        dengan {{ parsed.length }} soal dari {{ fileName }} — permanen, tidak bisa dibatalkan.
        Subtes lain tidak tersentuh.
      </p>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <AppButton type="button" size="sm" variant="danger" :disabled="importing" @click="importQuestions">
          {{ importing ? 'Mengimpor...' : `Ya, timpa & impor ${parsed.length} soal` }}
        </AppButton>
        <AppButton type="button" size="sm" variant="outline" :disabled="importing" @click="confirmingReplace = false">
          Batal
        </AppButton>
      </div>
    </AppSectionMessage>

    <!-- Word: jumlah soalnya belum diketahui sebelum server membacanya, jadi
         tombolnya menyebut berkasnya, bukan angka yang belum ada. -->
    <div v-else-if="docxFile" class="flex flex-wrap items-center gap-3">
      <AppButton type="button" size="sm" variant="primary" :disabled="importing" @click="importQuestions">
        {{ importing ? 'Mengimpor...' : 'Impor soal dari dokumen' }}
      </AppButton>
      <span class="text-[0.84rem] text-muted">{{ fileName }}</span>
      <button
        type="button"
        class="text-[0.84rem] font-semibold text-muted transition-colors hover:text-ink"
        @click="reset"
      >
        Batal
      </button>
    </div>

    <div v-else-if="rowCount > 0" class="flex flex-wrap items-center gap-3">
      <!-- Diblokir saat melebihi target: server menolak seluruh batch (400),
           jadi mengizinkan klik hanya menjanjikan impor yang pasti gagal. -->
      <AppButton
        type="button"
        size="sm"
        :variant="needsReplace ? 'danger' : 'primary'"
        :disabled="importing || overTarget"
        @click="importQuestions"
      >
        {{ importing ? 'Mengimpor...' : needsReplace ? `Timpa & impor ${rowCount} soal` : `Impor ${rowCount} soal` }}
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

    <AppInlineMessage v-if="docxFile" type="info">
      <template v-if="mode === 'section'">
        Semua soal di dokumen ini masuk ke <strong class="font-semibold">{{ section.title }}</strong>;
        baris SUBTES di dalam dokumen diabaikan. Sisa target subtes ini {{ room }} dari
        {{ section.questionTarget }} — tabel yang melebihi target dilewati dan dilaporkan satu per satu.
      </template>
      <template v-else>
        Tiap tabel masuk ke subtes yang ditulis di baris SUBTES-nya. Tabel dengan nama subtes yang
        salah ketik dilaporkan satu per satu, tanpa menggagalkan tabel lain.
      </template>
    </AppInlineMessage>

    <AppInlineMessage v-if="needsReplace && !confirmingReplace" type="warning">
      File ini berisi {{ parsed.length }} soal, tetapi sisa target subtes tinggal {{ room }}
      dari {{ section.questionTarget }}. Impor hanya bisa dilanjutkan dengan
      <strong class="font-semibold">menimpa semua {{ existingCount }} soal yang sudah ada</strong>
      di subtes ini — kamu akan diminta konfirmasi dulu.
    </AppInlineMessage>

    <AppInlineMessage v-else-if="overTarget" type="warning">
      Impor diblokir: file ini berisi {{ parsed.length }} soal, lebih banyak dari target subtes
      ({{ section.questionTarget }}). Menimpa pun tidak cukup — kurangi barisnya dulu.
    </AppInlineMessage>
  </div>
</template>
