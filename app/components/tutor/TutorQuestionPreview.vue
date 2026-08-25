<script setup lang="ts">
import type { QuestionDraft, QuestionOption } from '#shared/types/tutor-product'

/**
 * Panel "Pratinjau & Simulasi" (langkah Review & ajukan): render soal kira-
 * kira seperti yang siswa lihat SAAT MENGERJAKAN, TAPI interaktif — tutor
 * bisa benar-benar memilih jawaban untuk mengetes soalnya sendiri sebelum
 * diajukan, bukan cuma melihat tampilan statis. Begitu dijawab, hasil
 * (benar/salah, atau bobot untuk soal weighted) dan Pembahasan langsung
 * terlihat — sesuatu yang siswa sungguhan TIDAK lihat selama ujian
 * berlangsung (baru muncul di lembar review setelahnya, lihat
 * student-flow-contract.md §4), tapi berguna di sini justru untuk tutor
 * memeriksa kunci jawaban dan pembahasannya sudah benar.
 *
 * Layout wacana mengikuti §2C dokumen yang sama: split 2 kolom di desktop,
 * tab di mobile.
 *
 * Statis per instance — parent (TutorQuestionPreviewModal.vue) me-`:key`
 * komponen ini per soal, jadi state jawaban lokal otomatis reset begitu
 * tutor pindah ke soal lain lewat navigasi geser/panah.
 */
const props = defineProps<{
  question: QuestionDraft
}>()

const viewport = ref<'desktop' | 'mobile'>('desktop')
const mobileTab = ref<'wacana' | 'soal'>('soal')

const hasStimulus = computed(() => !!stripHtmlToText(props.question.stimulus ?? ''))
const stimulusHtml = computed(() => renderInlineMathHtml(props.question.stimulus ?? ''))
const promptHtml = computed(() => renderInlineMathHtml(props.question.prompt))
const explanationHtml = computed(() => renderInlineMathHtml(props.question.explanation))
/** Belum ada apa pun untuk ditinjau — tampilkan penuntun, bukan panel kosong. */
const hasPrompt = computed(() => !!stripHtmlToText(props.question.prompt))

function optionHtml(text: string) {
  return renderInlineMathHtml(text)
}

/* --------------------------------------------------------------------------
 * Simulasi jawaban — satu blok state per kind, cuma satu yang pernah aktif
 * sekaligus karena `kind` tetap sepanjang umur komponen ini (instance baru
 * per soal lewat `:key` di parent).
 * ------------------------------------------------------------------------ */

// single_choice & weighted: opsi yang dipilih.
const selectedOption = ref<QuestionOption | null>(null)
const answered = computed(() => selectedOption.value !== null)

function pickOption(option: QuestionOption) {
  selectedOption.value = option
}

function optionStateClass(option: QuestionOption): string {
  if (props.question.kind === 'weighted') {
    return selectedOption.value === option
      ? 'border-primary bg-primary-soft'
      : 'border-hairline-strong hover:border-line'
  }
  // single_choice: kunci jawaban selalu terungkap begitu ada yang dipilih,
  // pilihan yang salah ditandai merah — pilihan yang belum dijawab tetap netral.
  if (!answered.value) return 'border-hairline-strong hover:border-line'
  if (option.isCorrect) return 'border-success bg-success-soft'
  if (selectedOption.value === option) return 'border-danger bg-danger-soft'
  return 'border-hairline-strong opacity-60'
}

// true_false: jawaban per pernyataan, keyed by label.
const trueFalseAnswers = ref<Record<string, boolean>>({})

function pickTrueFalse(option: QuestionOption, value: boolean) {
  trueFalseAnswers.value = { ...trueFalseAnswers.value, [option.label]: value }
}

function trueFalseButtonClass(option: QuestionOption, value: boolean): string {
  const picked = trueFalseAnswers.value[option.label]
  if (picked === undefined) return 'text-muted hover:bg-surface-alt'
  const isPickedValue = picked === value
  const isCorrectValue = option.isCorrect === value
  if (isCorrectValue) return isPickedValue ? 'bg-success-soft text-success-ink' : 'bg-success-soft/50 text-success-ink'
  return isPickedValue ? 'bg-danger-soft text-danger-ink' : 'text-muted'
}

