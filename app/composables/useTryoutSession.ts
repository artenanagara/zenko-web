import type { MaybeRefOrGetter } from 'vue'
import type {
  OptionLabel,
  TryoutAnswerState,
  TryoutAnswerValue,
  TryoutBlueprint,
  TryoutPassage,
  TryoutQuestion,
  TryoutResult,
  TryoutSampleScore,
  TryoutSectionResult,
} from '#shared/types/tryout'
import { toValue } from 'vue'

export type TryoutPhase = 'intro' | 'running' | 'section-break' | 'finished'

interface PersistedState {
  phase: TryoutPhase
  currentIndex: number
  answers: Record<string, TryoutAnswerState>
  /** Unix ms the current countdown ends — the whole exam in flat mode, the current subtest in sequential mode. */
  sectionEndsAt: number
}

interface FlatQuestion {
  question: TryoutQuestion
  sectionIndex: number
}

/** One group of numbered buttons in the navigator, labelled by its subtest. */
export interface TryoutNavigatorGroup {
  code: string
  title: string
  /** Absolute index (into the flattened question list) of this group's first question — the jump target. */
  startIndex: number
  /**
   * What number its first question displays as. In flat mode this equals
   * `startIndex`, so numbering runs 1..110 straight through every subtest —
   * how CAT BKN actually numbers the SKD. In sequential mode it is always 0,
   * so each subtest restarts at "Soal 1", matching the question panel.
   */
  numberOffset: number
  questions: TryoutQuestion[]
}

function storageKey(slug: string) {
  return `zenko-tryout:${slug}`
}

function maxOf(scores: Record<OptionLabel, number> | undefined): number {
  const values = Object.values(scores ?? {})
  return values.length ? Math.max(...values) : 0
}

function answerValue(answer: TryoutAnswerState | undefined): TryoutAnswerValue {
  return answer?.value ?? answer?.selected ?? null
}

function sameSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const values = new Set(left)
  return right.every(value => values.has(value))
}

/**
 * Grades one item in the browser. Every field it reads is optional on
 * TryoutQuestion because the public sample ships without an answer key — a
 * sitting with no key scores zero here rather than throwing, and is graded by
 * the API instead (see the `grade` option).
 */
function scoreQuestion(question: TryoutQuestion, answer: TryoutAnswerState | undefined) {
  if (question.kind === 'objective') {
    const max = question.points ?? 0
    const correct = !!question.correct && answer?.selected === question.correct
    return { points: correct ? max : 0, max, correct }
  }
  if (question.kind === 'situational') {
    const max = maxOf(question.scores)
    const points = answer?.selected ? (question.scores?.[answer.selected] ?? 0) : 0
    return { points, max, correct: max > 0 && points === max }
  }

  const pointsPerItem = question.points ?? 0
  if (question.kind === 'multiple_choice') {
    const selected = Array.isArray(answerValue(answer)) ? answerValue(answer) as string[] : []
    const correct = question.correctOptions ?? []
    const hits = selected.filter(value => correct.includes(value)).length
    const max = pointsPerItem
    const points = correct.length ? Math.round(max * hits / correct.length) : 0
    return { points, max, correct: sameSet(selected, correct) }
  }

  if (question.kind === 'true_false') {
    const selected = answerValue(answer)
    const values = selected && typeof selected === 'object' && !Array.isArray(selected)
      ? selected as Record<string, string | boolean>
      : {}
    const expected = question.correctStatements ?? {}
    const total = Object.keys(expected).length
    const hits = Object.entries(expected).filter(([label, value]) => values[label] === value).length
    return { points: hits * pointsPerItem, max: total * pointsPerItem, correct: total > 0 && hits === total }
  }

  if (question.kind === 'short_answer') {
    const value = typeof answerValue(answer) === 'string' ? String(answerValue(answer)).trim().toLowerCase() : ''
    const correct = (question.answers ?? []).some(item => item.trim().toLowerCase() === value)
    return { points: correct ? pointsPerItem : 0, max: pointsPerItem, correct }
  }

  if (question.kind === 'assertion_reason' || question.kind === 'associative_choice') {
    const correct = answer?.selected === question.correct
    return { points: correct ? pointsPerItem : 0, max: pointsPerItem, correct }
  }

  if (question.kind === 'matching') {
    const selected = answerValue(answer)
    const values = selected && typeof selected === 'object' && !Array.isArray(selected)
      ? selected as Record<string, string | boolean>
      : {}
    const expected = question.matchingPairs ?? {}
    const total = Object.keys(expected).length
    const hits = Object.entries(expected).filter(([left, right]) => values[left] === right).length
    const max = pointsPerItem
    return { points: total ? Math.round(max * hits / total) : 0, max, correct: total > 0 && hits === total }
  }

  if (question.kind === 'ordering') {
    const selected = answerValue(answer)
    const values = Array.isArray(selected) ? selected : []
    const expected = question.ordering ?? []
    const hits = expected.filter((value, index) => values[index] === value).length
    return {
      points: expected.length ? Math.round(pointsPerItem * hits / expected.length) : 0,
      max: pointsPerItem,
      correct: expected.length > 0 && hits === expected.length,
    }
  }
  return { points: 0, max: pointsPerItem, correct: false }
}

