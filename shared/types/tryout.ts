/**
 * The try out workspace: sitting a purchased package as a timed CBT session.
 *
 * Packages are served by zenko-api's owned-package tryout endpoint, which is
 * the only source for these shapes.
 */

export type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E'

export interface TryoutOption {
  label: OptionLabel
  text: string
  /** Optional figure or diagram uploaded by the tutor. */
  imageUrl?: string
}

/**
 * One item. Scoring is one of two Indonesian CBT models:
 * - objective: exactly one right answer, worth `points` (usually 5), 0 otherwise.
 * - situational: every option scores something 1–5 (TKP/AKHLAK style), so
 *   there is no wrong answer, only a better one — `scores` replaces `correct`.
 */
export type TryoutQuestion =
  | {
    id: string
    kind: 'objective'
    stimulus?: string
    text: string
    options: TryoutOption[]
    correct: OptionLabel
    points: number
  }
  | {
    id: string
    kind: 'situational'
    stimulus?: string
    text: string
    options: TryoutOption[]
    scores: Record<OptionLabel, number>
  }

export interface TryoutSection {
  id: string
  /** Short official code, e.g. "TWK", "TKD", "PU". Shown in the header pill. */
  code: string
  title: string
  durationMinutes: number
  questions: TryoutQuestion[]
}

/** Identity of the agency/system a package's try out impersonates. Chrome colour is always Zenko's own brand — only these labels change. */
export interface TryoutTheme {
  /** e.g. "CAT BKN", "UTBK-SNBT", "Rekrutmen Bersama BUMN", "TKA". */
  system: string
  agency: string
  /** Two or three letters for the seal mark shown on the intro screen. */
  seal: string
}

/**
 * How a system paces its subtests, confirmed per system rather than assumed:
 * - flat: one countdown for every question across all subtests, freely
 *   navigable end to end — how CAT BKN actually runs the SKD (110 soal /
 *   100 menit in one sitting, not one timer per TWK/TIU/TKP).
 * - sequential: each subtest has its own countdown and, once you move on,
 *   the previous one locks — how UTBK-SNBT and TKA actually run.
 */
export type TryoutMode = 'flat' | 'sequential'

export interface TryoutBlueprint {
  slug: string
  title: string
  theme: TryoutTheme
  mode: TryoutMode
  sections: TryoutSection[]
}

/** Per-question answer state kept while a session is running. */
export interface TryoutAnswerState {
  selected: OptionLabel | null
  doubtful: boolean
}

export interface TryoutSectionResult {
  title: string
  correct: number
  total: number
  score: number
  maxScore: number
}

export interface TryoutResult {
  finishedAt: number
  score: number
  maxScore: number
  sections: TryoutSectionResult[]
}
