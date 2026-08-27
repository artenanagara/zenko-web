<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  prefix: string
  placeholder?: string
}>()

const model = defineModel<string>({ required: true })

const handle = computed(() => {
  const value = model.value.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
  const prefix = props.prefix.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  return value.toLowerCase().startsWith(prefix.toLowerCase()) ? value.slice(prefix.length) : value.replace(/^\/+/, '')
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
  const prefix = props.prefix.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const normalized = value.toLowerCase().startsWith(prefix.toLowerCase()) ? value.slice(prefix.length) : value
  model.value = normalized ? `https://${prefix}${normalized.replace(/^\/+/, '')}` : ''
}
</script>

<template>
  <div>
    <label :for="id" class="mb-2 block text-[0.9rem] font-semibold">{{ label }}</label>
    <div class="flex overflow-hidden rounded-sm border border-line bg-surface focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]">
      <span class="flex shrink-0 items-center border-r border-line bg-surface-alt px-3 text-[0.86rem] text-muted">{{ prefix }}</span>
      <input :id="id" :value="handle" type="text" :placeholder="placeholder" class="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[0.9rem] focus:outline-none" @input="onInput">
    </div>
  </div>
</template>
