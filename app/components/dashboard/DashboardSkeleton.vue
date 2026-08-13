<script setup lang="ts">
/**
 * Loading placeholder that holds the space of what it replaces, so tables and
 * stat cards do not jump in when the data lands.
 *
 * - `rows` mimics the list/table rows inside a DashboardPanel.
 * - `stats` mimics a DashboardStats strip (same card and column classes).
 *
 * Announced once via role="status" + sr-only label; the bars themselves are
 * decoration. animate-pulse is neutralized by the global reduced-motion rule.
 */
const props = withDefaults(defineProps<{
  variant?: 'rows' | 'stats'
  count?: number
  label?: string
  /** Widest-breakpoint columns for the stats variant; mirrors DashboardStats. */
  columns?: 2 | 3 | 4
}>(), {
  variant: 'rows',
  count: 4,
  label: 'Memuat data...',
  columns: 4,
})

const WIDE_COLS = { 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' } as const
const wideCols = computed(() => WIDE_COLS[props.columns])

/** Deterministic width variation, so rows read as content, not as stripes. */
const ROW_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-2/3'] as const
function rowWidth(index: number): string {
  return ROW_WIDTHS[(index - 1) % ROW_WIDTHS.length] as string
}
</script>

<template>
  <div role="status">
    <span class="sr-only">{{ label }}</span>

    <div v-if="variant === 'stats'" class="grid gap-4 sm:grid-cols-2" :class="wideCols" aria-hidden="true">
      <div
        v-for="n in count"
        :key="n"
        class="rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs"
      >
        <span class="block h-3.5 w-24 animate-pulse rounded-pill bg-skeleton" />
        <span class="mt-2.5 block h-7 w-32 animate-pulse rounded-pill bg-skeleton" />
      </div>
    </div>

    <ul v-else aria-hidden="true">
      <li
        v-for="n in count"
        :key="n"
        class="flex min-h-12 items-center gap-4 border-t border-hairline first:border-0"
      >
        <span class="h-4 animate-pulse rounded-pill bg-skeleton" :class="rowWidth(n)" />
        <span class="ml-auto h-6 w-20 shrink-0 animate-pulse rounded-pill bg-skeleton" />
      </li>
    </ul>
  </div>
</template>
