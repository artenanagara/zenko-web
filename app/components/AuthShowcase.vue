<script setup lang="ts">
/**
 * Product glimpse for the auth pages: a mock score report that answers
 * "what do I actually get after signing up?".
 *
 * Motion plays once and settles — a form is no place for a repeating loop.
 */

/** Relative bar heights, five attempts trending upward. */
const attempts = [38, 52, 61, 74, 92]

const TARGET_SCORE = 412
const COUNT_DURATION = 1100
const COUNT_DELAY = 350

const score = ref(0)

let frame = 0
let timer: ReturnType<typeof setTimeout> | null = null

function countUp() {
  const start = performance.now()

  const step = (now: number) => {
    const progress = Math.min((now - start) / COUNT_DURATION, 1)
    // Ease-out cubic, so the number decelerates into its final value.
    score.value = Math.round(TARGET_SCORE * (1 - (1 - progress) ** 3))

    if (progress < 1) frame = requestAnimationFrame(step)
  }

  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    score.value = TARGET_SCORE
    return
  }

  // Wait for the card to finish arriving before the number starts moving.
  timer = setTimeout(countUp, COUNT_DELAY)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="relative" aria-hidden="true">
    <div class="anim-in rounded-lg bg-white/85 p-6 shadow-float backdrop-blur-sm" style="--delay: 80ms">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-[0.82rem] text-muted">Hasil try out terakhir</p>
          <p class="mt-1 text-[2.4rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
            {{ score }}
          </p>
        </div>
        <span class="rounded-pill bg-success-soft px-3 py-1.5 text-[0.76rem] font-bold text-success-ink">
          +38 poin
        </span>
      </div>

      <div class="mt-7 flex h-[86px] items-end gap-2.5">
        <span
          v-for="(height, index) in attempts"
          :key="index"
          class="anim-rise flex-1 rounded-t-md rounded-b-sm"
          :class="index === attempts.length - 1
            ? 'bg-linear-to-b from-primary-light to-primary'
            : 'bg-primary/15'"
          :style="{ height: `${height}%`, '--delay': `${260 + index * 90}ms` }"
        />
      </div>

      <div class="mt-3 flex justify-between text-[0.72rem] text-muted">
        <span>Percobaan 1</span>
        <span>Percobaan 5</span>
      </div>

      <dl class="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5 text-center">
        <div v-for="(subtest, index) in ['TWK', 'TIU', 'TKP']" :key="subtest" class="anim-in" :style="{ '--delay': `${760 + index * 90}ms` }">
          <dt class="text-[0.72rem] text-muted">{{ subtest }}</dt>
          <dd class="mt-0.5 font-bold tabular-nums">{{ [118, 142, 152][index] }}</dd>
        </div>
      </dl>
    </div>

    <!-- Floating note, offset so the card does not read as a flat rectangle -->
    <p
      class="anim-in absolute -right-3 -bottom-4 flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 text-[0.8rem] font-semibold shadow-lift"
      style="--delay: 1020ms"
    >
      <IconSeal class="h-[18px] w-[18px] shrink-0" />
      Peringkat 128 dari 3.402
    </p>
  </div>
</template>
