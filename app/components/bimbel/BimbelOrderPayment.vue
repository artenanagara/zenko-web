<script setup lang="ts">
import type { BimbelOrder, BimbelPaymentInstructions } from '#shared/types/bimbel'
import type { PaymentProofPayload } from '../checkout/PaymentProofFields.vue'

/**
 * Instruksi bayar dan konfirmasi transfer untuk satu tagihan langganan bimbel.
 *
 * Sengaja bukan alur baru: bentuknya mencerminkan jalur QRIS manual yang sudah
 * dipakai siswa (checkout/ManualQrisCard.vue) — QRIS statis yang sama, nominal
 * persis, satu tombol "Saya sudah transfer", lampiran opsional, dan verifikasi
 * manual oleh admin. Pengelola bimbel yang juga pernah membeli paket sebagai
 * siswa menemukan halaman yang sama, bukan yang kedua.
 *
 * Seluruh angkanya dari `GET .../billing/orders/:orderId/payment`, termasuk
 * nama merchant dan tenggatnya: tagihan bisa hangus saat halaman ini terbuka,
 * dan yang tahu itu server. Tidak ada yang dihitung ulang di sini.
 */

const props = defineProps<{ bimbelId: string, order: BimbelOrder }>()
const emit = defineEmits<{ updated: [BimbelOrder] }>()

const { public: config } = useRuntimeConfig()

const instructions = ref<BimbelPaymentInstructions | null>(null)
const loading = ref(true)
const loadError = ref('')

async function loadInstructions() {
  loading.value = true
  loadError.value = ''
  try {
    instructions.value = await getBimbelPaymentInstructions(props.bimbelId, props.order.id)
  }
  catch (cause) {
    instructions.value = null
    loadError.value = tutorApiMessage(cause, 'Instruksi pembayaran belum bisa dimuat.')
  }
  finally {
    loading.value = false
  }
}
onMounted(loadInstructions)
watch(() => props.order.id, loadInstructions)

/**
 * Status dan bukti diambil dari instruksi kalau ada, karena membuka layar ini
 * juga tempat tagihan yang lewat waktunya dinyatakan hangus — daftar tagihan
 * yang dimuat lebih dulu bisa saja masih menyebutnya `pending`.
 */
const status = computed(() => instructions.value?.status ?? props.order.status)
const proof = computed(() => instructions.value?.proof ?? props.order.proof ?? null)
const amount = computed(() => instructions.value?.amount ?? props.order.amount)
const expiresAt = computed(() => instructions.value?.expiresAt ?? props.order.expiresAt ?? 0)

const isVerifying = computed(() => status.value === 'verifying')
const isClosed = computed(() => status.value === 'expired' || status.value === 'cancelled')
const payable = computed(() => status.value === 'pending')
const orderSummary = computed(() => props.order.kind === 'seat_addon'
  ? `${props.order.additionalSeats} kursi tambahan`
  : `${bimbelPlanLabel(props.order.plan)} · ${props.order.months} bulan`)

/** Bukti sebelumnya ditolak: alasannya yang pertama dibaca, sebelum QR-nya. */
const rejection = computed(() => {
  const latest = proof.value
  return latest?.status === 'rejected' && latest.rejectReason ? latest.rejectReason : null
})

/** Lampiran tidak pernah lewat /uploads publik; ini route berpenjaga sesi. */
const proofImageUrl = computed(() =>
  `${config.apiBase}/bimbel/${props.bimbelId}/billing/orders/${props.order.id}/payment-proof/image`,
)

const formOpen = ref(false)
const submitting = ref(false)
const submitError = ref('')

const copied = ref(false)
let copyResetHandle: ReturnType<typeof setTimeout> | null = null

async function copyAmount() {
  try {
    await navigator.clipboard.writeText(String(amount.value))
    copied.value = true
    if (copyResetHandle !== null) clearTimeout(copyResetHandle)
    copyResetHandle = setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    // Clipboard ditolak browser (izin, atau konteks non-HTTPS). Nominalnya
    // tetap terbaca di layar dan bisa diketik manual.
  }
}

onUnmounted(() => {
  if (copyResetHandle !== null) clearTimeout(copyResetHandle)
})

const paySteps = computed(() => [
  'Buka aplikasi bank atau e-wallet yang mendukung QRIS.',
  'Pilih "Scan QR", lalu arahkan kamera ke kode di atas. Kalau kamu membuka halaman ini dari HP, simpan dulu gambarnya lalu unggah di aplikasi bank.',
  `Ketik nominalnya persis ${formatRupiah(amount.value)}.`,
  'Selesaikan pembayaran, lalu beri tahu kami lewat tombol di bawah.',
])

