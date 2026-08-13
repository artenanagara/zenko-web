<script setup lang="ts">
/**
 * Renders as <a> when `href` is set, otherwise <button>.
 * Variants map to the three button treatments in the design.
 *
 * NuxtLink is imported rather than looked up with resolveComponent: auto-import
 * registers nothing for resolveComponent to find, so the lookup fails and the
 * button renders as an inert <NuxtLink> element with no href.
 */
import { NuxtLink } from '#components'

withDefaults(
  defineProps<{
    /** Internal route — renders a NuxtLink. */
    to?: string
    /** External or placeholder URL — renders a plain anchor. */
    href?: string
    variant?: 'primary' | 'light'
    size?: 'sm' | 'md' | 'lg'
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
  sm: 'min-h-10 px-4',
  md: 'min-h-12 px-7',
  lg: 'min-h-13 px-8',
}
</script>

<template>
  <component
    :is="to ? NuxtLink : href ? 'a' : 'button'"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :class="[base, variants[variant], sizes[size], 'rounded-xs']"
  >
    <slot />
  </component>
</template>
