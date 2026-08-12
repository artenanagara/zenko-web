<script setup lang="ts">
withDefaults(defineProps<{ to?: string }>(), { to: '/' })
</script>

<template>
  <NuxtLink :to="to" class="inline-flex items-center gap-2.5 font-extrabold tracking-[-0.04em]" aria-label="Zenko home">
    <span
      class="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-linear-to-b from-primary-light to-primary text-[0.96rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_rgba(47,111,235,0.2)]"
    >Z</span>
    <span class="text-xl">Zenko</span>
  </NuxtLink>
</template>
