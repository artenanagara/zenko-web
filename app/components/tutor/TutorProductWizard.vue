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
 * their own endpoints inside step 3. Produk yang sudah tayang tetap bisa
 * menelusuri semua langkah, tetapi tampil read-only karena endpoint edit
 * kontennya memang hanya menerima draft/ditolak.
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

/**
 * Aturan harga sebagaimana berlaku untuk pemanggil ini: lantai harga produk
 * berbayar, dan boleh-tidaknya paket gratis. Null selama belum termuat atau
 * saat gagal — checklist lalu bersikap longgar, karena submit di server tetap
 * penjaga sebenarnya dan kalimat penolakannya datang dari sana juga.
 */
const { data: pricingRule, refresh: refreshPricingRule } = useTutorPricingEligibility()

onMounted(refreshPricingRule)

/**
 * Payment gateway belum jalan, jadi harga tidak berarti apa-apa — setiap
 * paket harus Rp0. Mengunci input ini alih-alih membiarkannya dan menolak di
 * server: tutor tidak sempat mengetik angka yang toh akan ditolak nanti.
 * Cabut baris ini (dan biarkan input Harga aktif lagi) begitu pembayaran
 * sungguhan tersedia — lihat paymentGatewayLive di zenko-api.
 */
const PRICE_INPUT_DISABLED = true

/* ------------------------------------------------------------------ form */

const form = reactive({
  type: 'single' as ProductType,
  examTypeSlug: '',
  mode: 'simulasi' as ProductMode,
  sectionTitle: '',
  questionTarget: null as number | null,
  durationMinutes: null as number | null,
  title: '',
  description: '',
  thumbnailUrl: '',
  /** "Yang kamu dapatkan" — baris kosong difilter sebelum dikirim, lihat cleanIncludes. */
  includes: [] as string[],
  price: (PRICE_INPUT_DISABLED ? 0 : null) as number | null,
  priceOriginal: null as number | null,
  shuffleQuestions: false,
})

/**
 * Trim tiap baris dan buang yang kosong — baris kosong tidak pernah dikirim
 * ke server, baik lewat draft awal maupun autosave PATCH.
 */
function cleanIncludes(rows: string[]): string[] {
  return rows.map(row => row.trim()).filter(row => row.length > 0)
}

const INCLUDE_OPTIONS = [
  { label: 'Pembahasan video untuk setiap soal', category: null },
  { label: 'Pembahasan tertulis tiap soal', category: null },
  { label: 'Analisis skor per subtes', category: null },
  { label: 'Akses selamanya, bisa diulang kapan saja', category: null },
  { label: 'Grup diskusi bersama tutor', category: null },
  { label: 'Perhitungan skor dengan skema IRT', category: 'SNBT' },
  { label: 'Perhitungan skor dengan skema IRT', category: 'TKA' },
  { label: 'Simulasi antarmuka CAT BKN', category: 'SKD' },
  { label: 'Simulasi antarmuka CAT BKN', category: 'Kedinasan' },
  { label: 'Simulasi antarmuka CAT BKN', category: 'SKB' },
].filter((option, index, options) => options.findIndex(item => item.label === option.label) === index)

const includeOptions = computed(() => {
  const category = selectedExamType.value?.category?.toLowerCase() ?? ''
  return [...INCLUDE_OPTIONS].sort((a, b) => {
    const aRelevant = a.category ? category.includes(a.category.toLowerCase()) : false
    const bRelevant = b.category ? category.includes(b.category.toLowerCase()) : false
    return Number(bRelevant) - Number(aRelevant)
  })
})

function toggleInclude(label: string) {
  const index = form.includes.indexOf(label)
  if (index >= 0) form.includes.splice(index, 1)
  else form.includes.push(label)
}

const customInclude = ref('')

function addCustomInclude() {
  const value = customInclude.value.trim()
  if (!value || form.includes.includes(value)) return
  form.includes.push(value)
  customInclude.value = ''
}

/** Bundle membership, in display order. */
const selectedItems = ref<string[]>([])

const isSingle = computed(() => form.type === 'single')
const isCustom = computed(() => isSingle.value && form.examTypeSlug === 'custom')

const selectedExamType = computed(() =>
  examTypes.value.find(exam => exam.slug === form.examTypeSlug) ?? null,
)

/**
 * Kategori katalog tidak lagi diketik siapa pun: server menurunkannya dari
 * kategori ujian yang dipilih (atau "Bundel" untuk bundling). Yang dipakai di
 * sini hanya untuk menampilkan dan mencermin validasi submit — produk lama
 * yang terlanjur kosong tetap ketahuan di checklist.
 */
const derivedCategory = computed(() => {
  if (!isSingle.value) return detail.value?.category || 'Bundel'
  return detail.value?.category || selectedExamType.value?.category || ''
})

/**
 * Angka template yang terakhir kali diisikan sendiri oleh wizard ke dua field
 * di bawah. Ini yang membedakan "angka ini datang dari template" dari "angka
 * ini diketik tutor" — lihat prefill di bawah.
 */
