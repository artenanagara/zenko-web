<script setup lang="ts">
import type { Purchase } from '#shared/types/account'

/**
 * Kartu pembayaran QRIS manual: satu QRIS statis milik Zenko, nominal yang
 * harus dibayar sampai digit terakhir, dan satu tombol konfirmasi.
 *
 * Berbeda dari jalur otomatis, kode di sini tidak membawa nominal — QRIS statis
 * memang tidak bisa — jadi pembeli mengetik sendiri angkanya di aplikasi bank.
 * Itulah alasan tiga digit kode unik ditampilkan terpisah lalu dijumlahkan:
 * satu digit yang meleset membuat admin tidak bisa mencocokkan transfernya
 * dengan pesanan ini, dan pembeli berhak tahu dari mana angka ganjil itu
 * datang.
 *
 * Tidak ada unggahan bukti transfer, dan tidak ada isian nama maupun nominal.
 * Yang membuktikan uangnya masuk adalah daftar mutasi merchant, tempat kode
 * unik itu menunjuk pesanannya sendiri — tangkapan layar justru bukti yang
 * lebih lemah karena bisa dipalsukan, dan tiap kolom tambahan adalah satu lagi
 * cara pembayar jujur tersangkut. Tombolnya hanya mengerjakan dua hal yang
 * tidak bisa dikerjakan kode unik: memberi tahu bahwa ada yang perlu diperiksa,
 * dan menghentikan hitungan kedaluwarsa.
 */

const props = defineProps<{ purchase: Purchase }>()
const emit = defineEmits<{ confirmed: [Purchase] }>()

const { public: config } = useRuntimeConfig()

/** Nama merchant dan NMID dibaca dari server, satu sumber dengan yang dicetak di posternya. */
interface ManualQrisMethod {
  merchantName: string
  nmid: string
  deadlineHours: number
}

const method = ref<ManualQrisMethod | null>(null)
onMounted(async () => {
  try {
    method.value = await useApiFetch<ManualQrisMethod>('/payments/manual-qris', {
      baseURL: config.apiBase,
      credentials: 'include',
    })
  }
  catch {
    // Detail merchant hanyalah pemeriksaan tambahan sebelum membayar. Kalau
    // gagal dimuat, QR dan nominalnya tetap tampil — yang hilang cuma baris
    // pencocokan namanya.
  }
})

/**
 * Janji waktu verifikasi, dibaca dari tenggat yang sama yang dipakai server.
 * 24 jam ditulis "1×24 jam" karena itu yang lazim dibaca di Indonesia.
 */
const verificationWindow = computed(() => {
  const hours = method.value?.deadlineHours ?? 24
  return hours === 24 ? '1×24 jam' : `${hours} jam`
})

const amounts = computed(() => manualTransferBreakdown(props.purchase))

/** Ditolak admin: alasannya yang pertama dibaca, sebelum QR-nya. */
const rejection = computed(() => {
  const proof = props.purchase.paymentProof
  return proof?.status === 'rejected' && proof.rejectReason ? proof.rejectReason : null
})

const { error: confirmError, confirmPayment } = useCheckout()
const confirming = ref(false)

async function onConfirm() {
  confirming.value = true
  const updated = await confirmPayment(props.purchase.invoice)
  confirming.value = false
  if (updated) emit('confirmed', updated)
}

const copied = ref(false)
let copyResetHandle: ReturnType<typeof setTimeout> | null = null

async function copyAmount() {
  try {
    await navigator.clipboard.writeText(String(amounts.value.total))
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
  `Ketik nominalnya persis ${formatRupiah(amounts.value.total)} — termasuk tiga digit terakhir.`,
  'Selesaikan pembayaran, lalu tekan "Saya sudah bayar" di bawah supaya kami memeriksanya.',
])
</script>

