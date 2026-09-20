<script setup lang="ts">
import type { BankAccountInput } from '#shared/types/tutor-earnings'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pengaturan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const workspace = { bimbelId }
const bimbel = useBimbelDetail(bimbelId)
const { data: memberships, refresh: refreshMemberships } = useBimbelMemberships()
const bank = useTutorBankAccount(workspace)
const changeRequest = useTutorBankAccountChangeRequest(workspace)
const toast = useToast()

const membership = computed(() => memberships.value.find(item => item.bimbelId === bimbelId))
const isOwner = computed(() => membership.value?.role === 'owner')
const tabs = computed(() => [
  { id: 'profil', label: 'Profil' },
  { id: 'tim', label: 'Tim' },
  ...(isOwner.value ? [{ id: 'rekening', label: 'Rekening bank' }, { id: 'langganan', label: 'Langganan' }] : []),
])
const requestedTab = computed(() => String(route.hash || '').replace('#', ''))
const activeTab = ref('profil')

watch([requestedTab, tabs], ([requested, available]) => {
  activeTab.value = available.some(tab => tab.id === requested) ? requested : 'profil'
}, { immediate: true })

function selectTab(tab: string) {
  activeTab.value = tab
  void navigateTo({ path: route.path, hash: tab === 'profil' ? '' : `#${tab}` }, { replace: true })
}

const form = reactive({ name: '', username: '', provinceCode: '', city: '', description: '', logoUrl: '' })

/* Provinsi dan kota dipilih dari daftar wilayah, bukan diketik: kotanya
 * bergantung pada provinsi, dan API hanya menerima kode provinsi yang benar. */
const { provinces, cities, isLoadingProvinces, isLoadingCities, loadProvinces, loadCities } = useIndonesiaRegions()
const provinceOptions = computed(() => provinces.value.map(region => ({ value: region.code, label: region.name })))
const cityOptions = computed(() => cities.value.map(region => ({ value: region.name, label: region.name })))

// Mengganti provinsi membuat kota lama tidak lagi berada di dalamnya, jadi
// pilihannya dikosongkan — kecuali saat memuat nilai yang sudah tersimpan.
const loadingSavedProfile = ref(false)
watch(() => form.provinceCode, async (code) => {
  if (!loadingSavedProfile.value) form.city = ''
  await loadCities(code)
})
const saving = ref(false)
const rotating = ref(false)
const bankSaving = ref(false)
const account = reactive<BankAccountInput>({ bankCode: 'bca', bankLabel: 'BCA', accountNumber: '', holderName: '' })

onMounted(() => Promise.all([bimbel.refresh(), refreshMemberships(), bank.refresh(), changeRequest.refresh(), loadProvinces()]))
watch(() => bimbel.data.value, async (value) => {
  if (!value) return
  loadingSavedProfile.value = true
  Object.assign(form, {
    name: value.name,
    username: value.slug,
    provinceCode: value.provinceCode ?? '',
    city: value.city ?? '',
    description: value.description ?? '',
    logoUrl: value.logoUrl ?? '',
  })
  // Kotanya dimuat lebih dulu supaya nilai tersimpan punya pilihan yang cocok
  // saat select-nya dirender, bukan kosong sesaat lalu terisi.
  await loadCities(form.provinceCode)
  loadingSavedProfile.value = false
})
watch(() => account.bankCode, (code) => {
  account.bankLabel = BANK_OPTIONS.find(item => item.code === code)?.label ?? code
})

