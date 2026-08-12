<script setup lang="ts">
/**
 * Brand column for the auth pages. Purely decorative, so it disappears below
 * lg rather than stacking under the form and pushing it off the fold.
 *
 * The visual comes in through the `showcase` slot: sign-in shows returning
 * progress, sign-up shows the catalogue.
 */
defineProps<{
  badge: string
  stats: { label: string, value: string }[]
}>()

// The panel is above the fold here, so this fires on mount rather than on
// scroll — it still reuses one observer instead of a second timing path.
const { target, ready, isInView } = useInView(0.1)
</script>

<template>
  <aside class="hidden p-5 lg:block">
    <div
      ref="target"
      class="hero-aurora flex h-full flex-col justify-between gap-10 rounded-[32px] p-12"
      :class="[ready && 'anim-ready', isInView && 'is-inview']"
    >
      <p class="inline-flex w-fit items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-[7px] pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]">
        <span class="h-[7px] w-[7px] rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
        {{ badge }}
      </p>

      <div class="mx-auto w-full max-w-[380px]">
        <slot name="showcase" />
      </div>

      <div>
        <p class="text-[clamp(1.6rem,2.2vw,2.1rem)] leading-[1.25] tracking-[-0.03em]">
          <slot />
        </p>

        <dl class="mt-10 grid grid-cols-3 gap-6 border-t border-white/60 pt-8">
          <div v-for="stat in stats" :key="stat.label">
            <dt class="text-[0.82rem] text-ink/70">{{ stat.label }}</dt>
            <dd class="mt-1 text-[1.5rem] font-extrabold tracking-[-0.03em]">{{ stat.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </aside>
</template>
