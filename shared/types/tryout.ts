/**
 * The try out workspace: sitting a purchased package as a timed CBT session.
 *
 * Packages are served by zenko-api's owned-package tryout endpoint, which is
 * the only source for these shapes.
 */

import type { ScoreScale } from './tutor-product'

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
    passageId?: string
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
    passageId?: string
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
    passageId?: string
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
    passageId?: string
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
    passageId?: string
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
    passageId?: string
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
    passageId?: string
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
    passageId?: string
    text: string
    options: TryoutOption[]
    ordering?: string[]
    points?: number
    explanation?: string
  }

/**
 * Satu wacana (teks bacaan bersama) di dalam subtes. Soal-soal yang menunjuk
 * `passageId` ini menampilkan teksnya di panel bacaan tetap selama dikerjakan.
 */
export interface TryoutPassage {
  id: string
  title?: string
  content: string
}

export interface TryoutSection {
  id: string
  /** Short official code, e.g. "TWK", "TKD", "PU". Shown in the header pill. */
  code: string
  title: string
  durationMinutes: number
  durationSeconds?: number
  /**
   * "flat" (poin per jawaban benar) atau "weighted" (jumlah bobot opsi — gaya
   * TKP, tanpa jawaban salah). Absen pada payload lama.
   */
  scoringMode?: 'flat' | 'weighted'
  /** Ambang batas subtes (SKD). Absen saat subtes tidak punya. */
  passingGrade?: number
  /** Wacana milik subtes ini; absen saat semua soal berdiri sendiri. */
  passages?: TryoutPassage[]
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

/**
 * Milik siapa ruang ujian ini. Dikirim API hanya ketika paketnya dikerjakan
 * di dalam sebuah bimbel — untuk paket marketplace biasa field-nya absen dan
 * ruang ujian memakai identitas Zenko seperti biasa.
 *
 * `logoUrl` opsional: bimbel yang belum mengunggah logo tetap punya nama, dan
 * header jatuh ke lockup Zenko alih-alih menampilkan ruang kosong.
 */
export interface TryoutBrand {
  name: string
  logoUrl?: string
}

export interface TryoutBlueprint {
  slug: string
  title: string
  theme: TryoutTheme
  /** Bimbel penyelenggara, absen untuk paket non-bimbel. */
  brand?: TryoutBrand
  mode: TryoutMode
  scoreScale?: ScoreScale
  scoreDisclaimer?: string
  /**
   * Yang dihitung mundur klien mode flat: total resmi simulasi jenis ujiannya
   * saat ada (SKD: 100 menit), selain itu jumlah durasi subtes. Mode
   * sequential tetap memakai durationMinutes per subtes. Optional karena
   * payload lama (dan blueprint sample) belum membawanya — fallback: dijumlah.
   */
  totalDurationMinutes?: number
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
  /** Wacana milik subtes ini, untuk mengelompokkan soal per teks bacaan. */
  passages?: TryoutPassage[]
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
  /**
   * Batas atas `score` saat server yang menghitung ulang hasilnya (550 untuk
   * simulasi SKD penuh, 100 untuk satu mapel TKA); 0 untuk attempt yang tidak
   * dinilai server (produk legacy).
   */
  maxScore: number
  /** Verdict LULUS/TIDAK LULUS simulasi SKD; absen saat tidak berlaku. */
  passed?: boolean
  finishedAt: number
  title: string
  theme: TryoutTheme
  mode: TryoutMode
  scoreScale?: ScoreScale
  scoreDisclaimer?: string
  sections: TryoutReviewSection[]
}