export interface TryoutSessionOptions {
  /**
   * Whether a reload should pick the sitting back up where it left off
   * (default). Turn it off for a sitting that is deliberately throwaway — the
   * tutor/admin simulation — where "no resume" is the point: nothing is
   * written to sessionStorage, and arriving at the page always starts from a
   * clean intro screen instead of the previous run's leftovers, which the
   * `useState` keys would otherwise still be holding after a client-side
   * navigation away and back.
   */
  resume?: boolean
  /**
   * Grades the sitting somewhere other than this browser, and becomes the
   * result screen's only source of numbers.
   *
   * The "coba gratis" sample needs it: its questions arrive with no `correct`,
   * `points` or `scores`, on purpose — a public endpoint that shipped the
   * answer key would hand every visitor the keys to five real questions — so
   * the API grades the submission and returns the tally. Left unset, the
   * sitting is graded locally from the blueprint, which is what an owned
   * package does.
   *
   * A rejection is surfaced as `gradeFailed` rather than swallowed: unlike the
   * paid sitting, there is no locally computed score to fall back on.
   */
  grade?: (answers: Record<string, TryoutAnswerState>) => Promise<TryoutSampleScore>
}

/**
 * Runs one try out sitting end to end: intro → questions → result.
 *
 * Pacing follows the blueprint's `mode`, which reflects how each real system
 * actually runs (see TryoutMode) rather than a single assumed shape:
 * - flat (CAT BKN, BUMN): one countdown for the whole sitting, every
 *   question reachable from question one — no forced stop between subtests.
 * - sequential (UTBK-SNBT, TKA): each subtest has its own countdown, and
 *   once you move on there is no way back into the one before it.
 *
 * State survives a reload (sessionStorage), so a refresh mid-exam restores
 * the same question, answers, and remaining time instead of losing the
 * sitting — the one thing worse than a strict timer is one that resets itself.
 *
 * `blueprintSource` may resolve asynchronously for a purchased package or be
 * a static trimmed blueprint for the free-sample page. The session `slug`
 * must be unique (e.g. `${slug}--coba` for a sample), because
 * slug keys both the persisted state and every useState below; sharing the
 * real slug would let a sample sitting resume someone's real sitting.
 */
