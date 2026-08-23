<script setup lang="ts">
import type {
  ProductMode,
  ProductType,
  TutorProductDetail,
  UpdateProductRequest,
} from '#shared/types/tutor-product'

/**
 * Wizard 4 langkah untuk membuat dan mengedit produk tutor.
 *
 * Create mode (no productId) only walks steps 1–2: the API needs a title to
 * create a draft, so the POST happens when leaving step 2, then the page moves
 * to the edit URL — from there refreshes land back on the same draft.
 *
 * Edit mode autosaves a PATCH of whatever changed on every step change
 * ("Tersimpan" indicator), and questions/subtes/bundle items are saved through
 * their own endpoints inside step 3.
 */
const props = defineProps<{ productId?: string }>()

const isEdit = computed(() => Boolean(props.productId))

/**
 * Same cookie key the dashboard layout keys its rail width off (see
 * app/layouts/dashboard.vue) — `useCookie` shares reactive state by key, so
 * reading it here (rather than threading a prop through the layout) is
 * enough to keep the fixed step footer's left edge in sync with the rail
 * without coupling this component to the layout.
 */
const sidebarCollapsed = useCookie<boolean>('zenko-sidebar-collapsed', { default: () => false })

/* ------------------------------------------------------------------ data */

const { data: examTypes, pending: examTypesPending, error: examTypesError } = useExamTypes()

const {
  data: detail,
  pending: detailPending,
  error: detailError,
  refresh: refreshDetail,
} = useTutorProductDetail(props.productId ?? '')

onMounted(() => {
  if (props.productId) refreshDetail()
})

/** Own products, fetched lazily — only a bundle's step 3 and 4 need them. */
const own = useTutorProducts()
const ownRequested = ref(false)

/* ------------------------------------------------------------------ form */

const form = reactive({
  type: 'single' as ProductType,
  examTypeSlug: '',
  mode: 'simulasi' as ProductMode,
  sectionTitle: '',
  title: '',
  description: '',
  thumbnailUrl: '',
  category: '',
  price: null as number | null,
  priceOriginal: null as number | null,
  shuffleQuestions: false,
})

/** Bundle membership, in display order. */
const selectedItems = ref<string[]>([])

const isSingle = computed(() => form.type === 'single')
const isCustom = computed(() => isSingle.value && form.examTypeSlug === 'custom')

const selectedExamType = computed(() =>
  examTypes.value.find(exam => exam.slug === form.examTypeSlug) ?? null,
)

/** Kategori mengikuti jenis ujian untuk single non-custom. */
const categoryLocked = computed(() =>
  isSingle.value && Boolean(form.examTypeSlug) && form.examTypeSlug !== 'custom',
)

watch(() => form.examTypeSlug, (slug) => {
  if (!isSingle.value || !slug || slug === 'custom') return
  const exam = examTypes.value.find(entry => entry.slug === slug)
  if (exam) form.category = exam.label
})

// A stale subtest choice from a previous exam type (or from switching back to
// Simulasi) must never leak into a later mini-tryout submission.
watch([() => form.examTypeSlug, () => form.mode], () => {
  form.sectionTitle = ''
})

const PRODUCT_TYPE_OPTIONS: { value: ProductType, label: string }[] = [
  { value: 'single', label: 'Try-out tunggal' },
  { value: 'bundle', label: 'Bundling' },
]

const examTypeOptions = computed(() =>
  examTypes.value.map(exam => ({ value: exam.slug, label: exam.label })),
)

// Iterated as a fixed literal list (not Object.entries(PRODUCT_MODE_LABEL)):
// Object.entries always widens keys back to `string`, which would need an
// `as ProductMode` to recover — this keeps the option values honestly typed.
const PRODUCT_MODE_VALUES: ProductMode[] = ['simulasi', 'mini_tryout']
const productModeOptions = computed<{ value: ProductMode, label: string }[]>(() =>
  PRODUCT_MODE_VALUES.map(value => ({ value, label: PRODUCT_MODE_LABEL[value] })),
)

const sectionTitleOptions = computed(() =>
  (selectedExamType.value?.sections ?? []).map(section => ({
    value: section.title,
    label: `${section.title} — ${section.questionTarget} soal · ${section.durationMinutes} mnt`,
  })),
)

// AppSelect works in plain string|number; narrow its `update:modelValue`
// back onto these typed fields instead of casting.
function isProductType(value: string | number): value is ProductType {
  return value === 'single' || value === 'bundle'
}
function isProductMode(value: string | number): value is ProductMode {
  return value === 'simulasi' || value === 'mini_tryout'
}

