<script setup lang="ts">
/**
 * Decorative exam screen. The timer really counts down once the card scrolls
 * into view — it is the clearest way to show what "simulasi bertimer" means.
 */
const props = defineProps<{ active: boolean }>()

const START_SECONDS = 45 * 60

const remaining = ref(START_SECONDS)
let ticker: ReturnType<typeof setInterval> | null = null

const timeLabel = computed(() => {
  const minutes = Math.floor(remaining.value / 60)
  const seconds = remaining.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function start() {
  if (!import.meta.client || ticker) return
  // A ticking clock is motion; honour the same preference the CSS does.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  ticker = setInterval(() => {
    remaining.value = remaining.value > 0 ? remaining.value - 1 : START_SECONDS
  }, 1000)
}

watch(() => props.active, (active) => active && start())

onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
})
</script>

<template>
  <div
    class="anim-item w-full max-w-[260px] rounded-[14px] bg-surface p-5 shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
    style="--delay: 60ms"
  >
    <div class="flex items-center justify-between gap-3">
      <span class="anim-bar block h-2.5 w-3/5 rounded-pill bg-skeleton" style="--delay: 240ms" />
      <span
        class="anim-item shrink-0 rounded-pill bg-primary-soft px-[11px] py-[5px] font-mono text-[0.72rem] font-bold tabular-nums text-primary"
        style="--delay: 420ms"
        aria-hidden="true"
      >{{ timeLabel }}</span>
    </div>

    <span class="anim-bar mt-4 block h-2.5 w-2/5 rounded-pill bg-skeleton" style="--delay: 340ms" />

    <div class="mt-7 flex items-center justify-between gap-3">
      <span class="anim-bar block h-2.5 w-[30%] rounded-pill bg-skeleton" style="--delay: 440ms" />
      <span class="anim-pulse h-5 w-5 rounded-full bg-skeleton" />
    </div>
  </div>
</template>
