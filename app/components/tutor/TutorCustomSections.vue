<script setup lang="ts">
import type { QuestionKind, ScoringMode, SectionInput, TutorSection } from '#shared/types/tutor-product'

/**
 * Kelola subtes untuk exam type `custom`: tambah, ubah, hapus. Disimpan lewat
 * PATCH {sections} sebagai daftar pengganti penuh, sesuai kontrak.
 */
const props = defineProps<{
  productId: string
  sections: TutorSection[]
  workspace?: ProductWorkspace
}>()

const emit = defineEmits<{ refresh: [] }>()

const { confirm } = useConfirm()

const uid = useId()

interface Row {
  id?: string
  title: string
  questionTarget: number | null
  durationMinutes: number | null
  scoringMode: ScoringMode
  pointsCorrect: number | null
  passingGrade: number | null
  defaultKind: QuestionKind
  /** Berapa soal yang sudah ada — penghapusan harus terasa berisiko. */
  questionCount: number
}

const rows = ref<Row[]>([])

/** Snapshot JSON untuk deteksi perubahan yang belum disimpan. */
const savedSnapshot = ref('')

function hydrate() {
  rows.value = props.sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(section => ({
      id: section.id,
      title: section.title,
      questionTarget: section.questionTarget,
      durationMinutes: section.durationMinutes,
      scoringMode: section.scoringMode,
      pointsCorrect: section.pointsCorrect,
      passingGrade: section.passingGrade ?? null,
      defaultKind: section.defaultKind,
      questionCount: section.questions.length,
    }))
  savedSnapshot.value = JSON.stringify(rows.value)
}

watch(() => props.sections, hydrate, { immediate: true })

const isDirty = computed(() => JSON.stringify(rows.value) !== savedSnapshot.value)

const KIND_OPTIONS: { value: QuestionKind, label: string }[] = [
  { value: 'single_choice', label: 'Pilihan ganda' },
  { value: 'multiple_choice', label: 'Pilihan ganda kompleks' },
  { value: 'weighted', label: 'Berbobot (TKP)' },
  { value: 'true_false', label: 'Benar/Salah' },
  { value: 'short_answer', label: 'Isian singkat' },
  { value: 'assertion_reason', label: 'Sebab-akibat' },
  { value: 'associative_choice', label: 'Asosiatif' },
  { value: 'matching', label: 'Menjodohkan' },
  { value: 'ordering', label: 'Mengurutkan' },
]

const SCORING_MODE_OPTIONS: { value: ScoringMode, label: string }[] = [
  { value: 'flat', label: 'Flat (benar = poin tetap)' },
  { value: 'weighted', label: 'Berbobot (per opsi)' },
]

function addRow() {
  rows.value.push({
    title: '',
    questionTarget: 10,
    durationMinutes: 15,
    scoringMode: 'flat',
    pointsCorrect: 1,
    passingGrade: null,
    defaultKind: 'single_choice',
    questionCount: 0,
  })
}

// AppSelect works in plain string|number; narrow its `update:modelValue`
// back onto the row's typed field instead of casting.
function isScoringMode(value: string | number): value is ScoringMode {
  return value === 'flat' || value === 'weighted'
}
function isQuestionKind(value: string | number): value is QuestionKind {
  return KIND_OPTIONS.some(option => option.value === value)
}

async function removeRow(index: number) {
  const row = rows.value[index]
  if (!row) return
  if (row.questionCount > 0) {
    const ok = await confirm({
      title: `Hapus subtes "${row.title}"?`,
      description: `Subtes ini berisi ${row.questionCount} soal yang ikut terhapus.`,
      confirmLabel: 'Hapus',
    })
    if (!ok) return
  }
  rows.value.splice(index, 1)
}

const saving = ref(false)
const toast = useToast()