watch(() => form.type, (type) => {
  if (type === 'bundle' && !ownRequested.value && import.meta.client) {
    ownRequested.value = true
    own.refresh()
  }
}, { immediate: true })

/* ------------------------------------------------- hydration (edit mode) */

/** Values as the server last saw them; also the "hydrated once" marker. */
const savedFields = ref<{
  title: string
  description: string
  category: string
  thumbnailUrl: string
  price: number
  priceOriginal: number
  items: string[]
  shuffleQuestions: boolean
} | null>(null)

// Only the first load hydrates the form: refreshDetail() runs after every
// question/subtes change in step 3, and re-hydrating then would clobber
// whatever is being typed into the other steps' fields.
watch(detail, (loaded) => {
  if (!loaded || savedFields.value) return

  form.type = loaded.type
  form.examTypeSlug = loaded.examType ?? ''
  form.mode = loaded.mode ?? 'simulasi'
  form.title = loaded.title
  form.description = loaded.description ?? ''
  form.thumbnailUrl = loaded.thumbnailUrl ?? ''
  form.category = loaded.category ?? ''
  form.price = loaded.price > 0 ? loaded.price : null
  form.priceOriginal = loaded.priceOriginal > 0 ? loaded.priceOriginal : null
  form.shuffleQuestions = loaded.shuffleQuestions ?? false
  selectedItems.value = (loaded.items ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(item => item.productId)

  savedFields.value = {
    title: loaded.title,
    description: loaded.description ?? '',
    category: loaded.category ?? '',
    thumbnailUrl: loaded.thumbnailUrl ?? '',
    price: loaded.price,
    priceOriginal: loaded.priceOriginal,
    items: [...selectedItems.value],
    shuffleQuestions: loaded.shuffleQuestions ?? false,
  }
})

/** Tutor hanya boleh mengedit draft/rejected; sisanya dapat panel penjelasan. */
const canEditProduct = computed(() => {
  if (!isEdit.value) return true
  if (!detail.value) return false
  return detail.value.status === 'draft' || detail.value.status === 'rejected'
})

const LOCKED_EXPLANATION: Partial<Record<TutorProductDetail['status'], string>> = {
  review: 'Produk sedang ditinjau tim Zenko. Kamu bisa mengeditnya lagi jika hasil tinjauan keluar.',
  live: 'Produk sudah tayang di katalog. Arsipkan dulu dari daftar produk jika ingin menariknya.',
  archived: 'Produk sudah diarsipkan dan tidak tampil di katalog.',
}

/* ------------------------------------------------------------ save state */

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const saveState = ref<SaveState>('idle')
const saveError = ref('')

const saveIndicator = computed(() => {
  if (saveState.value === 'saving') return 'Menyimpan...'
  if (saveState.value === 'saved') return 'Tersimpan'
  if (saveState.value === 'error') return saveError.value
  return ''
})

function buildPatch(): UpdateProductRequest {
  const saved = savedFields.value
  if (!saved) return {}

  const patch: UpdateProductRequest = {}
  if (form.title.trim() !== saved.title) patch.title = form.title.trim()
  if (form.description.trim() !== saved.description) patch.description = form.description.trim()
  if (form.category.trim() !== saved.category) patch.category = form.category.trim()
  if (form.thumbnailUrl.trim() !== saved.thumbnailUrl) patch.thumbnailUrl = form.thumbnailUrl.trim()
  if ((form.price ?? 0) !== saved.price) patch.price = form.price ?? 0
  if ((form.priceOriginal ?? 0) !== saved.priceOriginal) patch.priceOriginal = form.priceOriginal ?? 0
  if (form.type === 'bundle' && selectedItems.value.join('|') !== saved.items.join('|')) {
    patch.items = [...selectedItems.value]
  }
  if (isSingle.value && form.shuffleQuestions !== saved.shuffleQuestions) {
    patch.shuffleQuestions = form.shuffleQuestions
  }
  return patch
}

/** Create mode has no server copy yet: any typed content counts as unsaved. */
const isDirty = computed(() => {
  if (isEdit.value) return Object.keys(buildPatch()).length > 0
  return Boolean(form.title.trim() || form.description.trim() || form.thumbnailUrl.trim())
})

/** Autosave (edit): PATCH what changed. Resolves false when saving failed. */
async function persist(): Promise<boolean> {
  if (!props.productId) return true

  const patch = buildPatch()
  if (Object.keys(patch).length === 0) return true

  saveState.value = 'saving'
  try {
    await updateTutorProduct(props.productId, patch)
    if (savedFields.value) {
      savedFields.value = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        price: form.price ?? 0,
        priceOriginal: form.priceOriginal ?? 0,
        items: [...selectedItems.value],
        shuffleQuestions: form.shuffleQuestions,
      }
    }
    saveState.value = 'saved'
    return true
  }
  catch (cause) {
    saveState.value = 'error'
    saveError.value = tutorApiMessage(cause, 'Gagal menyimpan draft. Coba lagi.')
    return false
  }
}

