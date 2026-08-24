<script setup lang="ts">
export interface DashboardStat {
  label: string
  value: string
}

/** Widest-breakpoint columns; default 4 keeps every existing caller unchanged. */
const props = withDefaults(defineProps<{ items: DashboardStat[], columns?: 2 | 3 | 4 }>(), {
  columns: 4,
})

const WIDE_COLS = { 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' } as const
const wideCols = computed(() => WIDE_COLS[props.columns])
</script>

<template>
  <!-- Metric cards deliberately contain one value and one single-line label.
       Keeping the same structure everywhere prevents supporting copy from
       changing card heights and weakening the value-first hierarchy. -->
  <div class="grid gap-4 sm:grid-cols-2" :class="wideCols">
    <div
      v-for="item in items"
      :key="item.label"
      class="rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs"
    >
      <div class="flex min-w-0 flex-col gap-3">
        <p class="text-3xl leading-none font-extrabold tracking-tight text-ink tabular-nums md:text-4xl">
          {{ item.value }}
        </p>
        <p class="truncate text-[0.82rem] font-medium text-muted" :title="item.label">
          {{ item.label }}
        </p>
      </div>
    </div>
  </div>
</template>
