<script setup lang="ts">
import type { TutorSection } from '#shared/types/tutor-product'

/**
 * Tabel daftar soal untuk langkah 4 (Review & ajukan) — nomor berjalan
 * lintas seluruh produk (bukan direset per subtes), subtes (kalau produknya
 * lebih dari satu subtes), dan cuplikan teks soal. Tiap baris bisa dibuka
 * untuk pratinjau + simulasi jawaban lewat TutorQuestionPreviewModal.vue,
 * lengkap dengan navigasi geser/panah ke soal lain tanpa menutup modalnya.
 *
 * Sengaja tanpa aksi hapus, beda dari referensi tampilan yang menginspirasi
 * tabel ini: penghapusan soal sudah punya rumahnya di langkah Isi
 * (TutorSectionEditor.vue's removeQuestion) lengkap dengan konfirmasi dan
 * penomoran ulang posisi — menduplikasi aksi itu di sini berisiko tidak
 * sinkron dengan logic tersebut. Ini review + pratinjau, bukan editor kedua.
 */
const props = defineProps<{
  sections: TutorSection[]
}>()

interface QuestionRow {
  no: number
  sectionTitle: string
  prompt: string
}

const previewOpen = ref(false)
const previewIndex = ref(0)

/**
 * Takes the row number directly (not the whole row) — AppTable's cell slots
 * hand back `item` as `Record<string, any>` (it isn't a generic component),
 * so pulling just the one field we need out of it avoids re-asserting the
 * whole row's shape with an `as`.
 */
function openPreview(no: number) {
  previewIndex.value = no - 1
  previewOpen.value = true
}

const orderedSections = computed(() =>
  props.sections.slice().sort((a, b) => a.position - b.position),
)

/** Satu subtes tidak perlu kolom Subtes berulang di tiap baris. */
const showSubtesColumn = computed(() => props.sections.length > 1)

const rows = computed<QuestionRow[]>(() => {
  const list: QuestionRow[] = []
  let no = 0
  for (const section of orderedSections.value) {
    const questions = section.questions.slice().sort((a, b) => a.position - b.position)
    for (const question of questions) {
      no += 1
      list.push({
        no,
        sectionTitle: section.title,
        prompt: stripHtmlToText(question.prompt) || '(soal kosong)',
      })
    }
  }
  return list
})

const columns = computed(() => [
  { key: 'no', label: '#' },
  ...(showSubtesColumn.value ? [{ key: 'sectionTitle', label: 'Subtes' }] : []),
  { key: 'prompt', label: 'Soal' },
])
</script>

<template>
  <div>
    <p v-if="rows.length === 0" class="flex flex-col items-center gap-2 py-8 text-center text-muted">
      <AppIcon name="list-bullets" :size="22" class="text-faint" />
      Belum ada soal di produk ini.
    </p>

    <AppTable v-else :columns="columns" :data="rows">
      <template #cell(sectionTitle)="{ value }">
        <DashboardBadge tone="neutral">{{ value }}</DashboardBadge>
      </template>
      <template #cell(prompt)="{ item, value }">
        <button
          type="button"
          class="flex max-w-120 items-center gap-2 text-left transition-colors hover:text-primary"
          @click="openPreview(Number(item.no))"
        >
          <span class="truncate" :title="value">{{ value }}</span>
          <AppIcon name="eye" :size="14" class="shrink-0 text-faint" />
        </button>
      </template>
    </AppTable>

    <TutorQuestionPreviewModal v-model:open="previewOpen" :sections="sections" :start-index="previewIndex" />
  </div>
</template>