const appliedTemplate = reactive({
  questionTarget: null as number | null,
  durationMinutes: null as number | null,
})

// A stale subtest choice from a previous exam type (or from switching back to
// Simulasi) must never leak into a later mini-tryout submission.
watch([() => form.examTypeSlug, () => form.mode], () => {
  if (isEdit.value) return
  form.sectionTitle = ''
  form.questionTarget = null
  form.durationMinutes = null
  appliedTemplate.questionTarget = null
  appliedTemplate.durationMinutes = null
})

/**
 * Memilih subtes mengisikan angka template sebagai titik awal — tapi hanya ke
 * field yang masih memegang angka template itu (atau masih kosong). Begitu
 * tutor mengetik angkanya sendiri, angka itu bertahan: mengganti subtes, atau
 * memilih subtes setelah angkanya terlanjur diketik, tidak boleh menimpanya.
 *
 * Ini bug yang dilaporkan sebagai "jumlah soal custom, tapi di isi soal masih
 * sesuai template": versi lama menimpa kedua field tanpa syarat setiap kali
 * `sectionTitle` berubah, jadi tutor yang mengetik "35" lebih dulu lalu memilih
 * subtes diam-diam kembali ke 30 — dan angka template itulah yang terkirim ke
 * POST /tutor/products. Durasi lewat jalur yang sama persis, jadi ikut kena.
 */