export function useTryoutSession(
  slug: string,
  blueprintSource: MaybeRefOrGetter<TryoutBlueprint | null | undefined>,
  options: TryoutSessionOptions = {},
) {
  const { resume = true, grade } = options
  const blueprint = computed<TryoutBlueprint | null>(() => toValue(blueprintSource) ?? null)
  const key = storageKey(slug)

  const phase = useState<TryoutPhase>(`tryout-phase-${slug}`, () => 'intro')
  const currentIndex = useState<number>(`tryout-index-${slug}`, () => 0)
  const answers = useState<Record<string, TryoutAnswerState>>(`tryout-answers-${slug}`, () => ({}))
  const sectionEndsAt = useState<number>(`tryout-ends-${slug}`, () => 0)
  const result = useState<TryoutResult | null>(`tryout-result-${slug}`, () => null)
  const now = useState<number>(`tryout-now-${slug}`, () => Date.now())
  // Only ever true while a remote grader is in flight; a locally graded
  // sitting goes from running to a filled-in result in one tick.
  const grading = useState<boolean>(`tryout-grading-${slug}`, () => false)
  const gradeFailed = useState<boolean>(`tryout-grade-failed-${slug}`, () => false)

  let ticker: ReturnType<typeof setInterval> | null = null

  // Every question, flattened once with the section it belongs to — the one
  // list both pacing modes navigate, just with a different allowed range.
  const allQuestions = computed<FlatQuestion[]>(() => {
    if (!blueprint.value) return []
    return blueprint.value.sections.flatMap((section, sectionIndex) =>
      section.questions.map(question => ({ question, sectionIndex })),
    )
  })

  // Absolute index each section starts at, e.g. [0, 6, 14] for sections of 6/8/6.
  const sectionOffsets = computed<number[]>(() => {
    if (!blueprint.value) return []
    let offset = 0
    return blueprint.value.sections.map((section) => {
      const start = offset
      offset += section.questions.length
      return start
    })
  })

  function persist() {
    if (!import.meta.client || !resume) return
    const payload: PersistedState = {
      phase: phase.value,
      currentIndex: currentIndex.value,
      answers: answers.value,
      sectionEndsAt: sectionEndsAt.value,
    }
    sessionStorage.setItem(key, JSON.stringify(payload))
  }

  function restore() {
    if (!import.meta.client || !blueprint.value) return
    const raw = sessionStorage.getItem(key)
    if (!raw) return

    try {
      const saved = JSON.parse(raw) as PersistedState
      if (saved.currentIndex >= allQuestions.value.length) return

      phase.value = saved.phase === 'running' || saved.phase === 'section-break' ? saved.phase : 'intro'
      currentIndex.value = saved.currentIndex
      answers.value = saved.answers
      sectionEndsAt.value = saved.sectionEndsAt
    }
    catch {
      sessionStorage.removeItem(key)
    }
  }

  function startTicker() {
    if (!import.meta.client || ticker) return
    ticker = setInterval(() => {
      now.value = Date.now()
      if (phase.value === 'running' && remainingSeconds.value <= 0) endSection()
    }, 1000)
  }

  function stopTicker() {
    if (ticker) {
      clearInterval(ticker)
      ticker = null
    }
  }

  const currentEntry = computed(() => allQuestions.value[currentIndex.value] ?? null)
  const currentQuestion = computed(() => currentEntry.value?.question ?? null)
  const currentSectionIndex = computed(() => currentEntry.value?.sectionIndex ?? 0)
  const currentSection = computed(() => blueprint.value?.sections[currentSectionIndex.value] ?? null)

  /**
   * Wacana (teks bacaan bersama) milik soal aktif — null saat soal berdiri
   * sendiri. Diambil dari daftar passages subtes soal itu; runtime menampilkan
   * teksnya di panel bacaan yang bertahan selama siswa berpindah antar nomor
   * dalam grup yang sama.
   */
  const currentPassage = computed<TryoutPassage | null>(() => {
    const question = currentQuestion.value
    if (!question?.passageId) return null
    return currentSection.value?.passages?.find(passage => passage.id === question.passageId) ?? null
  })

  // The range of absolute indices navigation is allowed to touch right now:
  // the whole exam in flat mode, only the current subtest in sequential mode.
  const bounds = computed<[number, number]>(() => {
    if (!blueprint.value) return [0, -1]
    if (blueprint.value.mode === 'flat') return [0, allQuestions.value.length - 1]
    const start = sectionOffsets.value[currentSectionIndex.value] ?? 0
    const end = start + (blueprint.value.sections[currentSectionIndex.value]?.questions.length ?? 1) - 1
    return [start, end]
  })

  const navigatorGroups = computed<TryoutNavigatorGroup[]>(() => {
    if (!blueprint.value) return []
    if (blueprint.value.mode === 'flat') {
      return blueprint.value.sections.map((section, index) => {
        const start = sectionOffsets.value[index] ?? 0
        return { code: section.code, title: section.title, startIndex: start, numberOffset: start, questions: section.questions }
      })
    }
    const section = currentSection.value
    if (!section) return []
    return [{ code: section.code, title: section.title, startIndex: bounds.value[0], numberOffset: 0, questions: section.questions }]
  })

  const isLastSection = computed(() => {
    if (!blueprint.value) return true
    if (blueprint.value.mode === 'flat') return true
    return currentSectionIndex.value === blueprint.value.sections.length - 1
  })
  const isLastQuestion = computed(() => currentIndex.value === bounds.value[1])
  const isFirstQuestion = computed(() => currentIndex.value === bounds.value[0])

  const displayIndex = computed(() =>
    blueprint.value?.mode === 'flat' ? currentIndex.value + 1 : currentIndex.value - bounds.value[0] + 1,
  )
  const displayTotal = computed(() =>
    blueprint.value?.mode === 'flat' ? allQuestions.value.length : bounds.value[1] - bounds.value[0] + 1,
  )

  const remainingSeconds = computed(() => Math.max(0, Math.round((sectionEndsAt.value - now.value) / 1000)))

  const navigableQuestions = computed(() =>
    allQuestions.value.slice(bounds.value[0], bounds.value[1] + 1).map(entry => entry.question),
  )
  const answeredCount = computed(
    () => navigableQuestions.value.filter(q => {
      const answer = answers.value[q.id]
      return answer?.selected != null || answer?.value != null
    }).length,
  )
  const doubtfulCount = computed(
    () => navigableQuestions.value.filter(q => answers.value[q.id]?.doubtful).length,
  )
  const unansweredCount = computed(() => navigableQuestions.value.length - answeredCount.value)

  function statusOf(questionId: string): 'answered' | 'doubtful' | 'unanswered' {
    const answer = answers.value[questionId]
    if (answer?.doubtful) return 'doubtful'
    if (answer?.selected) return 'answered'
    return 'unanswered'
  }

  function labelOf(questionId: string): OptionLabel | null {
    return answers.value[questionId]?.selected ?? null
  }

  function start() {
    const currentBlueprint = blueprint.value
    if (!currentBlueprint) return
    currentIndex.value = 0
    answers.value = {}
    // Flat mode counts down the blueprint's official total when it carries
    // one (SKD simulasi: 100 minutes for all 110 questions under one timer —
    // NOT the 105 the per-section mini-tryout defaults sum to); older
    // payloads and the sample blueprint fall back to summing the sections.
    const totalMinutes = currentBlueprint.mode === 'flat'
      ? (currentBlueprint.totalDurationMinutes
        || currentBlueprint.sections.reduce((sum, s) => sum + s.durationMinutes, 0))
      : currentBlueprint.sections[0]!.durationMinutes
    sectionEndsAt.value = Date.now() + totalMinutes * 60_000
    result.value = null
    grading.value = false
    gradeFailed.value = false
    phase.value = 'running'
    startTicker()
    persist()
  }

  function selectAnswer(label: OptionLabel) {
    const question = currentQuestion.value
    if (!question) return
    answers.value = {
      ...answers.value,
      [question.id]: { selected: label, value: label, doubtful: answers.value[question.id]?.doubtful ?? false },
    }
    persist()
  }

  function setAnswerValue(value: TryoutAnswerValue, selected: OptionLabel | null = null) {
    const question = currentQuestion.value
    if (!question) return
    answers.value = {
      ...answers.value,
      [question.id]: { selected, value, doubtful: answers.value[question.id]?.doubtful ?? false },
    }
    persist()
  }

  function toggleDoubt() {
    const question = currentQuestion.value
    if (!question) return
    const existing = answers.value[question.id]
    answers.value = {
      ...answers.value,
      [question.id]: { selected: existing?.selected ?? null, value: existing?.value ?? existing?.selected ?? null, doubtful: !existing?.doubtful },
    }
    persist()
  }

  function goTo(absoluteIndex: number) {
    currentIndex.value = Math.min(Math.max(absoluteIndex, bounds.value[0]), bounds.value[1])
    persist()
  }

  function next() {
    if (!isLastQuestion.value) goTo(currentIndex.value + 1)
  }

  function prev() {
    if (!isFirstQuestion.value) goTo(currentIndex.value - 1)
  }

  /**
   * Ends the current countdown — by the clock or by the participant's own
   * call. In flat mode that is always the whole exam, since there is only
   * ever one countdown. In sequential mode it locks the subtest just worked
   * through and, unless it was the last one, hands off to a break screen.
   */
  function endSection() {
    const currentBlueprint = blueprint.value
    if (!currentBlueprint) return
    if (currentBlueprint.mode === 'flat' || isLastSection.value) {
      finish()
      return
    }
    phase.value = 'section-break'
    persist()
  }

  function startNextSection() {
    const currentBlueprint = blueprint.value
    if (!currentBlueprint) return
    const nextIndex = currentSectionIndex.value + 1
    const nextSection = currentBlueprint.sections[nextIndex]
    if (!nextSection) return
    currentIndex.value = sectionOffsets.value[nextIndex] ?? currentIndex.value
    sectionEndsAt.value = Date.now() + nextSection.durationMinutes * 60_000
    phase.value = 'running'
    persist()
  }

  function finish() {
    const currentBlueprint = blueprint.value
    if (!currentBlueprint) return
    stopTicker()

    // The phase flips before the grader answers, not after: the sitting is
    // over the moment the countdown or the participant says so, and leaving
    // the workspace open while a request is in flight would let answers keep
    // changing under a submission already sent.
    phase.value = 'finished'
    if (import.meta.client) sessionStorage.removeItem(key)

    if (grade) {
      result.value = null
      void runGrade()
      return
    }
    result.value = localResult(currentBlueprint)
  }

  /**
   * Sends the sitting to the API grader. Failure leaves `result` null and
   * `gradeFailed` true — the result screen shows a retry rather than a score
   * of zero, which would be a lie about how the participant did.
   */
  async function runGrade() {
    if (!grade) return
    grading.value = true
    gradeFailed.value = false
    try {
      const scored = await grade(answers.value)
      result.value = {
        finishedAt: Math.floor(Date.now() / 1000),
        ...scored,
      }
    }
    catch {
      gradeFailed.value = true
      result.value = null
    }
    finally {
      grading.value = false
    }
  }

  function localResult(currentBlueprint: TryoutBlueprint): TryoutResult {
    const sections: TryoutSectionResult[] = currentBlueprint.sections.map((section) => {
      let score = 0
      let maxScore = 0
      let correct = 0

      // For situational items (TKP/AKHLAK) "correct" means the option that
      // scores the maximum, not a right/wrong answer — there is no wrong one.
      // Counting it this way keeps every section's correct/total ratio
      // meaningful, including subtests that are entirely situational.
      for (const question of section.questions) {
        const outcome = scoreQuestion(question, answers.value[question.id])
        score += outcome.points
        maxScore += outcome.max
        if (outcome.correct) correct += 1
      }

      return { title: section.title, correct, total: section.questions.length, score, maxScore }
    })

    return {
      finishedAt: Math.floor(Date.now() / 1000),
      score: sections.reduce((sum, s) => sum + s.score, 0),
      maxScore: sections.reduce((sum, s) => sum + s.maxScore, 0),
      sections,
    }
  }

  function warnBeforeUnload(event: BeforeUnloadEvent) {
    if (phase.value !== 'running' && phase.value !== 'section-break') return
    event.preventDefault()
  }

  let mounted = false
  let restored = false

  /** Back to a clean intro — same fields `start()` overwrites, minus the clock. */
  function resetSession() {
    stopTicker()
    phase.value = 'intro'
    currentIndex.value = 0
    answers.value = {}
    sectionEndsAt.value = 0
    result.value = null
    grading.value = false
    gradeFailed.value = false
    if (import.meta.client) sessionStorage.removeItem(key)
  }

  function restoreWhenReady() {
    if (!mounted || restored || !blueprint.value) return
    restored = true
    if (!resume) {
      resetSession()
      return
    }
    restore()
    if (phase.value === 'running') startTicker()
  }

  watch(blueprint, restoreWhenReady)

  onMounted(() => {
    mounted = true
    restoreWhenReady()
    window.addEventListener('beforeunload', warnBeforeUnload)
  })

  onUnmounted(() => {
    stopTicker()
    window.removeEventListener('beforeunload', warnBeforeUnload)
  })

  return {
    blueprint,
    phase,
    currentSection,
    sectionIndex: currentSectionIndex,
    currentQuestion,
    currentPassage,
    currentIndex,
    displayIndex,
    displayTotal,
    navigatorGroups,
    isLastSection,
    isLastQuestion,
    isFirstQuestion,
    remainingSeconds,
    answers,
    answeredCount,
    doubtfulCount,
    unansweredInSection: unansweredCount,
    result,
    grading,
    gradeFailed,
    /** Re-sends a submission the grader rejected; no-op without a grader. */
    retryGrade: runGrade,
    statusOf,
    labelOf,
    start,
    selectAnswer,
    setAnswerValue,
    toggleDoubt,
    goTo,
    next,
    prev,
    endSection,
    startNextSection,
    finish,
    reset: resetSession,
  }
}