/* ----------------------------------------------------------------- steps */

const STEPS = [
  { n: 1, label: 'Tipe & jenis' },
  { n: 2, label: 'Info produk' },
  { n: 3, label: 'Isi' },
  { n: 4, label: 'Review & ajukan' },
] as const

const route = useRoute()
const router = useRouter()

function initialStep(): number {
  const raw = Array.isArray(route.query.langkah) ? route.query.langkah[0] : route.query.langkah
  const parsed = Number.parseInt(raw ?? '', 10)
  const max = isEdit.value ? 4 : 2
  return Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), max)
}

const step = ref(initialStep())
const stepError = ref('')

function syncQuery() {
  router.replace({ query: { ...route.query, langkah: String(step.value) } })
}

/** Validasi minimum sebelum melangkah maju; server tetap memvalidasi penuh. */
function validateThrough(target: number): boolean {
  if (target > 1 && isSingle.value && !form.examTypeSlug) {
    stepError.value = 'Pilih jenis ujian dulu sebelum lanjut.'
    return false
  }
  if (
    target > 1
    && !isEdit.value
    && isSingle.value
    && form.mode === 'mini_tryout'
    && form.examTypeSlug !== 'custom'
    && !form.sectionTitle
  ) {
    stepError.value = 'Pilih subtes dulu sebelum lanjut.'
    return false
  }
  if (target > 2 && !form.title.trim()) {
    stepError.value = 'Isi judul produk dulu sebelum lanjut.'
    return false
  }
  return true
}

async function goTo(target: number) {
  if (target === step.value) return
  stepError.value = ''

  if (target > step.value && !validateThrough(target)) return

  // Create mode: past step 2 the draft must exist first.
  if (!props.productId && target >= 3) {
    await createAndContinue()
    return
  }

  if (!(await persist())) return

  step.value = target
  syncQuery()
}

const creating = ref(false)

/** POST draft baru + PATCH info tambahan, lalu pindah ke URL edit langkah 3. */
async function createAndContinue() {
  if (creating.value) return
  creating.value = true
  saveState.value = 'saving'
  try {
    const created = await createTutorProduct({
      type: form.type,
      title: form.title.trim(),
      examTypeSlug: isSingle.value ? form.examTypeSlug : undefined,
      mode: form.mode,
      ...(form.mode === 'mini_tryout' ? { sectionTitle: form.sectionTitle } : {}),
    })

    const patch: UpdateProductRequest = {}
    if (form.description.trim()) patch.description = form.description.trim()
    if (form.thumbnailUrl.trim()) patch.thumbnailUrl = form.thumbnailUrl.trim()
    if (form.category.trim()) patch.category = form.category.trim()
    if (form.price) patch.price = form.price
    if (form.priceOriginal) patch.priceOriginal = form.priceOriginal
    if (isSingle.value && form.shuffleQuestions) patch.shuffleQuestions = form.shuffleQuestions
    if (Object.keys(patch).length) await updateTutorProduct(created.id, patch)

    saveState.value = 'saved'
    // Everything typed so far now lives on the server; the leave guard must
    // not fire on our own redirect.
    form.title = ''
    form.description = ''
    form.thumbnailUrl = ''
    await navigateTo({
      path: `/dashboard/tutor/products/${created.id}/edit`,
      query: { langkah: '3' },
      replace: true,
    })
  }
  catch (cause) {
    saveState.value = 'error'
    saveError.value = tutorApiMessage(cause, 'Gagal membuat draft produk. Coba lagi.')
  }
  finally {
    creating.value = false
  }
}

const stepReachable = (target: number) => isEdit.value || target <= 2

/* ------------------------------------------------------------ leave guard */

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('Ada perubahan yang belum tersimpan. Tetap keluar?')
})

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) return
  event.preventDefault()
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

/* --------------------------------------------------------- bundle helpers */

const eligibleBundleItems = computed(() =>
  own.data.value.filter(product =>
    product.type === 'single' && product.status === 'live' && product.id !== props.productId,
  ),
)

/** Harga anggota bundel: daftar milik sendiri + fallback dari detail bundel. */
const itemPriceById = computed(() => {
  const map = new Map<string, number>()
  detail.value?.items?.forEach(item => map.set(item.productId, item.price))
  own.data.value.forEach(product => map.set(product.id, product.price))
  return map
})

