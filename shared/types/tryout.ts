/**
 * The try out workspace: sitting a purchased package as a timed CBT session.
 *
 * Packages are served by zenko-api's owned-package tryout endpoint, which is
 * the only source for these shapes.
 */

export type OptionLabel = string

export type TryoutAnswerValue = string | string[] | Record<string, string | boolean> | null

export interface TryoutOption {
  label: OptionLabel
  text: string
  /** Optional figure or diagram uploaded by the tutor. */
  imageUrl?: string
}

export interface TryoutMatchingItem {
  id: string
  text: string
}

/**
 * One item. Scoring is one of two Indonesian CBT models:
 * - objective: exactly one right answer, worth `points` (usually 5), 0 otherwise.
 * - situational: every option scores something 1–5 (TKP/AKHLAK style), so
 *   there is no wrong answer, only a better one — `scores` replaces `correct`.
 */
/**
 * The grading fields — `correct`, `points`, `scores` — are optional because one
 * source deliberately withholds them: the public sample behind "coba gratis"
 * ships questions with no answer key at all, and is graded by the API instead
 * (see gradeSampleAnswers). The owned-package endpoint always sends them.
 */
export type TryoutQuestion =
  | {
    id: string
    kind: 'objective'
    stimulus?: string
    text: string
    options: TryoutOption[]
    correct?: OptionLabel
    points?: number
    /** Pembahasan, sanitized HTML. Omitted by the API when the tutor left it empty. */
    explanation?: string
  }
  | {
    id: string
    kind: 'situational'
    stimulus?: string
    text: string
    options: TryoutOption[]
    scores?: Record<OptionLabel, number>
    /** Pembahasan, sanitized HTML. Omitted by the API when the tutor left it empty. */
    explanation?: string
  }
  | {
    id: string
    kind: 'multiple_choice'
    stimulus?: string
    text: string
    options: TryoutOption[]
    correctOptions?: OptionLabel[]
    points?: number
    explanation?: string
  }
  | {
    id: string
    kind: 'true_false'
    stimulus?: string
    text: string
    options: TryoutOption[]
    correctStatements?: Record<string, boolean>
    points?: number
    explanation?: string
  }
  | {
    id: string
    kind: 'short_answer'
    stimulus?: string
    text: string
    options: TryoutOption[]
    answers?: string[]
    points?: number
    explanation?: string
  }
  | {
    id: string
    kind: 'assertion_reason' | 'associative_choice'
    stimulus?: string
    text: string
    options: TryoutOption[]
    correct?: OptionLabel
    points?: number
    explanation?: string
  }
  | {
    id: string
    kind: 'matching'
    stimulus?: string
    text: string
    options: TryoutOption[]
    matching?: TryoutMatchingItem[]
    matchingPairs?: Record<string, string>
    points?: number
    explanation?: string
  }
  | {
    id: string
    kind: 'ordering'
    stimulus?: string
    text: string
    options: TryoutOption[]
    ordering?: string[]
    points?: number
    explanation?: string
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
  value?: TryoutAnswerValue
  doubtful: boolean
}

export interface TryoutSectionResult {
  title: string
  correct: number
  total: number
  score: number
  maxScore: number
}

/**
 * What POST /packages/:slug/sample/score returns: the same tally as
 * TryoutResult, minus finishedAt, which the browser stamps. The sample's
 * answer key never leaves the API, so these numbers are the only grading
 * information the "coba gratis" page ever receives.
 */
export interface TryoutSampleScore {
  score: number
  maxScore: number
  sections: TryoutSectionResult[]
}

export interface TryoutResult {
  finishedAt: number
  score: number
  maxScore: number
  sections: TryoutSectionResult[]
}

/**
 * One item inside a stored attempt's full review: everything TryoutQuestion
 * carries, plus what the student actually did with it and whether zenko-api
 * judged it correct. `selected`/`doubtful` mirror TryoutAnswerState — absent
 * (not merely falsy) means the question was left unanswered, same convention
 * the live session composable uses.
 */
export type TryoutReviewQuestion = TryoutQuestion & {
  selected?: OptionLabel
  value?: TryoutAnswerValue
  doubtful?: boolean
  /** Judged server-side against the real answer key, never trusted from the client. */
  isCorrect: boolean
}

/** One subtest inside a stored attempt's review. */
export interface TryoutReviewSection {
  id: string
  code: string
  title: string
  questions: TryoutReviewQuestion[]
}

/**
 * GET /me/attempts/:attemptId/review — the full pembahasan for one stored
 * attempt, snapshotted at submission time so it stays reopenable from
 * Riwayat pengerjaan long after the sitting itself, and unaffected by any
 * later edit the tutor makes to the live product.
 */
export interface TryoutAttemptReview {
  attemptId: string
  packageSlug: string
  number: number
  score: number
  finishedAt: number
  title: string
  theme: TryoutTheme
  mode: TryoutMode
  sections: TryoutReviewSection[]
}