async function onSubmit(payload: PaymentProofPayload) {
  submitError.value = ''
  submitting.value = true
  try {
    const updated = await confirmBimbelOrderPayment(props.bimbelId, props.order.id, payload)
    formOpen.value = false
    emit('updated', updated)
    // Instruksi dimuat ulang supaya status dan bukti terbarunya datang dari
    // sumber yang sama dengan yang dirender layar ini.
    await loadInstructions()
  }
  catch (cause) {
    submitError.value = tutorApiMessage(cause, 'Konfirmasi belum bisa dikirim. Coba lagi.')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <DashboardSkeleton v-if="loading" :count="3" label="Memuat instruksi pembayaran…" />

    <div v-else-if="loadError" class="py-6 text-center">
      <AppInlineMessage type="error">{{ loadError }}</AppInlineMessage>
      <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="loadInstructions">
        Coba lagi
      </button>
    </div>

    <template v-else>
      <AppSectionMessage
        v-if="isClosed"
        appearance="warning"
        :title="status === 'expired' ? 'Tagihan ini sudah kedaluwarsa' : 'Tagihan ini dibatalkan'"
      >
        Buat tagihan baru untuk melanjutkan. Pembayaran ke
        tagihan yang sudah tertutup tidak akan diproses.
      </AppSectionMessage>

      <AppSectionMessage v-else-if="rejection" appearance="warning" title="Bukti pembayaran sebelumnya belum bisa diterima">
        {{ rejection }} Tagihanmu belum hangus — perbaiki lalu konfirmasi lagi di bawah.
      </AppSectionMessage>

      <AppSectionMessage v-else-if="isVerifying" appearance="information" title="Bukti pembayaranmu sedang diperiksa">
        Tim Zenko memeriksanya secara manual. Langganan aktif begitu pembayaranmu
        diterima — tidak perlu mengirim ulang.
      </AppSectionMessage>

      <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ManualQrisCode />

        <div class="grid w-full gap-4 text-center sm:text-left">
          <div>
            <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">QRIS · Satu QRIS untuk semua</p>
            <p class="mt-1.5 font-bold tracking-[-0.02em]">{{ instructions?.merchantName }}</p>
            <p v-if="instructions?.nmid" class="mt-0.5 text-[0.82rem] text-muted tabular-nums">
              NMID {{ instructions.nmid }}
            </p>
            <p class="mt-2 text-[0.84rem] leading-[1.55] text-muted">
              Pastikan nama ini yang muncul di aplikasi pembayaranmu sebelum menekan bayar.
            </p>
          </div>

          <div class="rounded-sm border border-primary/25 bg-primary-soft/40 px-4 py-3.5 text-left">
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">Nominal transfer</p>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-primary hover:underline"
                @click="copyAmount"
              >
                <AppIcon :name="copied ? 'check' : 'copy'" :size="14" aria-hidden="true" />
                {{ copied ? 'Tersalin' : 'Salin' }}
              </button>
            </div>
            <p class="mt-1 text-[1.35rem] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
              {{ formatRupiah(amount) }}
            </p>
            <p class="mt-2 text-[0.82rem] text-muted">
              {{ orderSummary }}
            </p>
            <p v-if="expiresAt && payable" class="mt-1 text-[0.82rem] font-semibold text-warning-ink">
              Bayar sebelum {{ formatDate(expiresAt) }}
            </p>
          </div>

          <AppButton v-if="payable" size="lg" class="w-full" @click="formOpen = true">
            Saya sudah transfer
          </AppButton>
          <AppButton v-else-if="isVerifying" size="lg" class="w-full" disabled>
            Menunggu verifikasi
          </AppButton>

          <!-- Lampiran yang sudah terkirim, kalau ada. Membuka tab baru, bukan
               dirender inline: gambarnya di belakang penjaga sesi dan bisa
               berukuran penuh. -->
          <a
            v-if="proof?.hasImage"
            :href="proofImageUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center justify-center gap-2 text-[0.84rem] font-semibold text-primary hover:underline"
          >
            <AppIcon name="image" :size="15" aria-hidden="true" />
            Lihat bukti transfer yang kamu kirim
          </a>
        </div>
      </div>

      <ol v-if="payable" class="grid gap-4 border-t border-hairline pt-6">
        <li v-for="(step, index) in paySteps" :key="step" class="flex items-start gap-3.5">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.8rem] font-bold text-primary"
            aria-hidden="true"
          >{{ index + 1 }}</span>
          <span class="pt-0.5 text-[0.9rem] leading-[1.55] text-muted">{{ step }}</span>
        </li>
      </ol>

      <p class="text-[0.8rem] leading-[1.6] text-muted">
        Pembayaran diverifikasi manual oleh tim Zenko. Zenko tidak pernah meminta
        PIN, OTP, atau kata sandimu.
      </p>

      <AppModal
        :model-value="formOpen"
        title="Konfirmasi pembayaran"
        description="Beri tahu kami supaya pembayaranmu masuk antrean pemeriksaan dan tagihanmu tidak hangus sambil menunggu."
        @update:model-value="formOpen = $event"
      >
        <PaymentProofFields
          :expected-amount="amount"
          :error="submitError"
          :submitting="submitting"
          @submit="onSubmit"
        />
      </AppModal>
    </template>
  </div>
</template>
