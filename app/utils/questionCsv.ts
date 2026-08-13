import type { QuestionDraft, QuestionKind, QuestionOption } from '#shared/types/tutor-product'

/**
 * Parser CSV impor soal per subtes — parse di client, kirim batch.
 *
 * Header (kontrak): kind,prompt,explanation,optionA..optionE,correct,
 * weightA..weightE,answers. Kolom tak terpakai boleh kosong. `correct` berisi
 * huruf A–E untuk single_choice, atau daftar B/S dipisah `;` untuk true_false
 * (satu kunci per pernyataan). `answers` dipisah `;` untuk short_answer.
 *
 * Rows that fail validation are reported with their line number; valid rows
 * still import, so one typo does not throw away a whole file.
 */

export interface QuestionCsvResult {
  questions: QuestionDraft[]
  errors: string[]
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

const KINDS: QuestionKind[] = ['single_choice', 'weighted', 'true_false', 'short_answer']

export function parseQuestionCsv(text: string): QuestionCsvResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { questions: [], errors: ['File kosong.'] }

  const header = rows[0]!.map(cell => cell.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name.toLowerCase())

  for (const required of ['kind', 'prompt', 'explanation']) {
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

    const kind = cell('kind') as QuestionKind
    if (!KINDS.includes(kind)) {
      errors.push(`Baris ${line}: kind "${cell('kind')}" tidak dikenal.`)
      return
    }

    const prompt = cell('prompt')
    const explanation = cell('explanation')
    if (!prompt) {
      errors.push(`Baris ${line}: kolom prompt kosong.`)
      return
    }
    if (!explanation) {
      errors.push(`Baris ${line}: pembahasan (explanation) wajib diisi.`)
      return
    }

    const optionTexts = OPTION_LETTERS.map(letter => cell(`option${letter}`))

    if (kind === 'single_choice') {
      const correct = cell('correct').toUpperCase()
      const options: QuestionOption[] = []
      OPTION_LETTERS.forEach((letter, at) => {
        const optionText = optionTexts[at]
        if (optionText) options.push({ label: letter, text: optionText, isCorrect: letter === correct })
      })
      if (options.length < 2) {
        errors.push(`Baris ${line}: minimal dua opsi terisi.`)
        return
      }
      if (!options.some(option => option.isCorrect)) {
        errors.push(`Baris ${line}: kolom correct harus salah satu huruf opsi yang terisi (A–E).`)
        return
      }
      questions.push({ kind, prompt, explanation, options })
      return
    }

    if (kind === 'weighted') {
      const options: QuestionOption[] = []
      let weightProblem = false
      OPTION_LETTERS.forEach((letter, at) => {
        const optionText = optionTexts[at]
        if (!optionText) return
        const weight = Number.parseInt(cell(`weight${letter}`), 10)
        if (Number.isNaN(weight) || weight < 0) {
          weightProblem = true
          return
        }
        options.push({ label: letter, text: optionText, weight })
      })
      if (weightProblem) {
        errors.push(`Baris ${line}: tiap opsi berbobot butuh weight bilangan bulat ≥ 0.`)
        return
      }
      if (options.length < 2) {
        errors.push(`Baris ${line}: minimal dua opsi terisi.`)
        return
      }
      questions.push({ kind, prompt, explanation, options })
      return
    }

    if (kind === 'true_false') {
      const keys = cell('correct').split(';').map(key => parseTrueFalse(key))
      const statements = optionTexts.filter(Boolean)
      if (statements.length === 0) {
        errors.push(`Baris ${line}: isi pernyataan di kolom optionA dan seterusnya.`)
        return
      }
      if (keys.length !== statements.length || keys.some(key => key === null)) {
        errors.push(
          `Baris ${line}: kolom correct harus daftar B/S dipisah ";" — satu untuk tiap pernyataan.`,
        )
        return
      }
      const options: QuestionOption[] = statements.map((statement, at) => ({
        label: String(at + 1),
        text: statement,
        isCorrect: keys[at] === true,
      }))
      questions.push({ kind, prompt, explanation, options })
      return
    }

    // short_answer
    const answers = cell('answers').split(';').map(answer => answer.trim()).filter(Boolean)
    if (answers.length === 0) {
      errors.push(`Baris ${line}: kolom answers wajib berisi minimal satu jawaban (pisahkan dengan ";").`)
      return
    }
    questions.push({ kind, prompt, explanation, answers })
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