const bundleItemsTotal = computed(() =>
  selectedItems.value.reduce((sum, id) => sum + (itemPriceById.value.get(id) ?? 0), 0),
)

/* ------------------------------------------------------ step 4: checklist */

interface CheckItem {
  ok: boolean
  label: string
}

/** Cermin client-side dari validasi submit server, sebagai checklist. */
const checklist = computed<CheckItem[]>(() => {
  const list: CheckItem[] = [
    { ok: form.title.trim().length > 0, label: 'Judul terisi' },
    { ok: form.description.trim().length > 0, label: 'Deskripsi terisi' },
  ]

  if (isSingle.value) {
    list.push({ ok: form.category.trim().length > 0, label: 'Kategori terisi' })
  }

  list.push({ ok: (form.price ?? 0) > 0, label: 'Harga lebih dari nol' })

  if (isSingle.value) {
    for (const section of detail.value?.sections ?? []) {
      list.push({
        ok: section.questions.length === section.questionTarget,
        label: `Subtes ${section.title}: ${section.questions.length}/${section.questionTarget} soal`,
      })
    }
  }
  else {
    list.push({
      ok: selectedItems.value.length >= 2,
      label: `Minimal 2 produk dalam bundling (${selectedItems.value.length} dipilih)`,
    })
    list.push({
      ok: (form.price ?? 0) > 0 && (form.price ?? 0) < bundleItemsTotal.value,
      label: `Harga bundling di bawah total harga satuan (${formatRupiah(bundleItemsTotal.value)})`,
    })
  }

  return list
})

const allComplete = computed(() => checklist.value.every(item => item.ok))

/* ------------------------------------------------------ step 4: ringkasan */

const summarySections = computed(() =>
  (detail.value?.sections ?? []).slice().sort((a, b) => a.position - b.position),
)

/**
 * Durasi dijumlah dari tiap subtes, bukan dibaca dari `detail.durationMinutes`:
 * itu field agregat yang hanya diisi saat produk dibuat (jumlah durasi
 * template jenis ujian) — `rebuiltSections` di server tidak menghitungnya
 * ulang saat subtes custom ditambah/diubah/dihapus, jadi bisa basi. Menjumlah
 * langsung dari `sections` (yang sudah dipakai langkah Isi) selalu akurat.
 */
const totalDurationMinutes = computed(() =>
  summarySections.value.reduce((sum, section) => sum + section.durationMinutes, 0),
)

/** Sama seperti `totals` di TutorSectionEditor.vue, lintas semua subtes. */
const summaryQuestionTotals = computed(() => {
  const written = summarySections.value.reduce((sum, s) => sum + s.questions.length, 0)
  const target = summarySections.value.reduce((sum, s) => sum + s.questionTarget, 0)
  return { written, target, percent: target === 0 ? 0 : Math.round((written / target) * 100) }
})

/** Hanya subtes dengan ambang batas (mis. TWK/TIU/TKP) — sisanya tidak punya. */
const passingGradeSections = computed(() =>
  summarySections.value.filter(section => section.passingGrade != null),
)

/* --------------------------------------------------------------- submit */

const submitting = ref(false)
const submitted = ref(false)
const submitProblems = ref<string[]>([])
const submitError = ref('')

async function submitForReview() {
  if (!props.productId) return
  submitError.value = ''
  submitProblems.value = []

  // Harga yang baru diketik harus sampai ke server sebelum divalidasi.
  if (!(await persist())) return

  submitting.value = true
  try {
    await submitTutorProduct(props.productId)
    submitted.value = true
  }
  catch (cause) {
    submitProblems.value = tutorSubmitProblems(cause)
    if (submitProblems.value.length === 0) {
      submitError.value = tutorApiMessage(cause, 'Gagal mengajukan produk. Coba lagi sebentar lagi.')
    }
  }
  finally {
    submitting.value = false
  }
}

/* ----------------------------------------------------------------- misc */

function summarizeSections(exam: { sections: { questionTarget: number, durationMinutes: number }[] }) {
  const questions = exam.sections.reduce((sum, section) => sum + section.questionTarget, 0)
  const minutes = exam.sections.reduce((sum, section) => sum + section.durationMinutes, 0)
  return `${exam.sections.length} subtes · ${questions} soal · ${minutes} menit`
}
</script>

