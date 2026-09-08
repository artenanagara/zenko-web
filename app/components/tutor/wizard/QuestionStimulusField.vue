<script setup lang="ts">
/**
 * "Wacana soal" — the reading text a single question stands on.
 *
 * Optional, and most questions have none, so it must not cost a rich text
 * editor's worth of vertical space on every question. It used to be a link
 * that unfolded one in place, which pushed the question and its options down
 * the moment it was clicked; now the writing happens in a dialog and the form
 * keeps a one-line summary of what is there.
 *
 * Distinct from a subtes wacana (TutorPassageManager), which several questions
 * share. This one belongs to this question alone.
 */
const model = defineModel<string>({ default: '' })

const open = ref(false)
const draft = ref('')

/** Plain-text preview of stored HTML, for the summary line. */
const preview = computed(() => {
  const text = stripHtmlToText(model.value).trim()
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
})

function start() {
  draft.value = model.value
  open.value = true
}

function apply() {
  model.value = stripHtmlToText(draft.value).trim() ? draft.value : ''
  open.value = false
}

function clear() {
  model.value = ''
  open.value = false
}
</script>

<template>
  <div class="rounded-md border border-hairline px-4 py-3">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div class="min-w-0">
        <p class="text-[0.72rem] font-bold tracking-[0.1em] text-faint uppercase">Wacana soal</p>
        <p class="mt-0.5 text-[0.86rem] leading-[1.55]" :class="preview ? 'text-ink' : 'text-muted'">
          {{ preview || 'Belum ada — hanya perlu kalau soal ini berdiri di atas sebuah bacaan.' }}
        </p>
      </div>
      <AppButton variant="outline" size="sm" class="shrink-0" @click="start">
        {{ preview ? 'Ubah' : 'Tambah' }}
      </AppButton>
    </div>
  </div>

  <AppModal
    v-model="open"
    title="Wacana soal"
    description="Teks bacaan yang hanya dipakai soal ini."
  >
    <RichTextEditor
      v-model="draft"
      aria-label="Wacana soal"
      placeholder="Tulis teks bacaan, kutipan, atau studi kasus yang menjadi dasar soal ini."
    />

    <template #footer>
      <AppButton v-if="model" variant="ghost" size="sm" @click="clear">Hapus wacana</AppButton>
      <AppButton variant="ghost" size="sm" @click="open = false">Batal</AppButton>
      <AppButton size="sm" @click="apply">Simpan wacana</AppButton>
    </template>
  </AppModal>
</template>
