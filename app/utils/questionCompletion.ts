import type { TutorQuestion, TutorSection } from '#shared/types/tutor-product'

/**
 * Single source of truth for the 🟢/🟡/🔴 completion signal used across the
 * tutor question editor (question nav grid + subtes picker). A mirror of the
 * backend's `submit` validation (docs/tutor-flow-contract.md §4) — only for
 * visual hinting, the server re-validates for real.
 */
export type CompletionState = 'complete' | 'no-explanation' | 'incomplete'

export function questionCompletionState(question: TutorQuestion): CompletionState {
  if (!stripHtmlToText(question.prompt)) return 'incomplete'

  switch (question.kind) {
    case 'single_choice': {
      const options = question.options ?? []
      // Opsi kini HTML kaya (lihat TutorOptionField.vue) — "<p></p>" bukan
      // string kosong, jadi cek kelengkapannya lewat teksnya, bukan HTML mentah.
      if (options.length < 2 || options.some(o => !stripHtmlToText(o.text))) return 'incomplete'
      if (!options.some(o => o.isCorrect)) return 'incomplete'
      break
    }
    case 'weighted': {
      const options = question.options ?? []
      if (options.length < 2) return 'incomplete'
      if (options.some(o => !stripHtmlToText(o.text) || o.weight == null || o.weight < 0)) return 'incomplete'
      break
    }
    case 'true_false': {
      const options = question.options ?? []
      if (options.length === 0 || options.some(o => !stripHtmlToText(o.text))) return 'incomplete'
      break
    }
    case 'short_answer': {
      if (!question.answers || question.answers.length === 0) return 'incomplete'
      break
    }
  }

  return stripHtmlToText(question.explanation) ? 'complete' : 'no-explanation'
}

/**
 * Aggregate a whole subtes down to one of the same three states, so the
 * subtes picker can show the same 🟢/🟡/🔴 signal as the per-question grid
 * without inventing new thresholds: short of target (or any question
 * `incomplete`) outranks a missing explanation, which outranks complete.
 */
export function sectionCompletionState(section: TutorSection): CompletionState {
  if (section.questions.length < section.questionTarget) return 'incomplete'

  let worst: CompletionState = 'complete'
  for (const question of section.questions) {
    const state = questionCompletionState(question)
    if (state === 'incomplete') return 'incomplete'
    if (state === 'no-explanation') worst = 'no-explanation'
  }
  return worst
}

export const COMPLETION_STATE_CLASS: Record<CompletionState, string> = {
  complete: 'bg-success-soft text-success-ink',
  'no-explanation': 'bg-amber-100 text-amber-800',
  incomplete: 'bg-red-100 text-red-700',
}

export const COMPLETION_STATE_TITLE: Record<CompletionState, string> = {
  complete: 'Lengkap',
  'no-explanation': 'Belum ada pembahasan',
  incomplete: 'Belum lengkap',
}
