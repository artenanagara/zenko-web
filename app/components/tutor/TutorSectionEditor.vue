<script setup lang="ts">
import type { ExamType, QuestionDraft, TutorQuestion, TutorSection } from '#shared/types/tutor-product'
import type { CompletionState } from '~/utils/questionCompletion'
import type { MenuItem } from '~/components/core/AppDropdownMenu.vue'

/**
 * Langkah Isi untuk produk single: dropdown subtes, grid navigasi soal
 * berwarna, editor soal, dan tab impor CSV — mengikuti
 * docs/tutor-flow-contract.md §6 dan §7.2.
 *
 * Subtes dipilih lewat AppDropdownMenu (bukan native `<select>`, bukan strip
 * chip seperti sebelumnya — lihat tutor-dashboard-v2-tasks.md Task 5 /
 * kontrak §7.2) — tiap item membawa status kelengkapan (progres + dot warna,
 * logic sama dengan grid navigasi soal via ~/utils/questionCompletion.ts)
 * supaya overview lintas-subtes yang tadinya didapat dari chip yang selalu
 * terlihat tidak hilang total. Tidak ada pratinjau tampilan siswa langsung di
 * langkah ini lagi — dianggap tidak perlu selagi masih menulis, cukup di
 * langkah Review & ajukan (belum diimplementasikan di sana).
 *
 * Question writes hit their endpoints immediately (the contract gives each
 * question its own POST/PATCH/DELETE/reorder), then `refresh` asks the wizard
 * to reload the detail so counts and lists stay server-truth.
 */
const props = defineProps<{
  productId: string
  sections: TutorSection[]
  /** The section default is used as the initial answer type for new questions. */
  isCustom?: boolean
  /** Passed straight through to the question editor's TKA format check. */
  examTypeSlug?: string
  /**
   * Jenis ujian produk ini (dari GET /exam-types), sumber aturan per kategori:
   * allowedKinds per subtes, bentuk ketat SKD, dan fitur wacana TKA. Null
   * untuk produk legacy yang jenis ujiannya sudah tidak ada di seed — mereka
   * memakai aturan longgar seperti sebelumnya, sama dengan servernya.
   */
  examType?: ExamType | null
  workspace?: ProductWorkspace
}>()

const emit = defineEmits<{ refresh: [] }>()
const { confirm } = useConfirm()

const orderedSections = computed(() =>
  props.sections.slice().sort((a, b) => a.position - b.position),
)

/** Never empty while there's at least one subtes — reassigned, never toggled shut. */
const activeSectionId = ref('')

watch(orderedSections, (sections) => {
  if (sections.length === 0) return
  if (!sections.some(section => section.id === activeSectionId.value)) {
    activeSectionId.value = sections[0]!.id
  }
}, { immediate: true })

const activeSection = computed(() =>
  orderedSections.value.find(section => section.id === activeSectionId.value) ?? null,
)

/** '' = tidak ada editor terbuka; 'new' = tambah soal; selain itu id soal. */
const editorFor = ref('')
const saving = ref(false)
const errorMessage = ref('')
type QuestionFormHandle = { getDraft: () => QuestionDraft | null }
const questionFormRef = ref<QuestionFormHandle | null>(null)

/**
 * Bumped every time a *fresh* blank form should open. `editorFor` alone can't
 * key the form (see below): it stays the literal string 'new' across several
 * consecutive "Simpan & Buat Soal Berikutnya" clicks, so `:key="editorFor"`
 * would never change and Vue would keep reusing the same TutorQuestionForm
 * instance — leaving the just-submitted question's text sitting in the
 * "next" form instead of a clean slate.
 */
const newFormNonce = ref(0)

/**
 * Impor CSV: `null` = tidak sedang mengimpor (tampilan tulis-soal biasa),
 * selain itu mode impor yang dipilih lewat modal di tombol "Impor soal".
 *
 * Dulu ini sepasang tab "Input Manual per Soal" / "Impor File CSV" di atas
 * daftar soal, dengan sepasang tab lagi di dalamnya untuk memilih per-subtes
 * atau semua-subtes — dua tingkat tab untuk satu aksi yang jarang dipakai,
 * dan keduanya memakan lebar tepat di tempat soalnya ditulis. Sekarang impor
 * adalah satu tombol di header panel, dan pilihan modenya ditanyakan sekali
 * di dalam modal.
 */
