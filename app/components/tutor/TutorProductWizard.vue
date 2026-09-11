<script setup lang="ts">
import type { ProductIdentity } from './wizard/ProductIdentityPicker.vue'
import type {
  ExamType,
  ProductMode,
  ProductType,
  TutorProductDetail,
  UpdateProductRequest,
} from '#shared/types/tutor-product'

/**
 * Wizard berkelompok untuk membuat dan mengedit produk tutor — 5 kelompok
 * langkah dari rework kategori SKD/TKA (docs/konsep-kategori-skd-tka.md §4):
 *
 *   1. Jenis Ujian     — kategori (SKD/TKA) → sub-kategori → jenis ujian →
 *                        subtes/mapel (SKD simulasi melewati langkah subtes).
 *   2. Konfigurasi     — jumlah soal & durasi (terkunci utk simulasi, bisa
 *                        diatur utk mini tryout), shuffle; SKD menampilkan
 *                        scoring + passing grade sebagai info terkunci.
 *   3. Detail Produk   — judul, deskripsi, thumbnail, includes, harga.
 *   4. Soal            — editor soal per subtes + impor CSV + wacana (TKA).
 *   5. Review & ajukan — ringkasan + hasil validasi server.
 *
 * Create mode (no productId) only walks steps 1–3: the API needs a title to
 * create a draft, so the POST happens when leaving step 3, then the page moves
 * to the edit URL — from there refreshes land back on the same draft.
 *
 * Edit mode autosaves a PATCH of whatever changed on every step change
 * ("Tersimpan" indicator), and questions/subtes/bundle items are saved through
 * their own endpoints inside step 4. Produk yang sudah tayang tetap bisa
 * menelusuri semua langkah; isi soalnya dibuka lewat tombol Edit soal jika
 * rollout edit konten live diaktifkan.
 */
const props = defineProps<{ productId?: string, bimbelId?: string }>()

const workspace = computed<ProductWorkspace | undefined>(() =>
  props.bimbelId ? { bimbelId: props.bimbelId } : undefined,
)
const productDashboardPath = computed(() => props.bimbelId
  ? `/dashboard/bimbel/${props.bimbelId}/products`
  : '/dashboard/tutor/products')

const isEdit = computed(() => Boolean(props.productId))

/* ----------------------------------------------- kepemilikan ("Terbitkan sebagai") */

/**
 * Pemilik paket ditentukan sekali, saat paket dibuat. Server menolak
 * memindahkannya sesudah itu, jadi pemilih ini tidak pernah tampil di mode
 * edit — pilihan yang tidak bisa dijalankan lebih buruk daripada tidak ada.
 *
 * Dari ruang kerja bimbel (`bimbelId` ada), pemiliknya sudah ditentukan URL
 * dan server menolak body yang menyebut bimbel lain; yang tampil di sana
 * adalah keadaannya, bukan pilihan.
 */
const bimbelMemberships = useBimbelMemberships()

onMounted(() => {
  // Layout dashboard sudah memuat keanggotaan di route bimbel — di ruang kerja
  // tutor tidak, jadi hanya di sanalah wizard perlu memintanya sendiri.
  if (!isEdit.value && !props.bimbelId) bimbelMemberships.refresh()
})

/** Bimbel tempat akun ini boleh menerbitkan: anggota aktif, dan bukan siswa. */
const publishableBimbels = computed(() =>
  bimbelMemberships.data.value.filter(item => item.status === 'active' && item.role !== 'student'),
)

const lockedOwnerBimbel = computed(() =>
  props.bimbelId
    ? bimbelMemberships.data.value.find(item => item.bimbelId === props.bimbelId) ?? null
    : null,
)

/** Kosong = paket pribadi tutor. Hanya diisi dari ruang kerja tutor. */
const ownerBimbelId = ref('')

/**
 * Satu opsi bukan pilihan: tutor tanpa keanggotaan aktif non-student tidak
 * diberi pemilih sama sekali, bukan pemilih berisi "Saya sendiri" saja.
 */
const showOwnerPicker = computed(() =>
  !isEdit.value && !props.bimbelId && publishableBimbels.value.length > 0,
)

const ownerOptions = computed(() => [
  { value: '', label: 'Saya sendiri' },
  ...publishableBimbels.value.map(item => ({ value: item.bimbelId, label: item.bimbelName })),
])

const OWNER_CONSEQUENCE = 'Paket milik bimbel masuk ke bank soal privat bimbel dan langsung terbuka untuk siswanya; paket pribadi dijual di katalog publik.'

/**
 * Pemilik yang dipilih menentukan ruang kerja paket yang baru dibuat — bukan
 * URL tempat wizard dibuka. Draft milik bimbel hidup di `/bimbel/:id/products`,
 * jadi PATCH lanjutan dan seluruh langkah 4–5 harus menuju ke sana.
 */
const createOwnerBimbelId = computed(() => props.bimbelId || ownerBimbelId.value)

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
} = useTutorProductDetail(props.productId ?? '', workspace.value)

onMounted(() => {
  if (props.productId) refreshDetail()
})

/** Own products, fetched lazily — only a bundle's step 3 and 4 need them. */
const own = useTutorProducts(workspace.value)
const ownRequested = ref(false)

