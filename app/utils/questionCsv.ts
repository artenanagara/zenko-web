import type { QuestionDraft, QuestionImportDraft, QuestionKind, QuestionOption, TutorSection } from '#shared/types/tutor-product'

/**
 * Parser CSV impor soal — per subtes (satu section per file) dan gabungan
 * (banyak subtes dalam satu file, lewat kolom `subtes` tambahan). Parse di
 * client, kirim batch/impor ke endpoint terkait.
 *
 * Header per subtes (kontrak, docs/tutor-flow-contract.md §6): tipe,wacana,
 * pertanyaan,pembahasan,opsiA..opsiE,gambarOpsiA..gambarOpsiE,kunci,
 * bobotA..bobotE,jawabanIsian. Header gabungan (§7.4): sama, ditambah kolom
 * pertama `subtes` (wajib, dicocokkan ke section.title di server). Kolom tak
 * terpakai boleh kosong. `tipe` menerima nilai Indonesia (pilihan_ganda,
 * berbobot, benar_salah, isian_singkat) maupun alias Inggris (single_choice,
 * weighted, true_false, short_answer) — tapi harus sama dengan `defaultKind`
 * subtes tujuannya; server mengunci kind ke defaultKind section, jadi baris
 * yang menyebut kind lain ditolak di sini juga (bukan cuma di server) supaya
 * tutor tahu lebih cepat. `kunci` berisi huruf A–E untuk pilihan_ganda, atau
 * daftar B/S dipisah `;` untuk benar_salah (satu kunci per pernyataan).
 * `jawabanIsian` dipisah `;` untuk isian_singkat.
 *
 * Rows that fail validation are reported with their line number; valid rows
 * still import, so one typo does not throw away a whole file.
 */

export interface QuestionCsvResult {
  questions: QuestionDraft[]
  errors: string[]
}