<template>
  <!-- pb-24 clears the fixed step footer below, so the last panel's content
       never sits hidden behind it while scrolled to the bottom. -->
  <div class="grid gap-6 pb-24">
    <AppPageHeader
      :title="isEdit ? 'Edit produk' : 'Buat produk'"
      description="Susun try-out, lengkapi infonya, lalu ajukan untuk tayang di katalog."
    >
      <template #actions>
        <p
          v-if="saveIndicator"
          aria-live="polite"
          class="flex items-center gap-1.5 text-[0.86rem] font-semibold"
          :class="saveState === 'error' ? 'text-danger' : 'text-muted'"
        >
          <IconCheck v-if="saveState === 'saved'" class="h-4 w-4 text-success-ink" />
          {{ saveIndicator }}
        </p>
      </template>
    </AppPageHeader>

    <!-- Edit mode: the wizard cannot render before the draft arrives. -->
    <template v-if="isEdit && !detail">
      <p v-if="detailPending" class="rounded-lg border border-hairline bg-surface px-6 py-10 text-center text-muted shadow-xs">
        Memuat produk...
      </p>
      <div v-else class="rounded-lg border border-hairline bg-surface px-6 py-10 text-center shadow-xs">
        <p class="text-muted">{{ detailError || 'Gagal memuat produk.' }}</p>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refreshDetail">
          Coba lagi
        </button>
      </div>
    </template>

    <!-- Statuses a tutor cannot edit get an explanation, not a dead form. -->
    <DashboardPanel
      v-else-if="isEdit && detail && !canEditProduct"
      title="Produk tidak dapat diedit"
      :description="`Status saat ini: ${PRODUCT_STATUS_LABEL[detail.status]}`"
    >
      <p class="text-muted">{{ LOCKED_EXPLANATION[detail.status] }}</p>
      <AppButton to="/dashboard/tutor/products" size="sm" class="mt-5">Kembali ke daftar produk</AppButton>
    </DashboardPanel>

    <!-- Submitted: replace the wizard so nothing invites further edits. -->
    <DashboardPanel v-else-if="submitted" title="Produk diajukan untuk tayang">
      <div class="py-4 text-center">
        <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft" aria-hidden="true">
          <IconCheck class="h-7 w-7 text-success-ink" />
        </span>
        <p class="mx-auto mt-4 max-w-105 leading-[1.7] text-muted">
          Tim Zenko akan meninjau produkmu. Statusnya bisa kamu pantau di daftar
          produk — jika disetujui, produk langsung tayang di katalog.
        </p>
        <AppButton to="/dashboard/tutor/products" class="mt-6">Ke daftar produk</AppButton>
      </div>
    </DashboardPanel>

    <template v-else>
      <AppAlert v-if="isEdit && detail?.status === 'rejected' && detail.rejectReason" variant="warning" title="Produk ini ditolak">
        {{ detail.rejectReason }} — perbaiki lalu ajukan lagi.
      </AppAlert>

      <!-- Step nav -->
      <ol class="flex flex-wrap gap-2" aria-label="Langkah wizard">
        <li v-for="item in STEPS" :key="item.n">
          <button
            type="button"
            class="flex items-center gap-2 rounded-pill border px-3.5 py-2 text-[0.86rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45"
            :class="step === item.n
              ? 'border-primary/30 bg-primary-soft text-primary'
              : 'border-hairline bg-surface text-muted hover:text-ink'"
            :aria-current="step === item.n ? 'step' : undefined"
            :disabled="!stepReachable(item.n)"
            @click="goTo(item.n)"
          >
            <span
              class="flex h-5.5 w-5.5 items-center justify-center rounded-full text-[0.72rem] font-bold"
              :class="step === item.n ? 'bg-primary text-white' : 'bg-surface-sunken text-muted'"
              aria-hidden="true"
            >{{ item.n }}</span>
            {{ item.label }}
          </button>
        </li>
      </ol>

      <!-- ============================================= Langkah 1: Tipe & jenis -->
      <DashboardPanel v-if="step === 1">
        <div class="grid max-w-160 gap-5">
          <!-- The selects below are disabled in edit mode; without this the
               only cue is that they don't respond. -->
          <AppInlineMessage v-if="isEdit" type="info">
            Tipe dan jenis ujian terkunci setelah produk dibuat.
          </AppInlineMessage>

          <div>
            <AppSelect
              :options="PRODUCT_TYPE_OPTIONS"
              :model-value="form.type"
              :disabled="isEdit"
              label="Tipe"
              @update:model-value="(value) => { if (isProductType(value)) form.type = value }"
            />
            <p class="mt-2 text-[0.82rem] text-muted">
              {{ isSingle
                ? 'Satu try-out utuh dengan subtes dan soal yang kamu susun sendiri.'
                : 'Gabungan beberapa try-out tunggal milikmu yang sudah tayang, dijual satu harga.' }}
            </p>
          </div>

          <template v-if="isSingle">
            <div>
              <span :class="FIELD_LABEL_CLASS">Jenis ujian</span>

              <p v-if="examTypesPending" class="text-[0.9rem] text-muted">Memuat jenis ujian...</p>
              <p v-else-if="examTypesError" class="text-[0.9rem] text-muted">
                Gagal memuat jenis ujian. Muat ulang halaman untuk mencoba lagi.
              </p>
              <AppSelect
                v-else
                :options="examTypeOptions"
                :model-value="form.examTypeSlug"
                :disabled="isEdit"
                placeholder="Pilih jenis ujian"
                @update:model-value="(value) => { form.examTypeSlug = String(value) }"
              />

              <p v-if="selectedExamType" class="mt-2 text-[0.82rem] text-muted">
                {{ selectedExamType.sections.length ? summarizeSections(selectedExamType) : 'Susun subtes sendiri di langkah Isi' }}
              </p>
            </div>

            <div v-if="selectedExamType?.sections.length">
              <AppSelect
                :options="productModeOptions"
                :model-value="form.mode"
                :disabled="isEdit"
                label="Simulasi / Mini Try Out"
                @update:model-value="(value) => { if (isProductMode(value)) form.mode = value }"
              />
            </div>

            <div v-if="form.mode === 'mini_tryout' && selectedExamType?.sections.length">
              <template v-if="isEdit">
                <label for="product-section-title" :class="FIELD_LABEL_CLASS">Sub jenis ujian</label>
                <input
                  id="product-section-title"
                  type="text"
                  :value="detail?.sections?.[0]?.title ?? ''"
                  readonly
                  :class="[FIELD_CLASS, 'bg-surface-sunken text-muted']"
                >
              </template>
              <AppSelect
                v-else
                :options="sectionTitleOptions"
                :model-value="form.sectionTitle"
                label="Sub jenis ujian"
                placeholder="Pilih subtes"
                @update:model-value="(value) => { form.sectionTitle = String(value) }"
              />
            </div>
          </template>

          <AppSectionMessage v-else appearance="information">
            Bundling berisi produk try-out tunggal milikmu yang berstatus Tayang.
            Anggotanya dipilih di langkah Isi.
          </AppSectionMessage>
        </div>
      </DashboardPanel>

      <!-- ================================================ Langkah 2: Info produk -->
      <DashboardPanel v-else-if="step === 2">
        <div class="grid max-w-160 gap-5">
          <FormField
            id="product-title"
            v-model="form.title"
            label="Judul"
            placeholder="Contoh: Try Out SNBT Lengkap 2026"
          />

          <div>
            <label for="product-description" :class="FIELD_LABEL_CLASS">Deskripsi</label>
            <textarea
              id="product-description"
              v-model="form.description"
              rows="4"
              placeholder="Jelaskan isi try-out, untuk siapa, dan apa yang membedakannya."
              class="resize-y"
              :class="FIELD_CLASS"
            />
          </div>

          <TutorThumbnailField v-model="form.thumbnailUrl" />

          <div>
            <label for="product-category" :class="FIELD_LABEL_CLASS">Kategori</label>
            <input
              id="product-category"
              v-model="form.category"
              type="text"
              placeholder="Contoh: SNBT"
              :readonly="categoryLocked"
              :class="[FIELD_CLASS, categoryLocked && 'bg-surface-sunken text-muted']"
              :aria-describedby="categoryLocked ? 'product-category-hint' : undefined"
            >
            <p v-if="categoryLocked" id="product-category-hint" class="mt-2 text-[0.82rem] text-muted">
              Otomatis mengikuti jenis ujian yang dipilih.
            </p>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="product-price" :class="FIELD_LABEL_CLASS">Harga</label>
              <AppCurrencyField id="product-price" v-model="form.price" placeholder="149.000" />
            </div>
            <div>
              <label for="product-price-original" :class="FIELD_LABEL_CLASS">Harga coret</label>
              <AppCurrencyField
                id="product-price-original"
                v-model="form.priceOriginal"
                placeholder="199.000"
                ariaDescribedby="product-price-original-hint"
              />
              <p id="product-price-original-hint" class="mt-2 text-[0.82rem] text-muted">
                Opsional. Tampil tercoret di samping harga jual.
              </p>
            </div>
          </div>

          <div
            v-if="isSingle"
            class="flex items-start justify-between gap-4 rounded-md border border-hairline bg-surface-alt px-4 py-3.5"
          >
            <div>
              <label id="product-shuffle-questions-label" for="product-shuffle-questions" class="text-[0.9rem] font-semibold">
                Acak urutan soal saat dikerjakan siswa
              </label>
              <p class="mt-1 text-[0.82rem] text-muted">
                Tiap siswa mendapat urutan soal berbeda saat mengerjakan try-out, tapi tetap sama
                selama satu kali pengerjaan (reload halaman tidak mengacak ulang). Urutan di editor
                soal ini tidak berubah.
              </p>
            </div>
            <button
              id="product-shuffle-questions"
              type="button"
              role="switch"
              :aria-checked="form.shuffleQuestions"
              aria-labelledby="product-shuffle-questions-label"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-hairline transition-colors"
              :class="form.shuffleQuestions ? 'bg-primary' : 'bg-surface-sunken'"
              @click="form.shuffleQuestions = !form.shuffleQuestions"
            >
              <span
                class="inline-block size-4 transform rounded-full bg-surface shadow-sm transition-transform"
                :class="form.shuffleQuestions ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
      </DashboardPanel>

      <!-- ======================================================= Langkah 3: Isi -->
      <template v-else-if="step === 3">
        <template v-if="isSingle">
          <TutorCustomSections
            v-if="isCustom && productId && detail"
            :product-id="productId"
            :sections="detail.sections ?? []"
            @refresh="refreshDetail"
          />
          <TutorSectionEditor
            v-if="productId && detail"
            :product-id="productId"
            :sections="detail.sections ?? []"
            :is-custom="isCustom"
            @refresh="refreshDetail"
          />
          <DashboardPanel v-else>
            <p class="text-muted">Memuat subtes...</p>
          </DashboardPanel>
        </template>

        <TutorBundlePicker
          v-else
          v-model="selectedItems"
          :eligible="eligibleBundleItems"
          :pending="own.pending.value"
          :error="own.error.value"
        />
      </template>

      <!-- ============================================ Langkah 4: Review & ajukan -->
      <DashboardPanel v-else>
        <div class="grid gap-6">
          <div class="rounded-md border border-hairline bg-surface-alt p-5">
            <h3 class="text-[0.9rem] font-semibold">Ringkasan</h3>
            <dl class="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-[0.8rem] text-muted">Tipe</dt>
                <dd class="mt-0.5 font-semibold">{{ PRODUCT_TYPE_LABEL[form.type] }}</dd>
              </div>
              <div v-if="isSingle">
                <dt class="text-[0.8rem] text-muted">Jenis ujian</dt>
                <dd class="mt-0.5 font-semibold">
                  {{ selectedExamType?.label || form.examTypeSlug || '—' }}
                  <span class="block text-[0.82rem] font-normal text-muted">
                    {{ form.mode === 'mini_tryout'
                      ? `${PRODUCT_MODE_LABEL.mini_tryout} — ${isEdit ? (detail?.sections?.[0]?.title ?? '—') : (form.sectionTitle || '—')}`
                      : PRODUCT_MODE_LABEL.simulasi }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.8rem] text-muted">Judul</dt>
                <dd class="mt-0.5 font-semibold">{{ form.title || '—' }}</dd>
              </div>
              <div v-if="isSingle">
                <dt class="text-[0.8rem] text-muted">Kategori</dt>
                <dd class="mt-0.5 font-semibold">{{ form.category || '—' }}</dd>
              </div>
              <div v-if="isSingle">
                <dt class="text-[0.8rem] text-muted">Durasi</dt>
                <dd class="mt-0.5 font-semibold">
                  {{ totalDurationMinutes > 0 ? formatDuration(totalDurationMinutes) : '—' }}
                </dd>
              </div>

              <div v-if="isSingle && summarySections.length" class="sm:col-span-2">
                <dt class="text-[0.8rem] text-muted">Progres Soal</dt>
                <dd class="mt-1.5">
                  <div class="flex items-center justify-between text-[0.88rem] font-semibold">
                    <span>{{ summaryQuestionTotals.written }}/{{ summaryQuestionTotals.target }} soal</span>
                    <span class="tabular-nums text-muted">{{ summaryQuestionTotals.percent }}%</span>
                  </div>
                  <div
                    class="mt-1.5 h-2 w-full overflow-hidden rounded-pill bg-surface-sunken"
                    role="progressbar"
                    :aria-valuenow="summaryQuestionTotals.percent"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`Progres soal: ${summaryQuestionTotals.written} dari ${summaryQuestionTotals.target}`"
                  >
                    <div
                      class="h-full rounded-pill bg-primary transition-[width]"
                      :style="{ width: `${summaryQuestionTotals.percent}%` }"
                    />
                  </div>

                  <ul class="mt-3 grid gap-1.5 sm:grid-cols-2">
                    <li
                      v-for="section in summarySections"
                      :key="section.id"
                      class="flex items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-[0.82rem] font-semibold"
                      :class="COMPLETION_STATE_CLASS[sectionCompletionState(section)]"
                    >
                      <span class="truncate">{{ section.title }}</span>
                      <span class="shrink-0 tabular-nums">{{ section.questions.length }}/{{ section.questionTarget }}</span>
                    </li>
                  </ul>
                </dd>
              </div>

              <div v-if="isSingle && passingGradeSections.length" class="sm:col-span-2">
                <dt class="text-[0.8rem] text-muted">Ambang Lulus</dt>
                <dd class="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                  <span v-for="section in passingGradeSections" :key="section.id">
                    {{ section.title }}: {{ section.passingGrade }}
                  </span>
                </dd>
              </div>

              <div class="sm:col-span-2">
                <dt class="text-[0.8rem] text-muted">Thumbnail</dt>
                <dd class="mt-1.5">
                  <img
                    v-if="form.thumbnailUrl"
                    :src="form.thumbnailUrl"
                    alt=""
                    class="aspect-[16/10] h-24 w-auto rounded-sm border border-hairline object-cover"
                  >
                  <span v-else class="text-[0.88rem] text-muted">—</span>
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-[0.8rem] text-muted">Deskripsi</dt>
                <dd class="mt-0.5 whitespace-pre-line text-[0.88rem]">{{ form.description || '—' }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="isSingle" class="rounded-md border border-hairline bg-surface-alt p-5">
            <h3 class="text-[0.9rem] font-semibold">Daftar Soal</h3>
            <TutorQuestionSummaryTable class="mt-3" :sections="detail?.sections ?? []" />
          </div>

          <div class="rounded-md border border-hairline bg-surface-alt p-5">
            <h3 class="text-[0.9rem] font-semibold">Kelengkapan sebelum diajukan</h3>
            <ul class="mt-3 grid gap-2">
              <li
                v-for="item in checklist"
                :key="item.label"
                class="flex items-start gap-2.5 text-[0.9rem]"
                :class="item.ok ? 'text-muted' : 'text-warning-ink'"
              >
                <IconCheck v-if="item.ok" class="mt-0.5 h-4 w-4 shrink-0 text-success-ink" />
                <IconAlert v-else class="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                {{ item.label }}
              </li>
            </ul>
          </div>

          <AppSectionMessage v-if="submitProblems.length" appearance="warning" title="Produk belum bisa diajukan:">
            <ul class="grid list-disc gap-1 pl-5">
              <li v-for="problem in submitProblems" :key="problem">{{ problem }}</li>
            </ul>
          </AppSectionMessage>

          <AppSectionMessage v-if="submitError" appearance="warning">{{ submitError }}</AppSectionMessage>

          <!-- Tombol "Ajukan untuk tayang" sendiri ada di step footer fixed
               di bawah, di sebelah Kembali — bukan lagi di sini. -->
          <p v-if="!allComplete" class="text-[0.82rem] text-muted">
            Lengkapi daftar di atas dulu — tombol Ajukan aktif setelah semuanya terpenuhi.
          </p>
        </div>
      </DashboardPanel>

      <AppInlineMessage v-if="stepError" type="error">{{ stepError }}</AppInlineMessage>

      <!-- Step footer — fixed to the viewport bottom so Kembali/Lanjut stay
           reachable on long steps without scrolling. Left edge tracks the
           dashboard rail's width/collapse state (see sidebarCollapsed
           above) so it lines up with the content column, not the sidebar. -->
      <div
        class="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/95 backdrop-blur-md transition-[left] duration-200 ease-smooth"
        :class="sidebarCollapsed ? 'md:left-18' : 'md:left-66'"
      >
        <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 md:px-8">
          <AppButton
            v-if="step > 1"
            type="button"
            variant="outline"
            @click="goTo(step - 1)"
          >
            Kembali
          </AppButton>
          <span v-else aria-hidden="true" />

          <AppButton
            v-if="step < 4 && stepReachable(step + 1)"
            type="button"
            :disabled="creating || saveState === 'saving'"
            @click="goTo(step + 1)"
          >
            {{ creating ? 'Menyimpan draft...' : 'Lanjut' }}
          </AppButton>
          <AppButton
            v-else-if="step === 2 && !isEdit"
            type="button"
            :disabled="creating"
            @click="goTo(3)"
          >
            {{ creating ? 'Menyimpan draft...' : 'Simpan draft & lanjut' }}
          </AppButton>
          <AppButton
            v-else-if="step === 4"
            type="button"
            :disabled="submitting || !allComplete"
            @click="submitForReview"
          >
            {{ submitting ? 'Mengajukan...' : 'Ajukan untuk tayang' }}
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
