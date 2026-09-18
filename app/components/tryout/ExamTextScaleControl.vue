<script setup lang="ts">
type ExamTextScale = 'sm' | 'md' | 'lg'

const scale = defineModel<ExamTextScale>({ default: 'md' })

const options: { value: ExamTextScale; label: string; ariaLabel: string }[] = [
  { value: 'sm', label: 'A−', ariaLabel: 'Perkecil teks' },
  { value: 'md', label: 'A', ariaLabel: 'Ukuran teks normal' },
  { value: 'lg', label: 'A+', ariaLabel: 'Perbesar teks' },
]
</script>

<template>
  <div class="inline-flex items-center gap-0.5 rounded-xs border border-hairline-strong bg-surface p-0.5 shadow-xs" aria-label="Ukuran teks soal">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex h-8 min-w-8 items-center justify-center rounded-[3px] px-1.5 text-[0.78rem] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      :class="scale === option.value ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-alt hover:text-ink'"
      :aria-label="option.ariaLabel"
      :aria-pressed="scale === option.value"
      @click="scale = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