export interface CombinedQuestionCsvResult {
  questions: QuestionImportDraft[]
  errors: string[]
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

/** Nilai kolom `tipe` yang diterima — Indonesia (utama) dan alias Inggris. */
const KIND_BY_CELL: Record<string, QuestionKind> = {
  pilihan_ganda: 'single_choice',
  single_choice: 'single_choice',
  berbobot: 'weighted',
  weighted: 'weighted',
  benar_salah: 'true_false',
  true_false: 'true_false',
  isian_singkat: 'short_answer',
  short_answer: 'short_answer',
  pilihan_ganda_kompleks: 'multiple_choice',
  multiple_choice: 'multiple_choice',
  sebab_akibat: 'assertion_reason',
  assertion_reason: 'assertion_reason',
  asosiatif: 'associative_choice',
  associative_choice: 'associative_choice',
  menjodohkan: 'matching',
  matching: 'matching',
  mengurutkan: 'ordering',
  ordering: 'ordering',
}

type RowParseResult =
  | { ok: true, question: QuestionDraft }
  | { ok: false, error: string }

/**
 * Bungkus satu sel opsi CSV (teks polos + `$..$`) jadi HTML minimal untuk
 * QuestionOption.text. Sel kosong tetap `''` (bukan `<p></p>`) — semua
 * pengecekan "opsi ini terisi?" di bawah (`if (!optionText)`,
 * `optionTexts.filter(Boolean)`, dst.) bergantung pada itu, sama seperti
 * kontrak "blank collapses to ''" di RichTextEditor.vue.
 */
function wrapOptionCellHtml(cell: string): string {
  return cell ? `<p>${escapeHtml(cell)}</p>` : ''
}

/**
 * Parse satu baris (lewat `cell(kolom)`) jadi QuestionDraft — logic ini sama
 * persis untuk impor per subtes maupun gabungan, cuma diberi arti baris/kolom
 * `subtes` tambahan di pemanggil masing-masing.
 *
 * `expectedKind` adalah `defaultKind` subtes tujuan baris ini — server
 * mengunci kind soal ke defaultKind section-nya, jadi baris yang menyebut
 * kind lain ditolak di sini juga (bukan cuma setelah upload). `undefined`
 * kalau pemanggil belum bisa menentukan section baris ini (mis. impor
 * gabungan dengan `subtes` yang tidak cocok section manapun) — cek kind
 * dilewati saat itu, baris tetap dilaporkan lewat `problems` server.
 */
function parseQuestionRow(cell: (name: string) => string, expectedKind: QuestionKind | undefined): RowParseResult {
  const kind = KIND_BY_CELL[cell('tipe').toLowerCase()]
  if (!kind) return { ok: false, error: `tipe "${cell('tipe')}" tidak dikenal.` }
  if (expectedKind && kind !== expectedKind) {
    return {
      ok: false,
      error: `tipe "${cell('tipe')}" tidak sesuai tipe subtes ini — harus "${TEMPLATE_KIND_CELL[expectedKind]}".`,
    }
  }

  const stimulus = cell('wacana')
  const prompt = cell('pertanyaan')
  const explanation = cell('pembahasan')
  if (!prompt) return { ok: false, error: 'kolom pertanyaan kosong.' }
  if (!explanation) return { ok: false, error: 'pembahasan wajib diisi.' }

  const base = stimulus ? { stimulus } : {}
  // Sel opsi CSV masih teks polos + `$..$` (tutor tidak bisa mengetik HTML
  // mentah di Excel) — tapi QuestionOption.text sekarang HTML kaya, kontrak
  // sama seperti Question.Prompt (lihat TutorOptionField.vue), jadi tiap sel
  // dibungkus jadi satu paragraf di sini. escapeHtml membiarkan `$..$` apa
  // adanya (cuma menyasar &/</>), termasuk di dalam delimiter — itu berarti
  // "<"/">" pada rumus (mis. `$x < y$`) ikut ter-escape, tapi
  // renderInlineMathHtml men-decode-nya balik sebelum diserahkan ke KaTeX
  // (lihat komentar di sana), jadi tetap typeset dengan benar untuk siswa.
  const optionTexts = OPTION_LETTERS.map(letter => wrapOptionCellHtml(cell(`opsi${letter}`)))
  const optionImages = OPTION_LETTERS.map(letter => cell(`gambaropsi${letter}`))

  if (kind === 'single_choice') {
    const correct = cell('kunci').toUpperCase()
    const options: QuestionOption[] = []
    OPTION_LETTERS.forEach((letter, at) => {
      const optionText = optionTexts[at]
      if (!optionText) return
      const option: QuestionOption = { label: letter, text: optionText, isCorrect: letter === correct }
      if (optionImages[at]) option.imageUrl = optionImages[at]
      options.push(option)
    })
    if (options.length < 2) return { ok: false, error: 'minimal dua opsi terisi.' }
    if (!options.some(option => option.isCorrect)) {
      return { ok: false, error: 'kolom kunci harus salah satu huruf opsi yang terisi (A–E).' }
    }
    return { ok: true, question: { kind, prompt, explanation, options, ...base } }
  }

  if (kind === 'multiple_choice' || kind === 'assertion_reason' || kind === 'associative_choice') {
    const correct = new Set(cell('kunci').toUpperCase().split(/[;,]/).map(value => value.trim()).filter(Boolean))
    const options: QuestionOption[] = []
    OPTION_LETTERS.forEach((letter, at) => {
      const optionText = optionTexts[at]
      if (!optionText) return
      options.push({ label: letter, text: optionText, isCorrect: correct.has(letter) })
    })
    const requiredCorrect = kind === 'multiple_choice' ? 2 : 1
    if (options.length < 2 || options.filter(option => option.isCorrect).length < requiredCorrect) {
      return { ok: false, error: kind === 'multiple_choice' ? 'kolom kunci harus memuat minimal dua huruf opsi.' : 'kolom kunci harus memuat satu huruf opsi.' }
    }
    return { ok: true, question: { kind, prompt, explanation, options, ...base } }
  }

  if (kind === 'weighted') {
    const options: QuestionOption[] = []
    let weightProblem = false
    OPTION_LETTERS.forEach((letter, at) => {
      const optionText = optionTexts[at]
      if (!optionText) return
      const weight = Number.parseInt(cell(`bobot${letter}`), 10)
      if (Number.isNaN(weight) || weight < 0) {
        weightProblem = true
        return
      }
      const option: QuestionOption = { label: letter, text: optionText, weight }
      if (optionImages[at]) option.imageUrl = optionImages[at]
      options.push(option)
    })
    if (weightProblem) return { ok: false, error: 'tiap opsi berbobot butuh bobot bilangan bulat ≥ 0.' }
    if (options.length < 2) return { ok: false, error: 'minimal dua opsi terisi.' }
    return { ok: true, question: { kind, prompt, explanation, options, ...base } }
  }

  if (kind === 'true_false') {
    const keys = cell('kunci').split(';').map(key => parseTrueFalse(key))
    const statements = optionTexts.filter(Boolean)
    if (statements.length === 0) return { ok: false, error: 'isi pernyataan di kolom opsiA dan seterusnya.' }
    if (keys.length !== statements.length || keys.some(key => key === null)) {
      return { ok: false, error: 'kolom kunci harus daftar B/S dipisah ";" — satu untuk tiap pernyataan.' }
    }
    const options: QuestionOption[] = statements.map((statement, at) => ({
      label: String(at + 1),
      text: statement,
      isCorrect: keys[at] === true,
    }))
    return { ok: true, question: { kind, prompt, explanation, options, ...base } }
  }

  if (kind === 'matching') {
    const rightItems = cell('jawabanisian').split(';').map((text, index) => ({ id: String(index + 1), text: text.trim() })).filter(item => item.text)
    const leftOptions = optionTexts.map((text, index) => text ? { label: String(index + 1), text } : null).filter((option): option is QuestionOption => option !== null)
    const pairs = Object.fromEntries(cell('kunci').split(';').map(pair => pair.split('=').map(value => value.trim())).filter(pair => pair.length === 2 && pair[0] && pair[1]))
    if (leftOptions.length < 2 || rightItems.length !== leftOptions.length || leftOptions.some(option => !pairs[option.label])) {
      return { ok: false, error: 'matching membutuhkan jumlah item kiri/kanan yang sama dan pasangan pada kolom kunci.' }
    }
    return { ok: true, question: { kind, prompt, explanation, options: leftOptions, matching: { items: rightItems, pairs }, ...base } }
  }

  if (kind === 'ordering') {
    const options: QuestionOption[] = []
    optionTexts.forEach((text, index) => {
      if (text) options.push({ label: OPTION_LETTERS[index]!, text })
    })
    const ordering = cell('kunci').toUpperCase().split(/[;,]/).map(value => value.trim()).filter(Boolean)
    if (options.length < 2 || ordering.length !== options.length || new Set(ordering).size !== options.length || options.some(option => !ordering.includes(option.label))) {
      return { ok: false, error: 'ordering membutuhkan urutan semua label opsi pada kolom kunci.' }
    }
    return { ok: true, question: { kind, prompt, explanation, options, ordering, ...base } }
  }

  // isian_singkat
  const answers = cell('jawabanisian').split(';').map(answer => answer.trim()).filter(Boolean)
  if (answers.length === 0) {
    return { ok: false, error: 'kolom jawabanIsian wajib berisi minimal satu jawaban (pisahkan dengan ";").' }
  }
  return { ok: true, question: { kind, prompt, explanation, answers, ...base } }
}

export function parseQuestionCsv(text: string, section: Pick<TutorSection, 'defaultKind'>): QuestionCsvResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { questions: [], errors: ['File kosong.'] }