watch(() => form.sectionTitle, (title) => {
  const section = selectedExamType.value?.sections.find(item => item.title === title)
  if (!section || (isEdit.value && detail.value?.sections?.[0]?.title === title)) return

  if (form.questionTarget === null || form.questionTarget === appliedTemplate.questionTarget) {
    form.questionTarget = section.questionTarget
  }
  if (form.durationMinutes === null || form.durationMinutes === appliedTemplate.durationMinutes) {
    form.durationMinutes = section.durationMinutes
  }
  appliedTemplate.questionTarget = section.questionTarget
  appliedTemplate.durationMinutes = section.durationMinutes
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

/**
 * tka-sma-pilihan lists all 19 elective mata pelajaran, but a student only
 * ever sits two of them, and never in one session. Picking Simulasi there
 * would generate a 475-soal, 19-hour paket nobody can take — the template is
 * meant for one paket per mapel, via Mini Try Out.
 * See docs/plan-produk-tka-lengkap.md §7B.
 */
const electiveModeWarning = computed(() =>
  form.examTypeSlug === 'tka-sma-pilihan' && form.mode === 'simulasi'
    ? 'Template ini berisi 19 mata pelajaran pilihan, dan siswa hanya mengambil 2 — bukan semuanya sekaligus. '
      + 'Pilih "Mini Try Out" lalu satu mata pelajaran, supaya paketnya jadi 25 soal / 60 menit sesuai TKA aslinya.'
    : '',
)

/**
 * Pilihan subtes untuk mode mini try out.
 *
 * Saat edit, subtesnya sudah terkunci dan yang perlu tampil hanya subtes milik
 * produk ini — tanpa angka template di labelnya, karena angka produk boleh
 * berbeda dari template (justru itu inti fitur "jumlah soal custom"), dan
 * menempelkan angka template di sini akan berbohong tentang isi produknya.
 */
const sectionTitleOptions = computed(() => {
  const savedSection = isEdit.value ? detail.value?.sections?.[0] : null
  if (savedSection) return [{ value: savedSection.title, label: savedSection.title }]

  return (selectedExamType.value?.sections ?? []).map(section => ({
    value: section.title,
    label: `${section.title} (${section.questionTarget} soal · ${section.durationMinutes} menit)`,
  }))
})

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
  thumbnailUrl: string
  includes: string[]
  price: number
  priceOriginal: number
  sectionQuestionTarget: number
  sectionDurationMinutes: number
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
  form.sectionTitle = loaded.sections?.[0]?.title ?? ''
  form.title = loaded.title
  form.description = loaded.description ?? ''
  form.thumbnailUrl = loaded.thumbnailUrl ?? ''
  form.includes = [...(loaded.includes ?? [])]
  form.questionTarget = loaded.sections?.[0]?.questionTarget ?? null
  form.durationMinutes = loaded.sections?.[0]?.durationMinutes ?? null
  form.price = PRICE_INPUT_DISABLED ? 0 : (loaded.price > 0 ? loaded.price : null)
  form.priceOriginal = loaded.priceOriginal > 0 ? loaded.priceOriginal : null
  form.shuffleQuestions = loaded.shuffleQuestions ?? false
  selectedItems.value = (loaded.items ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(item => item.productId)

  savedFields.value = {
    title: loaded.title,
    description: loaded.description ?? '',
    thumbnailUrl: loaded.thumbnailUrl ?? '',
    includes: cleanIncludes(form.includes),
    price: loaded.price,
    priceOriginal: loaded.priceOriginal,
    sectionQuestionTarget: loaded.sections?.[0]?.questionTarget ?? 0,
    sectionDurationMinutes: loaded.sections?.[0]?.durationMinutes ?? 0,
    items: [...selectedItems.value],
    shuffleQuestions: loaded.shuffleQuestions ?? false,
  }
})

/** Produk tayang dapat menelusuri wizard, tetapi seluruh isinya read-only. */
const isLiveReadOnly = computed(() => isEdit.value && detail.value?.status === 'live')

const canEditProduct = computed(() => {
  if (!isEdit.value) return true
  if (!detail.value) return false
  return ['draft', 'rejected', 'live'].includes(detail.value.status)
})

/**
 * Yang boleh berubah setelah tayang hanya harga — judul ikut terkunci karena
 * itulah produk yang sudah dibeli dan sudah diindeks katalog. Aturan yang
 * sama ditegakkan server di ensurePatchEditable (zenko-api); kalau salah satu
 * berubah, ubah keduanya.
 */
function isFieldEditable(field: 'title' | 'price' | 'priceOriginal' | 'section' | 'details') {
  if (!isEdit.value || !detail.value) return true
  if (detail.value.status === 'draft' || detail.value.status === 'rejected') return true
  return detail.value.status === 'live' && ['price', 'priceOriginal'].includes(field)
}

const LOCKED_EXPLANATION: Partial<Record<TutorProductDetail['status'], string>> = {
  review: 'Produk sedang ditinjau tim Zenko. Kamu bisa mengeditnya lagi jika hasil tinjauan keluar.',
  live: 'Produk sudah tayang. Hanya harga yang masih bisa diubah; field lain terkunci karena produk sudah dibeli dan tampil di katalog.',
  archived: 'Produk sudah diarsipkan dan tidak tampil di katalog.',
}

/**
 * Kalimat "kenapa terkunci" untuk status produk saat ini, dipasang di atas
 * seluruh langkah wizard.
 *
 * Sebelumnya LOCKED_EXPLANATION hanya terpakai di cabang `!canEditProduct`
 * (review/archived) — padahal justru status `live` yang tetap membuka wizard
 * sambil mengunci hampir semua field, jadi satu-satunya status yang benar-benar
 * butuh penjelasan ini malah tidak pernah menampilkannya.
 *
 * Untuk `live` kalimatnya ditulis ulang saat PRICE_INPUT_DISABLED menyala:
 * kalimat aslinya menjanjikan "hanya harga yang masih bisa diubah", dan itu
 * tidak benar selama input harganya sendiri ikut dimatikan.
 */
const statusLockNotice = computed(() => {
  if (!isEdit.value || !detail.value) return ''
  if (detail.value.status === 'live' && PRICE_INPUT_DISABLED) {
    return 'Produk sudah tayang, jadi field-nya terkunci karena produk sudah dibeli dan tampil di katalog. '
      + 'Harga pun belum bisa diubah selama pembayaran belum tersedia.'
  }
  return LOCKED_EXPLANATION[detail.value.status] ?? ''
})

/**
 * Apakah ada field yang terkunci oleh status produk (bukan oleh urutan
 * langkah). Dipakai untuk memutuskan apakah penjelasan di atas perlu tampil.
 */
const hasStatusLockedFields = computed(() =>
  isEdit.value && !(['title', 'price', 'priceOriginal', 'section', 'details'] as const).every(isFieldEditable),
)

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
  if (form.thumbnailUrl.trim() !== saved.thumbnailUrl) patch.thumbnailUrl = form.thumbnailUrl.trim()
  const cleanedIncludes = cleanIncludes(form.includes)
  if (cleanedIncludes.join('\n') !== saved.includes.join('\n')) patch.includes = cleanedIncludes
  if ((form.price ?? 0) !== saved.price) patch.price = form.price ?? 0
  if ((form.priceOriginal ?? 0) !== saved.priceOriginal) patch.priceOriginal = form.priceOriginal ?? 0
  const currentSection = detail.value?.sections?.[0]
  if (
    currentSection
    && isFieldEditable('section')
    && ((form.questionTarget ?? 0) !== saved.sectionQuestionTarget || (form.durationMinutes ?? 0) !== saved.sectionDurationMinutes)
  ) {
    patch.sections = (detail.value?.sections ?? []).map(section => ({
      id: section.id,
      title: section.title,
      questionTarget: section.id === currentSection.id ? (form.questionTarget ?? section.questionTarget) : section.questionTarget,
      durationMinutes: section.id === currentSection.id ? (form.durationMinutes ?? section.durationMinutes) : section.durationMinutes,
      scoringMode: section.scoringMode,
      pointsCorrect: section.pointsCorrect,
      passingGrade: section.passingGrade,
      defaultKind: section.defaultKind,
    }))
  }
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
  return Boolean(form.title.trim() || form.description.trim() || form.thumbnailUrl.trim() || cleanIncludes(form.includes).length)
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
        thumbnailUrl: form.thumbnailUrl.trim(),
        includes: cleanIncludes(form.includes),
        price: form.price ?? 0,
        priceOriginal: form.priceOriginal ?? 0,
        sectionQuestionTarget: form.questionTarget ?? 0,
        sectionDurationMinutes: form.durationMinutes ?? 0,
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
  { n: 1, label: 'Tipe & kategori' },
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
const toast = useToast()

/**
 * Blocks a failed step check can point at. The wizard is a tall form and its
 * Lanjut button lives in a footer pinned to the viewport, so a message next to
 * that button sat nowhere near the field it was about.
 */
const examTypeBlockRef = ref<HTMLElement | null>(null)
const sectionBlockRef = ref<HTMLElement | null>(null)
const includesBlockRef = ref<HTMLElement | null>(null)

/** Set by validateThrough(); raised by whoever called it. */
let stepFailure: { message: string, anchor: Ref<HTMLElement | null> | string } | null = null

function failStep(message: string, anchor: Ref<HTMLElement | null> | string): false {
  stepFailure = { message, anchor }
  return false
}

function takeStepFailure() {
  const failure = stepFailure
  stepFailure = null
  return failure
}

function reportStepFailure() {
  const failure = takeStepFailure()
  if (!failure) return
  focusField(typeof failure.anchor === 'string' ? failure.anchor : failure.anchor.value)
  toast.error('Belum bisa lanjut.', failure.message)
}

function syncQuery() {
  router.replace({ query: { ...route.query, langkah: String(step.value) } })
}

/** Validasi minimum sebelum melangkah maju; server tetap memvalidasi penuh. */
function validateThrough(target: number): boolean {
  if (isEdit.value && detail.value?.status === 'live' && target !== 2) {
    return failStep('Produk tayang hanya bisa mengubah judul dan harga di langkah Info produk.', 'product-title')
  }
  if (target > 1 && isSingle.value && !form.examTypeSlug) {
    return failStep('Pilih kategori ujian dulu sebelum lanjut.', examTypeBlockRef)
  }
  if (
    target > 1
    && !isEdit.value
    && isSingle.value
    && form.mode === 'mini_tryout'
    && form.examTypeSlug !== 'custom'
    && !form.sectionTitle
  ) {
    return failStep('Pilih subtes dulu sebelum lanjut.', sectionBlockRef)
  }
  if (target > 2 && !form.title.trim()) {
    return failStep('Isi judul produk dulu sebelum lanjut.', 'product-title')
  }
  if (target > 2 && cleanIncludes(form.includes).length === 0) {
    return failStep('Pilih minimal satu poin yang kamu dapatkan.', includesBlockRef)
  }
  return true
}

async function goTo(target: number) {
  if (target === step.value) return

  if (target > step.value && !isLiveReadOnly.value && !validateThrough(target)) {
    reportStepFailure()
    return
  }

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
      ...(form.mode === 'mini_tryout' && form.questionTarget ? { questionTarget: form.questionTarget } : {}),
      ...(form.mode === 'mini_tryout' && form.durationMinutes ? { durationMinutes: form.durationMinutes } : {}),
    })

    const patch: UpdateProductRequest = {}
    if (form.description.trim()) patch.description = form.description.trim()
    if (form.thumbnailUrl.trim()) patch.thumbnailUrl = form.thumbnailUrl.trim()
    const cleanedIncludes = cleanIncludes(form.includes)
    if (cleanedIncludes.length) patch.includes = cleanedIncludes
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
    form.includes = []
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

