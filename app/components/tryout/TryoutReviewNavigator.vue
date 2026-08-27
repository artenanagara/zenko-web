<script setup lang="ts">
import type { OptionLabel, TryoutQuestion } from '#shared/types/tryout'

/**
 * The numbered grid on the Pembahasan page — TryoutNavigator's sibling for
 * read-only review, not a mode grafted onto it. The two answer completely
 * different questions ("where am I, what's left" during a timed sitting vs.
 * "what did I get right" after it), so their legends, colours and counts
 * never overlap; forcing one component to carry both would mean a `mode`
 * prop silently swapping the entire legend under it, which is worse than two
 * small components.
 *
 * Colour convention borrows the same tokens TryoutReviewQuestion already
 * uses for a single option (border-success/bg-success-soft,
 * border-danger/bg-danger-soft), so a cell here and the highlighted option
 * on the question it points to read as the same fact.
 *
 * `groups` is one section at a time here, never every section at once —
 * unlike TryoutNavigator's flat mode, a review page has no timer forcing
 * every subtest's numbers on screen together, so the page (see
 * tryout-pembahasan.vue) always passes just the active section's group, with
 * tabs above switching which one that is.
 */
const props = defineProps<{
  groups: { code: string, title: string, startIndex: number, numberOffset: number, questions: TryoutQuestion[] }[]
  currentIndex: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  totalQuestions: number
  statusOf: (id: string) => 'correct' | 'incorrect' | 'unanswered'
  labelOf: (id: string) => OptionLabel | null
}>()

const emit = defineEmits<{ jump: [index: number] }>()

function numberFor(question: TryoutQuestion, displayNumber: number) {
  return props.labelOf(question.id) ?? String(displayNumber)
}
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface shadow-xs">
    <div class="sticky top-0 z-10 rounded-t-lg border-b border-hairline bg-surface px-4 pt-4 pb-3">
      <p class="text-[0.9rem]">
        <span class="font-bold tabular-nums">{{ correctCount }}</span>
        <span class="text-muted"> benar</span>
        <span v-if="incorrectCount" class="text-danger"> · {{ incorrectCount }} kurang tepat</span>
        <span v-if="unansweredCount" class="text-muted"> · {{ unansweredCount }} tidak dijawab</span>
      </p>

      <ul class="mt-3 grid gap-1.5 text-[0.78rem] text-muted">
        <li class="flex items-center gap-2">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-success bg-success-soft" />
          Benar
        </li>
        <li class="flex items-center gap-2">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-danger bg-danger-soft" />
          Kurang tepat
        </li>
        <li class="flex items-center gap-2">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-hairline-strong bg-surface" />
          Tidak dijawab
        </li>
      </ul>
    </div>

    <div class="p-4 pt-3.5">
      <div v-for="group in groups" :key="group.code" class="mt-4 first:mt-0">
        <p class="mb-2 text-[0.76rem] font-bold tracking-[0.08em] text-faint uppercase">
          {{ group.code }} · {{ group.title }}
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2 md:grid-cols-5">
          <button
            v-for="(question, i) in group.questions"
            :key="question.id"
            type="button"
            class="flex h-11 w-full touch-manipulation items-center justify-center rounded-sm border text-[0.82rem] font-bold tabular-nums transition-transform duration-150 ease-smooth hover:-translate-y-0.5 md:h-10"
            :class="[
              statusOf(question.id) === 'correct' && 'border-success bg-success-soft text-success-ink',
              statusOf(question.id) === 'incorrect' && 'border-danger bg-danger-soft text-danger-ink',
              statusOf(question.id) === 'unanswered' && 'border-hairline-strong bg-surface text-muted',
              group.startIndex + i === currentIndex && 'ring-2 ring-primary ring-offset-1',
            ]"
            :aria-current="group.startIndex + i === currentIndex ? 'true' : undefined"
            :aria-label="`Soal nomor ${group.numberOffset + i + 1}, ${statusOf(question.id)}`"
            @click="emit('jump', group.startIndex + i)"
          >
            {{ numberFor(question, group.numberOffset + i + 1) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
