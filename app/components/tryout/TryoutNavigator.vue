<script setup lang="ts">
import type { TryoutQuestion } from '#shared/types/tryout'
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
 *
 * Two hosts, one grid:
 * - `panel` — the desktop sidebar column. Its own card, and 36px cells,
 *   which is plenty for a mouse and keeps 110 numbers from turning the rail
 *   into a scroll marathon.
 * - `sheet` — the mobile bottom sheet (TryoutNavigatorSheet). No card of its
 *   own, and cells grow to the 44px minimum touch target: a mis-tap here
 *   costs a candidate the question they meant to open, on the clock.
 */
const props = withDefaults(
  defineProps<{
    groups: TryoutNavigatorGroup[]
    currentIndex: number
    answeredCount: number
    doubtfulCount: number
    totalQuestions: number
    statusOf: (id: string) => 'answered' | 'doubtful' | 'unanswered'
    variant?: 'panel' | 'sheet'
  }>(),
  { variant: 'panel' },
)

const emit = defineEmits<{ jump: [index: number] }>()

function numberFor(_question: TryoutQuestion, displayNumber: number) {
  return String(displayNumber)
}
</script>

<template>
  <div :class="variant === 'panel' ? 'rounded-lg border border-hairline bg-surface shadow-xs' : ''">
    <!-- Panel only: counts + colour legend pinned to the top of the rail's own
         scroll container (see account/tryout.vue), so they stay in view no
         matter how far the numbered grid below has scrolled. The sheet
         doesn't need this — its own header in TryoutNavigatorSheet already
         stays fixed above its scrolling body. -->
    <div v-if="variant === 'panel'" class="sticky top-0 z-10 rounded-t-lg border-b border-hairline bg-surface px-4 pt-4 pb-3">
      <p class="text-[0.9rem]">
        <span class="font-bold tabular-nums">{{ answeredCount }}</span>
        <span class="text-muted"> dari {{ totalQuestions }} terjawab</span>
        <span v-if="doubtfulCount" class="text-amber-700"> · {{ doubtfulCount }} ragu-ragu</span>
      </p>

      <!-- Mendatar, membungkus ke baris berikutnya kalau rail-nya kesempitan:
           tiga baris tertumpuk memakan tinggi sticky header ini, dan tinggi
           itu langsung memotong jatah scroll grid nomor soal di bawahnya. -->
      <ul class="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.78rem] text-muted">
        <li class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-hairline-strong bg-surface" />
          Belum dijawab
        </li>
        <li class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-amber-400 bg-amber-50" />
          Ragu-ragu
        </li>
        <li class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-success bg-success-soft" />
          Sudah dijawab
        </li>
      </ul>
    </div>

    <div :class="variant === 'panel' ? 'p-4 pt-3.5' : ''">
      <div v-for="group in groups" :key="group.code" class="mt-4 first:mt-0">
        <p class="mb-2 text-[0.76rem] font-bold tracking-[0.08em] text-faint uppercase">
          {{ group.code }} · {{ group.title }}
        </p>
        <!-- auto-fill against a 2.75rem floor: the sheet lays out as many 44px
             cells as the phone is wide (7 at 390px, 9 at 480px) without a
             breakpoint per device. The desktop rail keeps its fixed 5. -->
        <div
          class="grid gap-1.5"
          :class="variant === 'sheet'
            ? 'grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))]'
            : 'grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] md:grid-cols-5'"
        >
          <button
            v-for="(question, i) in group.questions"
            :key="question.id"
            type="button"
            class="flex w-full touch-manipulation items-center justify-center rounded-sm border text-[0.82rem] font-bold tabular-nums transition-transform duration-150 ease-smooth hover:-translate-y-0.5"
            :class="[
              variant === 'sheet' ? 'h-11 text-[0.78rem]' : 'h-8 text-[0.68rem] md:h-8 md:text-[0.72rem]',
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

      <!-- Sheet only: the panel's legend moved into the sticky header above;
           the sheet keeps it inline here, same as before. -->
      <ul v-if="variant === 'sheet'" class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-hairline pt-3 text-[0.78rem] text-muted">
        <li class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-hairline-strong bg-surface" />
          Belum dijawab
        </li>
        <li class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-amber-400 bg-amber-50" />
          Ragu-ragu
        </li>
        <li class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border border-success bg-success-soft" />
          Sudah dijawab
        </li>
      </ul>
    </div>
  </div>
</template>