type ImportMode = 'section' | 'combined'
const importMode = ref<ImportMode | null>(null)
const importPickerOpen = ref(false)

/**
 * Produk mini_tryout selalu tepat satu subtes, jadi "semua subtes sekaligus"
 * tidak punya arti di sana — tidak ada yang perlu ditanyakan, tombolnya
 * langsung membuka impor per subtes.
 */
const canImportCombined = computed(() => orderedSections.value.length > 1)

function openImport() {
  if (!canImportCombined.value) {
    startImport('section')
    return
  }
  importPickerOpen.value = true
}

function startImport(mode: ImportMode) {
  importMode.value = mode
  importPickerOpen.value = false
  editorFor.value = ''
}

const formKey = computed(() => editorFor.value === 'new' ? `new-${newFormNonce.value}` : editorFor.value)

function selectSection(id: string) {
  if (id === activeSectionId.value) return
  activeSectionId.value = id
  editorFor.value = ''
  errorMessage.value = ''
  importMode.value = null
}

function openNewQuestion() {
  newFormNonce.value += 1
  editorFor.value = 'new'
}

function selectQuestion(id: string) {
  if (id === 'new') openNewQuestion()
  else editorFor.value = id
}

/** Return to the passage manager when a tutor needs to add a shared reading. */
function openPassageManager() {
  editorFor.value = ''
  importMode.value = null
  errorMessage.value = ''
}

/**
 * Pindah subtes aktif lewat panah prev/next di bar mode-menulis. Sengaja
 * memakai `selectSection` apa adanya (bukan membawa `editorFor` ke subtes
 * berikutnya): itu selalu menutup editor yang terbuka, sama seperti klik
 * chip subtes hari ini — tidak ada risiko baru soal draft yang hilang diam-
 * diam, dan tutor mendarat di grid pilih-soal subtes barunya.
 */
function stepSection(delta: number) {
  const index = orderedSections.value.findIndex(section => section.id === activeSectionId.value)
  const next = orderedSections.value[index + delta]
  if (!next) return
  selectSection(next.id)
}

const canStepSectionPrev = computed(() =>
  orderedSections.value.findIndex(section => section.id === activeSectionId.value) > 0,
)
const canStepSectionNext = computed(() => {
  const index = orderedSections.value.findIndex(section => section.id === activeSectionId.value)
  return index !== -1 && index < orderedSections.value.length - 1
})

function questionBeingEdited(section: TutorSection): TutorQuestion | null {
  if (!editorFor.value || editorFor.value === 'new') return null
  return section.questions.find(question => question.id === editorFor.value) ?? null
}

/* -------------------------------------------------------------------------
 * Aturan per kategori (rework SKD/TKA) — diturunkan dari template jenis
 * ujian yang judulnya sama dengan subtes aktif, cermin sectionRulesFromExamType
 * di zenko-api.
 * ---------------------------------------------------------------------- */

const activeTemplate = computed(() =>
  props.examType?.sections.find(template => template.title === activeSection.value?.title) ?? null,
)

/** Jenis soal yang diizinkan subtes aktif; null = semua jenis boleh. */
const activeAllowedKinds = computed(() => activeTemplate.value?.allowedKinds ?? null)

/** Bentuk ketat CAT BKN — berlaku untuk semua subtes produk SKD. */
const skdStrict = computed(() => props.examType?.category === 'SKD')

/** Fitur grup wacana — tersedia untuk semua mapel TKA (spec Q6). */
const passagesEnabled = computed(() => props.examType?.category === 'TKA')

const activePassages = computed(() =>
  passagesEnabled.value ? (activeSection.value?.passages ?? []) : [],
)

/**
 * Berapa soal LAIN yang sudah menautkan tiap wacana subtes aktif — soal yang
 * sedang diedit tidak dihitung, supaya menyimpan ulang soal tidak terhitung
 * sebagai anggota baru (aturan yang sama dengan assignQuestionPassage server).
 */
const activePassageUsage = computed<Record<string, number>>(() => {
  const usage: Record<string, number> = {}
  for (const question of activeSection.value?.questions ?? []) {
    if (!question.passageId || question.id === editorFor.value) continue
    usage[question.passageId] = (usage[question.passageId] ?? 0) + 1
  }
  return usage
})

