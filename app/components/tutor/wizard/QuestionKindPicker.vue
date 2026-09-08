<script setup lang="ts">
import type { QuestionKind } from '#shared/types/tutor-product'

/**
 * "Tipe soal" — chosen in a dialog rather than from a dropdown above the form.
 *
 * The type decides which fields the editor shows, so answering it inline meant
 * the page rearranged itself directly under the control you had just used, and
 * each type's explanation had to be squeezed into an option label. In a dialog
 * every type gets a sentence describing what it is, and the form is already the
 * right shape by the time it is visible again.
 */
const props = defineProps<{
  modelValue: QuestionKind
  /** Types this subtes accepts, in offer order. */
  options: QuestionKind[]
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [kind: QuestionKind] }>()

/** Every kind the editor can build, with what a tutor needs to tell them apart. */
const KIND_DETAILS: Record<QuestionKind, { label: string, description: string }> = {
  single_choice: {
    label: 'Pilihan ganda',
    description: 'Beberapa opsi, tepat satu kunci jawaban benar.',
  },
  multiple_choice: {
    label: 'Pilihan ganda kompleks',
    description: 'Beberapa opsi dengan lebih dari satu kunci; siswa memilih semua yang benar.',
  },
  weighted: {
    label: 'Berbobot',
    description: 'Setiap opsi bernilai dan tidak ada yang salah — bentuk soal sikap seperti TKP dan AKHLAK.',
  },
  true_false: {
    label: 'Benar atau salah',
    description: 'Daftar pernyataan, masing-masing dikunci benar atau salah.',
  },
  short_answer: {
    label: 'Isian singkat',
    description: 'Siswa mengetik jawabannya; kamu menuliskan daftar jawaban yang diterima.',
  },
  assertion_reason: {
    label: 'Sebab-akibat',
    description: 'Pernyataan dan alasan, dijawab lewat lima kemungkinan hubungan keduanya.',
  },
  associative_choice: {
    label: 'Asosiatif',
    description: 'Empat pernyataan bernomor, dijawab lewat kombinasi mana saja yang benar.',
  },
  matching: {
    label: 'Menjodohkan',
    description: 'Tiap item di kiri dipasangkan dengan satu item di kanan.',
  },
  ordering: {
    label: 'Mengurutkan',
    description: 'Siswa menyusun item yang kamu tulis ke urutan yang benar.',
  },
}

const open = ref(false)
const draft = ref<QuestionKind>(props.modelValue)

const choices = computed(() => props.options.map(kind => ({ value: kind, ...KIND_DETAILS[kind] })))
const currentLabel = computed(() => KIND_DETAILS[props.modelValue].label)
const currentDescription = computed(() => KIND_DETAILS[props.modelValue].description)

function start() {
  draft.value = props.modelValue
  open.value = true
}

function apply() {
  emit('update:modelValue', draft.value)
  open.value = false
}
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-md border border-hairline bg-surface-alt px-4 py-3">
    <div class="min-w-0">
      <p class="text-[0.72rem] font-bold tracking-[0.1em] text-faint uppercase">Tipe soal</p>
      <p class="mt-0.5 text-[0.95rem] font-semibold text-ink">{{ currentLabel }}</p>
      <p class="mt-0.5 text-[0.82rem] leading-[1.55] text-muted">{{ currentDescription }}</p>
    </div>
    <AppButton v-if="!disabled" variant="outline" size="sm" class="shrink-0" @click="start">
      Ubah
    </AppButton>
  </div>

  <AppModal v-model="open" title="Tipe soal" description="Menentukan bentuk isian di bawahnya.">
    <div class="grid max-h-[min(24rem,55vh)] gap-2 overflow-y-auto" role="radiogroup" aria-label="Tipe soal">
      <button
        v-for="choice in choices"
        :key="choice.value"
        type="button"
        role="radio"
        :aria-checked="draft === choice.value"
        class="flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        :class="draft === choice.value
          ? 'border-primary bg-primary-soft'
          : 'border-hairline bg-surface hover:border-line hover:bg-surface-alt'"
        @click="draft = choice.value"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-[0.92rem] font-semibold text-ink">{{ choice.label }}</span>
          <span class="mt-1 block text-[0.82rem] leading-[1.55] text-muted">{{ choice.description }}</span>
        </span>
        <AppIcon
          v-if="draft === choice.value"
          name="check-circle"
          :size="20"
          class="mt-0.5 shrink-0 text-primary"
          aria-hidden="true"
        />
      </button>
    </div>

    <template #footer>
      <AppButton variant="ghost" size="sm" @click="open = false">Batal</AppButton>
      <AppButton size="sm" @click="apply">Gunakan tipe ini</AppButton>
    </template>
  </AppModal>
</template>
