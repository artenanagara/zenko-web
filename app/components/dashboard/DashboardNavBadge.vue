<script setup lang="ts">
/**
 * The attention count on a sidebar entry — extracted because the rail, the
 * drawer, group headers and sub-menu entries all render the same pill.
 *
 * Renders nothing at 0, so callers can pass a count unguarded. `dot` is the
 * icon-only rail's stand-in: a number has nowhere to go at 72px wide, so the
 * signal becomes a dot on the icon and the count moves into sr-only text.
 * Positioned absolutely, so the row it sits in must be `relative` (itemClass
 * already is).
 */
defineProps<{ count: number, dot?: boolean }>()
</script>

<template>
  <span
    v-if="count > 0 && !dot"
    class="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill bg-amber-50 px-1.5 text-[0.72rem] font-bold text-amber-800"
  >
    {{ count }}<span class="sr-only"> perlu perhatian</span>
  </span>

  <span v-else-if="count > 0" class="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500">
    <span class="sr-only">{{ count }} perlu perhatian</span>
  </span>
</template>