const stepReachable = (target: number) =>
  isEdit.value || target <= 2

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

/**
 * Baris harga di checklist. Harga tutor punya dua keadaan sah — tepat Rp0
 * (paket gratis, dengan syaratnya sendiri) atau minimal `minPrice` — jadi
 * barisnya berganti pertanyaan tergantung yang mana sedang diketik.
 *
 * `minPrice` 0 berarti pemanggilnya admin: tanpa lantai dan tanpa syarat, jadi
 * tidak ada yang perlu dicentang dan barisnya absen sama sekali.
 */
function priceCheck(): CheckItem | null {
  const rule = pricingRule.value
  const price = form.price ?? 0

  if (price > 0) {
    const min = rule?.minPrice ?? 0
    if (min <= 0) return null
    return {
      ok: price >= min,
      label: `Harga minimal ${formatRupiah(min)}, atau Rp0 untuk paket gratis`,
    }
  }

  // Rp0 mulai dari sini. Putusannya milik server, termasuk kalimatnya:
  // `reason` sama persis dengan yang dikembalikan submit untuk kasus itu.
  if (!rule) return { ok: true, label: 'Harga: Gratis' }
  if (rule.minPrice <= 0) return null
  return {
    ok: rule.canSubmitFreeProduct,
    label: rule.canSubmitFreeProduct
      ? 'Harga: Gratis (memenuhi syarat paket gratis)'
      : rule.reason ?? 'Paket gratis belum bisa diajukan',
  }
}

