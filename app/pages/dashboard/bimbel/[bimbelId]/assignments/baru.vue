<script setup lang="ts">
import type { AssignmentTargetKind } from '#shared/types/bimbel'

/**
 * Form penugasan baru.
 *
 * Dulu panel `v-if` di dasar halaman Penugasan — di bimbel dengan 20 tugas,
 * mengklik "Buat penugasan" dari HP tampak tidak melakukan apa-apa karena
 * formnya terbuka jauh di bawah daftar. Sebagai route sendiri ia punya alamat,
 * tombol back, dan tidak menggeser daftarnya.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Penugasan Baru | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const base = `/dashboard/bimbel/${bimbelId}`
const listPath = `${base}/assignments`

const classes = useBimbelClasses(bimbelId)
const members = useBimbelMembers(bimbelId)
const productsResource = useTutorProducts({ bimbelId })
const { data: memberships, refresh: refreshMemberships } = useBimbelMemberships()
const toast = useToast()

const saving = ref(false)
const targetSearch = ref('')

const membership = computed(() => memberships.value.find(item => item.bimbelId === bimbelId))
const canTargetMembers = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')

const products = computed(() =>
  productsResource.data.value.filter(item =>
    item.visibility === 'bimbel' && item.status === 'live' && item.type === 'single',
  ),
)
const students = computed(() =>
  members.data.value.filter(item => item.role === 'student' && item.status === 'active'),
)

/** `datetime-local` membaca waktu lokal, jadi offset zona dikurangi lebih dulu. */
function localValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

const form = reactive({
  productId: '',
  title: '',
  targetKind: 'all' as AssignmentTargetKind,
  targetIds: [] as string[],
  opensAt: localValue(new Date(Date.now() + 60 * 60 * 1000)),
  closesAt: localValue(new Date(Date.now() + 3 * 60 * 60 * 1000)),
  maxAttempts: 1,
  reviewPolicy: 'after_close' as const,
})

const targetOptions = computed(() =>
  form.targetKind === 'class'
    ? classes.data.value.map(item => ({ id: item.id, label: item.name, meta: `${item.memberCount} siswa` }))
    : students.value.map(item => ({ id: item.accountId, label: item.name, meta: item.email })),
)

const visibleTargets = computed(() => {
  const term = targetSearch.value.trim().toLowerCase()
  if (!term) return targetOptions.value
  return targetOptions.value.filter(item =>
    item.label.toLowerCase().includes(term) || item.meta.toLowerCase().includes(term),
  )
})

const pending = computed(() =>
  classes.pending.value || productsResource.pending.value || members.pending.value,
)
const loadError = computed(() =>
  productsResource.error.value || classes.error.value || (canTargetMembers.value ? members.error.value : ''),
)

/** Sasaran selain "semua siswa" tidak berarti apa-apa tanpa satu pun pilihan. */
const missingTarget = computed(() => form.targetKind !== 'all' && form.targetIds.length === 0)

async function load() {
  await refreshMemberships()
  await Promise.all([
    classes.refresh(),
    productsResource.refresh(),
    canTargetMembers.value ? members.refresh() : Promise.resolve(),
  ])
}
onMounted(load)

watch(() => form.targetKind, () => {
  form.targetIds = []
  targetSearch.value = ''
})

function toggleTarget(id: string) {
  form.targetIds = form.targetIds.includes(id)
    ? form.targetIds.filter(item => item !== id)
    : [...form.targetIds, id]
}

