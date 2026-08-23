<script setup lang="ts">
/**
 * One Ringkasan queue card (design spec §4.1) — the whole card is a single
 * NuxtLink into its queue page, so navigation works even when the counts
 * failed to load (`count: null` renders the em-dash state).
 */
defineProps<{
  to: string
  label: string
  /** AppIcon (Phosphor) name, e.g. "user-circle-plus". */
  icon: string
  /** null = counts failed to load; the card stays a working link. */
  count: number | null
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex flex-col gap-3 rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs transition-[border-color,box-shadow] duration-200 ease-smooth hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <span class="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
      <AppIcon :name="icon" :size="18" weight="bold" />
    </span>

    <AppMetricText v-if="count !== null && count > 0" :value="count" :label="label" />
    <!-- Zero / failed: same metric anatomy, value in text-faint (— when unknown). -->
    <span v-else class="flex flex-col gap-0.5">
      <span class="text-3xl font-extrabold tracking-tight text-faint tabular-nums md:text-4xl">
        {{ count === null ? '—' : '0' }}
      </span>
      <span class="text-xs font-medium text-muted">{{ label }}</span>
    </span>

    <span
      v-if="count === null || count > 0"
      class="inline-flex items-center gap-1 text-[0.82rem] text-primary"
    >
      <span class="font-semibold group-hover:underline">Tinjau antrean</span>
      <AppIcon name="arrow-right" :size="14" />
    </span>
    <span v-else class="text-[0.82rem] text-muted">Tidak ada antrean</span>
  </NuxtLink>
</template>
