<script setup lang="ts">
import type { TutorPassage, TutorSection } from '#shared/types/tutor-product'
import { MAX_QUESTIONS_PER_PASSAGE } from '#shared/types/tutor-product'

/**
 * Panel wacana (grup stimulus) satu subtes — fitur TKA dari rework kategori
 * SKD/TKA (spec §6.2 poin grup wacana): tutor menulis teks bacaan sekali,
 * lalu menautkan soal-soal ke wacana itu lewat pemilih di editor soal
 * (TutorQuestionForm). Maksimal 5 soal per wacana; runtime menampilkan
 * teksnya di panel bacaan tetap selama siswa mengerjakan nomor segrup.
 *
 * Semua tulis langsung ke endpoint-nya (POST/PATCH/DELETE .../passages),
 * lalu `refresh` meminta wizard memuat ulang detail — pola yang sama dengan
 * soal di TutorSectionEditor.
 */
const props = defineProps<{
  productId: string
  section: TutorSection
  workspace?: ProductWorkspace
}>()

const emit = defineEmits<{ refresh: [] }>()
const { confirm } = useConfirm()

const passages = computed<TutorPassage[]>(() =>
  (props.section.passages ?? []).slice().sort((a, b) => a.position - b.position),
)

/** Nomor soal (posisi di subtes) yang menautkan tiap wacana. */
const questionNumbersByPassage = computed<Record<string, number[]>>(() => {
  const map: Record<string, number[]> = {}
  for (const question of props.section.questions) {
    if (!question.passageId) continue
    ;(map[question.passageId] ??= []).push(question.position)
  }
  for (const ids of Object.values(map)) ids.sort((a, b) => a - b)
  return map
})

/** '' = tertutup; 'new' = tambah wacana; selain itu id wacana yang diedit. */
const editorFor = ref('')
const title = ref('')
const content = ref('')
const saving = ref(false)
const errorMessage = ref('')

function openNew() {
  editorFor.value = 'new'
  title.value = ''
  content.value = ''
  errorMessage.value = ''
}

function openEdit(passage: TutorPassage) {
  editorFor.value = passage.id
  title.value = passage.title
  content.value = passage.content
  errorMessage.value = ''
}

function closeEditor() {
  editorFor.value = ''
  errorMessage.value = ''
}

async function save() {
  if (!stripHtmlToText(content.value)) {
    errorMessage.value = 'Isi wacananya dulu — teks bacaan tidak boleh kosong.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    const draft = { title: title.value.trim(), content: content.value }
    if (editorFor.value === 'new') {
      await createTutorPassage(props.productId, props.section.id, draft, props.workspace)
    }
    else {
      await updateTutorPassage(props.productId, props.section.id, editorFor.value, draft, props.workspace)
    }
    closeEditor()
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal menyimpan wacana. Coba lagi.')
  }
  finally {
    saving.value = false
  }
}

async function remove(passage: TutorPassage) {
  const linked = questionNumbersByPassage.value[passage.id]?.length ?? 0
  const detail = linked > 0
    ? ` ${linked} soal yang menautkannya tetap tersimpan, hanya tautan wacananya yang dilepas.`
    : ''
  const ok = await confirm({
    title: 'Hapus wacana ini?',
    description: `Wacana akan dihapus permanen.${detail}`,
    confirmLabel: 'Hapus wacana',
  })
  if (!ok) return

  errorMessage.value = ''
  try {
    await deleteTutorPassage(props.productId, props.section.id, passage.id, props.workspace)
    if (editorFor.value === passage.id) closeEditor()
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal menghapus wacana. Coba lagi.')
  }
}

function passageName(passage: TutorPassage, index: number): string {
  return passage.title.trim() || `Wacana ${index + 1}`
}
</script>

<template>
  <section class="grid gap-3 rounded-md border border-hairline bg-surface-alt p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-[0.9rem] font-semibold">Wacana subtes</h3>
        <p class="mt-0.5 text-[0.8rem] text-muted">
          Teks bacaan/stimulus bersama untuk beberapa soal — tulis sekali, tautkan maksimal
          {{ MAX_QUESTIONS_PER_PASSAGE }} soal per wacana lewat kolom "Wacana subtes" di editor soal.
        </p>
      </div>
      <AppButton v-if="editorFor === ''" type="button" variant="outline" size="xs" @click="openNew">
        <AppIcon name="plus" :size="13" />
        {{ passages.length ? 'Tambah wacana berikutnya' : 'Tambah wacana' }}
      </AppButton>
    </div>

    <AppSectionMessage v-if="errorMessage" appearance="warning">{{ errorMessage }}</AppSectionMessage>

    <ul v-if="passages.length" class="grid gap-2">
      <li
        v-for="(passage, index) in passages"
        :key="passage.id"
        class="rounded-sm border border-hairline bg-surface px-3.5 py-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h4 class="min-w-0 flex-1 text-[0.88rem] font-semibold leading-5">{{ passageName(passage, index) }}</h4>
          <span class="flex shrink-0 items-center gap-1 text-[0.82rem]">
            <button type="button" class="min-h-11 rounded-xs px-2 font-semibold text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft" @click="openEdit(passage)">
              Edit
            </button>
            <button type="button" class="min-h-11 rounded-xs px-2 font-semibold text-danger hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-soft" @click="remove(passage)">
              Hapus
            </button>
          </span>
        </div>
        <p class="mt-1 line-clamp-3 text-[0.82rem] leading-5 text-muted">{{ stripHtmlToText(passage.content) }}</p>
        <p class="mt-1.5 text-[0.78rem] font-semibold" :class="questionNumbersByPassage[passage.id]?.length ? 'text-muted' : 'text-warning-ink'">
          {{ questionNumbersByPassage[passage.id]?.length
            ? `Soal nomor ${questionNumbersByPassage[passage.id]!.join(', ')} (${questionNumbersByPassage[passage.id]!.length}/${MAX_QUESTIONS_PER_PASSAGE})`
            : 'Belum ditautkan ke soal mana pun — tautkan lewat editor soal sebelum mengajukan.' }}
        </p>
      </li>
    </ul>
    <p v-else-if="editorFor === ''" class="text-[0.84rem] text-muted">
      Belum ada wacana di subtes ini. Wacana opsional — pakai saat beberapa soal berbagi satu teks bacaan.
    </p>

    <form v-if="editorFor !== ''" class="grid gap-3 rounded-sm border border-hairline-strong bg-surface p-4" @submit.prevent="save">
      <h4 class="text-[0.88rem] font-bold">{{ editorFor === 'new' ? 'Tambah wacana' : 'Ubah wacana' }}</h4>
      <FormField
        id="passage-title"
        v-model="title"
        label="Judul (opsional)"
        placeholder="Contoh: Bacaan 1 — Ekosistem Mangrove"
      />
      <div>
        <span :class="FIELD_LABEL_CLASS">Isi wacana</span>
        <RichTextEditor
          v-model="content"
          aria-label="Isi wacana"
          placeholder="Teks bacaan, tabel data, atau stimulus lain yang dibaca bersama oleh soal-soal segrup."
        />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <AppButton type="submit" size="sm" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan wacana' }}
        </AppButton>
        <button
          type="button"
          class="text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink"
          @click="closeEditor"
        >
          Batal
        </button>
      </div>
    </form>
  </section>
</template>
