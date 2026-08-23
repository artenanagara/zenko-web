import type { MaybeRefOrGetter } from 'vue'
import type {
  OptionLabel,
  TryoutAnswerState,
  TryoutBlueprint,
  TryoutQuestion,
  TryoutResult,
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

function maxOf(scores: Record<OptionLabel, number>): number {
  return Math.max(...Object.values(scores))
}

function scoreQuestion(question: TryoutQuestion, answer: TryoutAnswerState | undefined) {
  if (question.kind === 'objective') {
    const correct = answer?.selected === question.correct
    return { points: correct ? question.points : 0, max: question.points, correct }
  }
  const points = answer?.selected ? question.scores[answer.selected] : 0
  return { points, max: maxOf(question.scores), correct: points === maxOf(question.scores) }
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
) {
  const blueprint = computed<TryoutBlueprint | null>(() => toValue(blueprintSource) ?? null)
  const key = storageKey(slug)

  const phase = useState<TryoutPhase>(`tryout-phase-${slug}`, () => 'intro')
  const currentIndex = useState<number>(`tryout-index-${slug}`, () => 0)
  const answers = useState<Record<string, TryoutAnswerState>>(`tryout-answers-${slug}`, () => ({}))
  const sectionEndsAt = useState<number>(`tryout-ends-${slug}`, () => 0)
  const result = useState<TryoutResult | null>(`tryout-result-${slug}`, () => null)
  const now = useState<number>(`tryout-now-${slug}`, () => Date.now())

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
    if (!import.meta.client) return
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
    () => navigableQuestions.value.filter(q => !!answers.value[q.id]?.selected).length,
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
    const totalMinutes = currentBlueprint.mode === 'flat'
      ? currentBlueprint.sections.reduce((sum, s) => sum + s.durationMinutes, 0)
      : currentBlueprint.sections[0]!.durationMinutes
    sectionEndsAt.value = Date.now() + totalMinutes * 60_000
    phase.value = 'running'
    startTicker()
    persist()
  }

  function selectAnswer(label: OptionLabel) {
    const question = currentQuestion.value
    if (!question) return
    answers.value = {
      ...answers.value,
      [question.id]: { selected: label, doubtful: answers.value[question.id]?.doubtful ?? false },
    }
    persist()
  }

  function toggleDoubt() {
    const question = currentQuestion.value
    if (!question) return
    const existing = answers.value[question.id]
    answers.value = {
      ...answers.value,
      [question.id]: { selected: existing?.selected ?? null, doubtful: !existing?.doubtful },
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

    result.value = {
      finishedAt: Math.floor(Date.now() / 1000),
      score: sections.reduce((sum, s) => sum + s.score, 0),
      maxScore: sections.reduce((sum, s) => sum + s.maxScore, 0),
      sections,
    }
    phase.value = 'finished'
    if (import.meta.client) sessionStorage.removeItem(key)
  }

  function warnBeforeUnload(event: BeforeUnloadEvent) {
    if (phase.value !== 'running' && phase.value !== 'section-break') return
    event.preventDefault()
  }

  let mounted = false
  let restored = false

  function restoreWhenReady() {
    if (!mounted || restored || !blueprint.value) return
    restored = true
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
    statusOf,
    labelOf,
    start,
    selectAnswer,
    toggleDoubt,
    goTo,
    next,
    prev,
    endSection,
    startNextSection,
    finish,
  }
}
