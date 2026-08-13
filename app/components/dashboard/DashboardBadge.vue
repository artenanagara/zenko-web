<script setup lang="ts">
/** Status pill. `tone` maps onto the semantic colours in main.css. */
withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'warning' | 'brand' | 'danger' }>(), {
  tone: 'neutral',
})

const TONES = {
  neutral: 'bg-surface-sunken text-muted',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-amber-50 text-amber-800',
  brand: 'bg-primary-soft text-primary',
  danger: 'bg-red-50 text-red-700',
} as const
</script>

<template>
  <span
    class="inline-flex items-center rounded-pill px-2.5 py-1 text-[0.74rem] font-bold whitespace-nowrap"
    :class="TONES[tone]"
  >
    <slot />
  </span>
</template>
