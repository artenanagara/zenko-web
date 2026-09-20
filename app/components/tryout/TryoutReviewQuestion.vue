<script setup lang="ts">
import type { TryoutAnswerState, TryoutOption, TryoutQuestion } from '#shared/types/tryout'
import { renderInlineMathHtml } from '~/utils/richText'

/**
 * Satu soal pada lembar Pembahasan, sesudah sesi selesai: baca saja, kunci
 * jawaban terbuka, tanpa cara menjawab ulang.
 *
 * Bahasa visualnya sengaja sama dengan TutorQuestionPreview.vue
 * (optionStateClass di sana): opsi benar bergaris success dan berikon
 * check-circle, opsi yang dipilih tapi salah bergaris danger dan berikon
 * x-circle, sisanya diredupkan. Bedanya di sini tidak ada yang bisa diklik —
 * semuanya sudah terjawab dan terkunci.
 *
 * HTML soal/opsi/pembahasan di-render apa adanya, persis seperti
 * TryoutQuestion.vue merender soal yang sama saat ujian berlangsung
 * (zenko-api yang mensanitasi saat tutor menyimpan). Lembar tinjauan harus
 * memperlihatkan soal yang sama, bukan versi yang diproses berbeda.
 */
const props = defineProps<{
  question: TryoutQuestion & {
    /** Server-side verdict is present on stored review questions. */
    isCorrect?: boolean
  }
  /** Nomor yang ditampilkan — berjalan lintas subtes, sama dengan navigasi soal. */
  number: number
  answer: TryoutAnswerState | undefined
}>()

const selected = computed(() => props.answer?.selected ?? null)
const answerValue = computed(() => props.answer?.value ?? props.answer?.selected ?? null)
const hasAnswer = computed(() => selected.value != null || answerValue.value != null)
const selectedMultiple = computed(() =>
  props.question.kind === 'multiple_choice' && Array.isArray(answerValue.value)
    ? answerValue.value as string[]
    : [],
)
const trueFalseValues = computed(() => {
  if (props.question.kind !== 'true_false') return {}
  const value = answerValue.value
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, boolean>
    : {}
})
const matchingValues = computed(() => {
  if (props.question.kind !== 'matching') return {}
  const value = answerValue.value
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, string>
    : {}
})
const orderingValues = computed(() =>
  props.question.kind === 'ordering' && Array.isArray(answerValue.value)
    ? answerValue.value as string[]
    : [],
)
const shortAnswerValue = computed(() =>
  props.question.kind === 'short_answer' && typeof answerValue.value === 'string'
    ? answerValue.value
    : '',
)

/** Keep review rendering identical to the active tryout question view. */
function renderedHtml(value: string): string {
  return renderInlineMathHtml(value)
}

/** Soal weighted (TKP/AKHLAK) tidak punya jawaban salah, cuma yang paling tinggi. */
const bestLabels = computed<string[]>(() => {
  const question = props.question
  if (question.kind === 'objective') return question.correct ? [question.correct] : []
  // Kunci jawaban selalu ada di layar review — paket ini sudah dimiliki. Nilai
  // kosong hanya mungkin pada payload tanpa kunci (contoh gratis), yang tidak
  // pernah sampai ke sini, jadi jangan sampai bikin halaman ini meledak.
  if (question.kind !== 'situational') return []
  const scores: Record<string, number> = question.scores ?? {}
  const values = Object.values(scores)
  if (!values.length) return []
  const top = Math.max(...values)
  return Object.entries(scores)
    .filter(([, score]) => score === top)
    .map(([label]) => label)
})

function scoreOf(option: TryoutOption): number | null {
  return props.question.kind === 'situational' ? (props.question.scores?.[option.label] ?? 0) : null
}

function isBest(option: TryoutOption): boolean {
  return bestLabels.value.includes(option.label)
}

function optionStateClass(option: TryoutOption): string {
  if (isBest(option)) return 'border-success bg-success-soft'
  if (selected.value === option.label || selectedMultiple.value.includes(option.label)) {
    // Untuk soal weighted, pilihan yang bukan tertinggi tetap berpoin —
    // menandainya merah akan berbohong soal cara skornya dihitung.
    return props.question.kind === 'objective'
      ? 'border-danger bg-danger-soft'
      : 'border-primary bg-primary-soft'
  }
  return 'border-hairline-strong opacity-60'
}

const outcome = computed<{ label: string, tone: 'success' | 'danger' | 'warning' | 'neutral' }>(() => {
  if (!hasAnswer.value) return { label: 'Tidak dijawab', tone: 'warning' }
  if (props.question.isCorrect === true) return { label: 'Tepat', tone: 'success' }
  if (props.question.isCorrect === false && props.question.kind !== 'situational') {
    return { label: 'Kurang tepat', tone: 'danger' }
  }
  if (props.question.kind === 'multiple_choice' || props.question.kind === 'true_false') {
    return { label: 'Terjawab', tone: 'neutral' }
  }
  if (isBestLabel(selected.value ?? '')) return { label: 'Tepat', tone: 'success' }
  return props.question.kind === 'objective'
    ? { label: 'Kurang tepat', tone: 'danger' }
    : { label: 'Belum optimal', tone: 'neutral' }
})