async function save() {
  saving.value = true
  try {
    bimbel.data.value = await updateBimbel(bimbelId, form)
    toast.success('Profil bimbel disimpan.')
  }
  catch (cause) {
    toast.error('Profil belum berhasil disimpan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    saving.value = false
  }
}

async function rotate() {
  rotating.value = true
  try {
    bimbel.data.value = await rotateBimbelJoinCode(bimbelId)
    toast.success('Kode bergabung diperbarui.', 'Kode lama tidak dapat dipakai lagi.')
  }
  catch (cause) {
    toast.error('Kode baru belum berhasil dibuat.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    rotating.value = false
  }
}

async function saveBank() {
  bankSaving.value = true
  try {
    await saveTutorBankAccount(account, workspace)
    await bank.refresh()
    toast.success('Rekening disimpan.', 'Admin Zenko akan memverifikasinya sebelum pencairan.')
  }
  catch (cause) {
    toast.error('Rekening belum bisa disimpan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    bankSaving.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Pengaturan bimbel" description="Kelola profil, tim, rekening bank, dan langganan dari satu tempat." />

    <div class="border-b border-hairline" role="tablist" aria-label="Bagian pengaturan bimbel">
      <div class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :id="`tab-${tab.id}`"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`panel-${tab.id}`"
          class="shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
          :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'profil'" id="panel-profil" role="tabpanel" aria-labelledby="tab-profil" class="grid gap-6">
      <DashboardPanel title="Profil bimbel">
        <DashboardSkeleton v-if="bimbel.pending.value" :count="4" label="Memuat profil…" />
        <form v-else class="grid max-w-3xl gap-5 md:grid-cols-2" @submit.prevent="save">
          <div class="md:col-span-2">
            <p class="mb-2 text-[0.82rem] font-semibold text-ink">Logo bimbel</p>
            <BimbelLogoField v-model="form.logoUrl" :name="form.name || 'Bimbel'" :disabled="saving" />
          </div>
          <AppInput v-model="form.name" label="Nama bimbel" required />
          <AppSelect
            v-model="form.provinceCode"
            label="Provinsi"
            :options="provinceOptions"
            :disabled="isLoadingProvinces || saving"
            :placeholder="isLoadingProvinces ? 'Memuat provinsi…' : 'Pilih provinsi'"
          />
          <AppSelect
            v-model="form.city"
            label="Kota"
            :options="cityOptions"
            :disabled="!form.provinceCode || isLoadingCities || saving"
            :placeholder="!form.provinceCode ? 'Pilih provinsi dulu' : (isLoadingCities ? 'Memuat kota…' : 'Pilih kota')"
          />
          <div class="md:col-span-2">
            <AppInput
              v-model="form.username"
              label="Username bimbel"
              placeholder="bimbel-kamu"
              hint="3–30 karakter: huruf kecil, angka, atau tanda hubung. Dipakai sebagai alamat publik bimbel."
            />
          </div>
          <AppTextarea v-model="form.description" class="md:col-span-2" label="Deskripsi" />
          <div class="md:col-span-2"><AppButton type="submit" :loading="saving">Simpan perubahan</AppButton></div>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Kode bergabung" description="Bagikan kode ini kepada siswa. Setiap permintaan tetap harus disetujui admin bimbel.">
        <div class="flex flex-wrap items-center gap-4">
          <code class="rounded-md bg-primary-soft px-5 py-3 text-xl font-bold tracking-[0.18em] text-primary">{{ bimbel.data.value?.joinCode || '—' }}</code>
          <AppButton variant="secondary" :loading="rotating" @click="rotate">Buat kode baru</AppButton>
        </div>
      </DashboardPanel>
    </div>

    <div v-show="activeTab === 'tim'" id="panel-tim" role="tabpanel" aria-labelledby="tab-tim">
      <BimbelTeamSettings :bimbel-id="bimbelId" />
    </div>

    <div v-if="isOwner" v-show="activeTab === 'rekening'" id="panel-rekening" role="tabpanel" aria-labelledby="tab-rekening">
      <DashboardPanel title="Rekening bank" description="Rekening tujuan transfer pencairan pendapatan marketplace.">
        <DashboardSkeleton v-if="bank.pending.value || changeRequest.pending.value" :count="3" label="Memuat rekening…" />
        <div v-else-if="bank.data.value" class="grid gap-4">
          <AppSectionMessage v-if="changeRequest.data.value" appearance="information" title="Perubahan rekening sedang ditinjau">
            Pengajuan perubahan rekening sudah diterima tim admin Zenko.
          </AppSectionMessage>
          <dl class="grid gap-4 rounded-md bg-surface-alt p-4 sm:grid-cols-3">
            <div><dt class="text-xs text-muted">Bank</dt><dd class="mt-1 font-semibold">{{ bank.data.value.bankLabel }}</dd></div>
            <div><dt class="text-xs text-muted">Nomor rekening</dt><dd class="mt-1 font-semibold tabular-nums">{{ bank.data.value.accountNumber }}</dd></div>
            <div><dt class="text-xs text-muted">Nama pemilik</dt><dd class="mt-1 font-semibold">{{ bank.data.value.holderName }}</dd></div>
          </dl>
          <DashboardBadge class="w-fit" :tone="bank.data.value.verifiedAt ? 'success' : 'warning'">
            {{ bank.data.value.verifiedAt ? 'Terverifikasi' : 'Menunggu verifikasi' }}
          </DashboardBadge>
        </div>
        <form v-else class="grid max-w-xl gap-4" @submit.prevent="saveBank">
          <AppSelect v-model="account.bankCode" label="Bank" :options="BANK_OPTIONS.map(item => ({ value: item.code, label: item.label }))" />
          <AppInput v-model="account.accountNumber" label="Nomor rekening" required />
          <AppInput v-model="account.holderName" label="Nama pemilik rekening" required />
          <AppButton type="submit" :loading="bankSaving">Simpan rekening</AppButton>
        </form>
      </DashboardPanel>
    </div>

    <div v-if="isOwner" v-show="activeTab === 'langganan'" id="panel-langganan" role="tabpanel" aria-labelledby="tab-langganan">
      <DashboardPanel title="Langganan" description="Kelola paket langganan dan kapasitas siswa Bimbel.">
        <dl class="grid gap-4 sm:grid-cols-3">
          <div><dt class="text-xs text-muted">Status</dt><dd class="mt-1 font-semibold capitalize">{{ bimbel.data.value?.status || '—' }}</dd></div>
          <div><dt class="text-xs text-muted">Paket</dt><dd class="mt-1 font-semibold uppercase">{{ bimbel.data.value?.plan || '—' }}</dd></div>
          <div><dt class="text-xs text-muted">Kapasitas</dt><dd class="mt-1 font-semibold">{{ bimbel.data.value?.seatsUsed ?? 0 }}/{{ bimbel.data.value?.seatQuota ?? 0 }} siswa</dd></div>
        </dl>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/billing`" class="mt-5" size="sm">Kelola langganan</AppButton>
      </DashboardPanel>
    </div>
  </div>
</template>