/**
 * Aturan harga sebagaimana berlaku untuk pemanggil ini: lantai harga produk
 * berbayar, dan boleh-tidaknya paket gratis. Null selama belum termuat atau
 * saat gagal — checklist lalu bersikap longgar, karena submit di server tetap
 * penjaga sebenarnya dan kalimat penolakannya datang dari sana juga.
 */
const { data: pricingRule, refresh: refreshPricingRule } = useTutorPricingEligibility(workspace.value)

onMounted(refreshPricingRule)

/**
 * Harga hanya dikunci ketika checkout belum diaktifkan pada environment ini.
 * Staging menyalakan `NUXT_PUBLIC_PAYMENT_ENABLED` untuk menguji DOKU, jadi
 * tutor bisa mengisi harga berbayar; nilai Rp0 tetap dikirim sebagai paket
 * gratis dan checkout tidak perlu memanggil gateway.
 */
const { public: runtimeConfig } = useRuntimeConfig()
const PRICE_INPUT_DISABLED = runtimeConfig.paymentEnabled !== true
const TUTOR_LIVE_CONTENT_EDIT_ENABLED = runtimeConfig.tutorLiveContentEditEnabled === true

/* ------------------------------------------------------------------ form */

const form = reactive({
  type: 'single' as ProductType,
  examTypeSlug: '',
  mode: 'simulasi' as ProductMode,
  sectionTitle: '',
  /** Posisi kurikulum paket latihan; null untuk paket dari jenis ujian. */
  schoolPractice: null as SchoolPractice | null,
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

/**
 * Ready-made "Yang kamu dapatkan" bullets. Two of them used to promise a
 * "Simulasi antarmuka CAT BKN" and a "Simulasi antarmuka ujian TKA
 * (Pusmendik)"; both are gone, because every exam room now wears Zenko's own
 * chrome and neither claim was true any more.
 *
 * `appliesTo` filters rather than sorts: a bullet only offered when it is
 * actually true of this package cannot be ticked onto one where it is false.
 */
const INCLUDE_OPTIONS: { label: string, appliesTo?: (exam: ExamType) => boolean }[] = [
  { label: 'Pembahasan tertulis tiap soal' },
  { label: 'Pembahasan video untuk setiap soal' },
  { label: 'Analisis skor per bagian' },
  { label: 'Akses selamanya, bisa diulang kapan saja' },
  { label: 'Grup diskusi bersama tutor' },
  {
    label: 'Waktu pengerjaan per bagian seperti ujian aslinya',
    appliesTo: exam => exam.timerPolicy === 'sequential',
  },
  {
    label: 'Skor otomatis skala 0–100 seperti ujian aslinya',
    appliesTo: exam => exam.scoreScale === 'normalized_100',
  },
  {
    label: 'Skor dan ambang batas resmi per bagian',
    appliesTo: exam => exam.sections.some(section => section.passingGrade != null),
  },
]

const includeOptions = computed(() => {
  const exam = selectedExamType.value
  return INCLUDE_OPTIONS.filter(option => !option.appliesTo || (exam ? option.appliesTo(exam) : false))
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

/* ------------------------------------------- kelompok 1: identitas paket */

/**
 * Identitas paket — rumpun, program, mode, dan bagian — dipilih di dialog
 * ProductIdentityPicker, bukan sebagai tumpukan dropdown yang tiap satunya
 * baru muncul setelah yang di atasnya dijawab. Wizard menyimpan hasilnya saja.
 */
const productIdentity = computed<ProductIdentity>(() => ({
  examTypeSlug: form.examTypeSlug,
  mode: form.mode,
  sectionTitle: form.sectionTitle,
  schoolPractice: form.schoolPractice,
}))

function applyIdentity(identity: ProductIdentity) {
  form.examTypeSlug = identity.examTypeSlug
  form.mode = identity.mode
  form.sectionTitle = identity.sectionTitle
  form.schoolPractice = identity.schoolPractice
}

/**
 * Mengganti identitas paket setelah ada isian yang bergantung padanya (bagian
 * terpilih, angka konfigurasi yang diketik sendiri) meminta konfirmasi dulu —
 * pilihan baru mengatur ulang konteks itu. Soal sendiri baru bisa ada di edit
 * mode, dan di sana identitasnya memang terkunci (server juga menolaknya).
 */
function confirmContextChange(): boolean {
  if (isEdit.value) return false
  const touchedConfig
    = form.sectionTitle !== ''
      || (form.questionTarget !== null && form.questionTarget !== appliedTemplate.questionTarget)
      || (form.durationMinutes !== null && form.durationMinutes !== appliedTemplate.durationMinutes)
  if (!touchedConfig) return true
  return window.confirm(
    'Mengganti pilihan ini mengatur ulang subtes/mapel dan konfigurasi jumlah soal/durasi yang sudah kamu isi. Lanjutkan?',
  )
}

/** Paket ini butuh satu bagian terpilih — cermin aturan server. */
const needsSectionTitle = computed(() =>
  isSingle.value && needsSectionChoice(selectedExamType.value, form.mode),
)

/** Jumlah soal & durasi terkunci mengikuti standar resmi yang dipublikasikan. */
const configLocked = computed(() => isConfigLocked(selectedExamType.value, form.mode))

/** Template bagian yang dipilih. */
const selectedSectionTemplate = computed(() =>
  selectedExamType.value?.sections.find(section => section.title === form.sectionTitle) ?? null,
)

/**
 * Durasi total simulasi menurut standar resminya: total resmi jenis ujian
 * saat ada (SKD: 100 menit), selain itu jumlah durasi template.
 */
const simulasiTotalMinutes = computed(() => {
  const exam = selectedExamType.value
  if (!exam) return 0
  if (exam.simulasiTotalMinutes) return exam.simulasiTotalMinutes
  return Math.round(
    lockedSections.value.reduce((sum, section) => sum + section.durationSeconds, 0) / 60,
  )
})

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

/** Sub-kategori turunan server (SKD → CPNS/Kedinasan, TKA → jenjang). */
const derivedSubcategory = computed(() => {
  if (!isSingle.value) return ''
  return detail.value?.subcategory || selectedExamType.value?.subcategory || ''
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

/**
 * A stale subtest choice from a previous exam type (or from switching back to
 * Simulasi) must never leak into a later mini-tryout submission.
 *
 * "Stale" is decided by whether the title still names a section of the exam
 * type now selected, and whether this mode asks for one at all — NOT by the
 * mere fact that the identity changed. Clearing unconditionally was correct
 * while the three fields were three separate dropdowns changed one at a time;
 * once they became one dialog that applies all of them together
 * (ProductIdentityPicker), this watcher fired after applyIdentity had already
 * written the section and wiped it on the same tick. Every package that needs
 * a section — every mini tryout, and every blueprint sold one section at a
 * time — was then stuck on "Pilih satu bagian dulu sebelum lanjut", with the
 * only control that can choose one handing back an answer this threw away.
 */
watch([() => form.examTypeSlug, () => form.mode], () => {
  if (isEdit.value) return

  const stillBelongs = form.sectionTitle !== ''
    && needsSectionChoice(selectedExamType.value, form.mode)
    && (selectedExamType.value?.sections.some(section => section.title === form.sectionTitle) ?? false)
  if (!stillBelongs) form.sectionTitle = ''

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
  { value: 'single', label: 'Tryout tunggal' },
  { value: 'bundle', label: 'Bundling' },
]

/* -------------------------------------- kelompok 2: standar yang berlaku */

/**
 * Bagian-bagian paket ini beserta angka standarnya, sebagai baris ringkas
 * untuk langkah Konfigurasi.
 *
 * Menggantikan tiga blok terpisah (daftar subtes + kalimat total + strip chip
 * penilaian) yang mengulang nama subtes yang sama sampai tiga kali dan
 * membuat layar itu terbaca penuh padahal tidak ada satu pun yang bisa diubah.
 */
interface LockedSectionRow {
  title: string
  questionTarget: number
  /** Kept in seconds so summing them never rounds twice. */
  durationSeconds: number
  scoring: string
  passingGrade: number | null
}

const lockedSections = computed<LockedSectionRow[]>(() => {
  const exam = selectedExamType.value
  if (!exam) return []
  // A one-section package shows the section it was built from; anything else
  // shows every section the simulasi copies.
  const sections = needsSectionTitle.value
    ? (selectedSectionTemplate.value ? [selectedSectionTemplate.value] : [])
    : exam.sections

  return sections.map(section => ({
    title: section.title,
    questionTarget: section.questionTarget,
    durationSeconds: sectionSeconds(section),
    scoring: section.scoringMode === 'weighted'
      ? `bobot 1–${section.maxOptionWeight || 5} per opsi`
      : `+${section.pointsCorrect} per jawaban benar`,
    passingGrade: section.passingGrade ?? null,
  }))
})

const lockedTotalQuestions = computed(() =>
  lockedSections.value.reduce((sum, section) => sum + section.questionTarget, 0),
)

// AppSelect works in plain string|number; narrow its `update:modelValue`
// back onto these typed fields instead of casting.
function isProductType(value: string | number): value is ProductType {
  return value === 'single' || value === 'bundle'
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
  form.schoolPractice = loaded.schoolPractice ?? null
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

/** Produk tayang tetap bisa menelusuri wizard dan punya tombol edit isi soal. */
const isLiveProduct = computed(() => isEdit.value && detail.value?.status === 'live')
/**
 * Produk live masuk ke langkah Isi dalam mode baca agar tutor tidak langsung
 * mengubah paket yang sudah tayang. Tombol "Edit soal" menjadi titik masuk
 * eksplisit; server tetap menjadi penjaga terakhir lewat feature flag yang
 * sama pada endpoint question-content.
 */
const liveContentEditing = ref(false)
type SectionEditorHandle = { saveActiveQuestion: () => Promise<boolean> }
const sectionEditorRef = ref<SectionEditorHandle | null>(null)
const isLiveReadOnly = computed(() =>
  isLiveProduct.value && (!TUTOR_LIVE_CONTENT_EDIT_ENABLED || !liveContentEditing.value),
)

function startLiveContentEditing() {
  if (!TUTOR_LIVE_CONTENT_EDIT_ENABLED) return
  liveContentEditing.value = true
}

const canEditProduct = computed(() => {
  if (!isEdit.value) return true
  if (!detail.value) return false
  return ['draft', 'rejected', 'live'].includes(detail.value.status)
})

/**
 * Yang boleh berubah pada metadata setelah tayang hanya harga — judul ikut
 * terkunci karena itulah produk yang sudah dibeli dan sudah diindeks katalog.
 * Isi soal punya rollout terpisah untuk staging dan ditegakkan server pada
 * endpoint question-content; kalau salah satu berubah, ubah keduanya.
 */
function isFieldEditable(field: 'title' | 'price' | 'priceOriginal' | 'section' | 'details') {
  if (!isEdit.value || !detail.value) return true
  if (detail.value.status === 'draft' || detail.value.status === 'rejected') return true
  return detail.value.status === 'live' && ['price', 'priceOriginal'].includes(field)
}

const LOCKED_EXPLANATION: Partial<Record<TutorProductDetail['status'], string>> = {
  review: 'Produk sedang ditinjau tim Zenko. Kamu bisa mengeditnya lagi jika hasil tinjauan keluar.',
  live: 'Produk sudah tayang. Metadata produk tetap terkunci karena produk sudah dibeli dan tampil di katalog. Isi soal dapat diedit pada environment yang mengaktifkan fitur ini.',
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
  if (detail.value.status === 'live' && TUTOR_LIVE_CONTENT_EDIT_ENABLED) {
    return 'Produk sudah tayang. Metadata produk tetap terkunci, tetapi isi soal dapat diedit. Perubahan soal berlaku untuk paket yang dibuka setelah perubahan disimpan.'
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
    await updateTutorProduct(props.productId, patch, workspace.value)
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
    saveError.value = tutorApiMessage(cause, 'Draft belum berhasil disimpan. Coba lagi.')
    return false
  }
}

/* ----------------------------------------------------------------- steps */

const STEPS = [
  // "Identitas Paket", not "Jenis Ujian": a school exercise has no exam type,
  // and the step is where both kinds of package get their identity.
  { n: 1, label: 'Identitas Paket' },
  { n: 2, label: 'Konfigurasi Ujian' },
  { n: 3, label: 'Detail Produk' },
  { n: 4, label: 'Soal' },
  { n: 5, label: 'Review & ajukan' },
] as const

const LAST_STEP = 5
/** Langkah terakhir create mode — POST draft terjadi saat meninggalkannya. */
const LAST_CREATE_STEP = 3

const route = useRoute()
const router = useRouter()

function initialStep(): number {
  const raw = Array.isArray(route.query.langkah) ? route.query.langkah[0] : route.query.langkah
  const parsed = Number.parseInt(raw ?? '', 10)
  const max = isEdit.value ? LAST_STEP : LAST_CREATE_STEP
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
  if (isLiveProduct.value && !TUTOR_LIVE_CONTENT_EDIT_ENABLED && target !== 3) {
    return failStep('Produk tayang hanya bisa mengubah harga di langkah Detail Produk.', 'product-title')
  }
  if (target > 1 && isSingle.value && !form.examTypeSlug && !form.schoolPractice) {
    return failStep('Pilih identitas paket dulu sebelum lanjut.', examTypeBlockRef)
  }
  if (target > 1 && !isEdit.value && needsSectionTitle.value && !form.sectionTitle) {
    return failStep('Pilih satu bagian dulu sebelum lanjut.', examTypeBlockRef)
  }
  if (target > 3 && !form.title.trim()) {
    return failStep('Isi judul produk dulu sebelum lanjut.', 'product-title')
  }
  if (target > 3 && cleanIncludes(form.includes).length === 0) {
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

  // Create mode: past step 3 (Detail Produk) the draft must exist first.
  if (!props.productId && target > LAST_CREATE_STEP) {
    await createAndContinue()
    return
  }

  if (step.value === 4 && target !== 4 && !isLiveReadOnly.value) {
    const savedQuestion = await sectionEditorRef.value?.saveActiveQuestion()
    if (savedQuestion === false) return
  }

  if (!(await persist())) return

  step.value = target
  syncQuery()
}

const creating = ref(false)

/** POST draft baru + PATCH info tambahan, lalu pindah ke URL edit langkah 4. */
async function createAndContinue() {
  if (creating.value) return
  creating.value = true
  saveState.value = 'saving'
  try {
    // Sebuah paket diidentifikasi lewat jenis ujian ATAU posisi kurikulum,
    // tidak pernah keduanya — server menolak body yang menyebut dua-duanya.
    // questionTarget/durationMinutes hanya dikirim saat memang boleh diatur:
    // server menjawab 400 kalau dikirim pada simulasi yang terkunci standar.
    const practice = isSingle.value ? form.schoolPractice : null
    const sendConfig = isSingle.value && !configLocked.value
    const created = await createTutorProduct({
      type: form.type,
      title: form.title.trim(),
      // Dari ruang kerja bimbel pemiliknya sudah dari URL, jadi tidak
      // diulang di body; dari ruang kerja tutor inilah satu-satunya cara
      // pilihan "Terbitkan sebagai" sampai ke server.
      ...(!props.bimbelId && ownerBimbelId.value ? { ownerBimbelId: ownerBimbelId.value } : {}),
      ...(practice ? { schoolPractice: practice } : {}),
      ...(isSingle.value && !practice && form.examTypeSlug ? { examTypeSlug: form.examTypeSlug } : {}),
      mode: form.mode,
      ...(needsSectionTitle.value && form.sectionTitle ? { sectionTitle: form.sectionTitle } : {}),
      ...(sendConfig && form.questionTarget ? { questionTarget: form.questionTarget } : {}),
      ...(sendConfig && form.durationMinutes ? { durationMinutes: form.durationMinutes } : {}),
    }, workspace.value)

    // Draft ini sekarang milik pemilik yang dipilih; sisa wizard mengikutinya.
    const ownedWorkspace: ProductWorkspace | undefined = createOwnerBimbelId.value
      ? { bimbelId: createOwnerBimbelId.value }
      : undefined
    const ownedDashboardPath = createOwnerBimbelId.value
      ? `/dashboard/bimbel/${createOwnerBimbelId.value}/products`
      : productDashboardPath.value

    const patch: UpdateProductRequest = {}
    if (form.description.trim()) patch.description = form.description.trim()
    if (form.thumbnailUrl.trim()) patch.thumbnailUrl = form.thumbnailUrl.trim()
    const cleanedIncludes = cleanIncludes(form.includes)
    if (cleanedIncludes.length) patch.includes = cleanedIncludes
    if (form.price) patch.price = form.price
    if (form.priceOriginal) patch.priceOriginal = form.priceOriginal
    if (isSingle.value && form.shuffleQuestions) patch.shuffleQuestions = form.shuffleQuestions
    if (Object.keys(patch).length) await updateTutorProduct(created.id, patch, ownedWorkspace)

    saveState.value = 'saved'
    // Everything typed so far now lives on the server; the leave guard must
    // not fire on our own redirect.
    form.title = ''
    form.description = ''
    form.thumbnailUrl = ''
    form.includes = []
    await navigateTo({
      path: `${ownedDashboardPath}/${created.id}/edit`,
      query: { langkah: '4' },
      replace: true,
    })
  }
  catch (cause) {
    saveState.value = 'error'
    saveError.value = tutorApiMessage(cause, 'Draft produk belum berhasil dibuat. Coba lagi.')
  }
  finally {
    creating.value = false
  }
}

const stepReachable = (target: number) =>
  isEdit.value || target <= LAST_CREATE_STEP

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
 * langsung dari `sections` (yang sudah dipakai langkah Soal) selalu akurat.
 *
 * Kecuali simulasi dengan total resmi (SKD: 100 menit satu timer): di sana
 * jumlah durasi per subtes (105) BUKAN durasi ujiannya — pakai total resminya.
 */
const totalDurationMinutes = computed(() => {
  if (form.mode === 'simulasi' && selectedExamType.value?.simulasiTotalMinutes) {
    return selectedExamType.value.simulasiTotalMinutes
  }
  return summarySections.value.reduce((sum, section) => sum + section.durationMinutes, 0)
})

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
  return `${productDashboardPath.value}/${props.productId}/simulasikan?section=${encodeURIComponent(sectionId)}`
}

/* --------------------------------------------------------------- submit */

const submitting = ref(false)
const submitted = ref(false)
const submitProblems = ref<string[]>([])
const submitError = ref('')
const isBimbelPrivateProduct = computed(() => Boolean(props.bimbelId) && detail.value?.visibility !== 'public')

async function submitForReview() {
  if (!props.productId) return
  if (isLiveProduct.value && !TUTOR_LIVE_CONTENT_EDIT_ENABLED) {
    toast.info('Produk sudah tayang.', 'Pengajuan ulang belum tersedia di environment ini.')
    return
  }
  submitError.value = ''
  submitProblems.value = []

  // Harga yang baru diketik harus sampai ke server sebelum divalidasi.
  if (!(await persist())) return

  submitting.value = true
  try {
    await submitTutorProduct(
      props.productId,
      workspace.value,
      detail.value?.visibility ?? (props.bimbelId ? 'bimbel' : 'public'),
    )
    submitted.value = true
    // Produk ini meninggalkan draft, jadi apa yang tayang milik tutor bisa
    // berubah — dan dengan itu, kelayakan paket gratis berikutnya.
    await refreshPricingRule()
  }
  catch (cause) {
    submitProblems.value = tutorSubmitProblems(cause)
    if (submitProblems.value.length === 0) {
      submitError.value = tutorApiMessage(cause, 'Produk belum berhasil diajukan. Coba lagi sebentar lagi.')
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

</script>

<template>
  <!-- pb-24 clears the fixed step footer below, so the last panel's content
       never sits hidden behind it while scrolled to the bottom. -->
  <div class="grid gap-6 pb-24">
    <AppPageHeader
      :title="isEdit ? 'Edit produk' : 'Buat produk'"
      :description="props.bimbelId ? 'Susun paket untuk bank soal bimbel. Setelah tayang, paket langsung terbuka untuk seluruh siswa bimbel.' : 'Susun tryout, lengkapi infonya, lalu ajukan untuk tayang di katalog.'"
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
        <p class="text-muted">{{ detailError || 'Produk belum berhasil dimuat.' }}</p>
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
      <AppButton :to="productDashboardPath" size="sm" class="mt-5">Kembali ke daftar produk</AppButton>
    </DashboardPanel>

    <!-- Submitted: replace the wizard so nothing invites further edits. -->
    <DashboardPanel v-else-if="submitted" :title="isBimbelPrivateProduct ? 'Paket tayang di bank soal' : 'Produk diajukan untuk tayang'">
      <div class="py-4 text-center">
        <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft" aria-hidden="true">
          <IconCheck class="h-7 w-7 text-success-ink" />
        </span>
        <p class="mx-auto mt-4 max-w-105 leading-[1.7] text-muted">
          {{ isBimbelPrivateProduct
            ? 'Paket sudah aktif di bank soal privat dan terbuka untuk seluruh siswa bimbel yang keanggotaannya aktif.'
            : 'Tim kurasi Zenko akan segera meninjau paket soalmu. Begitu disetujui, paket akan tayang di katalog.' }}
        </p>
        <AppButton :to="productDashboardPath" class="mt-6">Kembali ke daftar produk</AppButton>
      </div>
    </DashboardPanel>

    <template v-else>
      <AppAlert v-if="isEdit && detail?.status === 'rejected' && detail.rejectReason" variant="warning" title="Paket soal memerlukan revisi">
        {{ detail.rejectReason }}. Sesuaikan materi soalnya, lalu ajukan kembali.
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

      <!-- ============================================ Kelompok 1: Identitas -->
      <DashboardPanel v-if="step === 1">
        <!-- Kontrol di kiri, keterangan umum di kanan. Kolom kanan sengaja
             tidak lagi berubah mengikuti pilihan: penjelasan tiap pilihan kini
             ada di dialog tempat pilihan itu dibuat, bersama pilihannya. Yang
             tersisa di sini hanya yang berlaku sepanjang langkah ini. -->
        <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div class="grid max-w-160 gap-5">
            <!-- Kepemilikan: keadaan di ruang kerja bimbel, pilihan di ruang
                 kerja tutor, dan tidak ada sama sekali untuk tutor tanpa
                 keanggotaan aktif maupun di mode edit. -->
            <AppSectionMessage
              v-if="!isEdit && lockedOwnerBimbel"
              appearance="information"
              title="Terbitkan sebagai"
            >
              Paket ini dibuat di ruang kerja <strong class="font-semibold text-ink">{{ lockedOwnerBimbel.bimbelName }}</strong>,
              jadi bimbel itu pemiliknya dan tidak bisa diubah di sini. {{ OWNER_CONSEQUENCE }}
            </AppSectionMessage>

            <div v-else-if="showOwnerPicker">
              <AppSelect
                :options="ownerOptions"
                :model-value="ownerBimbelId"
                label="Terbitkan sebagai"
                @update:model-value="(value) => { ownerBimbelId = String(value) }"
              />
              <p class="mt-1.5 text-[0.8rem] leading-[1.6] text-muted">
                {{ OWNER_CONSEQUENCE }} Pemiliknya tidak bisa dipindah setelah paket dibuat.
              </p>
            </div>

            <AppSelect
              :options="PRODUCT_TYPE_OPTIONS"
              :model-value="form.type"
              :disabled="isEdit"
              label="Tipe"
              @update:model-value="(value) => { if (isProductType(value)) form.type = value }"
            />

            <template v-if="isSingle">
              <p v-if="examTypesPending" class="text-[0.9rem] text-muted">Memuat pilihan ujian...</p>
              <p v-else-if="examTypesError" class="text-[0.9rem] text-muted">
                Pilihan ujian belum berhasil dimuat. Muat ulang halaman untuk mencoba lagi.
              </p>
              <div v-else ref="examTypeBlockRef" class="scroll-mt-24">
                <ProductIdentityPicker
                  :identity="productIdentity"
                  :exam-types="examTypes"
                  :locked="isEdit"
                  :confirm-change="confirmContextChange"
                  @apply="applyIdentity"
                />
              </div>
            </template>
          </div>

          <!-- Kolom info: keterangan umum langkah ini, tidak berubah mengikuti
               pilihan. `self-start` wajib supaya item grid tidak meregang
               setinggi kolom kiri (sticky tidak akan punya ruang gerak);
               offset `top-20` mengukur header dashboard yang `sticky top-0`. -->
          <aside class="self-start lg:sticky lg:top-20">
            <div class="grid gap-4 rounded-md border border-hairline bg-surface-alt px-4 py-4 text-[0.84rem] leading-[1.65] text-muted">
              <div>
                <h3 class="text-[0.9rem] font-semibold text-ink">Tipe paket</h3>
                <p class="mt-1">
                  <strong class="font-semibold text-ink">Tryout tunggal</strong> adalah satu paket utuh dengan
                  bagian dan soal yang kamu susun sendiri.
                  <strong class="font-semibold text-ink">Bundling</strong> menggabungkan beberapa tryout tunggal
                  milikmu yang sudah tayang menjadi satu harga; anggotanya dipilih di langkah Soal.
                </p>
              </div>

              <div class="border-t border-hairline pt-4">
                <h3 class="text-[0.9rem] font-semibold text-ink">Identitas paket</h3>
                <p class="mt-1">
                  Identitas menentukan aturan yang berlaku sesudahnya: bagian, jumlah soal, durasi, jenis soal
                  yang boleh dipakai, dan cara skornya dibaca. Kategori katalog diturunkan dari sini — tidak ada
                  field kategori yang perlu kamu isi.
                </p>
              </div>

              <p class="border-t border-hairline pt-4">
                Setelah paket dibuat, identitasnya terkunci. Jumlah soal dan durasi paket yang tidak mengikuti
                standar resmi masih bisa disesuaikan di langkah Konfigurasi Ujian selama berstatus draft.
              </p>
            </div>
          </aside>
        </div>
      </DashboardPanel>

      <!-- ======================================== Kelompok 2: Konfigurasi Ujian -->
      <DashboardPanel
        v-else-if="step === 2"
        title="Konfigurasi Ujian"
        description="Jumlah soal, durasi, dan opsi pengerjaan paket ini."
      >
        <!-- Satu kolom. Isi langkah ini hanya dua hal — angka yang bisa diatur
             dan susunan yang berlaku — dan keduanya adalah isi, bukan
             keterangan; memaksanya jadi dua kolom cuma menyempitkan tabelnya. -->
        <div v-if="isSingle" class="grid max-w-200 gap-6">
          <!-- Bisa diatur: mini tryout dan paket latihan mata pelajaran,
               terisi otomatis dari angka standarnya sebagai titik awal. -->
          <div v-if="!configLocked && !isCustom">
            <p class="text-[0.88rem] text-muted">
              Jumlah soal dan durasi paket ini kamu yang menentukan.
            </p>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label for="product-question-target" :class="FIELD_LABEL_CLASS">Jumlah soal</label>
                <input id="product-question-target" v-model.number="form.questionTarget" type="number" min="1" max="200" placeholder="30" :disabled="!isFieldEditable('section')" :class="FIELD_CLASS">
              </div>
              <div>
                <label for="product-duration-minutes" :class="FIELD_LABEL_CLASS">Durasi (menit)</label>
                <input id="product-duration-minutes" v-model.number="form.durationMinutes" type="number" min="1" max="300" placeholder="60" :disabled="!isFieldEditable('section')" :class="FIELD_CLASS">
              </div>
            </div>
            <p class="mt-2 text-[0.82rem] text-muted">Maksimal 200 soal dan 300 menit.</p>
          </div>

          <!-- Produk custom/legacy: subtesnya diatur di langkah Soal. -->
          <AppSectionMessage v-else-if="isCustom" appearance="information">
            Produk dengan jenis ujian custom mengatur subtes, jumlah soal, dan durasinya
            langsung di langkah Soal.
          </AppSectionMessage>

          <!-- Susunan yang berlaku, satu baris per bagian: soal, durasi,
               penilaian, dan ambangnya sekaligus. -->
          <section v-if="lockedSections.length" class="overflow-hidden rounded-md border border-hairline">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-surface-alt px-4 py-3">
              <h3 class="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink">
                <AppIcon v-if="configLocked" name="lock-simple" :size="14" aria-hidden="true" class="text-muted" />
                Susunan {{ selectedExamType?.label }}
              </h3>
              <p v-if="configLocked" class="text-[0.82rem] font-semibold text-muted tabular-nums">
                {{ lockedTotalQuestions }} soal · {{ simulasiTotalMinutes }} menit
              </p>
            </div>

            <p class="border-b border-hairline px-4 py-2.5 text-[0.84rem] leading-[1.6] text-muted">
              {{ configLocked
                ? 'Susunan ini terkunci mengikuti standar resmi. Tugasmu tinggal mengisi soalnya.'
                : 'Angka standar bagian ini, sebagai pembanding jumlah soal dan durasi yang kamu isi.' }}
            </p>

            <ul class="divide-y divide-hairline">
              <li
                v-for="section in lockedSections"
                :key="section.title"
                class="grid gap-1 px-4 py-3 text-[0.86rem] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"
              >
                <span>
                  <span class="font-semibold text-ink">{{ section.title }}</span>
                  <span class="mt-0.5 block text-[0.82rem] text-muted">
                    {{ section.scoring }}<template v-if="section.passingGrade != null"> · ambang batas {{ section.passingGrade }}</template>
                  </span>
                </span>
                <span class="shrink-0 text-muted tabular-nums sm:text-right">
                  {{ section.questionTarget }} soal · {{ formatMinutes(section.durationSeconds) }}
                </span>
              </li>
            </ul>

            <p v-if="selectedExamType?.scoreDisclaimer" class="flex items-start gap-2 border-t border-hairline bg-surface-alt px-4 py-3 text-[0.82rem] leading-[1.6] text-muted">
              <AppIcon name="info" :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
              {{ selectedExamType.scoreDisclaimer }}
            </p>
          </section>

          <!-- Acak soal — berlaku untuk semua produk single. -->
          <div class="flex items-start justify-between gap-4 rounded-md border border-hairline bg-surface-alt px-4 py-3.5">
            <div>
              <label id="product-shuffle-questions-label" for="product-shuffle-questions" class="text-[0.9rem] font-semibold">
                Acak urutan soal saat dikerjakan siswa
              </label>
              <p class="mt-1 text-[0.82rem] text-muted">
                Tiap siswa mendapat urutan soal berbeda saat mengerjakan tryout, tapi tetap sama
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
              :disabled="!isFieldEditable('details')"
              @click="form.shuffleQuestions = !form.shuffleQuestions"
            >
              <span
                class="inline-block size-4 transform rounded-full bg-surface shadow-sm transition-transform"
                :class="form.shuffleQuestions ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <AppSectionMessage v-else appearance="information">
          Bundling tidak punya konfigurasi ujian sendiri — tiap produk anggotanya membawa
          konfigurasinya masing-masing.
        </AppSectionMessage>
      </DashboardPanel>

      <!-- ============================================ Kelompok 3: Detail Produk -->
      <DashboardPanel v-else-if="step === 3">
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
              placeholder="Contoh: Simulasi SKD CPNS Lengkap 2026"
              :disabled="!isFieldEditable('title')"
            />

            <div>
              <label for="product-description" :class="FIELD_LABEL_CLASS">Deskripsi</label>
              <textarea
                id="product-description"
                v-model="form.description"
                rows="4"
                placeholder="Jelaskan isi tryout, untuk siapa, dan apa yang membedakannya."
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

            <!-- Acak soal pindah ke langkah Konfigurasi Ujian (kelompok 2). -->
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

      <!-- ==================================================== Kelompok 4: Soal -->
      <template v-else-if="step === 4">
        <DashboardPanel v-if="isLiveReadOnly" title="Isi produk" description="Isi produk tayang ditampilkan dalam mode baca saja.">
          <AppSectionMessage appearance="information">
            Produk yang sudah tayang tidak langsung berubah. Klik Edit soal jika ingin memperbarui isi paket ini.
            <template #actions>
              <AppButton
                v-if="TUTOR_LIVE_CONTENT_EDIT_ENABLED"
                type="button"
                size="sm"
                @click="startLiveContentEditing"
              >
                <AppIcon name="pencil-simple" :size="14" aria-hidden="true" />
                Edit soal
              </AppButton>
            </template>
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
            :workspace="workspace"
            @refresh="refreshDetail"
          />
          <TutorSectionEditor
            v-if="productId && detail"
            ref="sectionEditorRef"
            :product-id="productId"
            :sections="detail.sections ?? []"
            :is-custom="isCustom"
            :exam-type-slug="detail.examType ?? form.examTypeSlug"
            :exam-type="selectedExamType"
            :workspace="workspace"
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

      <!-- ======================================== Kelompok 5: Review & ajukan -->
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
                  {{ derivedCategory && derivedSubcategory
                    ? `${derivedCategory} · ${derivedSubcategory}`
                    : (selectedExamType?.label || form.examTypeSlug || 'Belum dipilih') }}
                  <span class="block text-[0.82rem] font-normal text-muted">
                    {{ form.mode === 'mini_tryout'
                      ? `Mini Tryout: ${isEdit ? (detail?.sections?.[0]?.title ?? 'Belum ditentukan') : (form.sectionTitle || 'Belum ditentukan')}`
                      : `Simulasi${needsSectionTitle ? `: ${isEdit ? (detail?.sections?.[0]?.title ?? 'Belum ditentukan') : (form.sectionTitle || 'Belum ditentukan')}` : ' (standar resmi)'}` }}
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
                  <AppThumbnail
                    :src="form.thumbnailUrl"
                    :alt="form.thumbnailUrl ? '' : 'Sampul bawaan Zenko — paket ini belum punya sampul sendiri'"
                    class="aspect-16/10 h-24 w-auto rounded-sm border border-hairline object-cover"
                  />
                  <span v-if="!form.thumbnailUrl" class="mt-1.5 block text-[0.82rem] text-muted">
                    Belum ada sampul sendiri — katalog memakai gambar bawaan Zenko.
                  </span>
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
            Untuk mengubah isi, buka langkah Isi dan klik Edit soal. Setelah perubahan disimpan, ajukan ulang di langkah ini agar masuk review admin.
          </AppSectionMessage>

          <!-- Tombol "Ajukan untuk tayang" sendiri ada di step footer fixed
               di bawah, di sebelah Kembali — bukan lagi di sini. -->
          <p v-if="!allComplete && !isLiveReadOnly" class="text-[0.82rem] text-muted">
            Masih ada syarat yang belum lengkap. Kamu tetap bisa klik tombol ajukan untuk melihat validasi terbaru dari server.
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
            v-if="step < 5 && stepReachable(step + 1)"
            type="button"
            :disabled="creating || saveState === 'saving'"
            @click="goTo(step + 1)"
          >
            {{ creating ? 'Menyimpan draft...' : 'Lanjut' }}
          </AppButton>
          <AppButton
            v-else-if="step === 3 && !isEdit"
            type="button"
            :disabled="creating"
            @click="goTo(4)"
          >
            {{ creating ? 'Menyimpan draft...' : 'Simpan draft & lanjut' }}
          </AppButton>
          <AppButton
            v-else-if="step === 5"
            type="button"
            :disabled="submitting"
            @click="submitForReview"
          >
            {{ submitting
              ? 'Mengajukan...'
              : isLiveProduct
                ? 'Ajukan ulang untuk ditinjau'
                : isBimbelPrivateProduct
                  ? 'Tayangkan ke bank soal'
                  : 'Ajukan untuk tayang' }}
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
