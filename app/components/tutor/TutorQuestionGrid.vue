<script setup lang="ts">
import type { TutorQuestion } from '#shared/types/tutor-product'

/**
 * Grid navigasi nomor soal `1..N` (kontrak §6): kotak berwarna sesuai
 * kelengkapan, klik untuk membuka soal itu di editor, geser (drag) atau
 * tombol pindah untuk mengubah urutan. Kotak hanya dibuat untuk soal yang
 * sudah ada, ditambah SATU kotak putus-putus "+ tambah" di akhir kalau
 * target belum terpenuhi — bukan satu kotak kosong per slot sisa, supaya
 * grid tidak membengkak untuk target besar (sampai 30+ soal/subtes). Sisa
 * target ditampilkan sebagai teks di header grid.
 *
 * Kotak sengaja tidak lagi mencetak nomor urutnya (Task 5 /
 * tutor-flow-contract.md §7.2) — warna tetap satu-satunya isyarat status,
 * urutan literal cuma perlu tersirat lewat posisi di grid + judul (title
 * attribute) dan label "Urutan soal N" di bawahnya.
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
}>()

/** Jumlah soal + satu kotak "+ tambah" kalau target belum terpenuhi. */
const slotCount = computed(() =>
  props.questions.length < props.questionTarget ? props.questions.length + 1 : props.questions.length,
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

/** Alias lokal — logic aslinya di ~/utils/questionCompletion.ts, dipakai
 * bersama oleh dropdown subtes di TutorSectionEditor.vue supaya warnanya
 * konsisten dan ambangnya tidak pernah didefinisikan dua kali. */
const completionState = questionCompletionState
const STATE_CLASS = COMPLETION_STATE_CLASS
const STATE_TITLE = COMPLETION_STATE_TITLE
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-2">
      <span class="text-[0.82rem] font-semibold tabular-nums text-muted">
        {{ questions.length }}/{{ questionTarget }} soal
      </span>

      <!-- Keterangan warna kotak: disclosure sesuai permintaan, bukan teks
           permanen — tutor sudah tahu artinya setelah soal pertama, jadi ini
           tidak perlu menetap di layar tiap saat. Tidak tampil sama sekali
           dalam mode menulis (compact), karena ruang di sana diprioritaskan
           untuk editor. -->
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
            <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-amber-100" aria-hidden="true" /> Belum ada pembahasan</span>
            <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-red-100" aria-hidden="true" /> Belum lengkap</span>
            <span class="text-faint">Geser kotak untuk mengubah urutan.</span>
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
          class="flex aspect-square items-center justify-center rounded-sm transition-[transform,box-shadow] duration-150 ease-smooth hover:-translate-y-0.5"
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
        />
        <button
          v-else
          type="button"
          class="flex aspect-square items-center justify-center rounded-sm border-2 border-dashed border-hairline-strong text-faint transition-colors hover:border-primary hover:text-primary"
          :title="`Tambah soal ${index}`"
          :aria-label="`Tambah soal ${index}`"
          @click="emit('select', 'new')"
        >
          <AppIcon name="plus" :size="compact ? 14 : 16" />
        </button>
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
    </div>
  </div>
</template>
