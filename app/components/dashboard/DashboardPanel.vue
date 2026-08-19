<script setup lang="ts">
/** Titled surface for a table or list. `id` is the sidebar's anchor target. */
defineProps<{
  title: string
  description?: string
  id?: string
}>()
</script>

<template>
  <!-- scroll-mt clears the dashboard's sticky navbar, so jumping to an
       anchor (e.g. /dashboard/admin#pengajuan) never hides the heading.
       Card treatment (rounded-md/border-line/shadow-xs, bg-surface-alt
       header) mirrors the design system's AppPanel so this reads as the
       same surface — AppPanel itself can't be reused directly here since
       it has no description line and no always-visible action slot.
       Deliberately NOT overflow-hidden on the section (unlike AppPanel):
       this card routinely hosts dropdowns/popovers (AppSelect,
       AppDropdownMenu, RteDropdown, …) that position themselves absolutely
       and extend past the card's own bounds — clipping the section would
       clip those too. The header gets its own top radius instead, so its
       flush background still respects the card's rounded corners. -->
  <section :id="id" class="scroll-mt-20 rounded-md border border-line bg-surface shadow-xs">
    <header class="flex flex-wrap items-start justify-between gap-3 rounded-t-md border-b border-line bg-surface-alt px-5 py-4 md:px-6">
      <div>
        <h2 class="text-[1.05rem] font-bold tracking-[-0.03em] text-ink">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-[0.86rem] text-muted">{{ description }}</p>
      </div>
      <slot name="action" />
    </header>

    <div class="px-5 py-4 md:px-6 md:py-5">
      <slot />
    </div>
  </section>
</template>
