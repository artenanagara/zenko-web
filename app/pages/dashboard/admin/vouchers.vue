<script setup lang="ts">
import type { Voucher, VoucherRedemption, VoucherRequest } from '#shared/types/voucher'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Voucher | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: vouchers, pending, error, refresh } = useAdminVouchers()

const TABS = [
  { id: 'platform', label: 'Voucher platform' },
  { id: 'tutor', label: 'Voucher tutor' },
]
const activeTab = ref('platform')

const platformVouchers = computed(() => vouchers.value.filter(v => v.createdByRole === 'admin'))
const tutorVouchers = computed(() => vouchers.value.filter(v => v.createdByRole === 'tutor'))

const columns = [
  { key: 'code', label: 'Kode' },
  { key: 'discount', label: 'Diskon' },
  { key: 'scope', label: 'Berlaku untuk' },
  { key: 'absorbedBy', label: 'Ditanggung' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
]

function usageLabel(voucher: Voucher): string {
  const limit = voucher.usageLimitTotal ? `/${voucher.usageLimitTotal}` : ''
  return `— ${limit || 'tanpa batas'}`
}

// See the same helper's doc in dashboard/tutor/vouchers.vue.
function asVoucher(item: Record<string, any>): Voucher {
  return item as Voucher
}

/* --------------------------------------------------------------------------
 * Create / edit — voucher platform saja. Voucher tutor tidak pernah dibuka
 * di modal edit ini; itemnya hanya tombol kill switch (lihat toggleTutorVoucher).
 * ------------------------------------------------------------------------ */

const modalOpen = ref(false)
const editing = ref<Voucher | null>(null)
const saving = ref(false)
const formError = ref('')
const locked = ref(false)

function openCreate() {
  editing.value = null
  locked.value = false
  formError.value = ''
  modalOpen.value = true
}

async function openEdit(voucher: Voucher) {
  editing.value = voucher
  formError.value = ''
  modalOpen.value = true
  try {
    const rows = await adminVoucherRedemptions(voucher.id)
    locked.value = rows.some(row => row.status === 'paid')
  }
  catch {
    locked.value = false
  }
}

async function handleSubmit(input: VoucherRequest, password: string) {
  saving.value = true
  formError.value = ''
  try {
    let stepUpToken: string | undefined
    // The modal only asks for (and passes) a password when the server will
    // want step-up: saving a high-risk code, or switching a locked one back on.
    if (password) {
      const stepUp = await stepUpVoucher(password)
      stepUpToken = stepUp.stepUpToken
    }
    if (editing.value) {
      await updateAdminVoucher(editing.value.id, input, stepUpToken)
    }
    else {
      await createAdminVoucher(input, stepUpToken)
    }
    modalOpen.value = false
    await refresh()
  }
  catch (cause) {
    formError.value = voucherErrorCode(cause) === 'step_up_required'
      ? 'Kata sandi tidak cocok atau sudah kedaluwarsa. Coba lagi.'
      : voucherApiMessage(cause, 'Voucher belum berhasil disimpan.')
  }
  finally {
    saving.value = false
  }
}

/* --------------------------------------------------------------------------
 * Kill switch — voucher siapa pun, hanya menyentuh Active. Ini satu-satunya
 * aksi admin punya atas voucher buatan tutor.
 * ------------------------------------------------------------------------ */

const togglingId = ref('')
const toggleError = ref('')

// Re-enabling a high-risk voucher needs the acting admin's password again;
// the server answers step_up_required and this dialog collects it.
const stepUpFor = ref<Voucher | null>(null)
const stepUpOpen = computed({
  get: () => stepUpFor.value !== null,
  set: (open: boolean) => { if (!open) stepUpFor.value = null },
})
const stepUpPassword = ref('')
const stepUpError = ref('')

async function toggleActive(voucher: Voucher, stepUpToken?: string) {
  togglingId.value = voucher.id
  toggleError.value = ''
  try {
    await setAdminVoucherActive(voucher.id, !isVoucherEnabledByAdmin(voucher), stepUpToken)
    stepUpFor.value = null
    await refresh()
  }
  catch (cause) {
    if (voucherErrorCode(cause) === 'step_up_required' && !stepUpToken) {
      stepUpPassword.value = ''
      stepUpError.value = ''
      stepUpFor.value = voucher
      return
    }
    const message = voucherApiMessage(cause, 'Status voucher belum berhasil diubah.')
    if (stepUpToken) stepUpError.value = message
    else toggleError.value = message
  }
  finally {
    togglingId.value = ''
  }
}

async function confirmStepUp() {
  const voucher = stepUpFor.value
  if (!voucher || !stepUpPassword.value) return
  stepUpError.value = ''
  try {
    const stepUp = await stepUpVoucher(stepUpPassword.value)
    await toggleActive(voucher, stepUp.stepUpToken)
  }
  catch {
    stepUpError.value = 'Kata sandi tidak cocok. Coba lagi.'
  }
}

/* --------------------------------------------------------------------------
 * Riwayat pemakaian — identitas pembeli tampil penuh untuk admin.
 * ------------------------------------------------------------------------ */

const redemptionsOpen = ref(false)
const redemptionsFor = ref<Voucher | null>(null)
const redemptions = ref<VoucherRedemption[]>([])
const redemptionsPending = ref(false)

async function openRedemptions(voucher: Voucher) {
  redemptionsFor.value = voucher
  redemptionsOpen.value = true
  redemptionsPending.value = true
  try {
    redemptions.value = await adminVoucherRedemptions(voucher.id)
  }
  catch {
    redemptions.value = []
  }
  finally {
    redemptionsPending.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Voucher"
      description="Kelola voucher platform dan pantau voucher yang dibuat tutor untuk produk mereka sendiri."
    >
      <template #actions>
        <AppButton v-if="activeTab === 'platform'" size="sm" @click="openCreate">
          <AppIcon name="plus" :size="14" />
          Buat voucher platform
        </AppButton>
      </template>
    </AppPageHeader>

    <AppTabs v-model="activeTab" :tabs="TABS" aria-label="Cakupan voucher" />

    <DashboardPanel :title="activeTab === 'platform' ? 'Voucher platform' : 'Voucher buatan tutor'">
      <DashboardSkeleton v-if="pending" :count="3" label="Memuat voucher..." />

      <div v-else-if="error" class="py-6 text-center">
        <AppInlineMessage type="error">Voucher belum berhasil dimuat.</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refresh">
          Coba lagi
        </button>
      </div>

      <template v-else-if="activeTab === 'platform'">
        <p v-if="platformVouchers.length === 0" class="py-6 text-center text-muted">
          Belum ada voucher platform.
        </p>
        <DashboardTable v-else :columns="columns" :data="platformVouchers" primary-key="id">
          <template #cell(code)="{ item }">
            <span class="font-mono font-semibold tracking-wide">{{ item.code }}</span>
          </template>
          <template #cell(discount)="{ item }">{{ voucherDiscountLabel(asVoucher(item)) }}</template>
          <template #cell(scope)="{ item }">
            {{ VOUCHER_SCOPE_LABEL[item.scope as Voucher['scope']] }}
            <span class="text-muted">{{ usageLabel(asVoucher(item)) }}</span>
          </template>
          <template #cell(absorbedBy)="{ item }">{{ VOUCHER_ABSORBED_BY_LABEL[item.absorbedBy as Voucher['absorbedBy']] }}</template>
          <template #cell(status)="{ item }">
            <DashboardBadge :tone="voucherStatus(asVoucher(item)).tone">{{ voucherStatus(asVoucher(item)).label }}</DashboardBadge>
          </template>
          <template #cell(actions)="{ item }">
            <div class="flex justify-end gap-3">
              <button type="button" class="text-[0.84rem] font-semibold text-primary hover:underline" @click="openRedemptions(asVoucher(item))">
                Riwayat
              </button>
              <button type="button" class="text-[0.84rem] font-semibold text-primary hover:underline" @click="openEdit(asVoucher(item))">
                Ubah
              </button>
            </div>
          </template>
        </DashboardTable>
      </template>

      <template v-else>
        <AppInlineMessage v-if="toggleError" type="error" class="mb-4">{{ toggleError }}</AppInlineMessage>
        <p v-if="tutorVouchers.length === 0" class="py-6 text-center text-muted">
          Belum ada voucher buatan tutor.
        </p>
        <DashboardTable v-else :columns="columns" :data="tutorVouchers" primary-key="id">
          <template #cell(code)="{ item }">
            <span class="font-mono font-semibold tracking-wide">{{ item.code }}</span>
          </template>
          <template #cell(discount)="{ item }">{{ voucherDiscountLabel(asVoucher(item)) }}</template>
          <template #cell(scope)="{ item }">
            {{ VOUCHER_SCOPE_LABEL[item.scope as Voucher['scope']] }}
            <span class="text-muted">{{ usageLabel(asVoucher(item)) }}</span>
          </template>
          <template #cell(absorbedBy)="{ item }">{{ VOUCHER_ABSORBED_BY_LABEL[item.absorbedBy as Voucher['absorbedBy']] }}</template>
          <template #cell(status)="{ item }">
            <DashboardBadge :tone="voucherStatus(asVoucher(item)).tone">{{ voucherStatus(asVoucher(item)).label }}</DashboardBadge>
          </template>
          <template #cell(actions)="{ item }">
            <div class="flex justify-end gap-3">
              <button type="button" class="text-[0.84rem] font-semibold text-primary hover:underline" @click="openRedemptions(asVoucher(item))">
                Riwayat
              </button>
              <button
                type="button" class="text-[0.84rem] font-semibold text-danger hover:underline disabled:opacity-50"
                :disabled="togglingId === item.id" @click="toggleActive(asVoucher(item))"
              >
                {{ isVoucherEnabledByAdmin(asVoucher(item)) ? 'Nonaktifkan' : 'Aktifkan' }}
              </button>
            </div>
          </template>
        </DashboardTable>
      </template>
    </DashboardPanel>

    <AdminVoucherModal
      v-model:open="modalOpen"
      :voucher="editing"
      :saving="saving"
      :error="formError"
      :locked="locked"
      @submit="handleSubmit"
    />

    <AppModal v-model="stepUpOpen" :title="stepUpFor ? `Aktifkan ulang ${stepUpFor.code}` : 'Konfirmasi'">
      <form class="grid gap-4" @submit.prevent="confirmStepUp">
        <p class="text-[0.9rem] text-muted">
          Potongan voucher ini 80% ke atas atau Rp50.000 ke atas. Masukkan ulang kata sandimu untuk mengaktifkannya.
        </p>
        <div>
          <label for="admin-voucher-reactivate-password" :class="FIELD_LABEL_CLASS">Kata sandi akunmu</label>
          <input
            id="admin-voucher-reactivate-password" v-model="stepUpPassword" type="password"
            autocomplete="current-password" :class="FIELD_CLASS"
          >
        </div>
        <AppInlineMessage v-if="stepUpError" type="error">{{ stepUpError }}</AppInlineMessage>
        <AppButton type="submit" size="sm" :disabled="!stepUpPassword || togglingId !== ''">
          Aktifkan voucher
        </AppButton>
      </form>
    </AppModal>

    <AppModal
      v-model="redemptionsOpen"
      :title="redemptionsFor ? `Riwayat pemakaian ${redemptionsFor.code}` : 'Riwayat pemakaian'"
    >
      <DashboardSkeleton v-if="redemptionsPending" :count="2" label="Memuat riwayat..." />
      <p v-else-if="redemptions.length === 0" class="py-4 text-center text-muted">
        Belum pernah dipakai.
      </p>
      <ul v-else class="grid gap-3">
        <li v-for="row in redemptions" :key="row.invoice" class="flex items-center justify-between gap-3 rounded-sm border border-hairline px-3.5 py-2.5 text-[0.86rem]">
          <div>
            <p class="font-semibold">{{ row.buyerName }}</p>
            <p class="text-muted">{{ formatWibDateTime(row.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold tabular-nums">{{ formatRupiah(row.price) }}</p>
            <p class="text-muted">−{{ formatRupiah(row.discount) }}</p>
          </div>
        </li>
      </ul>
    </AppModal>
  </div>
</template>
