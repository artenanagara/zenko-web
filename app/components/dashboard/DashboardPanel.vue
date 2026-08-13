<script setup lang="ts">
/** Titled surface for a table or list. `id` is the sidebar's anchor target. */
defineProps<{
  title: string
  description?: string
  id?: string
}>()
</script>

<template>
  <section :id="id" class="rounded-lg border border-hairline bg-surface shadow-xs">
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4 md:px-6">
      <div>
        <h2 class="text-[1.05rem] font-bold tracking-[-0.03em]">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-[0.86rem] text-muted">{{ description }}</p>
      </div>
      <slot name="action" />
    </header>

    <div class="px-5 py-4 md:px-6 md:py-5">
      <slot />
    </div>
  </section>
</template>
