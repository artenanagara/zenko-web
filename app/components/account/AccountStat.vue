<script setup lang="ts">
/**
 * One metric tile: an icon chip with a tone-matched accent, a label, and a big
 * value. Shared by the account overview and Paket saya so the numbers read as
 * one family. Pass the icon through the `icon` slot.
 */
withDefaults(defineProps<{
  label: string
  value: string
  hint?: string
  tone?: 'primary' | 'success' | 'star'
}>(), { tone: 'primary' })

const TONES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success-ink',
  star: 'bg-amber-50 text-star',
} as const
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface p-5 shadow-xs">
    <div class="flex items-center gap-2.5">
      <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md" :class="TONES[tone]">
        <slot name="icon" />
      </span>
      <p class="text-[0.84rem] text-muted">{{ label }}</p>
    </div>
    <p class="mt-3 text-[1.7rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{{ value }}</p>
    <p v-if="hint" class="mt-1.5 text-[0.76rem] text-muted">{{ hint }}</p>
  </div>
</template>
