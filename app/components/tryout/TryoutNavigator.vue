<script setup lang="ts">
import type { OptionLabel, TryoutQuestion } from '#shared/types/tryout'
import type { TryoutNavigatorGroup } from '~/composables/useTryoutSession'

/**
 * The numbered grid every candidate stares at more than the question itself.
 * Same three-colour convention across CAT BKN, UTBK-SNBT, and TKA: white for
 * untouched, yellow for "ragu-ragu", green once answered — confirmed against
 * the real systems rather than guessed, since getting this legend wrong is
 * the fastest way for the page to look unfamiliar to someone who has sat one.
 *
 * `groups` carries one section in sequential mode (only the current subtest
 * is reachable) or every section at once in flat mode — CAT BKN shows the
 * whole SKD's numbers up front rather than gating them behind a "next
 * subtest" step, so this component doesn't assume there is only one group.
 * This panel doubles as the exam info that used to live in the header: the
 * progress line here is the only place that count is shown now.
 */
const props = defineProps<{
  groups: TryoutNavigatorGroup[]
  currentIndex: number
  answeredCount: number
  doubtfulCount: number
  totalQuestions: number
  statusOf: (id: string) => 'answered' | 'doubtful' | 'unanswered'
  labelOf: (id: string) => OptionLabel | null
}>()

const emit = defineEmits<{ jump: [index: number] }>()

function numberFor(question: TryoutQuestion, displayNumber: number) {
  return props.labelOf(question.id) ?? String(displayNumber)
}
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface p-4 shadow-xs">
    <p class="text-[0.9rem]">
      <span class="font-bold tabular-nums">{{ answeredCount }}</span>
      <span class="text-muted"> dari {{ totalQuestions }} terjawab</span>
      <span v-if="doubtfulCount" class="text-amber-700"> · {{ doubtfulCount }} ragu-ragu</span>
    </p>

    <div v-for="group in groups" :key="group.code" class="mt-4 first:mt-3.5">
      <p class="mb-2 text-[0.76rem] font-bold tracking-[0.08em] text-faint uppercase">
        {{ group.code }} · {{ group.title }}
      </p>
      <div class="grid grid-cols-6 gap-2 md:grid-cols-5">
        <button
          v-for="(question, i) in group.questions"
          :key="question.id"
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-sm border text-[0.82rem] font-bold tabular-nums transition-transform duration-150 ease-smooth hover:-translate-y-0.5"
          :class="[
            statusOf(question.id) === 'answered' && 'border-success bg-success-soft text-success-ink',
            statusOf(question.id) === 'doubtful' && 'border-amber-400 bg-amber-50 text-amber-800',
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

    <ul class="mt-4 grid gap-1.5 border-t border-hairline pt-3 text-[0.78rem] text-muted">
      <li class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-[3px] border border-hairline-strong bg-surface" />
        Belum dijawab
      </li>
      <li class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-[3px] border border-amber-400 bg-amber-50" />
        Ragu-ragu
      </li>
      <li class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-[3px] border border-success bg-success-soft" />
        Sudah dijawab (menampilkan pilihan)
      </li>
    </ul>
  </div>
</template>
