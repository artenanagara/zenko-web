<script setup lang="ts">
/**
 * Status pill. Thin semantic-name wrapper around the design system's
 * AppBadge — `tone` is this app's own vocabulary (kept as-is since many
 * call sites depend on these exact 5 values), mapped onto AppBadge's
 * `variant` prop.
 */
const props = withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'warning' | 'brand' | 'danger' }>(), {
  tone: 'neutral',
})

const VARIANTS = {
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  brand: 'primary',
  danger: 'danger',
} as const

const variant = computed(() => VARIANTS[props.tone])
</script>

<template>
  <AppBadge :variant="variant">
    <slot />
  </AppBadge>
</template>
