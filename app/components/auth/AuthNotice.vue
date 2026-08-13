<script setup lang="ts">
/**
 * Status message inside auth forms. `warning` = not wired up yet (not the
 * user's fault, so not red); `error` = real failure; `info` = mock-mode notes
 * that must stand out precisely so they are not mistaken for the real thing.
 */
withDefaults(defineProps<{ tone?: 'warning' | 'error' | 'info' }>(), { tone: 'warning' })

const TONES = {
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-primary/20 bg-primary-soft text-primary-dark',
}
</script>

<template>
  <p role="alert" class="rounded-sm border px-4 py-3 text-[0.86rem]" :class="TONES[tone]">
    <slot />
  </p>
</template>