// short_answer: satu input bebas + cek terhadap daftar jawaban diterima.
const shortAnswerInput = ref('')
const shortAnswerChecked = ref(false)
const shortAnswerCorrect = computed(() => {
  const given = shortAnswerInput.value.trim().toLowerCase()
  return (props.question.answers ?? []).some(accepted => accepted.trim().toLowerCase() === given)
})
function checkShortAnswer() {
  if (!shortAnswerInput.value.trim()) return
  shortAnswerChecked.value = true
}

/** Ada progres yang cukup untuk menampilkan hasil + Pembahasan di bawah. */
const showResult = computed(() => {
  if (props.question.kind === 'single_choice' || props.question.kind === 'weighted') return answered.value
  if (props.question.kind === 'true_false') {
    const total = props.question.options?.length ?? 0
    return total > 0 && Object.keys(trueFalseAnswers.value).length === total
  }
  return shortAnswerChecked.value
})
</script>

<template>
  <div
    class="grid max-h-[90vh] grid-rows-[auto_1fr] overflow-hidden rounded-md border border-hairline bg-surface shadow-xs"
  >
    <header class="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
      <p class="font-bold tracking-[-0.02em]">Pratinjau &amp; Simulasi Siswa</p>
      <span class="inline-flex overflow-hidden rounded-sm border border-line" role="group" aria-label="Ukuran layar">
        <button
          type="button"
          class="px-3 py-1.5 text-[0.8rem] font-semibold transition-colors"
          :class="viewport === 'desktop' ? 'bg-primary-soft text-primary' : 'text-muted'"
          @click="viewport = 'desktop'"
        >
          Desktop
        </button>
        <button
          type="button"
          class="border-l border-line px-3 py-1.5 text-[0.8rem] font-semibold transition-colors"
          :class="viewport === 'mobile' ? 'bg-primary-soft text-primary' : 'text-muted'"
          @click="viewport = 'mobile'"
        >
          Mobile
        </button>
      </span>
    </header>

    <div class="overflow-y-auto p-5">
      <div
        v-if="!hasPrompt"
        class="flex min-h-[240px] flex-col items-center justify-center gap-2 py-10 text-center text-muted"
      >
        <AppIcon name="eye" :size="28" class="text-faint" />
        <p class="max-w-[26ch] text-[0.88rem]">
          Pratinjau muncul di sini saat kamu mulai mengetik soal.
        </p>
      </div>

      <template v-else>
        <div
          v-if="viewport === 'mobile' && hasStimulus"
          class="mb-4 inline-flex overflow-hidden rounded-sm border border-line"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="mobileTab === 'wacana'"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors"
            :class="mobileTab === 'wacana' ? 'bg-primary-soft text-primary' : 'text-muted'"
            @click="mobileTab = 'wacana'"
          >
            <AppIcon name="file-text" :size="14" />
            Baca Wacana
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="mobileTab === 'soal'"
            class="inline-flex items-center gap-1.5 border-l border-line px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors"
            :class="mobileTab === 'soal' ? 'bg-primary-soft text-primary' : 'text-muted'"
            @click="mobileTab = 'soal'"
          >
            <AppIcon name="pencil-simple" :size="14" />
            Jawab Soal
          </button>
        </div>

        <div :class="viewport === 'desktop' && hasStimulus ? 'grid grid-cols-2 items-start gap-6' : 'grid gap-6'">
          <div
            v-if="hasStimulus"
            v-show="viewport === 'desktop' || mobileTab === 'wacana'"
            class="prose-question max-h-[60vh] overflow-y-auto rounded-md border border-hairline bg-surface-alt p-4"
            v-html="stimulusHtml"
          />

          <div v-show="viewport === 'desktop' || !hasStimulus || mobileTab === 'soal'" class="grid gap-4">
            <div class="prose-question font-medium" v-html="promptHtml" />

            <div v-if="question.kind === 'single_choice' || question.kind === 'weighted'" class="grid gap-2.5">
              <button
                v-for="option in question.options ?? []"
                :key="option.label"
                type="button"
                class="flex w-full items-start gap-3 rounded-sm border px-4 py-3 text-left transition-colors"
                :class="optionStateClass(option)"
                @click="pickOption(option)"
              >
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline-strong text-[0.82rem] font-bold text-muted">
                  {{ option.label }}
                </span>
                <div class="grid flex-1 gap-2">
                  <span class="prose-question" v-html="optionHtml(option.text)" />
                  <img v-if="option.imageUrl" :src="option.imageUrl" alt="" class="max-h-32 w-auto rounded-xs border border-hairline object-contain">
                </div>
                <span
                  v-if="question.kind === 'weighted' && selectedOption === option"
                  class="shrink-0 rounded-pill bg-primary px-2.5 py-1 text-[0.72rem] font-bold text-white"
                >
                  Bobot {{ option.weight ?? 0 }}
                </span>
                <AppIcon
                  v-else-if="question.kind === 'single_choice' && answered && option.isCorrect"
                  name="check-circle"
                  :size="18"
                  weight="fill"
                  class="shrink-0 text-success"
                />
                <AppIcon
                  v-else-if="question.kind === 'single_choice' && answered && selectedOption === option && !option.isCorrect"
                  name="x-circle"
                  :size="18"
                  weight="fill"
                  class="shrink-0 text-danger"
                />
              </button>
            </div>

            <div v-else-if="question.kind === 'true_false'" class="grid gap-2.5">
              <div
                v-for="option in question.options ?? []"
                :key="option.label"
                class="flex items-center justify-between gap-3 rounded-sm border border-hairline-strong px-4 py-3"
              >
                <span class="prose-question" v-html="optionHtml(option.text)" />
                <span class="inline-flex shrink-0 overflow-hidden rounded-sm border border-line text-[0.78rem] font-bold" role="group">
                  <button
                    type="button"
                    class="px-2.5 py-1 transition-colors"
                    :class="trueFalseButtonClass(option, true)"
                    @click="pickTrueFalse(option, true)"
                  >
                    Benar
                  </button>
                  <button
                    type="button"
                    class="border-l border-line px-2.5 py-1 transition-colors"
                    :class="trueFalseButtonClass(option, false)"
                    @click="pickTrueFalse(option, false)"
                  >
                    Salah
                  </button>
                </span>
              </div>
            </div>

            <div v-else class="grid gap-2.5">
              <input
                v-model="shortAnswerInput"
                type="text"
                placeholder="Ketik jawabanmu…"
                class="w-full rounded-sm border border-hairline-strong bg-surface px-4 py-2.5 text-[0.9rem] focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)] focus:outline-none"
                @keydown.enter.prevent="checkShortAnswer"
              >
              <AppButton type="button" size="xs" class="justify-self-start" @click="checkShortAnswer">
                Cek jawaban
              </AppButton>
              <p v-if="shortAnswerChecked" class="flex items-center gap-1.5 text-[0.86rem] font-semibold" :class="shortAnswerCorrect ? 'text-success-ink' : 'text-danger-ink'">
                <AppIcon :name="shortAnswerCorrect ? 'check-circle' : 'x-circle'" :size="16" weight="fill" />
                {{ shortAnswerCorrect ? 'Benar.' : 'Kurang tepat.' }}
                Jawaban diterima: {{ (question.answers ?? []).join(', ') || 'Belum diatur' }}
              </p>
            </div>

            <!-- Hasil + Pembahasan: cuma untuk QC tutor sendiri di sini — siswa
                 sungguhan baru melihat ini setelah ujian selesai, bukan saat
                 mengerjakan. -->
            <div v-if="showResult" class="rounded-md border border-hairline bg-surface-alt p-4">
              <p class="mb-1.5 flex items-center gap-1.5 text-[0.78rem] font-bold tracking-wide text-faint uppercase">
                <AppIcon name="eye" :size="13" />
                Pembahasan (Khusus Pratinjau Tutor)
              </p>
              <div v-if="stripHtmlToText(question.explanation)" class="prose-question text-[0.9rem]" v-html="explanationHtml" />
              <p v-else class="text-[0.86rem] text-muted">Belum ada pembahasan untuk soal ini.</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
