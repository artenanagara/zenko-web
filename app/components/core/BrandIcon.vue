<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'gradient' | 'white' | 'blue-bg'
  }>(),
  {
    variant: 'gradient',
  },
)
</script>

<template>
  <div v-if="variant === 'blue-bg'" class="relative inline-flex items-center justify-center rounded-lg bg-[#0052FF] p-2 aspect-square">
    <img src="/brand/zenko-icon-blue-bg.png" alt="" aria-hidden="true" class="h-full w-full object-contain" />
  </div>

  <div v-else class="relative inline-flex items-center justify-center aspect-square">
    <img
      :src="variant === 'white' ? '/brand/zenko-icon-blue-bg.png' : '/brand/zenko-icon-gradient.png'"
      alt=""
      aria-hidden="true"
      class="h-full w-full object-contain"
    />
  </div>
</template>
