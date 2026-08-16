<script setup lang="ts">
import type { QuestionDraft, TutorQuestion, TutorSection } from '#shared/types/tutor-product'

/**
 * Langkah Isi untuk produk single: accordion subtes dengan progres "20/35",
 * daftar soal, editor soal, dan impor CSV per subtes.
 *
 * Question writes hit their endpoints immediately (the contract gives each
 * question its own POST/PATCH/DELETE), then `refresh` asks the wizard to
 * reload the detail so counts and lists stay server-truth.
 */
const props = defineProps<{
  productId: string
  sections: TutorSection[]
}>()

const emit = defineEmits<{ refresh: [] }>()

const openId = ref('')

/** '' = tidak ada editor terbuka; 'new' = tambah soal; selain itu id soal. */
const editorFor = ref('')
const saving = ref(false)
const errorMessage = ref('')

const orderedSections = computed(() =>
  props.sections.slice().sort((a, b) => a.position - b.position),
)

function toggleSection(id: string) {
  openId.value = openId.value === id ? '' : id
  editorFor.value = ''
  errorMessage.value = ''
}

function questionBeingEdited(section: TutorSection): TutorQuestion | null {
  if (!editorFor.value || editorFor.value === 'new') return null
  return section.questions.find(question => question.id === editorFor.value) ?? null
}

async function saveQuestion(section: TutorSection, draft: QuestionDraft) {
  saving.value = true
  errorMessage.value = ''
  try {
    if (editorFor.value && editorFor.value !== 'new') {
      await updateTutorQuestion(props.productId, section.id, editorFor.value, draft)
    }
    else {
      await createTutorQuestion(props.productId, section.id, draft)
    }
    editorFor.value = ''
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal menyimpan soal. Coba lagi.')
  }
  finally {
    saving.value = false
  }
}

async function removeQuestion(section: TutorSection, question: TutorQuestion) {
  if (!window.confirm('Hapus soal ini? Tindakan tidak bisa dibatalkan.')) return

  errorMessage.value = ''
  try {
    await deleteTutorQuestion(props.productId, section.id, question.id)
    if (editorFor.value === question.id) editorFor.value = ''
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal menghapus soal. Coba lagi.')
  }
}

function progressTone(section: TutorSection) {
  return section.questions.length >= section.questionTarget ? 'success' : 'neutral'
}
</script>

<template>
  <DashboardPanel
    title="Soal per subtes"
    description="Buka satu subtes untuk menyusun soalnya — tulis satu per satu atau impor CSV."
  >
    <p v-if="orderedSections.length === 0" class="py-6 text-center text-muted">
      Belum ada subtes. Tambahkan subtes dulu untuk mulai menyusun soal.
    </p>

    <div v-else class="grid gap-3">
      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
      >
        {{ errorMessage }}
      </p>

      <section
        v-for="section in orderedSections"
        :key="section.id"
        class="overflow-hidden rounded-md border border-hairline-strong"
      >
        <h3>
          <button
            type="button"
            class="flex w-full flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-alt"
            :aria-expanded="openId === section.id"
            @click="toggleSection(section.id)"
          >
            <span class="flex min-w-0 items-center gap-3">
              <IconChevron
                class="h-4 w-4 shrink-0 text-muted transition-transform"
                :class="openId === section.id ? 'rotate-180' : ''"
              />
              <span class="truncate font-bold tracking-[-0.02em]">{{ section.title }}</span>
            </span>
            <span class="flex shrink-0 items-center gap-3">
              <span class="text-[0.82rem] text-muted">{{ section.durationMinutes }} menit</span>
              <DashboardBadge :tone="progressTone(section)">
                {{ section.questions.length }}/{{ section.questionTarget }} soal
              </DashboardBadge>
            </span>
          </button>
        </h3>

        <div v-if="openId === section.id" class="border-t border-hairline bg-surface-alt/60 px-4 py-4">
          <!-- Daftar soal -->
          <p v-if="section.questions.length === 0 && editorFor === ''" class="py-2 text-[0.9rem] text-muted">
            Belum ada soal di subtes ini.
          </p>

          <ul v-else-if="editorFor === ''" class="grid gap-2">
            <li
              v-for="(question, index) in section.questions"
              :key="question.id"
              class="flex flex-wrap items-center gap-3 rounded-sm border border-hairline bg-surface px-3.5 py-2.5"
            >
              <span class="w-6 shrink-0 text-[0.82rem] font-bold text-faint tabular-nums">{{ index + 1 }}.</span>
              <span class="min-w-0 flex-1 truncate text-[0.9rem]">{{ stripHtmlToText(question.prompt) }}</span>
              <DashboardBadge tone="neutral">{{ QUESTION_KIND_LABEL[question.kind] }}</DashboardBadge>
              <span class="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  class="text-[0.84rem] font-semibold text-primary hover:underline"
                  @click="editorFor = question.id"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  class="text-[0.84rem] font-semibold text-red-600 hover:underline"
                  @click="removeQuestion(section, question)"
                >
                  Hapus
                </button>
              </span>
            </li>
          </ul>

          <!-- Editor -->
          <TutorQuestionForm
            v-if="editorFor !== ''"
            :key="editorFor"
            :initial="questionBeingEdited(section)"
            :default-kind="section.defaultKind"
            :saving="saving"
            class="mt-1"
            @save="draft => saveQuestion(section, draft)"
            @cancel="editorFor = ''"
          />

          <div v-else class="mt-4 flex flex-wrap items-center gap-4">
            <AppButton
              v-if="section.questions.length < section.questionTarget"
              type="button"
              size="sm"
              @click="editorFor = 'new'"
            >
              Tambah soal
            </AppButton>
            <p v-else class="text-[0.86rem] font-semibold text-success-ink">
              Target soal subtes ini terpenuhi.
            </p>
          </div>

          <!-- Impor CSV -->
          <TutorCsvImport
            v-if="editorFor === ''"
            class="mt-5"
            :product-id="productId"
            :section="section"
            @refresh="emit('refresh')"
          />
        </div>
      </section>
    </div>
  </DashboardPanel>
</template>