  const header = rows[0]!.map(cell => cell.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name.toLowerCase())

  for (const required of ['tipe', 'pertanyaan', 'pembahasan']) {
    if (col(required) === -1) {
      return { questions: [], errors: [`Header tidak dikenali: kolom "${required}" tidak ditemukan.`] }
    }
  }

  const questions: QuestionDraft[] = []
  const errors: string[] = []

  rows.slice(1).forEach((row, index) => {
    // +2: satu untuk header, satu karena manusia menghitung dari 1.
    const line = index + 2
    if (row.every(cell => !cell.trim())) return

    const cell = (name: string) => {
      const at = col(name)
      return at === -1 ? '' : (row[at] ?? '').trim()
    }

    const result = parseQuestionRow(cell, section.defaultKind)
    if (!result.ok) {
      errors.push(`Baris ${line}: ${result.error}`)
      return
    }
    questions.push(result.question)
  })

  return { questions, errors }
}

/**
 * Parser CSV impor gabungan (§7.4) — header sama seperti per subtes ditambah
 * kolom pertama `subtes` wajib, dicocokkan ke section produk ini di server
 * (POST /tutor/products/:id/questions/import). Baris tanpa `subtes` gagal di
 * sini; baris dengan `subtes` yang tidak cocok section manapun baru terlihat
 * setelah upload, di `problems` respons server.
 */
export function parseCombinedQuestionCsv(
  text: string,
  sections: Pick<TutorSection, 'title' | 'defaultKind'>[],
): CombinedQuestionCsvResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { questions: [], errors: ['File kosong.'] }

  const header = rows[0]!.map(cell => cell.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name.toLowerCase())

  for (const required of ['subtes', 'tipe', 'pertanyaan', 'pembahasan']) {
    if (col(required) === -1) {
      return { questions: [], errors: [`Header tidak dikenali: kolom "${required}" tidak ditemukan.`] }
    }
  }

  const questions: QuestionImportDraft[] = []
  const errors: string[] = []

  rows.slice(1).forEach((row, index) => {
    const line = index + 2
    if (row.every(cell => !cell.trim())) return

    const cell = (name: string) => {
      const at = col(name)
      return at === -1 ? '' : (row[at] ?? '').trim()
    }

    const subtes = cell('subtes')
    if (!subtes) {
      errors.push(`Baris ${line}: kolom subtes wajib diisi.`)
      return
    }

    // Section yang namanya tidak cocok mana pun baru dilaporkan server (lihat
    // komentar berkas) — di sini kind hanya dicek kalau section-nya ketemu.
    const section = sections.find(candidate => candidate.title.trim().toLowerCase() === subtes.toLowerCase())

    const result = parseQuestionRow(cell, section?.defaultKind)
    if (!result.ok) {
      errors.push(`Baris ${line} (${subtes}): ${result.error}`)
      return
    }
    questions.push({ ...result.question, subtes })
  })

  return { questions, errors }
}