<template>
  <div class="rounded-lg border border-hairline-strong bg-surface-alt p-6 shadow-xs sm:p-8">
    <!-- Bukti sebelumnya ditolak: alasannya diletakkan paling atas, karena
         itulah satu-satunya hal yang harus pembeli perbaiki. -->
    <div
      v-if="rejection"
      role="status"
      class="mb-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3.5"
    >
      <p class="flex items-center gap-2 font-semibold text-amber-900">
        <IconAlert class="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        Konfirmasi pembayaran sebelumnya belum bisa diterima
      </p>
      <p class="mt-1.5 text-[0.88rem] leading-[1.6] text-amber-800">{{ rejection }}</p>
      <p class="mt-1.5 text-[0.84rem] text-amber-800">
        Pesananmu belum hangus — pastikan nominalnya persis, lalu konfirmasi lagi di bawah.
      </p>
    </div>

    <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      <ManualQrisCode />

      <!-- Kolom kanan: siapa yang dibayar, berapa, lalu satu tindakan.
           Nominalnya sengaja tidak sebesar angka Total di ringkasan pesanan —
           di sini ia berdampingan dengan QR, bukan penutup halaman. -->
      <div class="grid w-full gap-4 text-center sm:text-left">
        <div>
          <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">QRIS · Satu QRIS untuk semua</p>
          <p class="mt-1.5 font-bold tracking-[-0.02em]">
            {{ method?.merchantName ?? 'Zenko Edukasi' }}
          </p>
          <p v-if="method?.nmid" class="mt-0.5 text-[0.82rem] text-muted tabular-nums">
            NMID {{ method.nmid }}
          </p>
          <!-- Penerbitnya disebut, bukan disembunyikan: pembeli yang melihat
               nama DANA muncul di aplikasinya perlu tahu itu memang benar dan
               bukan QR orang lain. Disebut sebagai penerbit, bukan sebagai
               syarat — QRIS ini bisa dibayar dari aplikasi apa pun. -->
          <p class="mt-0.5 text-[0.82rem] text-muted">Diterbitkan lewat DANA</p>
          <p class="mt-2 text-[0.84rem] leading-[1.55] text-muted">
            Pastikan nama ini yang muncul di aplikasi pembayaranmu sebelum menekan bayar.
            Kamu bisa membayarnya dari aplikasi bank atau e-wallet apa pun yang mendukung QRIS —
            tidak harus DANA.
          </p>
        </div>

        <!-- Nominal: angka bulat dan kode unik dipisah, lalu dijumlahkan. -->
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
            {{ formatRupiah(amounts.total) }}
          </p>

          <dl v-if="amounts.uniqueCode > 0" class="mt-3 grid gap-1 border-t border-primary/20 pt-2.5 text-[0.82rem]">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Harga paket</dt>
              <dd class="tabular-nums">{{ formatRupiah(amounts.base) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Kode unik</dt>
              <dd class="font-semibold tabular-nums">{{ amounts.uniqueCode }}</dd>
            </div>
          </dl>
        </div>

        <!-- Satu tindakan, tanpa dialog dan tanpa isian: kode unik di
             nominalnya sudah menunjuk pesanan ini, jadi tidak ada yang perlu
             ditanyakan lagi ke pembeli. -->
        <AppButton
          size="lg"
          class="w-full"
          :disabled="confirming"
          @click="onConfirm"
        >
          {{ confirming ? 'Mengirim…' : 'Saya sudah bayar' }}
        </AppButton>
        <p v-if="confirmError" role="alert" class="text-[0.84rem] text-danger">
          {{ confirmError }}
        </p>

      </div>
    </div>

    <ol class="mt-7 grid gap-4 border-t border-hairline pt-6">
      <li v-for="(step, index) in paySteps" :key="step" class="flex items-start gap-3.5">
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.8rem] font-bold text-primary"
          aria-hidden="true"
        >{{ index + 1 }}</span>
        <span class="pt-0.5 text-[0.9rem] leading-[1.55] text-muted">{{ step }}</span>
      </li>
    </ol>

    <p class="mt-6 text-[0.8rem] leading-[1.6] text-muted">
      Pembayaran diverifikasi manual oleh tim Zenko, maksimal {{ verificationWindow }}.
      Zenko tidak pernah meminta PIN, OTP, atau kata sandimu.
      <NuxtLink to="/kebijakan-refund" class="font-semibold text-primary hover:underline">
        Kebijakan Refund
      </NuxtLink>
    </p>

  </div>
</template>
