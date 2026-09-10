<script setup lang="ts">
import type { OptionLabel, TryoutQuestion } from '#shared/types/tryout'

/**
 * "Lihat pembahasan" as its own page, not the inline panel TryoutResult used
 * to open. Two things justify the split from the exam-taking page's route
 * pattern (`account/tryout.vue` → `/akun/paket/:slug/kerjakan`):
 *
 * - It needs its own attemptId in the URL — pembahasan is per sitting, not
 *   per package, and a package may be sat many times.
 * - It has to be reachable on its own, days later, from Riwayat pengerjaan
 *   on the package page — not only as a same-session continuation of
 *   finishing a sitting.
 *
 * `layout: 'tryout'` for the same reason the exam room uses it: this is a
 * focused reading surface, not a page that wants the marketplace chrome
 * around it.
 */
definePageMeta({
  path: '/akun/paket/:slug()/kerjakan/pembahasan/:attemptId()',
  layout: 'tryout',
  middleware: 'auth',
})

const route = useRoute()
const slug = route.params.slug as string
const attemptId = route.params.attemptId as string

const { data: review, pending, error, refresh } = useAttemptReview(attemptId)

useHead({
  title: computed(() => (review.value ? `Pembahasan ${review.value.title} | Zenko` : 'Pembahasan | Zenko')),
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface FlatReviewQuestion {
  question: TryoutQuestion & { selected?: OptionLabel, doubtful?: boolean, isCorrect: boolean }
  sectionIndex: number
}

// Every question, flattened once with the section it belongs to — the same
// shape useTryoutSession keeps for the live sitting, so numbering and
// section-lookup logic below reads the same way it does there.
const allQuestions = computed<FlatReviewQuestion[]>(() => {
  if (!review.value) return []
  return review.value.sections.flatMap((section, sectionIndex) =>
    section.questions.map(question => ({ question, sectionIndex })),
  )
})

// Absolute index each section starts at, e.g. [0, 6, 14] for sections of 6/8/6.
const sectionOffsets = computed<number[]>(() => {
  if (!review.value) return []
  let offset = 0
  return review.value.sections.map((section) => {
    const start = offset
    offset += section.questions.length
    return start
  })
})

/** Multi-section products (simulasi) get tabs above the navigator; a single
 * subtest (mini tryout) goes straight to the navigator, nothing to switch. */
const isMultiSection = computed(() => (review.value?.sections.length ?? 0) > 1)

const activeSectionIndex = ref(0)
const currentIndex = ref(0)

const currentEntry = computed(() => allQuestions.value[currentIndex.value] ?? null)
const currentQuestion = computed(() => currentEntry.value?.question ?? null)

/**
 * Wacana soal aktif — dirender sekali di atas soal, sehingga soal-soal
 * segrup tampil "di bawah wacananya" saat ditelusuri berurutan (pengelompokan
 * per teks bacaan, spec §6.3).
 */
const currentPassage = computed(() => {
  const entry = currentEntry.value
  const passageId = (entry?.question as { passageId?: string } | null)?.passageId
  if (!entry || !passageId) return null
  return review.value?.sections[entry.sectionIndex]?.passages?.find(passage => passage.id === passageId) ?? null
})
const totalQuestions = computed(() => allQuestions.value.length)
const isFirstQuestion = computed(() => currentIndex.value === 0)
const isLastQuestion = computed(() => currentIndex.value === totalQuestions.value - 1)

/**
 * Numbering matches how the student actually saw it while sitting the exam:
 * running across every subtest for `flat` blueprints (CAT BKN), restarting
 * at 1 per subtest for `sequential` ones (UTBK-SNBT/TKA) — the same rule
 * TryoutResult's old inline panel already followed, so "Soal 37" here is the
 * same question "Soal 37" was during the sitting.
 */
const displayNumber = computed(() => {
  if (!review.value || !currentEntry.value) return 0
  if (review.value.mode === 'flat') return currentIndex.value + 1
  const start = sectionOffsets.value[currentEntry.value.sectionIndex] ?? 0
  return currentIndex.value - start + 1
})

/** Just the active section's questions — see TryoutReviewNavigator for why
 * a review page never shows every subtest's grid at once. */
const navigatorGroups = computed(() => {
  if (!review.value) return []
  const index = isMultiSection.value ? activeSectionIndex.value : 0
  const section = review.value.sections[index]
  if (!section) return []
  const start = sectionOffsets.value[index] ?? 0
  return [{
    code: section.code,
    title: section.title,
    startIndex: start,
    numberOffset: review.value.mode === 'flat' ? start : 0,
    questions: section.questions,
  }]
})

function findQuestion(id: string) {
  return allQuestions.value.find(entry => entry.question.id === id)?.question ?? null
}

function statusOf(id: string): 'correct' | 'incorrect' | 'unanswered' {
  const question = findQuestion(id)
  if (!question?.selected) return 'unanswered'
  return question.isCorrect ? 'correct' : 'incorrect'
}

function labelOf(id: string): OptionLabel | null {
  return findQuestion(id)?.selected ?? null
}

function goTo(index: number) {
  currentIndex.value = Math.min(Math.max(index, 0), totalQuestions.value - 1)
  activeSectionIndex.value = allQuestions.value[currentIndex.value]?.sectionIndex ?? 0
}

function prev() {
  if (!isFirstQuestion.value) goTo(currentIndex.value - 1)
}

function next() {
  if (!isLastQuestion.value) goTo(currentIndex.value + 1)
}

function selectSection(index: number) {
  activeSectionIndex.value = index
  goTo(sectionOffsets.value[index] ?? 0)
}

const correctCount = computed(() => allQuestions.value.filter(entry => entry.question.isCorrect).length)
const incorrectCount = computed(
  () => allQuestions.value.filter(entry => !entry.question.isCorrect && entry.question.selected).length,
)
const unansweredCount = computed(() => allQuestions.value.filter(entry => !entry.question.selected).length)
</script>

<template>
  <div>
    <div v-if="pending" class="container-page grid min-h-screen place-items-center py-10">
      <div class="grid w-full max-w-3xl gap-6" aria-busy="true">
        <p class="sr-only" role="status">Memuat pembahasan…</p>
        <div class="h-8 w-48 animate-pulse rounded-sm bg-surface-sunken" aria-hidden="true" />
        <div class="h-40 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
        <div class="h-64 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
      </div>
    </div>

    <div v-else-if="error" class="container-page grid min-h-screen place-items-center py-10">
      <div class="w-full max-w-md">
        <AccountError @retry="refresh">
          Pembahasan belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
        </AccountError>
      </div>
    </div>

    <template v-else-if="review && currentQuestion">
      <header class="sticky top-0 z-20 border-b border-hairline bg-surface/95 backdrop-blur">
        <div class="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3.5">
          <nav class="min-w-0 text-[0.85rem] text-muted">
            <NuxtLink
              :to="`/akun/paket/${slug}#riwayat`"
              class="inline-flex items-center gap-1 transition-colors hover:text-ink"
            >
              <IconArrowLeft class="h-3.5 w-3.5 shrink-0" /> Kembali ke paket
            </NuxtLink>
          </nav>
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.84rem] font-semibold text-muted">
            <span>
              Pembahasan · Percobaan #{{ review.number }} ·
              Skor {{ review.score }}<template v-if="review.maxScore > 0">/{{ review.maxScore }}</template> ·
              {{ formatDate(review.finishedAt) }}
            </span>
            <span
              v-if="review.passed !== undefined"
              class="inline-flex items-center rounded-pill px-2 py-0.5 text-[0.72rem] font-bold"
              :class="review.passed ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink'"
            >
              {{ review.passed ? 'LULUS' : 'TIDAK LULUS' }}
            </span>
          </p>
        </div>
        <!-- Keterangan skor dibekukan ke snapshot attempt ini, jadi riwayat
             lama tetap terbaca dengan kalimat yang berlaku saat dikerjakan. -->
        <p
          v-if="review.scoreDisclaimer"
          class="border-t border-hairline bg-surface-alt"
        >
          <span class="container-page flex items-start gap-2 py-2.5 text-[0.8rem] leading-[1.55] text-muted">
            <AppIcon name="info" :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
            {{ review.scoreDisclaimer }}
          </span>
        </p>
      </header>

      <main class="container-page grid gap-5 py-6 md:h-[calc(100vh-3.375rem)] md:grid-cols-[minmax(0,1fr)_280px]">
        <div class="min-h-0 md:overflow-y-auto md:pr-1">
          <!-- Wacana grup soal aktif, dicetak sekali di atas soalnya. -->
          <div v-if="currentPassage" class="mb-4 rounded-sm border border-hairline bg-surface-alt px-4 py-3.5">
            <h3 class="text-[0.88rem] font-bold text-ink">{{ currentPassage.title || 'Wacana' }}</h3>
            <div class="prose-question mt-2 max-h-[40svh] overflow-y-auto text-[0.94rem] leading-[1.65] md:max-h-none" v-html="currentPassage.content" />
          </div>

          <TryoutReviewQuestion
            :question="currentQuestion"
            :number="displayNumber"
            :answer="{ selected: currentQuestion.selected ?? null, doubtful: currentQuestion.doubtful ?? false }"
          />

          <div class="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              :disabled="isFirstQuestion"
              class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              @click="prev"
            >
              <IconArrowLeft class="inline-block h-3.5 w-3.5 -mt-0.5" /> Sebelumnya
            </button>
            <span class="text-[0.84rem] text-muted tabular-nums">{{ displayNumber }} / {{ totalQuestions }}</span>
            <button
              type="button"
              :disabled="isLastQuestion"
              class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              @click="next"
            >
              Selanjutnya <IconArrowRight class="inline-block h-3.5 w-3.5 -mt-0.5" />
            </button>
          </div>
        </div>

        <div class="min-h-0 md:overflow-y-auto md:pr-1">
          <div v-if="isMultiSection" class="mb-3 flex flex-wrap gap-2">
            <button
              v-for="(section, index) in review.sections"
              :key="section.id"
              type="button"
              class="rounded-pill border px-3 py-1.5 text-[0.78rem] font-bold transition-colors"
              :class="index === activeSectionIndex
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-hairline-strong text-muted hover:bg-surface-alt'"
              @click="selectSection(index)"
            >
              {{ section.code }}
            </button>
          </div>

          <TryoutReviewNavigator
            :groups="navigatorGroups"
            :current-index="currentIndex"
            :correct-count="correctCount"
            :incorrect-count="incorrectCount"
            :unanswered-count="unansweredCount"
            :total-questions="totalQuestions"
            :status-of="statusOf"
            :label-of="labelOf"
            @jump="goTo"
          />
        </div>
      </main>
    </template>
  </div>
</template>
