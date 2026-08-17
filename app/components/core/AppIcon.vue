<script setup lang="ts">
import * as PhosphorIcons from '@phosphor-icons/vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    color?: string
    weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  }>(),
  {
    size: 20,
    weight: 'regular',
  },
)

const formatComponentName = (raw: string): string => {
  if (raw.startsWith('Ph') || raw.startsWith('ph-')) {
    const clean = raw.replace(/^ph-/, '')
    const pascal = clean
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('')
    return pascal.startsWith('Ph') ? pascal : `Ph${pascal}`
  }

  const pascal = raw
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

  return `Ph${pascal}`
}

const resolvedComponent = computed(() => {
  const compName = formatComponentName(props.name)
  return (PhosphorIcons as Record<string, any>)[compName] || PhosphorIcons.PhQuestion
})
</script>

<template>
  <component
    :is="resolvedComponent"
    :size="size"
    :color="color"
    :weight="weight"
    class="inline-block shrink-0"
  />
</template>