/** Terima B/S, benar/salah, dan true/false — CSV buatan tangan tidak seragam. */
function parseTrueFalse(raw: string): boolean | null {
  const value = raw.trim().toLowerCase()
  if (['b', 'benar', 'true', '1'].includes(value)) return true
  if (['s', 'salah', 'false', '0'].includes(value)) return false
  return null
}

const CSV_TEMPLATE_HEADER = [
  'tipe', 'wacana', 'pertanyaan', 'pembahasan',
  'opsiA', 'opsiB', 'opsiC', 'opsiD', 'opsiE',
  'gambarOpsiA', 'gambarOpsiB', 'gambarOpsiC', 'gambarOpsiD', 'gambarOpsiE',
  'kunci', 'bobotA', 'bobotB', 'bobotC', 'bobotD', 'bobotE', 'jawabanIsian',
]

/** Nilai kolom `tipe` yang diharapkan untuk tiap kind — dipakai template dan pesan error. */
export const TEMPLATE_KIND_CELL: Record<QuestionKind, string> = {
  single_choice: 'pilihan_ganda',
  multiple_choice: 'pilihan_ganda_kompleks',
  weighted: 'berbobot',
  true_false: 'benar_salah',
  short_answer: 'isian_singkat',
  assertion_reason: 'sebab_akibat',
  associative_choice: 'asosiatif',
  matching: 'menjodohkan',
  ordering: 'mengurutkan',
}

/**
 * Template CSV kosong untuk satu subtes — header resmi + satu baris contoh
 * berisi `tipe` sesuai `defaultKind` subtes, supaya tutor tinggal isi.
 */
export function buildQuestionCsvTemplate(section: Pick<TutorSection, 'defaultKind'>): string {
  const exampleRow = CSV_TEMPLATE_HEADER.map(column =>
    column === 'tipe' ? TEMPLATE_KIND_CELL[section.defaultKind] : '',
  )
  return [CSV_TEMPLATE_HEADER, exampleRow].map(row => row.map(csvCell).join(',')).join('\r\n')
}

const CSV_TEMPLATE_HEADER_COMBINED = ['subtes', ...CSV_TEMPLATE_HEADER]

/**
 * Template CSV untuk impor gabungan (§7.4) — header + kolom `subtes`, dan
 * satu baris contoh per subtes produk ini berisi nama subtes-nya persis
 * (bukan placeholder generik) supaya tutor tidak salah ketik.
 */
export function buildCombinedQuestionCsvTemplate(
  sections: Pick<TutorSection, 'title' | 'defaultKind'>[],
): string {
  const exampleRows = sections.map(section =>
    CSV_TEMPLATE_HEADER_COMBINED.map((column) => {
      if (column === 'subtes') return section.title
      if (column === 'tipe') return TEMPLATE_KIND_CELL[section.defaultKind]
      return ''
    }),
  )
  return [CSV_TEMPLATE_HEADER_COMBINED, ...exampleRows].map(row => row.map(csvCell).join(',')).join('\r\n')
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Trigger unduhan file lewat Blob + <a> sementara — tanpa dependency baru. */
export function downloadCsvTemplate(section: Pick<TutorSection, 'title' | 'defaultKind'>): void {
  const csv = buildQuestionCsvTemplate(section)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `question-template-${slugifyFilename(section.title)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Trigger unduhan template gabungan — sama seperti downloadCsvTemplate. */
export function downloadCombinedCsvTemplate(sections: Pick<TutorSection, 'title' | 'defaultKind'>[]): void {
  const csv = buildCombinedQuestionCsvTemplate(sections)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'template-soal-gabungan.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function slugifyFilename(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'subtes'
}

/**
 * Pemecah CSV kecil dengan dukungan tanda kutip ("...", "" sebagai escape) dan
 * baris baru di dalam kutipan — cukup untuk file dari Excel/Sheets tanpa
 * menarik dependensi baru.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    // Baris yang benar-benar kosong (mis. newline penutup) dibuang.
    if (row.length > 1 || row[0]!.trim() !== '') rows.push(row)
    row = []
  }

  for (let at = 0; at < text.length; at += 1) {
    const char = text[at]!

    if (inQuotes) {
      if (char === '"') {
        if (text[at + 1] === '"') {
          field += '"'
          at += 1
        }
        else {
          inQuotes = false
        }
      }
      else {
        field += char
      }
      continue
    }

    if (char === '"') inQuotes = true
    else if (char === ',') pushField()
    else if (char === '\n') pushRow()
    else if (char !== '\r') field += char
  }

  if (field !== '' || row.length > 0) pushRow()

  return rows
}
