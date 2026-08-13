<script setup lang="ts">
import type { OptionLabel, TryoutQuestion } from '#shared/types/tryout'

defineProps<{
  question: TryoutQuestion
  index: number
  total: number
  selected: OptionLabel | null
  doubtful: boolean
}>()

const emit = defineEmits<{ select: [label: OptionLabel] }>()
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface p-5 shadow-xs md:p-7">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-[0.82rem] font-bold text-muted">
        Soal {{ index }} <span class="text-faint">dari {{ total }}</span>
      </p>
      <span
        v-if="doubtful"
        class="inline-flex items-center gap-1.5 rounded-pill bg-amber-50 px-2.5 py-1 text-[0.74rem] font-bold text-amber-800"
      >
        Ditandai ragu-ragu
      </span>
    </div>

    <p class="mt-4 text-[1.05rem] leading-[1.6] font-medium tracking-[-0.01em] text-ink whitespace-pre-line">
      {{ question.text }}
    </p>

    <div class="mt-6 grid gap-2.5" role="radiogroup" :aria-label="`Pilihan jawaban soal ${index}`">
      <button
        v-for="option in question.options"
        :key="option.label"
        type="button"
        role="radio"
        :aria-checked="selected === option.label"
        class="flex items-start gap-3.5 rounded-sm border px-4 py-3.5 text-left transition-colors duration-150 ease-smooth"
        :class="
          selected === option.label
            ? 'border-transparent bg-primary-soft ring-1 ring-primary'
            : 'border-hairline-strong bg-surface hover:bg-surface-alt'
        "
        @click="emit('select', option.label)"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.82rem] font-bold"
          :class="
            selected === option.label
              ? 'border-transparent bg-primary text-white'
              : 'border-hairline-strong text-muted'
          "
        >
          {{ option.label }}
        </span>
        <span class="pt-0.5 text-[0.94rem] leading-[1.55]">{{ option.text }}</span>
      </button>
    </div>
  </div>
</template>
