<script setup lang="ts">
type ExamTextScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

const scale = defineModel<ExamTextScale>({ default: 4 as ExamTextScale })

const options: { value: ExamTextScale; label: string; ariaLabel: string }[] = [
  { value: 1, label: 'A−4', ariaLabel: 'Ukuran teks paling kecil' },
  { value: 2, label: 'A−3', ariaLabel: 'Ukuran teks sangat kecil' },
  { value: 3, label: 'A−2', ariaLabel: 'Ukuran teks kecil sekali' },
  { value: 4, label: 'A−1', ariaLabel: 'Ukuran teks kecil' },
  { value: 5, label: 'A', ariaLabel: 'Ukuran teks normal' },
  { value: 6, label: 'A+1', ariaLabel: 'Ukuran teks agak besar' },
  { value: 7, label: 'A+2', ariaLabel: 'Ukuran teks besar' },
  { value: 8, label: 'A+3', ariaLabel: 'Ukuran teks sangat besar' },
  { value: 9, label: 'A+4', ariaLabel: 'Ukuran teks besar sekali' },
  { value: 10, label: 'A+5', ariaLabel: 'Ukuran teks paling besar' },
]
</script>

<template>
  <div class="inline-flex items-center gap-0.5 rounded-xs border border-hairline-strong bg-surface p-0.5 shadow-xs" aria-label="Ukuran teks soal">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex h-8 min-w-8 items-center justify-center rounded-[3px] px-1 text-[0.68rem] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:px-1.5 sm:text-[0.74rem]"
      :class="scale === option.value ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-alt hover:text-ink'"
      :aria-label="option.ariaLabel"
      :aria-pressed="scale === option.value"
      @click="scale = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
