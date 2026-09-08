import type {
  MatchingData,
  QuestionDraft,
  QuestionKind,
  QuestionOption,
} from '#shared/types/tutor-product'
import { stripHtmlToText } from '~/utils/richText'

export type DraftValidationAnchor = 'prompt' | 'choices' | 'statements' | 'matching' | 'answers'

export interface ChoiceDraftRow {
  letter: string
  text: string
  weight: number | null
  imageUrl: string
}

export interface StatementDraftRow {
  text: string
  isCorrect: boolean
  imageUrl: string
}

export interface MatchingLeftRow {
  label: string
  text: string
}

export interface QuestionDraftState {
  kind: QuestionKind
  prompt: string
  explanation: string
  stimulus: string
  /**
   * Tautan wacana subtes. Selalu dikirim saat terdefinisi — string kosong
   * berarti soal berdiri sendiri (dan melepas tautan pada PATCH, yang memang
   * full-replace di server).
   */
  passageId?: string
  choiceRows: ChoiceDraftRow[]
  correctIndex: number
  correctIndexes: number[]
  statements: StatementDraftRow[]
  answers: string[]
  matchingLeftRows: MatchingLeftRow[]
  matchingItems: MatchingData['items']
  matchingPairs: Record<string, string>
  ordering: string[]
  /**
   * Batas bentuk opsi dari template subtes — cermin sectionKindIssue di
   * zenko-api. maxOptionWeight adalah bobot tertinggi yang boleh dipakai, dan
   * yang wajib dicapai minimal satu opsi supaya skor maksimum subtes benar-benar
   * terjangkau; requiredOptionCount memaksa jumlah opsi persis segitu (bentuk
   * baku CAT BKN, A–E). Divalidasi di sini juga supaya tutor tahu sebelum
   * request-nya ditolak server.
   */
  maxOptionWeight?: number
  requiredOptionCount?: number
}

export interface DraftValidationError {
  message: string
  anchor: DraftValidationAnchor
}

export type QuestionDraftResult =
  | { draft: QuestionDraft }
  | { error: DraftValidationError }

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

function error(message: string, anchor: DraftValidationAnchor): QuestionDraftResult {
  return { error: { message, anchor } }
}

function filledChoices(rows: ChoiceDraftRow[]) {
  return rows
    .map((row, index) => ({ ...row, index }))
    .filter(row => stripHtmlToText(row.text))
}

function baseDraft(state: QuestionDraftState): QuestionDraft | null {
  if (!stripHtmlToText(state.prompt)) return null

  const stimulus = stripHtmlToText(state.stimulus) ? state.stimulus.trim() : ''
  return {
    kind: state.kind,
    prompt: state.prompt.trim(),
    explanation: state.explanation.trim(),
    ...(stimulus ? { stimulus } : {}),
    ...(state.passageId !== undefined ? { passageId: state.passageId } : {}),
  }
}

function choiceOption(row: ChoiceDraftRow, index: number, extra: Partial<QuestionOption> = {}): QuestionOption {
  return {
    label: OPTION_LETTERS[index]!,
    text: row.text.trim(),
    ...(row.imageUrl.trim() ? { imageUrl: row.imageUrl.trim() } : {}),
    ...extra,
  }
}

function buildCorrectChoiceDraft(
  base: QuestionDraft,
  state: QuestionDraftState,
  rows: ReturnType<typeof filledChoices>,
): QuestionDraftResult {
  if (!rows.some(row => row.index === state.correctIndex)) {
    return error('Pilih kunci jawaban dari opsi yang terisi.', 'choices')
  }

  return {
    draft: {
      ...base,
      options: rows.map((row, index) => choiceOption(row, index, {
        isCorrect: row.index === state.correctIndex,
      })),
    },
  }
}

function buildMultipleChoiceDraft(
  base: QuestionDraft,
  state: QuestionDraftState,
  rows: ReturnType<typeof filledChoices>,
): QuestionDraftResult {
  if (state.correctIndexes.length < 2) {
    return error('Pilih minimal dua kunci jawaban.', 'choices')
  }

  return {
    draft: {
      ...base,
      options: rows.map((row, index) => choiceOption(row, index, {
        isCorrect: state.correctIndexes.includes(row.index),
      })),
    },
  }
}

function orderingLabels(rows: ReturnType<typeof filledChoices>, ordering: string[]) {
  const labels = new Map(rows.map((row, index) => [row.letter, OPTION_LETTERS[index]!] as [string, string]))
  return ordering
    .slice(0, rows.length)
    .flatMap(letter => labels.has(letter) ? [labels.get(letter)!] : [])
}

function buildOrderingDraft(
  base: QuestionDraft,
  state: QuestionDraftState,
  rows: ReturnType<typeof filledChoices>,
): QuestionDraftResult {
  const ordered = orderingLabels(rows, state.ordering)
  if (new Set(ordered).size !== ordered.length) {
    return error('Tiap item cuma boleh dipakai sekali dalam urutan.', 'choices')
  }
  if (ordered.length !== rows.length) {
    return error('Tentukan urutan semua item.', 'choices')
  }

  return {
    draft: {
      ...base,
      options: rows.map((row, index) => choiceOption(row, index)),
      ordering: ordered,
    },
  }
}