async function saveQuestion(section: TutorSection, draft: QuestionDraft, andNext: boolean) {
  saving.value = true
  errorMessage.value = ''
  try {
    if (editorFor.value && editorFor.value !== 'new') {
      await updateTutorQuestion(props.productId, section.id, editorFor.value, draft, props.workspace)
    }
    else {
      await createTutorQuestion(props.productId, section.id, draft, props.workspace)
    }
    if (andNext) openNewQuestion()
    else editorFor.value = ''
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal menyimpan soal. Coba lagi.')
  }
  finally {
    saving.value = false
  }
}

/** Flush an open question editor before the wizard changes steps. */
async function saveActiveQuestion(): Promise<boolean> {
  if (!editorFor.value || !activeSection.value) return true

  const draft = questionFormRef.value?.getDraft()
  if (!draft) return false

  const editorBeforeSave = editorFor.value
  await saveQuestion(activeSection.value, draft, false)
  return editorFor.value !== editorBeforeSave
}

defineExpose({ saveActiveQuestion })

async function removeQuestion(section: TutorSection, questionId: string) {
  const question = section.questions.find(item => item.id === questionId)
  if (!question) return
  const ok = await confirm({
    title: 'Hapus soal ini?',
    description: 'Soal akan dihapus permanen dari subtes ini dan tindakan tersebut tidak dapat dibatalkan.',
    confirmLabel: 'Hapus soal',
  })
  if (!ok) return

  errorMessage.value = ''
  try {
    await deleteTutorQuestion(props.productId, section.id, question.id, props.workspace)
    if (editorFor.value === question.id) editorFor.value = ''
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal menghapus soal. Coba lagi.')
  }
}

async function reorderQuestions(section: TutorSection, questionIds: string[]) {
  errorMessage.value = ''
  try {
    await reorderTutorQuestions(props.productId, section.id, questionIds, props.workspace)
    emit('refresh')
  }
  catch (cause) {
    errorMessage.value = tutorApiMessage(cause, 'Gagal mengubah urutan soal. Coba lagi.')
  }
}

/*
 * Ringkasan lintas subtes. Pertanyaan tutor di langkah ini adalah "berapa lagi
 * sampai bisa diajukan?", dan tanpa ini ia harus membuka dropdown lalu
 * menjumlahkan angka tiap opsi sendiri.
 */
const totals = computed(() => {
  const written = orderedSections.value.reduce((sum, s) => sum + s.questions.length, 0)
  const target = orderedSections.value.reduce((sum, s) => sum + s.questionTarget, 0)
  return { written, target, percent: target === 0 ? 0 : Math.round((written / target) * 100) }
})

/**
 * Item dropdown per subtes — warna dot memakai kosakata varian yang sama
 * dengan AppBadge/AppDropdownMenu (bukan emoji), tapi state-nya tetap dari
 * ~/utils/questionCompletion.ts, sama persis dengan grid navigasi soal.
 */
const SECTION_STATE_DOT: Record<CompletionState, 'success' | 'warning' | 'danger'> = {
  complete: 'success',
  'no-explanation': 'warning',
  incomplete: 'danger',
}

const sectionMenuItems = computed<MenuItem[]>(() => orderedSections.value.map(section => ({
  id: section.id,
  label: `${section.title} (${section.questions.length}/${section.questionTarget})`,
  dot: SECTION_STATE_DOT[sectionCompletionState(section)],
})))

const DOT_BG_CLASS = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-muted',
} as const

const activeSectionDotClass = computed(() =>
  DOT_BG_CLASS[activeSection.value ? SECTION_STATE_DOT[sectionCompletionState(activeSection.value)] : 'neutral'],
)
</script>

