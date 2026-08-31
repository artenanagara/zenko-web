<script setup lang="ts">
import type { TutorQuestion } from '#shared/types/tutor-product'
import type { CompletionState } from '~/utils/questionCompletion'

/**
 * Grid navigasi nomor soal `1..N`: semua slot target selalu terlihat dan
 * menampilkan nomor soal. Slot kosong dibuka dengan klik untuk membuat soal
 * berikutnya; soal yang ada tetap bisa dipilih, digeser, atau dipindahkan.
 * Warna memakai tiga status yang mudah dipindai: hijau = lengkap, kuning =
 * sudah ada tetapi masih kurang, putih = belum diisi.
 */
const props = defineProps<{
  questions: TutorQuestion[]
  questionTarget: number
  /** '' = tidak ada yang aktif; 'new' = form tambah soal terbuka. */
  activeId: string
  /** Editor soal sedang terbuka — kotak & chrome menyusut untuk memberi ruang ke editor. */
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  reorder: [questionIds: string[]]
  remove: [id: string]
}>()

/** Tampilkan semua nomor target; jangan sembunyikan soal ekstra dari server. */
const slotCount = computed(() =>
  Math.max(props.questions.length, props.questionTarget),
)

const legendOpen = ref(false)

const activeIndex = computed(() => props.questions.findIndex(q => q.id === props.activeId))

const draggingIndex = ref<number | null>(null)

function onDragStart(index: number) {
  draggingIndex.value = index
}

function onDrop(index: number) {
  const from = draggingIndex.value
  draggingIndex.value = null
  if (from === null || from === index) return
  moveQuestion(from, index)
}

function moveQuestion(from: number, to: number) {
  const ids = props.questions.map(q => q.id)
  const moved = ids.splice(from, 1)[0]!
  ids.splice(to, 0, moved)
  emit('reorder', ids)
}

function moveBy(index: number, delta: number) {
  const to = index + delta
  if (to < 0 || to >= props.questions.length) return
  moveQuestion(index, to)
}

/** State tetap berasal dari satu sumber; grid hanya memilih warna visualnya. */
const completionState = questionCompletionState
const STATE_CLASS: Record<CompletionState, string> = {
  complete: 'bg-success-soft text-success-ink',
  'no-explanation': 'border border-warning/40 bg-amber-100 text-amber-800',
  incomplete: 'border border-warning/40 bg-amber-100 text-amber-800',
}
const STATE_TITLE = COMPLETION_STATE_TITLE
const EMPTY_SLOT_CLASS = 'border border-line bg-surface text-faint'
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-2">
      <span class="text-[0.82rem] font-semibold tabular-nums text-muted">
        {{ questions.length }}/{{ questionTarget }} soal
      </span>

      <!-- Keterangan warna tetap bisa dibuka tanpa memenuhi ruang editor. -->
      <RteDropdown v-if="!compact" v-model="legendOpen" title="Keterangan kotak" :width="230">
        <template #trigger>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-pill text-faint transition-colors hover:bg-surface-alt hover:text-ink"
            title="Keterangan warna kotak"
            aria-label="Keterangan warna kotak"
            @click="legendOpen = !legendOpen"
          >
            <AppIcon name="question" :size="16" />
          </button>
        </template>
        <template #panel>
          <div class="grid gap-1.5 text-[0.82rem] text-muted">
            <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-success-soft" aria-hidden="true" /> Lengkap</span>
            <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-amber-100" aria-hidden="true" /> Masih ada yang kurang</span>
            <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full border border-line bg-surface" aria-hidden="true" /> Belum diisi</span>
            <span class="text-faint">Geser nomor yang sudah diisi untuk mengubah urutan.</span>
          </div>
        </template>
      </RteDropdown>
    </div>

    <div
      class="grid gap-2"
      :class="compact ? 'grid-cols-[repeat(auto-fill,minmax(2.1rem,1fr))] gap-1.5' : 'grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))]'"
    >
      <template v-for="index in slotCount" :key="index">
        <button
          v-if="index - 1 < questions.length"
          type="button"
          draggable="true"
          class="flex aspect-square items-center justify-center rounded-sm text-[0.82rem] font-bold tabular-nums transition-[transform,box-shadow] duration-150 ease-smooth hover:-translate-y-0.5"
          :class="[
            STATE_CLASS[completionState(questions[index - 1]!)],
            activeId === questions[index - 1]!.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : '',
          ]"
          :title="`Soal ${index}: ${STATE_TITLE[completionState(questions[index - 1]!)]}`"
          :aria-label="`Soal ${index}: ${STATE_TITLE[completionState(questions[index - 1]!)]}`"
          @click="emit('select', questions[index - 1]!.id)"
          @dragstart="onDragStart(index - 1)"
          @dragover.prevent
          @drop="onDrop(index - 1)"
        >
          {{ index }}
        </button>
        <button
          v-else
          type="button"
          class="flex aspect-square items-center justify-center rounded-sm text-[0.82rem] font-bold tabular-nums transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
          :class="EMPTY_SLOT_CLASS"
          :title="`Tambah soal ${index}`"
          :aria-label="`Tambah soal ${index}`"
          @click="emit('select', 'new')"
        >{{ index }}</button>
      </template>
    </div>

    <div v-if="activeIndex !== -1 && questions.length > 1" class="mt-2 flex items-center gap-3 text-[0.82rem]">
      <span class="font-semibold text-muted">Urutan soal {{ activeIndex + 1 }}:</span>
      <button
        type="button"
        class="inline-flex items-center gap-1 font-semibold text-primary disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
        :disabled="activeIndex === 0"
        @click="moveBy(activeIndex, -1)"
      >
        <AppIcon name="arrow-left" :size="14" />
        Pindah ke depan
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 font-semibold text-primary disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
        :disabled="activeIndex === questions.length - 1"
        @click="moveBy(activeIndex, 1)"
      >
        Pindah ke belakang
        <AppIcon name="arrow-right" :size="14" />
      </button>
      <button
        type="button"
        class="ml-auto inline-flex items-center gap-1 font-semibold text-danger hover:underline"
        @click="emit('remove', questions[activeIndex]!.id)"
      >
        <AppIcon name="trash" :size="14" />
        Hapus soal
      </button>
    </div>
  </div>
</template>
