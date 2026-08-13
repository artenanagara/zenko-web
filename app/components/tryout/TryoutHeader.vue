<script setup lang="ts">
/**
 * Fixed top bar for the exam room. White, the same on every package — a
 * candidate switching between a BUMN and an SKD try out should recognise it
 * as the same product, not wonder whether they are on a different site.
 * What changes per system is content (subtest labels), never chrome colour.
 * Closer to how the real CBT systems read too: most run a plain, utilitarian
 * header rather than a solid colour block.
 */
const props = defineProps<{
  packageTitle: string
  remainingSeconds: number
}>()

const clock = computed(() => {
  const total = Math.max(0, props.remainingSeconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
})

const isUrgent = computed(() => props.remainingSeconds <= 60)
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 border-b border-hairline bg-surface shadow-xs">
    <div class="container-page flex h-16 items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <BrandIcon class="h-8 w-8 shrink-0" />
        <span class="min-w-0 truncate">
          <span class="font-extrabold tracking-[-0.03em] text-ink">Zenko</span>
          <span class="mx-2 text-faint" aria-hidden="true">·</span>
          <span class="text-[0.92rem] font-medium text-muted">{{ packageTitle }}</span>
        </span>
      </div>

      <div
        class="flex shrink-0 items-center gap-2 rounded-sm px-3 py-1.5 tabular-nums"
        :class="isUrgent ? 'animate-pulse bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-primary-soft text-primary ring-1 ring-primary/15'"
        role="timer"
        aria-live="polite"
      >
        <IconAlert v-if="isUrgent" class="h-4 w-4" />
        <span class="text-[1.05rem] font-extrabold">{{ clock }}</span>
      </div>
    </div>
  </header>
</template>
