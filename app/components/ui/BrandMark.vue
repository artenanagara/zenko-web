<script setup lang="ts">
withDefaults(defineProps<{ to?: string }>(), { to: '/' })
</script>

<template>
  <NuxtLink :to="to" class="inline-flex items-center gap-2.5 font-extrabold tracking-[-0.04em]" aria-label="Zenko home">
    <BrandIcon class="h-8 w-8 drop-shadow-[0_6px_14px_rgba(47,111,235,0.3)]" />
    <span class="text-xl">Zenko</span>
  </NuxtLink>
</template>
