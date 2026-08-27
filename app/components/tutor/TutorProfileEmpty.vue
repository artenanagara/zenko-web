<script setup lang="ts">
/**
 * The one empty-state shape used by every tab on the tutor profile, so
 * "belum ada paket", "belum ada ulasan" and "belum ada perkenalan" all read
 * as the same deliberate state instead of three different kinds of blank.
 * Dashed border matches the existing empty pattern in the marketplace.
 */
defineProps<{ icon: string, title: string, description: string }>()
</script>

<template>
  <div class="rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
    <span
      aria-hidden="true"
      class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"
    >
      <AppIcon :name="icon" :size="26" />
    </span>
    <p class="mt-4 font-bold tracking-[-0.02em]">{{ title }}</p>
    <p class="mx-auto mt-1.5 max-w-100 text-[0.92rem] leading-[1.6] text-muted">{{ description }}</p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
