<script setup lang="ts">
import type { OptionLabel, TryoutAnswerValue, TryoutPassage, TryoutQuestion } from '#shared/types/tryout'
import { renderInlineMathHtml } from '~/utils/richText'

const props = defineProps<{
  question: TryoutQuestion
  index: number
  total: number
  selected: OptionLabel | null
  value?: TryoutAnswerValue
  doubtful: boolean
  /**
   * Wacana bersama soal ini (grup stimulus TKA) — dirender sebagai panel
   * bacaan di atas soal yang tetap terbuka selama siswa berpindah antar
   * nomor dalam grup yang sama. Terpisah dari `question.stimulus` (teks per
   * soal, mekanisme lama) yang tetap dirender seperti sebelumnya.
   */
  passage?: TryoutPassage | null
  textScale?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
}>()

const emit = defineEmits<{
  select: [label: OptionLabel]
  answer: [value: TryoutAnswerValue, selected?: OptionLabel | null]
}>()

const stimulusOpen = ref(true)
watch(() => props.question.id, () => { stimulusOpen.value = true })
const stimulusId = useId()

// Panel wacana dibuka ulang saat WACANA-nya berganti, bukan saat nomor soal
// berganti — berpindah antar soal segrup tidak boleh menutup/mereset bacaan
// yang sedang dibaca.
const passageOpen = ref(true)
watch(() => props.passage?.id, () => { passageOpen.value = true })
const passageId = useId()

const textScale = computed(() => props.textScale ?? 5)
const questionTextClass = computed(() => ({
  1: 'text-[0.82rem] md:text-[0.86rem]',
  2: 'text-[0.86rem] md:text-[0.9rem]',
  3: 'text-[0.92rem] md:text-[0.96rem]',
  4: 'text-[0.98rem] md:text-[1.02rem]',
  5: 'text-[1.02rem] md:text-[1.05rem]',
  6: 'text-[1.1rem] md:text-[1.16rem]',
  7: 'text-[1.2rem] md:text-[1.28rem]',
  8: 'text-[1.3rem] md:text-[1.4rem]',
  9: 'text-[1.4rem] md:text-[1.52rem]',
  10: 'text-[1.52rem] md:text-[1.65rem]',
}[textScale.value]))
const answerTextClass = computed(() => ({
  1: 'text-[0.72rem]',
  2: 'text-[0.76rem]',
  3: 'text-[0.82rem]',
  4: 'text-[0.88rem]',
  5: 'text-[0.94rem]',
  6: 'text-[1.02rem]',
  7: 'text-[1.1rem]',
  8: 'text-[1.18rem]',
  9: 'text-[1.26rem]',
  10: 'text-[1.34rem]',
}[textScale.value]))
const imageScaleClass = computed(() => `exam-scale-${textScale.value}`)

const currentValue = computed(() => props.value ?? props.selected ?? null)
const selectedMultiple = computed(() => Array.isArray(currentValue.value) ? currentValue.value as string[] : [])
const trueFalseValues = computed(() => {
  const value = currentValue.value
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, boolean> : {}
})
const matchingValues = computed(() => {
  const value = currentValue.value
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, string> : {}
})
const orderingValues = computed(() => Array.isArray(currentValue.value) ? currentValue.value as string[] : [])

/** Student-facing fields may contain editor math spans or `$..$` CSV math. */
function renderedHtml(value: string): string {
  return renderInlineMathHtml(value)
}

function toggleMultiple(label: OptionLabel) {
  const next = selectedMultiple.value.includes(label)
    ? selectedMultiple.value.filter(item => item !== label)
    : [...selectedMultiple.value, label]
  emit('answer', next, null)
}

function setTrueFalse(label: string, value: boolean) {
  emit('answer', { ...trueFalseValues.value, [label]: value }, null)
}

function setShortAnswer(event: Event) {
  emit('answer', (event.target as HTMLInputElement).value, null)
}

function setMatching(left: string, right: string) {
  emit('answer', { ...matchingValues.value, [left]: right }, null)
}