async function save() {
  const payload: SectionInput[] = []
  for (const [index, row] of rows.value.entries()) {
    // Which row is at fault matters here — the list can be long, and "Tiap
    // subtes butuh judul." says nothing about which subtes. The toast names
    // the row, focusField() scrolls to the field itself.
    if (!row.title.trim()) {
      focusField(`${uid}-title-${index}`)
      toast.error('Judul subtes belum diisi.', `Subtes ke-${index + 1} belum punya judul.`)
      return
    }
    if (!row.questionTarget || row.questionTarget < 1 || !row.durationMinutes || row.durationMinutes < 1) {
      focusField(`${uid}-target-${index}`)
      toast.error(
        'Target soal atau durasi belum benar.',
        `Subtes ke-${index + 1}: target soal dan durasi minimal 1.`,
      )
      return
    }
    payload.push({
      id: row.id,
      title: row.title.trim(),
      questionTarget: row.questionTarget,
      durationMinutes: row.durationMinutes,
      scoringMode: row.scoringMode,
      pointsCorrect: row.pointsCorrect ?? 1,
      passingGrade: row.passingGrade ?? undefined,
      defaultKind: row.defaultKind,
    })
  }

  saving.value = true
  try {
    await updateTutorProduct(props.productId, { sections: payload }, props.workspace)
    emit('refresh')
    toast.success('Subtes tersimpan.')
  }
  catch (cause) {
    toast.error('Subtes belum berhasil disimpan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <DashboardPanel
    title="Subtes"
    description="Tipe ujian kustom: susun subtes tryout ini sebelum mengisi soalnya."
  >
    <div class="grid gap-4">
      <p v-if="rows.length === 0" class="text-[0.9rem] text-muted">
        Belum ada subtes. Tambahkan minimal satu untuk mulai menyusun soal.
      </p>

      <div
        v-for="(row, index) in rows"
        :key="row.id ?? `new-${index}`"
        class="grid scroll-mt-24 gap-3 rounded-md border border-hairline-strong bg-surface p-4"
      >
        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-48 flex-1">
            <label :for="`${uid}-title-${index}`" :class="FIELD_LABEL_CLASS">Judul subtes</label>
            <input
              :id="`${uid}-title-${index}`"
              v-model="row.title"
              type="text"
              placeholder="Contoh: Penalaran Umum"
              :class="FIELD_CLASS"
            >
          </div>
          <button
            type="button"
            class="mb-3 shrink-0 text-[0.86rem] font-semibold text-danger hover:underline"
            @click="removeRow(index)"
          >
            Hapus subtes
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label :for="`${uid}-target-${index}`" :class="FIELD_LABEL_CLASS">Target soal</label>
            <input
              :id="`${uid}-target-${index}`"
              v-model.number="row.questionTarget"
              type="number"
              min="1"
              :class="FIELD_CLASS"
            >
          </div>
          <div>
            <label :for="`${uid}-duration-${index}`" :class="FIELD_LABEL_CLASS">Durasi (menit)</label>
            <input
              :id="`${uid}-duration-${index}`"
              v-model.number="row.durationMinutes"
              type="number"
              min="1"
              :class="FIELD_CLASS"
            >
          </div>
          <AppSelect
            :options="SCORING_MODE_OPTIONS"
            :model-value="row.scoringMode"
            label="Penilaian"
            size="sm"
            @update:model-value="(value) => { if (isScoringMode(value)) row.scoringMode = value }"
          />
          <div>
            <label :for="`${uid}-points-${index}`" :class="FIELD_LABEL_CLASS">Poin benar</label>
            <input
              :id="`${uid}-points-${index}`"
              v-model.number="row.pointsCorrect"
              type="number"
              min="1"
              :disabled="row.scoringMode === 'weighted'"
              :class="[FIELD_CLASS, row.scoringMode === 'weighted' && 'bg-surface-sunken text-muted']"
            >
          </div>
          <div>
            <label :for="`${uid}-passing-${index}`" :class="FIELD_LABEL_CLASS">Ambang lulus</label>
            <input
              :id="`${uid}-passing-${index}`"
              v-model.number="row.passingGrade"
              type="number"
              min="0"
              placeholder="Opsional"
              :class="FIELD_CLASS"
            >
          </div>
        </div>

        <div class="max-w-72">
          <AppSelect
            :options="KIND_OPTIONS"
            :model-value="row.defaultKind"
            label="Tipe soal bawaan"
            size="sm"
            @update:model-value="(value) => { if (isQuestionKind(value)) row.defaultKind = value }"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="text-[0.9rem] font-semibold text-primary hover:underline"
          @click="addRow"
        >
          + Tambah subtes
        </button>
        <AppButton v-if="isDirty" type="button" size="sm" :disabled="saving" @click="save">
          {{ saving ? 'Menyimpan...' : 'Simpan subtes' }}
        </AppButton>
      </div>
    </div>
  </DashboardPanel>
</template>
