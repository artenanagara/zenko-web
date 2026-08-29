<script setup lang="ts">
import type { OptionLabel, TryoutAnswerValue, TryoutQuestion } from '#shared/types/tryout'
import { renderInlineMathHtml } from '~/utils/richText'

const props = defineProps<{
  question: TryoutQuestion
  index: number
  total: number
  selected: OptionLabel | null
  value?: TryoutAnswerValue
  doubtful: boolean
}>()

const emit = defineEmits<{
  select: [label: OptionLabel]
  answer: [value: TryoutAnswerValue, selected?: OptionLabel | null]
}>()

const stimulusOpen = ref(true)
watch(() => props.question.id, () => { stimulusOpen.value = true })
const stimulusId = useId()

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

    <div v-if="question.stimulus" class="mt-4 overflow-hidden rounded-sm border border-hairline bg-surface-alt">
      <button type="button" class="flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-surface-sunken" :aria-expanded="stimulusOpen" :aria-controls="stimulusId" @click="stimulusOpen = !stimulusOpen">
        <span class="text-[0.76rem] font-bold tracking-[0.08em] text-faint uppercase">Bacaan</span>
        <span class="flex shrink-0 items-center gap-1.5 text-[0.8rem] font-semibold text-muted">{{ stimulusOpen ? 'Sembunyikan' : 'Tampilkan' }}<IconChevron class="h-4 w-4 transition-transform duration-200 ease-smooth" :class="stimulusOpen ? 'rotate-180' : ''" /></span>
      </button>
      <div v-show="stimulusOpen" :id="stimulusId" class="prose-question max-h-[46svh] overflow-y-auto border-t border-hairline px-4 py-3.5 text-[0.94rem] leading-[1.65] text-ink md:max-h-none md:overflow-visible [&_img]:my-3 [&_img]:max-h-80" v-html="renderedHtml(question.stimulus)" />
    </div>

    <div class="prose-question mt-4 text-[1.02rem] leading-[1.6] font-medium tracking-[-0.01em] text-ink md:text-[1.05rem] [&_img]:max-h-96" v-html="renderedHtml(question.text)" />

    <div v-if="question.kind === 'multiple_choice'" class="mt-5 grid gap-2.5 md:mt-6" role="group" aria-label="Pilihan jawaban">
      <button v-for="option in question.options" :key="option.label" type="button" class="flex min-h-11 touch-manipulation items-start gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-150 ease-smooth sm:gap-3.5 sm:px-4 sm:py-3.5" :class="selectedMultiple.includes(option.label) ? 'border-transparent bg-primary-soft ring-1 ring-primary' : 'border-hairline-strong bg-surface hover:bg-surface-alt'" :aria-pressed="selectedMultiple.includes(option.label)" @click="toggleMultiple(option.label)">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border text-[0.82rem] font-bold" :class="selectedMultiple.includes(option.label) ? 'border-transparent bg-primary text-white' : 'border-hairline-strong text-muted'">{{ option.label }}</span>
        <span class="min-w-0 flex-1 pt-0.5 text-[0.94rem] leading-[1.55]"><img v-if="option.imageUrl" :src="option.imageUrl" alt="" class="mb-2 max-h-52 max-w-full rounded-xs object-contain"><span class="prose-question [&_img]:max-h-52" v-html="renderedHtml(option.text)" /></span>
      </button>
    </div>

    <div v-else-if="question.kind === 'true_false'" class="mt-5 grid gap-3" role="group" aria-label="Pernyataan benar atau salah">
      <div v-for="option in question.options" :key="option.label" class="rounded-sm border border-hairline-strong p-3.5">
        <div class="prose-question text-[0.94rem] leading-[1.55]" v-html="renderedHtml(option.text)" />
        <div class="mt-3 flex gap-2">
          <button type="button" class="rounded-xs border px-3 py-2 text-[0.82rem] font-bold" :class="trueFalseValues[option.label] === true ? 'border-success bg-success-soft text-success-ink' : 'border-hairline-strong text-muted'" @click="setTrueFalse(option.label, true)">Benar</button>
          <button type="button" class="rounded-xs border px-3 py-2 text-[0.82rem] font-bold" :class="trueFalseValues[option.label] === false ? 'border-danger bg-danger-soft text-danger-ink' : 'border-hairline-strong text-muted'" @click="setTrueFalse(option.label, false)">Salah</button>
        </div>
      </div>
    </div>

    <div v-else-if="question.kind === 'short_answer'" class="mt-5">
      <label class="text-[0.78rem] font-bold tracking-[0.08em] text-faint uppercase" :for="`${question.id}-answer`">Jawaban singkat</label>
      <input :id="`${question.id}-answer`" :value="typeof currentValue === 'string' ? currentValue : ''" type="text" class="mt-2 w-full rounded-sm border border-hairline-strong bg-surface px-3.5 py-3 text-[0.94rem] focus:border-primary focus:outline-none" placeholder="Ketik jawabanmu" @input="setShortAnswer">
    </div>

    <div v-else-if="question.kind === 'matching'" class="mt-5 grid gap-3">
      <div v-for="option in question.options" :key="option.label" class="grid gap-2 rounded-sm border border-hairline-strong p-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)] md:items-center">
        <div class="prose-question text-[0.94rem] leading-[1.55]"><span class="mr-2 font-bold text-primary">{{ option.label }}</span><span v-html="renderedHtml(option.text)" /></div>
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
        <span class="min-w-0 flex-1 pt-0.5 text-[0.94rem] leading-[1.55]"><img v-if="option.imageUrl" :src="option.imageUrl" alt="" class="mb-2 max-h-52 max-w-full rounded-xs object-contain"><span class="prose-question [&_img]:max-h-52" v-html="renderedHtml(option.text)" /></span>
      </button>
    </div>
  </div>
</template>
