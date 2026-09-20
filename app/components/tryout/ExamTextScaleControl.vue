<script setup lang="ts">
type ExamTextScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

const scale = defineModel<ExamTextScale>({ default: 5 as ExamTextScale })

const DEFAULT_SCALE: ExamTextScale = 5

function changeScale(delta: -1 | 1) {
  scale.value = Math.min(10, Math.max(1, scale.value + delta)) as ExamTextScale
}

function resetScale() {
  scale.value = DEFAULT_SCALE
}
</script>

<template>
  <div class="inline-flex items-center gap-0.5 rounded-xs border border-hairline-strong bg-surface p-0.5 shadow-xs" aria-label="Ukuran teks soal">
    <button type="button" class="flex h-8 min-w-8 items-center justify-center rounded-[3px] px-1.5 text-[0.74rem] font-bold text-muted transition-colors hover:bg-surface-alt hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40" aria-label="Perkecil teks" :disabled="scale === 1" @click="changeScale(-1)">A−</button>
    <button type="button" class="flex h-8 min-w-8 items-center justify-center rounded-[3px] bg-primary-soft px-1.5 text-[0.74rem] font-bold text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none" aria-label="Kembalikan ukuran teks ke normal" @click="resetScale">A</button>
    <button type="button" class="flex h-8 min-w-8 items-center justify-center rounded-[3px] px-1.5 text-[0.74rem] font-bold text-muted transition-colors hover:bg-surface-alt hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40" aria-label="Perbesar teks" :disabled="scale === 10" @click="changeScale(1)">A+</button>
  </div>
</template>
