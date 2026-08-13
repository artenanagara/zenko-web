<script setup lang="ts">
import type {
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
  title: '',
  description: '',
  thumbnailUrl: '',
  category: '',
  price: null as number | null,
  priceOriginal: null as number | null,
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
} | null>(null)

// Only the first load hydrates the form: refreshDetail() runs after every
// question/subtes change in step 3, and re-hydrating then would clobber
// whatever is being typed into the other steps' fields.
watch(detail, (loaded) => {
  if (!loaded || savedFields.value) return

  form.type = loaded.type
  form.examTypeSlug = loaded.examType ?? ''
  form.title = loaded.title
  form.description = loaded.description ?? ''
  form.thumbnailUrl = loaded.thumbnailUrl ?? ''
  form.category = loaded.category ?? ''
  form.price = loaded.price > 0 ? loaded.price : null
  form.priceOriginal = loaded.priceOriginal > 0 ? loaded.priceOriginal : null
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
  { n: 4, label: 'Harga & ajukan' },
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
    })

    const patch: UpdateProductRequest = {}
    if (form.description.trim()) patch.description = form.description.trim()
    if (form.thumbnailUrl.trim()) patch.thumbnailUrl = form.thumbnailUrl.trim()
    if (form.category.trim()) patch.category = form.category.trim()
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
  <div class="grid gap-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">
          {{ isEdit ? 'Edit produk' : 'Buat produk' }}
        </h1>
        <p class="mt-1.5 text-muted">
          Susun try-out, lengkapi infonya, lalu ajukan untuk tayang di katalog.
        </p>
      </div>

      <p
        v-if="saveIndicator"
        aria-live="polite"
        class="flex items-center gap-1.5 text-[0.86rem] font-semibold"
        :class="saveState === 'error' ? 'text-red-600' : 'text-muted'"
      >
        <IconCheck v-if="saveState === 'saved'" class="h-4 w-4 stroke-success-ink" />
        {{ saveIndicator }}
      </p>
    </header>

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
          <IconCheck class="h-7 w-7 stroke-success-ink" />
        </span>
        <p class="mx-auto mt-4 max-w-105 leading-[1.7] text-muted">
          Tim Zenko akan meninjau produkmu. Statusnya bisa kamu pantau di daftar
          produk — jika disetujui, produk langsung tayang di katalog.
        </p>
        <AppButton to="/dashboard/tutor/products" class="mt-6">Ke daftar produk</AppButton>
      </div>
    </DashboardPanel>

    <template v-else>
      <p
        v-if="isEdit && detail?.status === 'rejected' && detail.rejectReason"
        role="alert"
        class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
      >
        <strong>Produk ini ditolak:</strong> {{ detail.rejectReason }} —
        perbaiki lalu ajukan lagi.
      </p>

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
      <DashboardPanel
        v-if="step === 1"
        title="Tipe & jenis"
        :description="isEdit
          ? 'Tipe dan jenis ujian terkunci setelah produk dibuat.'
          : 'Pilih bentuk produk, lalu jenis ujiannya.'"
      >
        <div class="grid gap-6">
          <fieldset :disabled="isEdit" class="grid gap-3 sm:grid-cols-2">
            <legend class="sr-only">Tipe produk</legend>
            <button
              v-for="option in ([
                { type: 'single', title: 'Try-out tunggal', description: 'Satu try-out utuh dengan subtes dan soal yang kamu susun sendiri.' },
                { type: 'bundle', title: 'Bundling', description: 'Gabungan beberapa try-out tunggal milikmu yang sudah tayang, dijual satu harga.' },
              ] as const)"
              :key="option.type"
              type="button"
              class="rounded-md border p-5 text-left transition-[border-color,box-shadow] disabled:cursor-not-allowed"
              :class="form.type === option.type
                ? 'border-primary/40 bg-primary-soft/40 shadow-[0_0_0_3px_rgba(47,111,235,0.08)]'
                : 'border-hairline-strong bg-surface hover:border-primary/25'"
              :aria-pressed="form.type === option.type"
              @click="form.type = option.type"
            >
              <span class="block font-bold tracking-[-0.02em]">{{ option.title }}</span>
              <span class="mt-1.5 block text-[0.88rem] leading-[1.6] text-muted">{{ option.description }}</span>
            </button>
          </fieldset>

          <div v-if="isSingle" class="grid gap-3">
            <h3 class="text-[0.9rem] font-semibold">Jenis ujian</h3>

            <p v-if="examTypesPending" class="text-[0.9rem] text-muted">Memuat jenis ujian...</p>
            <p v-else-if="examTypesError" class="text-[0.9rem] text-muted">
              Gagal memuat jenis ujian. Muat ulang halaman untuk mencoba lagi.
            </p>

            <fieldset v-else :disabled="isEdit" class="grid gap-3 lg:grid-cols-3">
              <legend class="sr-only">Jenis ujian</legend>
              <button
                v-for="exam in examTypes"
                :key="exam.slug"
                type="button"
                class="rounded-md border p-5 text-left transition-[border-color,box-shadow] disabled:cursor-not-allowed"
                :class="form.examTypeSlug === exam.slug
                  ? 'border-primary/40 bg-primary-soft/40 shadow-[0_0_0_3px_rgba(47,111,235,0.08)]'
                  : 'border-hairline-strong bg-surface hover:border-primary/25'"
                :aria-pressed="form.examTypeSlug === exam.slug"
                @click="form.examTypeSlug = exam.slug"
              >
                <span class="block font-bold tracking-[-0.02em]">{{ exam.label }}</span>
                <span class="mt-1 block text-[0.85rem] leading-[1.6] text-muted">{{ exam.description }}</span>

                <template v-if="exam.sections.length">
                  <span class="mt-3 block text-[0.78rem] font-semibold text-primary">
                    {{ summarizeSections(exam) }}
                  </span>
                  <span class="mt-2 grid gap-1">
                    <span
                      v-for="section in exam.sections"
                      :key="section.title"
                      class="flex items-baseline justify-between gap-3 text-[0.8rem] text-muted"
                    >
                      <span class="truncate">{{ section.title }}</span>
                      <span class="shrink-0 tabular-nums">{{ section.questionTarget }} soal · {{ section.durationMinutes }} mnt</span>
                    </span>
                  </span>
                </template>
                <span v-else class="mt-3 block text-[0.78rem] font-semibold text-primary">
                  Susun subtes sendiri di langkah Isi
                </span>
              </button>
            </fieldset>
          </div>

          <p v-else class="rounded-sm border border-hairline-strong bg-surface-alt px-4 py-3 text-[0.86rem] text-muted">
            Bundling berisi produk try-out tunggal milikmu yang berstatus Tayang.
            Anggotanya dipilih di langkah Isi.
          </p>
        </div>
      </DashboardPanel>

      <!-- ================================================ Langkah 2: Info produk -->
      <DashboardPanel
        v-else-if="step === 2"
        title="Info produk"
        description="Info yang tampil di katalog dan halaman produk."
      >
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

          <FormField
            id="product-thumbnail"
            v-model="form.thumbnailUrl"
            label="URL thumbnail"
            type="url"
            placeholder="https://..."
            hint="Opsional. Gambar sampul produk di katalog."
          />

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
            @refresh="refreshDetail"
          />
          <DashboardPanel v-else title="Isi" description="Soal disusun setelah draft tersimpan.">
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

      <!-- ============================================ Langkah 4: Harga & ajukan -->
      <DashboardPanel
        v-else
        title="Harga & ajukan"
        description="Tentukan harga, cek kelengkapan, lalu ajukan untuk ditinjau."
      >
        <div class="grid gap-6">
          <div class="grid max-w-160 gap-5 sm:grid-cols-2">
            <div>
              <label for="product-price" :class="FIELD_LABEL_CLASS">Harga (Rp)</label>
              <input
                id="product-price"
                v-model.number="form.price"
                type="number"
                min="0"
                step="1000"
                inputmode="numeric"
                placeholder="149000"
                :class="FIELD_CLASS"
              >
            </div>
            <div>
              <label for="product-price-original" :class="FIELD_LABEL_CLASS">Harga coret (Rp)</label>
              <input
                id="product-price-original"
                v-model.number="form.priceOriginal"
                type="number"
                min="0"
                step="1000"
                inputmode="numeric"
                placeholder="199000"
                :class="FIELD_CLASS"
                aria-describedby="product-price-original-hint"
              >
              <p id="product-price-original-hint" class="mt-2 text-[0.82rem] text-muted">
                Opsional. Tampil tercoret di samping harga jual.
              </p>
            </div>
          </div>

          <div class="rounded-md border border-hairline bg-surface-alt p-5">
            <h3 class="text-[0.9rem] font-semibold">Kelengkapan sebelum diajukan</h3>
            <ul class="mt-3 grid gap-2">
              <li
                v-for="item in checklist"
                :key="item.label"
                class="flex items-start gap-2.5 text-[0.9rem]"
                :class="item.ok ? 'text-muted' : 'text-amber-800'"
              >
                <IconCheck v-if="item.ok" class="mt-0.5 h-4 w-4 shrink-0 stroke-success-ink" />
                <IconAlert v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {{ item.label }}
              </li>
            </ul>
          </div>

          <div
            v-if="submitProblems.length"
            role="alert"
            class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
          >
            <p class="font-semibold">Produk belum bisa diajukan:</p>
            <ul class="mt-2 grid list-disc gap-1 pl-5">
              <li v-for="problem in submitProblems" :key="problem">{{ problem }}</li>
            </ul>
          </div>

          <p
            v-if="submitError"
            role="alert"
            class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
          >
            {{ submitError }}
          </p>

          <div>
            <AppButton type="button" :disabled="submitting || !allComplete" @click="submitForReview">
              {{ submitting ? 'Mengajukan...' : 'Ajukan untuk tayang' }}
            </AppButton>
            <p v-if="!allComplete" class="mt-2.5 text-[0.82rem] text-muted">
              Lengkapi daftar di atas dulu — tombol aktif setelah semuanya terpenuhi.
            </p>
          </div>
        </div>
      </DashboardPanel>

      <p v-if="stepError" role="alert" class="text-[0.86rem] font-semibold text-red-600">
        {{ stepError }}
      </p>

      <!-- Step footer -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          v-if="step > 1"
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          @click="goTo(step - 1)"
        >
          Kembali
        </button>
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
      </div>
    </template>
  </div>
</template>
