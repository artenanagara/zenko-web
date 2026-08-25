<script setup lang="ts">
import type { OptionLabel, TryoutQuestion } from '#shared/types/tryout'

const props = defineProps<{
  question: TryoutQuestion
  index: number
  total: number
  selected: OptionLabel | null
  doubtful: boolean
}>()

const emit = defineEmits<{ select: [label: OptionLabel] }>()

/**
 * Stimulus (bacaan/tabel/grafik) bisa dilipat.
 *
 * Pada soal literasi SNBT satu bacaan bisa setinggi dua layar HP, dan lima
 * opsi jawaban terdorong jauh di bawahnya — siswa membaca sekali, lalu
 * menghabiskan sisa waktunya menggulung bolak-balik antara bacaan dan opsi.
 * Melipatnya mengembalikan opsi ke satu layar setelah bacaan selesai dibaca.
 *
 * Selalu terbuka saat soal berganti: menyembunyikan bacaan yang belum pernah
 * dilihat adalah cara tercepat membuat orang melewatkannya. Yang di-reset
 * adalah id soal, bukan indeks — melompat lewat navigator juga harus membuka
 * ulang bacaannya.
 */
const stimulusOpen = ref(true)
watch(() => props.question.id, () => {
  stimulusOpen.value = true
})

const stimulusId = useId()
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface p-4 shadow-xs sm:p-5 md:p-7">
    <div class="flex flex-wrap items-center justify-between gap-2">
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

    <div v-if="question.stimulus" class="mt-4 overflow-hidden rounded-sm border border-hairline bg-surface-alt">
      <button
        type="button"
        class="flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-surface-sunken"
        :aria-expanded="stimulusOpen"
        :aria-controls="stimulusId"
        @click="stimulusOpen = !stimulusOpen"
      >
        <span class="text-[0.76rem] font-bold tracking-[0.08em] text-faint uppercase">Bacaan</span>
        <span class="flex shrink-0 items-center gap-1.5 text-[0.8rem] font-semibold text-muted">
          {{ stimulusOpen ? 'Sembunyikan' : 'Tampilkan' }}
          <IconChevron
            class="h-4 w-4 transition-transform duration-200 ease-smooth"
            :class="stimulusOpen ? 'rotate-180' : ''"
          />
        </span>
      </button>

      <!-- max-h + scroll sendiri: bacaan sepanjang apa pun tidak pernah
           mendorong opsi jawaban keluar layar, tapi tetap terbaca utuh. -->
      <div
        v-show="stimulusOpen"
        :id="stimulusId"
        class="prose-question max-h-[46svh] overflow-y-auto border-t border-hairline px-4 py-3.5 text-[0.94rem] leading-[1.65] text-muted md:max-h-none md:overflow-visible [&_img]:my-3 [&_img]:max-h-80"
        v-html="question.stimulus"
      />
    </div>

    <!-- Product question HTML is sanitized by zenko-api when the tutor saves it. -->
    <div
      class="prose-question mt-4 text-[1.02rem] leading-[1.6] font-medium tracking-[-0.01em] text-ink md:text-[1.05rem] [&_img]:max-h-96"
      v-html="question.text"
    />

    <div class="mt-5 grid gap-2.5 md:mt-6" role="radiogroup" :aria-label="`Pilihan jawaban soal ${index}`">
      <button
        v-for="option in question.options"
        :key="option.label"
        type="button"
        role="radio"
        :aria-checked="selected === option.label"
        class="flex min-h-11 touch-manipulation items-start gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-150 ease-smooth sm:gap-3.5 sm:px-4 sm:py-3.5"
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
        <span class="min-w-0 flex-1 pt-0.5 text-[0.94rem] leading-[1.55]">
          <img
            v-if="option.imageUrl"
            :src="option.imageUrl"
            alt=""
            class="mb-2 max-h-52 max-w-full rounded-xs object-contain"
          >
          <span class="prose-question [&_img]:max-h-52" v-html="option.text" />
        </span>
      </button>
    </div>
  </div>
</template>
