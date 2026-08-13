<script setup lang="ts">
/**
 * Decorative earnings panel for the "Penghasilan tambahan" card.
 *
 * Illustration only. The figure and the bar heights are invented, same as the
 * mock in TutorCta. The rupiah amount counts up once per animation cycle, so
 * the number is still climbing as the columns finish growing.
 */
const props = withDefaults(defineProps<{ cycleMs?: number }>(), { cycleMs: 8000 })

/** Relative column heights, six months trending upward. */
const columns = [30, 46, 38, 62, 54, 100]

const TARGET = 4250000
const COUNT_DURATION = 1200
const COUNT_DELAY = 460

const amount = ref(0)
const label = computed(() => `Rp${amount.value.toLocaleString('id-ID')}`)

let frame = 0
let timer: ReturnType<typeof setTimeout> | null = null
let cycle: ReturnType<typeof setInterval> | null = null

function countUp() {
  const start = performance.now()

  const step = (now: number) => {
    const progress = Math.min((now - start) / COUNT_DURATION, 1)
    // Ease-out cubic, so the number decelerates into its final value.
    amount.value = Math.round(TARGET * (1 - (1 - progress) ** 3))

    if (progress < 1) frame = requestAnimationFrame(step)
  }

  frame = requestAnimationFrame(step)
}

function restart() {
  amount.value = 0
  timer = setTimeout(countUp, COUNT_DELAY)
}

onMounted(() => {
  // Honour the same preference the CSS animations do.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    amount.value = TARGET
    return
  }

  restart()
  cycle = setInterval(restart, props.cycleMs)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (cycle) clearInterval(cycle)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <!-- Reused inside the floating card on /jadi-tutor, so it sizes to its
       parent card (~200px), not to the tray. -->
  <div class="w-full" aria-hidden="true">
    <div class="flex items-center justify-between gap-3">
      <span class="anim-item text-[0.78rem] font-semibold text-muted" style="--delay: 140ms">
        Pendapatan Agustus
      </span>
      <span
        class="anim-item rounded-pill bg-success-soft px-3 py-1 text-[0.74rem] font-bold text-success-ink"
        style="--delay: 300ms"
      >+18%</span>
    </div>

    <p
      class="anim-item mt-3 text-[1.45rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums"
      style="--delay: 220ms"
    >
      {{ label }}
    </p>

    <div class="mt-5 flex h-16 items-end gap-2">
      <span
        v-for="(height, index) in columns"
        :key="index"
        class="anim-bar-y flex-1 rounded-t-md rounded-b-sm"
        :class="index === columns.length - 1
          ? 'bg-linear-to-b from-primary-light to-primary'
          : 'bg-primary/15'"
        :style="{ height: `${height}%`, '--delay': `${380 + index * 90}ms` }"
      />
    </div>

    <div class="mt-3 flex justify-between text-[0.72rem] text-muted">
      <span>Mar</span>
      <span>Agu</span>
    </div>
  </div>
</template>
