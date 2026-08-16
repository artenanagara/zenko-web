<script setup lang="ts">
withDefaults(
  defineProps<{
    to?: string
    layout?: 'horizontal' | 'vertical' | 'wordmark'
    theme?: 'light' | 'dark' | 'blue'
    /** Overrides the lockup image's default height classes per usage site. */
    imgClass?: string
    ariaLabel?: string
  }>(),
  {
    to: '/',
    layout: 'horizontal',
    theme: 'light',
    imgClass: '',
    ariaLabel: 'Zenko home',
  },
)
</script>

<template>
  <NuxtLink :to="to" :aria-label="ariaLabel">
    <!-- Horizontal Lockup -->
    <div v-if="layout === 'horizontal'" class="inline-flex items-center gap-2.5">
      <img
        v-if="theme === 'blue' || theme === 'dark'"
        src="/brand/zenko-lockup-horizontal-blue.png"
        alt=""
        :class="imgClass || 'h-8 md:h-9 w-auto object-contain'"
      />
      <img
        v-else
        src="/brand/zenko-lockup-horizontal-light.png"
        alt=""
        :class="imgClass || 'h-8 md:h-9 w-auto object-contain'"
      />
    </div>

    <!-- Vertical Stacked Lockup -->
    <div v-else-if="layout === 'vertical'" class="inline-flex flex-col items-center gap-2 text-center">
      <img
        v-if="theme === 'blue' || theme === 'dark'"
        src="/brand/zenko-lockup-vertical-blue.png"
        alt=""
        :class="imgClass || 'h-20 w-auto object-contain'"
      />
      <img
        v-else
        src="/brand/zenko-lockup-vertical-light.png"
        alt=""
        :class="imgClass || 'h-20 w-auto object-contain'"
      />
    </div>

    <!-- Standalone Wordmark -->
    <div v-else class="inline-flex items-center">
      <img
        v-if="theme === 'blue' || theme === 'dark'"
        src="/brand/zenko-wordmark-blue.png"
        alt=""
        :class="imgClass || 'h-6 md:h-7 w-auto object-contain'"
      />
      <img
        v-else
        src="/brand/zenko-wordmark-dark.png"
        alt=""
        :class="imgClass || 'h-6 md:h-7 w-auto object-contain'"
      />
    </div>
  </NuxtLink>
</template>