async function createAssignment() {
  if (missingTarget.value) return
  saving.value = true
  try {
    await createBimbelAssignment(bimbelId, {
      ...form,
      opensAt: Math.floor(new Date(form.opensAt).getTime() / 1000),
      closesAt: Math.floor(new Date(form.closesAt).getTime() / 1000),
    })
    toast.success('Draft penugasan dibuat.', 'Periksa jadwal dan sasaran, lalu publikasikan.')
    await navigateTo(listPath)
  }
  catch (cause) {
    toast.error('Gagal membuat penugasan.', tutorApiMessage(cause, 'Periksa isian lalu coba lagi.'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Penugasan baru"
      description="Penugasan disimpan sebagai draft dan belum memberi akses sampai dipublikasikan."
    >
      <template #breadcrumbs>
        <AppBreadcrumbs :items="[{ label: 'Penugasan', to: listPath }, { label: 'Penugasan baru' }]" />
      </template>
      <template #actions>
        <AppButton :to="listPath" size="sm" variant="outline">Kembali</AppButton>
      </template>
    </AppPageHeader>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="6" label="Memuat paket dan sasaran…" />

      <div v-else-if="loadError" class="py-8 text-center">
        <AppInlineMessage type="error">{{ loadError }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <AppEmptyState
        v-else-if="products.length === 0"
        title="Belum ada paket siap tugas"
        description="Penugasan membutuhkan paket privat yang sudah tayang. Selesaikan lalu tayangkan satu paket dari Bank soal terlebih dahulu."
        action-label="Buka bank soal"
        @action="navigateTo(`${base}/products`)"
      />

      <form v-else class="grid gap-4 md:grid-cols-2" @submit.prevent="createAssignment">
        <AppSelect
          v-model="form.productId"
          label="Paket soal"
          :options="products.map(item => ({ value: item.id, label: item.title }))"
          required
        />
        <AppInput v-model="form.title" label="Judul tugas" placeholder="Opsional, mengikuti judul paket" />
        <AppSelect
          v-model="form.targetKind"
          label="Diberikan kepada"
          :options="[
            { value: 'all', label: 'Semua siswa aktif' },
            { value: 'class', label: 'Kelas tertentu' },
            ...(canTargetMembers ? [{ value: 'member', label: 'Siswa tertentu' }] : []),
          ]"
        />
        <AppInput v-model.number="form.maxAttempts" type="number" min="1" max="10" label="Maksimal percobaan" />
        <AppInput v-model="form.opensAt" type="datetime-local" label="Mulai" required />
        <AppInput v-model="form.closesAt" type="datetime-local" label="Berakhir" required />

        <fieldset v-if="form.targetKind !== 'all'" class="grid gap-3 md:col-span-2">
          <legend class="text-sm font-semibold">
            Pilih {{ form.targetKind === 'class' ? 'kelas' : 'siswa' }}
          </legend>

          <div class="max-w-md">
            <AppTextField
              id="bimbel-assignment-target-search"
              v-model="targetSearch"
              :label="form.targetKind === 'class' ? 'Cari kelas' : 'Cari siswa'"
              placeholder="Cari nama…"
              size="sm"
              clearable
            >
              <template #leading-icon>
                <AppIcon name="magnifying-glass" :size="16" />
              </template>
            </AppTextField>
          </div>

          <p class="text-[0.82rem] text-muted" aria-live="polite">
            <span class="font-semibold tabular-nums text-ink">{{ form.targetIds.length }}</span> dipilih ·
            menampilkan <span class="tabular-nums">{{ visibleTargets.length }}</span>
            dari <span class="tabular-nums">{{ targetOptions.length }}</span>
          </p>

          <div v-if="visibleTargets.length" class="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="item in visibleTargets"
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 rounded-sm border border-hairline p-3 transition-colors hover:bg-surface-alt focus-within:border-primary/40"
            >
              <input
                type="checkbox"
                class="size-4 shrink-0 accent-primary"
                :checked="form.targetIds.includes(item.id)"
                @change="toggleTarget(item.id)"
              >
              <span class="min-w-0">
                <strong class="block truncate text-sm">{{ item.label }}</strong>
                <span class="block truncate text-xs text-muted">{{ item.meta }}</span>
              </span>
            </label>
          </div>

          <AppInlineMessage v-else-if="targetSearch" type="info">
            Tidak ada {{ form.targetKind === 'class' ? 'kelas' : 'siswa' }} yang cocok dengan pencarian.
          </AppInlineMessage>

          <AppInlineMessage v-else type="info">
            {{ form.targetKind === 'class'
              ? 'Belum ada kelas. Buat kelas lebih dulu, atau tugaskan ke semua siswa aktif.'
              : 'Belum ada siswa aktif yang dapat ditugaskan.' }}
          </AppInlineMessage>
        </fieldset>

        <div class="grid gap-3 md:col-span-2">
          <AppInlineMessage v-if="missingTarget" type="warning">
            Pilih minimal satu {{ form.targetKind === 'class' ? 'kelas' : 'siswa' }} sebelum menyimpan draft.
          </AppInlineMessage>
          <div class="flex flex-wrap gap-2">
            <AppButton type="submit" :disabled="saving || missingTarget">
              {{ saving ? 'Menyimpan…' : 'Simpan draft' }}
            </AppButton>
            <AppButton :to="listPath" variant="outline">Batal</AppButton>
          </div>
        </div>
      </form>
    </DashboardPanel>
  </div>
</template>