function isBestLabel(label: string): boolean {
  return bestLabels.value.includes(label)
}
</script>

<template>
  <article class="rounded-md border border-hairline bg-surface p-4 md:p-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-[0.82rem] font-bold text-muted">Soal {{ number }}</p>
      <DashboardBadge :tone="outcome.tone">{{ outcome.label }}</DashboardBadge>
    </div>

    <div
      v-if="question.stimulus"
      class="prose-question mt-3 rounded-sm border border-hairline bg-surface-alt p-3.5 text-[0.9rem] leading-[1.65] text-muted [&_img]:max-h-72"
      v-html="renderedHtml(question.stimulus)"
    />

    <div
      class="prose-question mt-3 text-[0.98rem] leading-[1.6] font-medium tracking-[-0.01em] text-ink [&_img]:max-h-96"
      v-html="renderedHtml(question.text)"
    />

    <ul class="mt-4 grid gap-2">
      <li
        v-for="option in question.options"
        :key="option.label"
        class="flex items-start gap-3 rounded-sm border px-3.5 py-3"
        :class="optionStateClass(option)"
      >
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline-strong text-[0.8rem] font-bold text-muted">
          {{ option.label }}
        </span>

        <span class="min-w-0 flex-1 pt-0.5 text-[0.92rem] leading-[1.55]">
          <img
            v-if="option.imageUrl"
            :src="option.imageUrl"
            alt=""
            class="mb-2 max-h-52 max-w-full rounded-xs object-contain"
          >
          <span class="prose-question [&_img]:max-h-52" v-html="renderedHtml(option.text)" />
          <span v-if="selected === option.label" class="mt-1 block text-[0.76rem] font-bold text-muted uppercase">
            Jawabanmu
          </span>
        </span>

        <span
          v-if="scoreOf(option) !== null"
          class="shrink-0 rounded-pill bg-surface-alt px-2.5 py-1 text-[0.72rem] font-bold text-muted"
        >
          Bobot {{ scoreOf(option) }}
        </span>
        <AppIcon
          v-if="isBest(option)"
          name="check-circle"
          :size="18"
          weight="fill"
          class="mt-0.5 shrink-0 text-success"
        />
        <AppIcon
          v-else-if="question.kind === 'objective' && selected === option.label"
          name="x-circle"
          :size="18"
          weight="fill"
          class="mt-0.5 shrink-0 text-danger"
        />
      </li>
    </ul>

    <div v-if="question.kind === 'multiple_choice'" class="mt-4 rounded-sm border border-primary bg-primary-soft p-3 text-[0.86rem] text-primary">
      <span class="font-bold">Jawabanmu:</span>
      {{ selectedMultiple.length ? selectedMultiple.join(', ') : 'Tidak dijawab' }}
    </div>

    <div v-else-if="question.kind === 'true_false'" class="mt-4 grid gap-2 rounded-sm border border-primary bg-primary-soft p-3 text-[0.86rem] text-primary">
      <p class="font-bold">Jawabanmu:</p>
      <p v-for="option in question.options" :key="option.label">
        {{ option.label }}: {{ trueFalseValues[option.label] === undefined ? 'Belum dijawab' : trueFalseValues[option.label] ? 'Benar' : 'Salah' }}
      </p>
    </div>

    <div v-else-if="question.kind === 'short_answer'" class="mt-4 rounded-sm border border-primary bg-primary-soft p-3 text-[0.86rem] text-primary">
      <span class="font-bold">Jawabanmu:</span>
      {{ shortAnswerValue || 'Tidak dijawab' }}
    </div>

    <div v-else-if="question.kind === 'matching'" class="mt-4 grid gap-2 rounded-sm border border-primary bg-primary-soft p-3 text-[0.86rem] text-primary">
      <p class="font-bold">Jawabanmu:</p>
      <p v-for="option in question.options" :key="option.label">
        {{ option.label }}: {{ matchingValues[option.label] || 'Belum dijawab' }}
      </p>
    </div>

    <div v-else-if="question.kind === 'ordering'" class="mt-4 rounded-sm border border-primary bg-primary-soft p-3 text-[0.86rem] text-primary">
      <span class="font-bold">Urutan jawabanmu:</span>
      {{ orderingValues.length ? orderingValues.join(' → ') : 'Tidak dijawab' }}
    </div>

    <div class="mt-4 rounded-sm border border-hairline bg-surface-alt p-3.5">
      <p class="mb-1.5 flex items-center gap-1.5 text-[0.76rem] font-bold tracking-wide text-faint uppercase">
        <AppIcon name="eye" :size="13" />
        Pembahasan
      </p>
      <div
        v-if="question.explanation"
        class="prose-question text-[0.9rem] leading-[1.65] text-muted [&_img]:max-h-72"
        v-html="renderedHtml(question.explanation)"
      />
      <p v-else class="text-[0.86rem] text-muted">Tutor belum menulis pembahasan untuk soal ini.</p>
    </div>
  </article>
</template>