function buildWeightedDraft(
  base: QuestionDraft,
  state: QuestionDraftState,
  rows: ReturnType<typeof filledChoices>,
): QuestionDraftResult {
  if (rows.some(row => row.weight === null || !Number.isInteger(row.weight) || row.weight < 0)) {
    return error('Isi bobot (bilangan bulat ≥ 0) untuk tiap opsi yang terisi.', 'choices')
  }
  const maximum = state.maxOptionWeight ?? 0
  if (maximum && rows.some(row => row.weight! < 1 || row.weight! > maximum)) {
    return error(`Bobot tiap opsi harus antara 1 dan ${maximum}.`, 'choices')
  }
  if (maximum && !rows.some(row => row.weight === maximum)) {
    return error(`Isi minimal satu opsi dengan bobot tertinggi (${maximum}).`, 'choices')
  }

  return {
    draft: {
      ...base,
      options: rows.map((row, index) => choiceOption(row, index, { weight: row.weight! })),
    },
  }
}

function buildChoiceDraft(base: QuestionDraft, state: QuestionDraftState): QuestionDraftResult {
  const rows = filledChoices(state.choiceRows)
  if (rows.length < 2) return error('Isi minimal dua opsi.', 'choices')

  // Jumlah opsi yang dipatok template (bentuk baku CAT BKN: A–E) — cermin
  // optionCountIssue di zenko-api, supaya kekurangannya ketahuan di form dan
  // bukan sebagai 400 dari server.
  // `ordering` stores items to arrange rather than answer choices, so a fixed
  // choice count never applies to it — same exclusion questionHasOptionList
  // makes server-side.
  const requiredCount = state.kind === 'ordering' ? 0 : state.requiredOptionCount ?? 0
  if (requiredCount && rows.length !== requiredCount) {
    return error(`Soal ini wajib memiliki tepat ${requiredCount} pilihan jawaban.`, 'choices')
  }

  switch (state.kind) {
    case 'single_choice':
    case 'assertion_reason':
    case 'associative_choice':
      return buildCorrectChoiceDraft(base, state, rows)
    case 'multiple_choice':
      return buildMultipleChoiceDraft(base, state, rows)
    case 'ordering':
      return buildOrderingDraft(base, state, rows)
    case 'weighted':
      return buildWeightedDraft(base, state, rows)
    default:
      return error('Jenis soal tidak didukung.', 'choices')
  }
}

function buildTrueFalseDraft(base: QuestionDraft, state: QuestionDraftState): QuestionDraftResult {
  const statements = state.statements.filter(statement => stripHtmlToText(statement.text))
  if (statements.length === 0) return error('Tulis minimal satu pernyataan.', 'statements')

  return {
    draft: {
      ...base,
      options: statements.map((statement, index) => ({
        label: String(index + 1),
        text: statement.text.trim(),
        isCorrect: statement.isCorrect,
        ...(statement.imageUrl.trim() ? { imageUrl: statement.imageUrl.trim() } : {}),
      })),
    },
  }
}

function buildMatchingDraft(base: QuestionDraft, state: QuestionDraftState): QuestionDraftResult {
  const left = state.matchingLeftRows.filter(row => stripHtmlToText(row.text))
  const right = state.matchingItems.filter(item => stripHtmlToText(item.text))
  if (left.length < 2 || right.length !== left.length) {
    return error('Isi jumlah item kiri dan kanan yang sama, minimal dua.', 'matching')
  }

  const hasInvalidPair = left.some((row) => {
    const rightId = state.matchingPairs[row.label]
    return !rightId || !right.some(item => item.id === rightId)
  })
  if (hasInvalidPair) return error('Tentukan pasangan untuk setiap item kiri.', 'matching')

  return {
    draft: {
      ...base,
      options: left.map(row => ({ label: row.label, text: row.text.trim() })),
      matching: {
        items: right.map(item => ({ id: item.id, text: item.text.trim() })),
        pairs: Object.fromEntries(left.map(row => [row.label, state.matchingPairs[row.label]!])),
      },
    },
  }
}

function buildShortAnswerDraft(base: QuestionDraft, state: QuestionDraftState): QuestionDraftResult {
  const answers = state.answers.map(answer => answer.trim()).filter(Boolean)
  if (answers.length === 0) return error('Isi minimal satu jawaban yang diterima.', 'answers')
  return { draft: { ...base, answers } }
}

export function buildQuestionDraft(state: QuestionDraftState): QuestionDraftResult {
  if (!stripHtmlToText(state.prompt)) return error('Tulis pertanyaannya dulu.', 'prompt')

  const base = baseDraft(state)!
  switch (state.kind) {
    case 'true_false':
      return buildTrueFalseDraft(base, state)
    case 'matching':
      return buildMatchingDraft(base, state)
    case 'short_answer':
      return buildShortAnswerDraft(base, state)
    default:
      return buildChoiceDraft(base, state)
  }
}