function setMatchingFromEvent(left: string, event: Event) {
  setMatching(left, (event.target as HTMLSelectElement).value)
}

function setOrdering(position: number, label: string) {
  const next = [...orderingValues.value]
  next[position] = label
  emit('answer', next, null)
}

function setOrderingFromEvent(position: number, event: Event) {
  setOrdering(position, (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface p-4 shadow-xs sm:p-5 md:p-7">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-[0.82rem] font-bold text-muted">
        Soal {{ index }} <span class="text-faint">dari {{ total }}</span>
      </p>
      <span v-if="doubtful" class="inline-flex items-center gap-1.5 rounded-pill bg-amber-50 px-2.5 py-1 text-[0.74rem] font-bold text-amber-800">Ditandai ragu-ragu</span>
    </div>

    <!-- Panel wacana bersama (grup stimulus): tetap tampil selama soal-soal
         segrup dikerjakan. Bisa dilipat — penting di layar sempit — dan isi
         panjangnya scroll di dalam panelnya sendiri. -->
    <section v-if="passage" class="mt-4 overflow-hidden rounded-sm border border-hairline bg-surface-alt" :aria-labelledby="passageId">
      <button type="button" class="flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-surface-sunken" :aria-expanded="passageOpen" :aria-controls="`${passageId}-content`" @click="passageOpen = !passageOpen">
        <span :id="passageId" class="min-w-0 text-left text-[0.88rem] font-bold text-ink">{{ passage.title || 'Wacana' }}</span>
        <span class="flex shrink-0 items-center gap-1.5 text-[0.8rem] font-semibold text-muted">{{ passageOpen ? 'Sembunyikan' : 'Tampilkan' }}<IconChevron class="h-4 w-4 transition-transform duration-200 ease-smooth" :class="passageOpen ? 'rotate-180' : ''" /></span>
      </button>
      <div v-show="passageOpen" :id="`${passageId}-content`" class="prose-question max-h-[46svh] overflow-y-auto border-t border-hairline px-4 py-3.5 leading-[1.65] text-ink md:max-h-[38rem] [&_img]:my-3" :class="[answerTextClass, imageScaleClass]" v-html="renderedHtml(passage.content)" />
    </section>

    <div v-if="question.stimulus" class="mt-4 overflow-hidden rounded-sm border border-hairline bg-surface-alt">
      <button type="button" class="flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-surface-sunken" :aria-expanded="stimulusOpen" :aria-controls="stimulusId" @click="stimulusOpen = !stimulusOpen">
        <span class="text-[0.76rem] font-bold tracking-[0.08em] text-faint uppercase">Bacaan</span>
        <span class="flex shrink-0 items-center gap-1.5 text-[0.8rem] font-semibold text-muted">{{ stimulusOpen ? 'Sembunyikan' : 'Tampilkan' }}<IconChevron class="h-4 w-4 transition-transform duration-200 ease-smooth" :class="stimulusOpen ? 'rotate-180' : ''" /></span>
      </button>
      <div v-show="stimulusOpen" :id="stimulusId" class="prose-question max-h-[46svh] overflow-y-auto border-t border-hairline px-4 py-3.5 leading-[1.65] text-ink md:max-h-none md:overflow-visible [&_img]:my-3" :class="[answerTextClass, imageScaleClass]" v-html="renderedHtml(question.stimulus)" />
    </div>

    <div class="prose-question mt-4 leading-[1.6] font-medium tracking-[-0.01em] text-ink" :class="[questionTextClass, imageScaleClass]" v-html="renderedHtml(question.text)" />

    <div v-if="question.kind === 'multiple_choice'" class="mt-5 grid gap-2.5 md:mt-6" role="group" aria-label="Pilihan jawaban">
      <button v-for="option in question.options" :key="option.label" type="button" class="flex min-h-11 touch-manipulation items-start gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-150 ease-smooth sm:gap-3.5 sm:px-4 sm:py-3.5" :class="selectedMultiple.includes(option.label) ? 'border-transparent bg-primary-soft ring-1 ring-primary' : 'border-hairline-strong bg-surface hover:bg-surface-alt'" :aria-pressed="selectedMultiple.includes(option.label)" @click="toggleMultiple(option.label)">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border text-[0.82rem] font-bold" :class="selectedMultiple.includes(option.label) ? 'border-transparent bg-primary text-white' : 'border-hairline-strong text-muted'">{{ option.label }}</span>
        <span class="min-w-0 flex-1 pt-0.5 leading-[1.55]" :class="[answerTextClass, imageScaleClass]"><img v-if="option.imageUrl" :src="option.imageUrl" alt="" class="mb-2 max-w-full rounded-xs object-contain" :class="imageScaleClass"><span class="prose-question" v-html="renderedHtml(option.text)" /></span>
      </button>
    </div>

    <div v-else-if="question.kind === 'true_false'" class="mt-5 grid gap-3" role="group" aria-label="Pernyataan benar atau salah">
      <div v-for="option in question.options" :key="option.label" class="rounded-sm border border-hairline-strong p-3.5">
        <div class="prose-question leading-[1.55]" :class="answerTextClass" v-html="renderedHtml(option.text)" />
        <div class="mt-3 flex gap-2">
          <button type="button" class="rounded-xs border px-3 py-2 text-[0.82rem] font-bold" :class="trueFalseValues[option.label] === true ? 'border-success bg-success-soft text-success-ink' : 'border-hairline-strong text-muted'" @click="setTrueFalse(option.label, true)">Benar</button>
          <button type="button" class="rounded-xs border px-3 py-2 text-[0.82rem] font-bold" :class="trueFalseValues[option.label] === false ? 'border-danger bg-danger-soft text-danger-ink' : 'border-hairline-strong text-muted'" @click="setTrueFalse(option.label, false)">Salah</button>
        </div>
      </div>
    </div>

    <div v-else-if="question.kind === 'short_answer'" class="mt-5">
      <label class="text-[0.78rem] font-bold tracking-[0.08em] text-faint uppercase" :for="`${question.id}-answer`">Jawaban singkat</label>
      <input :id="`${question.id}-answer`" :value="typeof currentValue === 'string' ? currentValue : ''" type="text" class="mt-2 w-full rounded-sm border border-hairline-strong bg-surface px-3.5 py-3 focus:border-primary focus:outline-none" :class="answerTextClass" placeholder="Ketik jawabanmu" @input="setShortAnswer">
    </div>

    <div v-else-if="question.kind === 'matching'" class="mt-5 grid gap-3">
      <div v-for="option in question.options" :key="option.label" class="grid gap-2 rounded-sm border border-hairline-strong p-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)] md:items-center">
        <div class="prose-question leading-[1.55]" :class="answerTextClass"><span class="mr-2 font-bold text-primary">{{ option.label }}</span><span v-html="renderedHtml(option.text)" /></div>
        <select :value="matchingValues[option.label] ?? ''" class="min-h-11 rounded-xs border border-hairline-strong bg-surface px-3 text-[0.88rem]" :aria-label="`Pasangan untuk ${option.label}`" @change="setMatchingFromEvent(option.label, $event)">
          <option value="">Pilih pasangan</option>
          <option v-for="item in question.matching ?? []" :key="item.id" :value="item.id">{{ item.text }}</option>
        </select>
      </div>
    </div>

    <div v-else-if="question.kind === 'ordering'" class="mt-5 grid gap-3">
      <div v-for="(_, position) in question.options" :key="position" class="flex items-center gap-3">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.82rem] font-bold text-primary">{{ position + 1 }}</span>
        <select :value="orderingValues[position] ?? ''" class="min-h-11 flex-1 rounded-xs border border-hairline-strong bg-surface px-3 text-[0.88rem]" :aria-label="`Item urutan ${position + 1}`" @change="setOrderingFromEvent(position, $event)">
          <option value="">Pilih item</option>
          <option v-for="option in question.options" :key="option.label" :value="option.label">{{ option.label }} — {{ stripHtmlToText(option.text) }}</option>
        </select>
      </div>
    </div>

    <div v-else class="mt-5 grid gap-2.5" role="radiogroup" aria-label="Pilihan jawaban">
      <button v-for="option in question.options" :key="option.label" type="button" role="radio" :aria-checked="selected === option.label" class="flex min-h-11 touch-manipulation items-start gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-150 ease-smooth sm:gap-3.5 sm:px-4 sm:py-3.5" :class="selected === option.label ? 'border-transparent bg-primary-soft ring-1 ring-primary' : 'border-hairline-strong bg-surface hover:bg-surface-alt'" @click="emit('select', option.label)">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.82rem] font-bold" :class="selected === option.label ? 'border-transparent bg-primary text-white' : 'border-hairline-strong text-muted'">{{ option.label }}</span>
        <span class="min-w-0 flex-1 pt-0.5 leading-[1.55]" :class="[answerTextClass, imageScaleClass]"><img v-if="option.imageUrl" :src="option.imageUrl" alt="" class="mb-2 max-w-full rounded-xs object-contain" :class="imageScaleClass"><span class="prose-question" v-html="renderedHtml(option.text)" /></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
img.exam-scale-1,
.exam-scale-1 :deep(img) { max-height: 6rem; }

img.exam-scale-2,
.exam-scale-2 :deep(img) { max-height: 7rem; }

img.exam-scale-3,
.exam-scale-3 :deep(img) { max-height: 8rem; }

img.exam-scale-4,
.exam-scale-4 :deep(img) { max-height: 10rem; }

img.exam-scale-5,
.exam-scale-5 :deep(img) { max-height: 12rem; }

img.exam-scale-6,
.exam-scale-6 :deep(img) { max-height: 14rem; }

img.exam-scale-7,
.exam-scale-7 :deep(img) { max-height: 17rem; }

img.exam-scale-8,
.exam-scale-8 :deep(img) { max-height: 20rem; }

img.exam-scale-9,
.exam-scale-9 :deep(img) { max-height: 24rem; }

img.exam-scale-10,
.exam-scale-10 :deep(img) { max-height: 28rem; }

/* Keep figures sharp and self-contained as the text grows. On a phone the
   question column is narrow, so a shorter cap prevents a single tall diagram
   from taking over the entire viewport while still leaving enough height for
   labels and axes to remain legible. */
.exam-scale-1 :deep(img),
.exam-scale-2 :deep(img),
.exam-scale-3 :deep(img),
.exam-scale-4 :deep(img),
.exam-scale-5 :deep(img),
.exam-scale-6 :deep(img),
.exam-scale-7 :deep(img),
.exam-scale-8 :deep(img),
.exam-scale-9 :deep(img),
.exam-scale-10 :deep(img),
img.exam-scale-1,
img.exam-scale-2,
img.exam-scale-3,
img.exam-scale-4,
img.exam-scale-5,
img.exam-scale-6,
img.exam-scale-7,
img.exam-scale-8,
img.exam-scale-9,
img.exam-scale-10 {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

@media (min-width: 768px) {
  img.exam-scale-1,
  .exam-scale-1 :deep(img) { max-height: 8rem; }

  img.exam-scale-2,
  .exam-scale-2 :deep(img) { max-height: 10rem; }

  img.exam-scale-3,
  .exam-scale-3 :deep(img) { max-height: 12rem; }

  img.exam-scale-4,
  .exam-scale-4 :deep(img) { max-height: 14rem; }

  img.exam-scale-5,
  .exam-scale-5 :deep(img) { max-height: 18rem; }

  img.exam-scale-6,
  .exam-scale-6 :deep(img) { max-height: 22rem; }

  img.exam-scale-7,
  .exam-scale-7 :deep(img) { max-height: 28rem; }

  img.exam-scale-8,
  .exam-scale-8 :deep(img) { max-height: 36rem; }

  img.exam-scale-9,
  .exam-scale-9 :deep(img) { max-height: 44rem; }

  img.exam-scale-10,
  .exam-scale-10 :deep(img) { max-height: 52rem; }
}
</style>
