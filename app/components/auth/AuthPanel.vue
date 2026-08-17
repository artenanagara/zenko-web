<script setup lang="ts">
/**
 * Single-column shell for the account-recovery pages. No AuthAside here:
 * someone locked out just wants to finish — promo stats only add distance
 * to the one action they need.
 */
type Tone = 'neutral' | 'pending' | 'loading' | 'success' | 'danger'

withDefaults(defineProps<{ title: string, tone?: Tone }>(), { tone: 'neutral' })

const TONE_RING: Record<Tone, string> = {
  neutral: '',
  pending: 'bg-primary-soft text-primary',
  loading: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success-ink',
  danger: 'bg-red-50 text-red-600',
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
    <div class="w-full max-w-105">
      <BrandMark img-class="h-10 w-auto object-contain" />

      <div class="mt-9">
        <span
          v-if="tone !== 'neutral'"
          class="mb-6 inline-flex h-13 w-13 items-center justify-center rounded-full"
          :class="TONE_RING[tone]"
        >
          <IconMail v-if="tone === 'pending'" class="h-6.5 w-6.5" />
          <IconSpinner v-else-if="tone === 'loading'" class="h-6.5 w-6.5 animate-spin" />
          <IconCheck v-else-if="tone === 'success'" class="h-6.5 w-6.5" />
          <IconAlert v-else class="h-6.5 w-6.5" />
        </span>

        <h1 class="text-[clamp(1.6rem,2.4vw,2rem)] leading-[1.18] tracking-[-0.04em]">
          {{ title }}
        </h1>

        <p v-if="$slots.description" class="mt-2.5 text-muted">
          <slot name="description" />
        </p>
      </div>

      <div class="mt-8">
        <slot />
      </div>

      <div v-if="$slots.footer" class="mt-8 text-center text-[0.9rem] text-muted">
        <slot name="footer" />
      </div>
    </div>
  </main>
</template>