<template>
  <DashboardPanel
    title="Soal per subtes"
    description="Pilih subtes lalu susun soalnya dengan menulis langsung atau mengimpor file CSV."
  >
    <!-- Impor adalah aksi tingkat panel, bukan mode tab yang harus dilewati
         setiap kali menulis soal — jadi tempatnya di header, di samping
         judulnya. -->
    <template #action>
      <AppButton
        v-if="orderedSections.length"
        type="button"
        variant="outline"
        size="sm"
        @click="openImport"
      >
        <AppIcon name="upload-simple" :size="15" aria-hidden="true" />
        Impor soal
      </AppButton>
    </template>

    <p v-if="orderedSections.length === 0" class="py-6 text-center text-muted">
      Belum ada subtes. Tambahkan subtes dulu untuk mulai menyusun soal.
    </p>

    <div v-else class="grid gap-4">
      <AppSectionMessage v-if="errorMessage" appearance="warning">{{ errorMessage }}</AppSectionMessage>

      <!--
        Bar subtes ringkas — selalu tampil begitu ada subtes, terlepas dari
        sedang menulis soal atau tidak. AppDropdownMenu (bukan native
        `<select>`, bukan strip chip — lihat tutor-dashboard-v2-tasks.md Task
        5 / kontrak §7.2) dipakai supaya pindah subtes tetap satu aksi, dan
        tiap item membawa status kelengkapan (progres + dot warna) supaya
        overview lintas-subtes yang tadinya didapat dari chip tidak hilang
        total.
      -->
      <div
        v-if="activeSection"
        class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-sm border border-hairline bg-surface-alt px-3 py-2"
      >
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <AppDropdownMenu :items="sectionMenuItems" label="Pilih subtes" @select="selectSection">
            <!-- Matches AppSelect's own trigger size (this IS a select, in
                 effect) — not AppButton, which reads as a CTA-sized button
                 next to it. -->
            <template #trigger="{ open, isOpen }">
              <button
                type="button"
                class="flex min-h-11 items-center gap-2 rounded-xs border border-line bg-surface px-3.5 text-xs shadow-xs transition-colors hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none sm:text-sm"
                @click="open"
              >
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="activeSectionDotClass" />
                <span class="truncate font-semibold text-ink">{{ activeSection.title }} ({{ activeSection.questions.length }}/{{ activeSection.questionTarget }})</span>
                <AppIcon name="caret-down" :size="14" class="shrink-0 text-muted transition-transform" :class="isOpen ? 'rotate-180 text-primary' : ''" />
              </button>
            </template>
          </AppDropdownMenu>

          <span class="hidden shrink-0 text-[0.82rem] font-semibold tabular-nums text-muted sm:inline">
            · {{ totals.written }}/{{ totals.target }} total ({{ totals.percent }}%)
          </span>
        </div>

        <span class="inline-flex items-center gap-0.5" role="group" aria-label="Pindah subtes">
          <AppIconButton
            variant="ghost"
            size="md"
            ariaLabel="Subtes sebelumnya"
            :disabled="!canStepSectionPrev"
            @click="stepSection(-1)"
          >
            <AppIcon name="caret-left" :size="16" />
          </AppIconButton>
          <AppIconButton
            variant="ghost"
            size="md"
            ariaLabel="Subtes berikutnya"
            :disabled="!canStepSectionNext"
            @click="stepSection(1)"
          >
            <AppIcon name="caret-right" :size="16" />
          </AppIconButton>
        </span>
      </div>

      <div v-if="activeSection" class="grid gap-4 lg:grid-cols-[1fr_16rem] lg:items-start lg:gap-5">
        <div>
          <!-- Editor. Pratinjau tampilan siswa dipindah ke langkah Review &
               ajukan — tidak perlu dobel di sini saat masih menulis. -->
          <TutorQuestionForm
            v-if="editorFor !== ''"
            ref="questionFormRef"
            :key="formKey"
            :initial="questionBeingEdited(activeSection!)"
            :default-kind="activeSection!.defaultKind"
            :is-custom="isCustom"
            :exam-type-slug="examTypeSlug"
            :allowed-kinds="activeAllowedKinds"
            :skd-strict="skdStrict"
            :passages="activePassages"
            :passage-usage="activePassageUsage"
            :saving="saving"
            :product-id="productId"
            :section-id="activeSection!.id"
            @save="draft => saveQuestion(activeSection!, draft, false)"
            @save-and-next="draft => saveQuestion(activeSection!, draft, true)"
            @open-passage-manager="openPassageManager"
            @cancel="editorFor = ''"
          />

          <template v-else>
            <!-- Grup wacana (TKA): dikelola per subtes, di atas daftar soal,
                 supaya teksnya sudah ada sebelum soal-soalnya ditautkan. -->
            <TutorPassageManager
              v-if="passagesEnabled && activeSection"
              class="mb-4"
              :product-id="productId"
              :section="activeSection"
              :workspace="workspace"
              @refresh="emit('refresh')"
            />

            <div v-if="importMode === null">
              <p v-if="activeSection!.questions.length === 0" class="py-2 text-[0.9rem] text-muted">
                Belum ada soal di subtes ini.
              </p>
              <AppButton
                v-if="activeSection!.questions.length < activeSection!.questionTarget"
                type="button"
                size="sm"
                @click="openNewQuestion"
              >
                Tambah soal
              </AppButton>
              <AppInlineMessage v-else type="confirmation">
                Target soal subtes ini sudah terpenuhi. Klik nomor soal di samping untuk mengedit, atau hapus salah satu soal untuk menambah soal baru.
              </AppInlineMessage>
            </div>

            <div v-else class="grid gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-[0.9rem] font-semibold">
                  {{ importMode === 'combined' ? 'Impor semua subtes sekaligus' : `Impor ke ${activeSection!.title}` }}
                </h3>
                <button
                  type="button"
                  class="inline-flex min-h-9 items-center gap-1.5 rounded-xs px-2 text-[0.84rem] font-semibold text-muted transition-colors hover:text-ink"
                  @click="importMode = null"
                >
                  <AppIcon name="x" :size="14" aria-hidden="true" />
                  Tutup impor
                </button>
              </div>

              <TutorCsvImport
                :product-id="productId"
                :section="activeSection!"
                :sections="orderedSections"
                :mode="importMode"
                :group-passages="passagesEnabled"
                :workspace="workspace"
                @refresh="emit('refresh')"
              />
            </div>
          </template>
        </div>

        <!--
          Grid navigasi nomor soal — di samping kanan konten (bukan di
          atasnya), selalu tampil untuk seluruh target soal, termasuk saat
          semua slot masih kosong. Nomor kosong tetap bisa dipilih untuk
          langsung membuka form soal baru.

          Menempel saat editor soal digulung: `self-start` wajib (tanpa itu
          item grid meregang setinggi kolom kiri dan `sticky` tidak pernah
          punya ruang gerak), offset `top-20` mengukur header dashboard yang
          `sticky top-0` di layar ini. Target 110 soal (simulasi SKD) lebih
          tinggi dari viewport, jadi kolomnya menggulung sendiri alih-alih
          memotong panel "Urutan soal" di bawah grid.
        -->
        <TutorQuestionGrid
          v-if="activeSection"
          class="lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1"
          :questions="activeSection!.questions"
          :question-target="activeSection!.questionTarget"
          :active-id="editorFor"
          :compact="editorFor !== ''"
          @select="selectQuestion"
          @reorder="ids => reorderQuestions(activeSection!, ids)"
          @remove="id => removeQuestion(activeSection!, id)"
        />
      </div>
    </div>

    <!-- Pemilih mode impor. Ditanyakan sekali di sini, bukan sebagai tab
         permanen di dalam panel impor: setelah dipilih, panelnya cuma perlu
         menampilkan satu bentuk saja. -->
    <AppModal
      v-model="importPickerOpen"
      title="Impor soal dari CSV"
      description="Pilih cakupan file yang akan kamu unggah."
    >
      <div class="grid gap-3">
        <button
          type="button"
          class="flex items-start gap-3 rounded-md border border-hairline-strong bg-surface px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          @click="startImport('section')"
        >
          <AppIcon name="file-csv" :size="20" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span class="block font-bold tracking-[-0.02em] text-ink">Satu subtes saja</span>
            <span class="mt-1 block text-[0.84rem] leading-[1.6] text-muted">
              Semua baris masuk ke <strong class="font-semibold text-ink">{{ activeSection?.title }}</strong>,
              subtes yang sedang kamu buka.
            </span>
          </span>
        </button>

        <button
          type="button"
          class="flex items-start gap-3 rounded-md border border-hairline-strong bg-surface px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          @click="startImport('combined')"
        >
          <AppIcon name="files" :size="20" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span class="block font-bold tracking-[-0.02em] text-ink">Semua subtes sekaligus</span>
            <span class="mt-1 block text-[0.84rem] leading-[1.6] text-muted">
              Satu file untuk {{ orderedSections.length }} subtes — kolom <code class="rounded-[4px] bg-surface-sunken px-1.5 py-0.5 text-[0.78rem]">subtes</code>
              tiap baris menentukan tujuannya.
            </span>
          </span>
        </button>
      </div>
    </AppModal>
  </DashboardPanel>
</template>
