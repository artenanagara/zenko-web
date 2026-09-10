<script setup lang="ts">
import type { BimbelOrder, BimbelSeatAddonQuote } from '#shared/types/bimbel'

const props = defineProps<{
  modelValue: boolean
  bimbelId: string
  seatsUsed: number
  pendingSeats?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [order: BimbelOrder]
  renew: []
}>()

const STEP = 5
const additionalSeats = ref(STEP)
const quote = ref<BimbelSeatAddonQuote | null>(null)
const pending = ref(false)
const ordering = ref(false)
const error = ref('')
let requestToken = 0
let debounce: ReturnType<typeof setTimeout> | null = null

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const stepSize = computed(() => quote.value?.seatQuotaStep ?? STEP)
const atMaximum = computed(() => quote.value
  ? quote.value.resultingSeatQuota + stepSize.value > quote.value.maxSeatQuota
  : false)

async function refreshQuote() {
  const token = ++requestToken
  pending.value = true
  error.value = ''
  try {
    const response = await getBimbelQuote(props.bimbelId, {
      kind: 'seat_addon',
      additionalSeats: additionalSeats.value,
    })
    if (token !== requestToken) return
    if (response.kind !== 'seat_addon') throw new Error('Jenis harga tidak sesuai.')
    quote.value = response
  }
  catch (cause) {
    if (token !== requestToken) return
    quote.value = null
    error.value = tutorApiMessage(cause, 'Harga tambah kursi belum bisa dimuat.')
  }
  finally {
    if (token === requestToken) pending.value = false
  }
}

function scheduleQuote() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(refreshQuote, 250)
}

function step(direction: 1 | -1) {
	additionalSeats.value = Math.max(stepSize.value, additionalSeats.value + direction * stepSize.value)
  scheduleQuote()
}

async function createOrder() {
  if (!quote.value?.canPurchase || quote.value.renewalRequired || ordering.value) return
  ordering.value = true
  error.value = ''
  try {
    const order = await createBimbelOrder(props.bimbelId, {
      kind: 'seat_addon',
      additionalSeats: quote.value.additionalSeats,
    })
    emit('created', order)
    open.value = false
  }
  catch (cause) {
    error.value = tutorApiMessage(cause, 'Tagihan tambah kursi belum bisa dibuat.')
  }
  finally {
    ordering.value = false
  }
}

function renew() {
  open.value = false
  emit('renew')
}

watch(() => props.modelValue, (value) => {
  if (!value) return
  additionalSeats.value = STEP
  quote.value = null
  refreshQuote()
})

onUnmounted(() => {
  if (debounce) clearTimeout(debounce)
})
</script>

<template>
  <AppModal
    v-model="open"
    title="Tambah kursi"
    description="Kursi bertambah setelah pembayaran diverifikasi oleh tim Zenko."
  >
    <div class="grid gap-5">
      <p class="text-sm text-muted">
        {{ quote?.currentSeatQuota ?? '—' }} kursi sekarang · {{ seatsUsed }} terpakai
        <span v-if="pendingSeats"> · +{{ pendingSeats }} menunggu pembayaran</span>
      </p>

      <div>
        <p id="additional-seats-label" class="text-sm font-semibold text-ink">Jumlah kursi tambahan</p>
        <p class="mt-1 text-xs text-muted">Ditambahkan dalam kelipatan {{ stepSize }} kursi.</p>
        <div class="mt-3 flex items-center gap-3" role="group" aria-labelledby="additional-seats-label">
          <AppIconButton
            variant="outline"
            :ariaLabel="`Kurangi ${stepSize} kursi`"
            :disabled="additionalSeats <= stepSize || ordering"
            @click="step(-1)"
          >
            <AppIcon name="minus" :size="16" aria-hidden="true" />
          </AppIconButton>
          <output class="min-w-14 text-center text-xl font-bold tabular-nums" aria-live="polite">
            {{ additionalSeats }}
          </output>
          <AppIconButton
            variant="outline"
            :ariaLabel="`Tambah ${stepSize} kursi`"
            :disabled="ordering || atMaximum"
            @click="step(1)"
          >
            <AppIcon name="plus" :size="16" aria-hidden="true" />
          </AppIconButton>
        </div>
      </div>

      <DashboardSkeleton v-if="pending" :count="2" label="Menghitung harga tambah kursi…" />
      <AppInlineMessage v-else-if="error" type="error">
        {{ error }}
        <button type="button" class="ml-1 font-semibold underline" @click="refreshQuote">Coba lagi</button>
      </AppInlineMessage>
      <template v-else-if="quote">
        <AppSectionMessage
          v-if="quote.renewalRequired"
          appearance="warning"
          title="Perpanjang langganan lebih dahulu"
        >
          Sisa masa aktif kurang dari satu bulan. Perpanjang agar kursi dibeli untuk periode penuh, bukan ditagih satu bulan untuk sisa hari yang singkat.
        </AppSectionMessage>
        <div v-else class="rounded-sm border border-hairline bg-surface-alt p-4">
          <dl class="grid gap-2 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">Kapasitas setelah dibayar</dt>
              <dd class="font-semibold tabular-nums">{{ quote.resultingSeatQuota }} kursi</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">Sisa masa aktif</dt>
              <dd class="font-semibold">{{ quote.remainingMonths }} bulan · sampai {{ formatDate(quote.activeUntil) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">{{ quote.additionalSeats }} × {{ formatRupiah(quote.extraSeatPrice) }} × {{ quote.remainingMonths }} bulan</dt>
              <dd class="font-semibold tabular-nums">{{ formatRupiah(quote.amount) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4 border-t border-hairline pt-2">
              <dt class="font-semibold">Total tagihan</dt>
              <dd class="text-lg font-bold tabular-nums">{{ formatRupiah(quote.amount) }}</dd>
            </div>
          </dl>
        </div>
      </template>
    </div>

    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="ordering" @click="open = false">Batal</AppButton>
      <AppButton
        v-if="quote?.renewalRequired"
        size="sm"
        @click="renew"
      >
        Perpanjang
      </AppButton>
      <AppButton
        v-else
        size="sm"
        :loading="ordering"
        :disabled="pending || !quote?.canPurchase || ordering"
        @click="createOrder"
      >
        Buat tagihan
      </AppButton>
    </template>
  </AppModal>
</template>
