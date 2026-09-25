<script setup lang="ts">
import type { Voucher, VoucherRedemption, VoucherRequest } from '#shared/types/voucher'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Voucher | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: vouchers, pending, error, refresh } = useTutorVouchers()
const { data: products, refresh: refreshProducts } = useTutorProducts()
onMounted(refreshProducts)
const liveProducts = computed(() => products.value.filter(p => p.status === 'live'))

const columns = [
  { key: 'code', label: 'Kode' },
  { key: 'discount', label: 'Diskon' },
  { key: 'scope', label: 'Berlaku untuk' },
  { key: 'usage', label: 'Pemakaian' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
]

function usageLabel(voucher: Voucher): string {
  const limit = voucher.usageLimitTotal ? `/${voucher.usageLimitTotal}` : ''
  return `— ${limit || 'tanpa batas'}`
}

// DashboardTable's cell slots hand back `item` as Record<string, any> (it
// isn't a generic component — see payouts.vue's payoutStatusTone for the
// same shape), so the typed voucher helpers go through this cast instead of
// widening their own signatures.
function asVoucher(item: Record<string, any>): Voucher {
  return item as Voucher
}

/* --------------------------------------------------------------------------
 * Create / edit modal.
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
  // Nilai hanya terkunci kalau sudah ada pembelian lunas dengan voucher ini —
  // server mengunci hal yang sama secara independen; ini murni menyalakan
  // peringatan di form sebelum tutor sempat mengetik.
  try {
    const rows = await tutorVoucherRedemptions(voucher.id)
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
    if (isHighRiskVoucherInput(input)) {
      const stepUp = await stepUpVoucher(password)
      stepUpToken = stepUp.stepUpToken
    }
    if (editing.value) {
      await updateTutorVoucher(editing.value.id, input, stepUpToken)
    }
    else {
      await createTutorVoucher(input, stepUpToken)
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
 * Riwayat pemakaian — dimuat sesuai permintaan, bukan sekaligus untuk semua
 * baris, supaya daftar voucher tetap satu request saja.
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
    redemptions.value = await tutorVoucherRedemptions(voucher.id)
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
      description="Buat kode promo untuk paketmu sendiri. Diskon dipotong dari bagi hasilmu, bukan dari margin Zenko."
    >
      <template #actions>
        <AppButton size="sm" @click="openCreate">
          <AppIcon name="plus" :size="14" />
          Buat voucher
        </AppButton>
      </template>
    </AppPageHeader>

    <DashboardPanel title="Voucher saya">
      <DashboardSkeleton v-if="pending" :count="3" label="Memuat voucher..." />

      <div v-else-if="error" class="py-6 text-center">
        <AppInlineMessage type="error">Voucher belum berhasil dimuat.</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refresh">
          Coba lagi
        </button>
      </div>

      <p v-else-if="vouchers.length === 0" class="py-6 text-center text-muted">
        Belum ada voucher. Buat satu untuk memberi diskon pada paketmu sendiri.
      </p>

      <DashboardTable v-else :columns="columns" :data="vouchers" primary-key="id">
        <template #cell(code)="{ item }">
          <span class="font-mono font-semibold tracking-wide">{{ item.code }}</span>
        </template>
        <template #cell(discount)="{ item }">
          {{ voucherDiscountLabel(asVoucher(item)) }}
        </template>
        <template #cell(scope)="{ item }">
          {{ VOUCHER_SCOPE_LABEL[item.scope as Voucher['scope']] }}
        </template>
        <template #cell(usage)="{ item }">
          {{ usageLabel(asVoucher(item)) }}
        </template>
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
    </DashboardPanel>

    <TutorVoucherModal
      v-model:open="modalOpen"
      :voucher="editing"
      :products="liveProducts"
      :saving="saving"
      :error="formError"
      :locked="locked"
      @submit="handleSubmit"
    />

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
