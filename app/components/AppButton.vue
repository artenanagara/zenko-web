<script setup lang="ts">
/**
 * Renders as <a> when `href` is set, otherwise <button>.
 * Variants map to the three button treatments in the design.
 */
withDefaults(
  defineProps<{
    href?: string
    variant?: 'primary' | 'light'
    size?: 'sm' | 'md' | 'lg'
    pill?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const base =
  'inline-flex items-center justify-center border border-transparent font-semibold transition-[transform,box-shadow,background] duration-200 ease-smooth hover:-translate-y-px focus-visible:-translate-y-px'

const variants = {
  primary:
    'bg-linear-to-b from-primary-light to-primary border-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(47,111,235,0.25)] hover:from-[#5c93f5] hover:to-[#3878f0] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_8px_18px_rgba(47,111,235,0.18)]',
  light:
    'bg-surface text-primary font-bold shadow-[0_8px_20px_rgba(12,40,100,0.18)] hover:bg-[#f4f7ff]',
}

const sizes = {
  sm: 'min-h-[38px] px-4',
  md: 'min-h-[48px] px-[26px]',
  lg: 'min-h-[52px] px-[30px]',
}
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : type"
    :class="[base, variants[variant], sizes[size], pill ? 'rounded-pill' : 'rounded-xs']"
  >
    <slot />
  </component>
</template>