/** Cermin client-side dari validasi submit server, sebagai checklist. */
const checklist = computed<CheckItem[]>(() => {
  const list: CheckItem[] = [
    { ok: form.title.trim().length > 0, label: 'Judul terisi' },
    { ok: form.description.trim().length > 0, label: 'Deskripsi terisi' },
  ]

  if (isSingle.value) {
    list.push({ ok: derivedCategory.value.trim().length > 0, label: 'Kategori terisi' })
  }

  const price = priceCheck()
  if (price) list.push(price)

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
    // Bundel gratis melewati perbandingan ini, persis seperti servernya: Rp0
    // sudah lebih murah dari isi apa pun, dan tak ada diskon tersisa untuk
    // dituntut saat isinya pun gratis.
    if ((form.price ?? 0) > 0) {
      list.push({
        ok: (form.price ?? 0) < bundleItemsTotal.value,
        label: `Harga bundling di bawah total harga satuan (${formatRupiah(bundleItemsTotal.value)})`,
      })
    }
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

/**
 * "Simulasikan" per subtes — menjalankan subtesnya di ruang ujian sungguhan
 * (lihat TryoutSimulation.vue). Opsional: sengaja TIDAK masuk `checklist`,
 * jadi tidak pernah menahan tombol Ajukan.
 *
 * Cuma untuk produk `single` yang sudah tersimpan sebagai draft: bundling
 * tidak punya subtes sendiri (isinya produk lain, yang masing-masing bisa
 * disimulasikan dari halamannya sendiri), dan mode create belum punya id
 * produk untuk dipanggil endpoint pratinjaunya.
 *
 * Subtes yang masih kurang dari target soal dimatikan tombolnya: server
 * menjawab 422 untuk subtes belum lengkap, jadi lebih jujur mengatakannya di
 * sini daripada mengirim tutor ke layar galat.
 */
const simulatableSections = computed(() =>
  summarySections.value.map(section => ({
    id: section.id,
    title: section.title,
    ready: section.questions.length >= section.questionTarget && section.questions.length > 0,
    written: section.questions.length,
    target: section.questionTarget,
  })),
)

function simulateHref(sectionId: string): string {
  return `/dashboard/tutor/products/${props.productId}/simulasikan?section=${encodeURIComponent(sectionId)}`
}

/* --------------------------------------------------------------- submit */

const submitting = ref(false)
const submitted = ref(false)
const submitProblems = ref<string[]>([])
const submitError = ref('')

async function submitForReview() {
  if (!props.productId) return
  if (isLiveReadOnly.value) {
    toast.info('Produk sudah tayang.', 'Tidak perlu diajukan ulang.')
    return
  }
  submitError.value = ''
  submitProblems.value = []

  // Harga yang baru diketik harus sampai ke server sebelum divalidasi.
  if (!(await persist())) return

  submitting.value = true
  try {
    await submitTutorProduct(props.productId)
    submitted.value = true
    // Produk ini meninggalkan draft, jadi apa yang tayang milik tutor bisa
    // berubah — dan dengan itu, kelayakan paket gratis berikutnya.
    await refreshPricingRule()
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

/* ------------------------------------------------------- step 2: harga */

/**
 * Kalimat pendamping kolom harga, supaya aturannya terbaca saat mengetik dan
 * bukan hanya saat checklist step 4 menolak. Null berarti tidak ada yang perlu
 * dikatakan: aturannya belum termuat, atau pemanggilnya admin yang memang
 * bebas menetapkan harga berapa pun.
 */
const priceHint = computed<string | null>(() => {
  if (PRICE_INPUT_DISABLED) return 'Sementara nonaktif — semua paket gratis selama pembayaran belum tersedia.'
  const rule = pricingRule.value
  if (!rule || rule.minPrice <= 0) return null
  if ((form.price ?? 0) > 0) {
    return `Minimal ${formatRupiah(rule.minPrice)}, atau Rp0 untuk paket gratis.`
  }
  return rule.canSubmitFreeProduct
    ? 'Rp0 tampil sebagai "Gratis" di katalog.'
    : rule.reason ?? 'Paket gratis belum bisa diajukan.'
})

/** Merah hanya saat Rp0 memang belum boleh — sisanya keterangan biasa. */
const priceHintBlocking = computed(() =>
  (form.price ?? 0) === 0 && pricingRule.value?.canSubmitFreeProduct === false,
)

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
          Tim kurasi Zenko akan segera meninjau paket soalmu. Kamu bisa memantau statusnya di menu Produk Saya. Begitu disetujui, paketmu akan langsung tayang di katalog.
        </p>
        <AppButton to="/dashboard/tutor/products" class="mt-6">Kembali ke Produk Saya</AppButton>
      </div>
    </DashboardPanel>

    <template v-else>
      <AppAlert v-if="isEdit && detail?.status === 'rejected' && detail.rejectReason" variant="warning" title="Paket soal memerlukan revisi">
        {{ detail.rejectReason }}. Silakan sesuaikan materi soal, lalu ajukan kembali.
      </AppAlert>

      <!-- Kenapa field-field di bawah tampil abu-abu dan tidak bisa diisi.
           Ini soal STATUS produk; penjelasan "terkunci karena sudah dibuat"
           (tipe/kategori/jenis/subtes) berdiri sendiri di langkah 1. -->
      <AppAlert
        v-if="hasStatusLockedFields && statusLockNotice"
        variant="info"
        title="Sebagian field terkunci"
      >
        {{ statusLockNotice }}
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

      <!-- ========================================== Langkah 1: Tipe & kategori -->
      <DashboardPanel v-if="step === 1">
        <div class="grid max-w-160 gap-5">
          <!-- The selects below are disabled in edit mode; without this the
               only cue is that they don't respond. Terkunci di sini bukan
               karena status produk (lihat pemberitahuan di atas wizard) tapi
               karena bentuk produknya sudah terlanjur dibuat: server pun
               menolak mengubahnya. -->
          <AppInlineMessage v-if="isEdit" type="info">
            Tipe, kategori ujian, jenis ujian, dan subtes terkunci setelah produk dibuat.
            Jumlah soal dan durasi masih bisa disesuaikan selama produk berstatus draft.
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
            <div ref="examTypeBlockRef" class="scroll-mt-24">
              <span :class="FIELD_LABEL_CLASS">Kategori ujian</span>

              <p v-if="examTypesPending" class="text-[0.9rem] text-muted">Memuat kategori ujian...</p>
              <p v-else-if="examTypesError" class="text-[0.9rem] text-muted">
                Gagal memuat kategori ujian. Muat ulang halaman untuk mencoba lagi.
              </p>
              <!-- Namanya lewat `aria-label`, bukan prop `label`: label yang
                   tampak adalah <span> di atas, dan di antara keduanya ada
                   state memuat/gagal. Memindahkannya ke dalam AppSelect akan
                   menghilangkan label itu justru saat memuat/gagal, karena
                   selectnya sendiri belum dirender. -->
              <AppSelect
                v-else
                :options="examTypeOptions"
                :model-value="form.examTypeSlug"
                :disabled="isEdit"
                aria-label="Kategori ujian"
                placeholder="Pilih kategori ujian"
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
                label="Jenis ujian"
                @update:model-value="(value) => { if (isProductMode(value)) form.mode = value }"
              />
              <AppInlineMessage v-if="electiveModeWarning" type="warning" class="mt-2">
                {{ electiveModeWarning }}
              </AppInlineMessage>
            </div>

            <div v-if="form.mode === 'mini_tryout' && selectedExamType?.sections.length" ref="sectionBlockRef" class="scroll-mt-24">
              <!-- Satu kontrol untuk kedua keadaan: saat edit ini AppSelect
                   yang disabled, bukan input readonly yang menyamar jadi
                   select. Tutor melihat field yang sama dengan saat membuat,
                   hanya terkunci. -->
              <AppSelect
                :options="sectionTitleOptions"
                :model-value="form.sectionTitle"
                :disabled="isEdit"
                label="Subtes"
                placeholder="Pilih subtes"
                @update:model-value="(value) => { form.sectionTitle = String(value) }"
              />

              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="product-question-target" :class="FIELD_LABEL_CLASS">Jumlah soal</label>
                  <input id="product-question-target" v-model.number="form.questionTarget" type="number" min="1" max="200" placeholder="30" :disabled="!isFieldEditable('section')" :class="FIELD_CLASS">
                </div>
                <div>
                  <label for="product-duration-minutes" :class="FIELD_LABEL_CLASS">Durasi (menit)</label>
                  <input id="product-duration-minutes" v-model.number="form.durationMinutes" type="number" min="1" max="300" placeholder="60" :disabled="!isFieldEditable('section')" :class="FIELD_CLASS">
                </div>
              </div>
              <p class="mt-2 text-[0.82rem] text-muted">Boleh berbeda dari template subtes. Maksimal 200 soal dan 300 menit.</p>
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
        <!-- Dua kolom: form di kiri, thumbnail sebagai section sendiri di
             kanan. `items-start` menahan kedua kolom di puncaknya — tanpa itu
             item grid meregang setinggi baris dan `sticky` tidak punya ruang
             untuk bergerak. Di bawah 1024px keduanya menumpuk mengikuti urutan
             DOM: form dulu, thumbnail sesudahnya (thumbnail opsional, jadi
             tidak pantas mendorong judul/deskripsi ke bawah layar). -->
        <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div class="grid max-w-160 gap-5">
            <FormField
              id="product-title"
              v-model="form.title"
              label="Judul"
              placeholder="Contoh: Try Out SNBT Lengkap 2026"
              :disabled="!isFieldEditable('title')"
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
                :disabled="!isFieldEditable('details')"
              />
            </div>

            <div ref="includesBlockRef" class="scroll-mt-24">
              <span :class="FIELD_LABEL_CLASS">Yang kamu dapatkan</span>
              <p class="-mt-1 mb-3 text-[0.82rem] text-muted">Pilih minimal satu manfaat yang benar-benar tersedia di paket ini.</p>
              <div class="grid gap-2.5">
                <label
                  v-for="option in includeOptions"
                  :key="option.label"
                  class="flex items-start gap-3 rounded-sm border border-hairline px-3.5 py-3 text-[0.9rem]"
                  :class="isFieldEditable('details') ? 'bg-surface' : 'cursor-not-allowed bg-surface-sunken text-muted'"
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 accent-primary disabled:cursor-not-allowed"
                    :checked="form.includes.includes(option.label)"
                    :disabled="!isFieldEditable('details')"
                    @change="toggleInclude(option.label)"
                  >
                  <span>{{ option.label }}</span>
                </label>
              </div>
              <div class="mt-3 flex gap-2">
                <input
                  v-model="customInclude"
                  type="text"
                  placeholder="Tambahan lain (opsional)"
                  :disabled="!isFieldEditable('details')"
                  :class="FIELD_CLASS"
                  @keydown.enter.prevent="addCustomInclude"
                >
                <button
                  type="button"
                  class="shrink-0 rounded-sm border border-line px-3 text-[0.86rem] font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!isFieldEditable('details') || !customInclude.trim()"
                  @click="addCustomInclude"
                >
                  Tambah
                </button>
              </div>
              <p v-if="cleanIncludes(form.includes).some(item => !INCLUDE_OPTIONS.some(option => option.label === item))" class="mt-2 text-[0.82rem] text-muted">
                Poin tambahan tersimpan: {{ cleanIncludes(form.includes).filter(item => !INCLUDE_OPTIONS.some(option => option.label === item)).join(', ') }}
              </p>
              <p v-if="cleanIncludes(form.includes).length === 0" class="mt-2 text-[0.82rem] text-danger-ink">Pilih minimal satu poin.</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="product-price" :class="FIELD_LABEL_CLASS">Harga</label>
                <AppCurrencyField
                  id="product-price"
                  v-model="form.price"
                  placeholder="149.000"
                  :disabled="PRICE_INPUT_DISABLED || !isFieldEditable('price')"
                  :ariaDescribedby="priceHint ? 'product-price-hint' : undefined"
                  :ariaInvalid="priceHintBlocking || undefined"
                />
                <p
                  v-if="priceHint"
                  id="product-price-hint"
                  class="mt-2 text-[0.82rem]"
                  :class="priceHintBlocking ? 'text-danger-ink' : 'text-muted'"
                >
                  {{ priceHint }}
                </p>
              </div>
              <div>
                <label for="product-price-original" :class="FIELD_LABEL_CLASS">Harga coret</label>
                <AppCurrencyField
                  id="product-price-original"
                  v-model="form.priceOriginal"
                  placeholder="199.000"
                  :disabled="!isFieldEditable('priceOriginal')"
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
                class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-hairline transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                :class="form.shuffleQuestions ? 'bg-primary' : 'bg-surface-sunken'"
                @click="form.shuffleQuestions = !form.shuffleQuestions"
                :disabled="!isFieldEditable('details')"
              >
                <span
                  class="inline-block size-4 transform rounded-full bg-surface shadow-sm transition-transform"
                  :class="form.shuffleQuestions ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>

          <!-- Thumbnail: section sendiri di kolom kanan, ikut menempel saat
               kolom form di-scroll. `self-start` wajib (item grid akan
               meregang setinggi kolom kiri tanpa itu, dan sticky tidak pernah
               aktif). Offset `top-20` = 80px, mengukur header dashboard yang
               benar-benar ada di layar ini (`sticky top-0`, tinggi 65px) plus
               sedikit jarak — bukan `top-24` milik header situs publik di
               pages/packages/[slug].vue. -->
          <aside class="self-start lg:sticky lg:top-20">
            <h3 :class="FIELD_LABEL_CLASS">Sampul produk</h3>
            <TutorThumbnailField v-model="form.thumbnailUrl" :disabled="!isFieldEditable('details')" />
          </aside>
        </div>
      </DashboardPanel>

      <!-- ======================================================= Langkah 3: Isi -->
      <template v-else-if="step === 3">
        <DashboardPanel v-if="isLiveReadOnly" title="Isi produk" description="Isi produk tayang ditampilkan dalam mode baca saja.">
          <AppSectionMessage appearance="information">
            Produk yang sudah tayang tidak dapat mengubah soal atau anggota bundel. Kamu tetap bisa melihat seluruh isi wizard ini.
          </AppSectionMessage>

          <template v-if="isSingle">
            <TutorQuestionSummaryTable class="mt-4" :sections="detail?.sections ?? []" />
          </template>
          <div v-else class="mt-4 rounded-md border border-hairline bg-surface-alt p-5">
            <h3 class="text-[0.9rem] font-semibold">Anggota bundel</h3>
            <ul v-if="detail?.items?.length" class="mt-3 grid gap-2">
              <li
                v-for="item in detail.items"
                :key="item.productId"
                class="flex items-center justify-between gap-3 rounded-sm border border-hairline bg-surface px-3.5 py-3 text-[0.88rem]"
              >
                <span class="min-w-0 truncate font-semibold">{{ item.title }}</span>
                <span class="shrink-0 text-muted">{{ PRODUCT_STATUS_LABEL[item.status] }}</span>
              </li>
            </ul>
            <p v-else class="mt-3 text-[0.88rem] text-muted">Belum ada anggota bundel.</p>
          </div>
        </DashboardPanel>

        <template v-else-if="isSingle">
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
            :exam-type-slug="detail.examType ?? form.examTypeSlug"
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
                <dt class="text-[0.8rem] text-muted">Kategori ujian</dt>
                <dd class="mt-0.5 font-semibold">
                  {{ selectedExamType?.label || form.examTypeSlug || 'Belum dipilih' }}
                  <span class="block text-[0.82rem] font-normal text-muted">
                    {{ form.mode === 'mini_tryout'
                      ? `${PRODUCT_MODE_LABEL.mini_tryout}: ${isEdit ? (detail?.sections?.[0]?.title ?? 'Belum ditentukan') : (form.sectionTitle || 'Belum ditentukan')}`
                      : PRODUCT_MODE_LABEL.simulasi }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.8rem] text-muted">Judul</dt>
                <dd class="mt-0.5 font-semibold">{{ form.title || 'Belum diisi' }}</dd>
              </div>
              <div v-if="isSingle">
                <dt class="text-[0.8rem] text-muted">Durasi</dt>
                <dd class="mt-0.5 font-semibold">
                  {{ totalDurationMinutes > 0 ? formatDuration(totalDurationMinutes) : 'Belum diatur' }}
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
                    class="aspect-16/10 h-24 w-auto rounded-sm border border-hairline object-cover"
                  >
                  <span v-else class="text-[0.88rem] text-muted">Belum ada thumbnail</span>
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-[0.8rem] text-muted">Deskripsi</dt>
                <dd class="mt-0.5 whitespace-pre-line text-[0.88rem]">{{ form.description || 'Belum ada deskripsi' }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="isSingle" class="rounded-md border border-hairline bg-surface-alt p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <h3 class="text-[0.9rem] font-semibold">Daftar Soal</h3>

              <!-- Satu tombol per subtes: endpoint pratinjaunya menjalankan
                   satu subtes, bukan seluruh produk sekaligus. -->
              <div v-if="productId && simulatableSections.length" class="flex flex-wrap items-center gap-2">
                <span class="text-[0.8rem] text-muted">Simulasikan:</span>
                <template v-for="section in simulatableSections" :key="section.id">
                  <AppButton
                    v-if="section.ready"
                    :to="simulateHref(section.id)"
                    variant="outline"
                    size="xs"
                  >
                    <AppIcon name="play" :size="13" />
                    {{ section.title }}
                  </AppButton>
                  <span
                    v-else
                    class="inline-flex min-h-8 cursor-not-allowed items-center gap-2 rounded-xs border border-line px-3 text-[0.8rem] font-semibold text-faint"
                    :title="`Belum bisa disimulasikan — baru ${section.written} dari ${section.target} soal.`"
                  >
                    <AppIcon name="play" :size="13" />
                    {{ section.title }}
                  </span>
                </template>
              </div>
            </div>

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

          <AppSectionMessage v-if="submitProblems.length" appearance="warning" title="Paket belum dapat diajukan:">
            <ul class="grid list-disc gap-1 pl-5">
              <li v-for="problem in submitProblems" :key="problem">{{ problem }}</li>
            </ul>
          </AppSectionMessage>

          <AppSectionMessage v-if="submitError" appearance="warning">{{ submitError }}</AppSectionMessage>

          <AppSectionMessage v-if="isLiveReadOnly" appearance="information" title="Produk sudah tayang">
            Langkah ini hanya untuk melihat ringkasan. Produk tayang tidak perlu diajukan ulang.
          </AppSectionMessage>

          <!-- Tombol "Ajukan untuk tayang" sendiri ada di step footer fixed
               di bawah, di sebelah Kembali — bukan lagi di sini. -->
          <p v-if="!allComplete && !isLiveReadOnly" class="text-[0.82rem] text-muted">
            Lengkapi poin di atas terlebih dahulu. Tombol ajukan akan aktif otomatis setelah seluruh syarat terpenuhi.
          </p>
        </div>
      </DashboardPanel>

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
            :disabled="isLiveReadOnly || submitting || !allComplete"
            @click="submitForReview"
          >
            {{ submitting ? 'Mengajukan...' : 'Ajukan untuk tayang' }}
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
