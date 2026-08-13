<script setup lang="ts">
export interface DashboardStat {
  label: string
  value: string
  /** Optional supporting line, e.g. a comparison with last month. */
  hint?: string
}

/** Widest-breakpoint columns; default 4 keeps every existing caller unchanged. */
const props = withDefaults(defineProps<{ items: DashboardStat[], columns?: 2 | 3 | 4 }>(), {
  columns: 4,
})

const WIDE_COLS = { 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' } as const
const wideCols = computed(() => WIDE_COLS[props.columns])
</script>

<template>
  <dl class="grid gap-4 sm:grid-cols-2" :class="wideCols">
    <div
      v-for="item in items"
      :key="item.label"
      class="rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs"
    >
      <dt class="text-[0.82rem] text-muted">{{ item.label }}</dt>
      <dd class="mt-1.5 text-[1.6rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
        {{ item.value }}
      </dd>
      <p v-if="item.hint" class="mt-2 text-[0.78rem] text-muted">{{ item.hint }}</p>
    </div>
  </dl>
</template>
