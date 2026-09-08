<script setup lang="ts">
import type { VerificationItem } from '#shared/types/admin-moderation'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Verifikasi pembayaran — satu antrean untuk dua jenis pembayaran manual:
 * pembelian paket oleh siswa, dan tagihan langganan bimbel.
 *
 * Keduanya digabung karena pekerjaan admin identik: buka daftar mutasi bank,
 * cocokkan nominalnya, putuskan. Dua halaman untuk satu kebiasaan berarti satu
 * di antaranya rutin terlupakan, dan yang terlupakan adalah orang yang sudah
 * membayar.
 *
 * Yang TIDAK digabung adalah akibat keputusannya, dan itu disengaja.
 * Menyetujui pembelian paket melunasi satu pesanan lalu memanggil hook ledger
 * yang sama persis dengan callback DOKU. Menyetujui langganan memanggil
 * BimbelBilling.Activate — mengaktifkan langganan dengan kuota kursi dan
 * durasinya. Dua endpoint berbeda, dua konsekuensi berbeda, jadi tiap kartu
 * membawa angka yang jenisnya butuhkan (kode unik dan paket untuk pembelian;
 * tingkat, kuota kursi, dan durasi untuk langganan) dan tombolnya memanggil
 * jalurnya masing-masing.
 *
 * Yang membuktikan uangnya masuk tetap mutasi di dashboard merchant. Baris di
 * sini hanyalah pembayar yang bilang "saya sudah transfer" — sinyal untuk
 * memeriksa, bukan buktinya sendiri.
 *
 * Berbeda dari antrean lain yang berbentuk tabel, satu keputusan di sini
 * dibuat dengan membandingkan beberapa angka berdampingan. Jadi tiap baris
 * tampil sebagai kartu, bukan baris yang harus diklik dulu.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Verifikasi Pembayaran | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { items: proofs, pending, error, refresh } = useAdminVerificationQueue()
const { refresh: refreshSummary } = useAdminSummary()

const runtimeConfig = useRuntimeConfig().public

/** Rute gambar per jenis — dua endpoint, dua pemeriksaan peran di server. */
function proofImageUrl(proof: VerificationItem): string {
  return proof.kind === 'package'
    ? adminPaymentProofImageUrl(proof.id)
    : `${runtimeConfig.apiBase}/admin/bimbel-payment-proofs/${proof.id}/image`
}

const KIND_LABEL: Record<VerificationItem['kind'], string> = {
  package: 'Pembelian paket',
  subscription: 'Langganan bimbel',
}

/** Siapa yang membayar, dibaca dari cabang union masing-masing. */
function payerName(proof: VerificationItem): string {
  return proof.kind === 'package' ? proof.buyerName : proof.bimbelName
}

// Skeleton hanya untuk muat pertama; refetch setelah keputusan membiarkan
// daftar lama tampil sampai data barunya datang.
const loaded = ref(false)
onMounted(async () => {
  await refresh()
  loaded.value = true
})

// Jenis ikut jadi filter, bukan hanya kolom. Menggabungkan antrean tidak boleh
// berarti admin kehilangan kemampuan mengerjakan satu jenis sekaligus — itu
// justru bagaimana daftar mutasi bank dibaca: per kelompok nominal, bukan
// selang-seling.
const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'queue', label: 'Perlu diperiksa' },
  { value: 'queue-package', label: 'Perlu diperiksa · paket' },
  { value: 'queue-subscription', label: 'Perlu diperiksa · langganan' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'oldest', label: 'Paling lama menunggu' },
  { value: 'newest', label: 'Terbaru dikonfirmasi' },
  { value: 'amount-desc', label: 'Nominal terbesar' },
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<VerificationItem>(() => proofs.value, {
  // Email hanya ada pada pembelian paket — server sengaja tidak mengirim
  // identitas pembayar pada baris langganan — jadi pencariannya menyesuaikan
  // per jenis alih-alih memaksa satu bentuk.
  searchFields: proof => proof.kind === 'package'
    ? [proof.invoice, proof.buyerName, proof.buyerEmail, proof.senderName]
    : [proof.invoice, proof.bimbelName, proof.senderName],
  filters: {
    queue: proof => proof.status === 'submitted',
    'queue-package': proof => proof.status === 'submitted' && proof.kind === 'package',
    'queue-subscription': proof => proof.status === 'submitted' && proof.kind === 'subscription',
    approved: proof => proof.status === 'approved',
    rejected: proof => proof.status === 'rejected',
    all: () => true,
  },
  sorts: {
    // Terlama dulu: yang paling lama menunggu adalah pembeli yang paling lama
    // sudah membayar tanpa mendapat aksesnya.
    oldest: (a, b) => a.createdAt - b.createdAt,
    newest: (a, b) => b.createdAt - a.createdAt,
    'amount-desc': (a, b) => b.amountDue - a.amountDue,
  },
  defaultFilter: 'queue',
  defaultSort: 'oldest',
})

const queueCount = computed(() => proofs.value.filter(proof => proof.status === 'submitted').length)

/* --------------------------------------------------------------------------
 * Pemberitahuan di tingkat halaman — satu slot di bawah header.
 * ------------------------------------------------------------------------ */

const successMessage = ref('')
const conflictMessage = ref('')
const actionError = ref('')

function clearNotices() {
  successMessage.value = ''
  conflictMessage.value = ''
  actionError.value = ''
}

const CONFLICT_NOTICE = 'Konfirmasi ini baru saja diputuskan (mungkin oleh admin lain). Daftar dimuat ulang.'
const DECISION_FALLBACK = 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.'

function isConflict(cause: unknown): boolean {
  return (cause as { statusCode?: number } | null)?.statusCode === 409
}

async function refreshAll() {
  await refresh()
  await refreshSummary()
}

/* --------------------------------------------------------------------------
 * Setujui — bukti submitted → approved, pesanan → paid. Final dan memindahkan
 * uang ke saldo tutor, jadi lewat modal konfirmasi yang menyebut nominalnya.
 * ------------------------------------------------------------------------ */

const approveTarget = ref<VerificationItem | null>(null)
const approveBusy = ref(false)
const approveError = ref('')

function openApprove(proof: VerificationItem) {
  clearNotices()
  approveError.value = ''
  approveTarget.value = proof
}

/**
 * Kalimat konfirmasi menyebut akibat yang sebenarnya, per jenis.
 *
 * Ini bukan sekadar copy. Menyetujui pembelian melunasi satu pesanan;
 * menyetujui langganan menjalankan langganan berbulan-bulan dengan kuota
 * kursi. Satu kalimat generik akan membuat dua keputusan dengan bobot yang
 * jauh berbeda terbaca sama.
 */
const approveDescription = computed(() => {
  const target = approveTarget.value
  if (!target) return ''
  const mismatch = target.paidAmount !== target.amountDue
    ? ` Perhatikan: pembayar menuliskan ${formatRupiah(target.paidAmount)}, berbeda dari tagihan.`
    : ''
  const consequence = target.kind === 'package'
    ? `Pesanan ${target.invoice} akan langsung lunas dan paketnya jadi milik ${target.buyerName}. `
      + 'Bagi hasil tutor ikut dicatat. '
    : `Tagihan ${target.invoice} akan langsung lunas dan ${bimbelPlanLabel(target.plan)} `
      + `${target.bimbelName} berjalan ${target.months} bulan dengan kuota ${target.seatQuota} kursi. `
  return `${consequence}Pastikan mutasi ${formatRupiah(target.amountDue)} benar-benar masuk.${mismatch}`
})

async function confirmApprove() {
  const target = approveTarget.value
  if (!target) return

  approveError.value = ''
  approveBusy.value = true
  try {
    // Dua endpoint, bukan satu: server yang melunasi pesanan dan server yang
    // mengaktifkan langganan adalah jalur berbeda, masing-masing transaksional
    // dan idempoten. Menggabungkan tampilannya tidak boleh menciptakan jalur
    // ketiga menuju uang.
    if (target.kind === 'package') await decideAdminPaymentProof(target.id, { action: 'approve' })
    else await decideBimbelProof(target.id, { action: 'approve' })

    approveTarget.value = null
    successMessage.value = target.kind === 'package'
      ? `Pembayaran ${target.invoice} disetujui. Paketnya sudah aktif untuk ${target.buyerName}.`
      : `Tagihan ${target.invoice} disetujui. Langganan ${target.bimbelName} sudah berjalan.`
    await refreshAll()
  }
  catch (cause) {
    if (isConflict(cause)) {
      approveTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refreshAll()
    }
    else {
      approveError.value = tutorApiMessage(cause, DECISION_FALLBACK)
    }
  }
  finally {
    approveBusy.value = false
  }
}

/* --------------------------------------------------------------------------
 * Tolak — alasannya wajib, karena itulah yang dikirim ke pembeli lewat email
 * dan yang tampil di halaman pembayarannya. Pesanan kembali jadi giliran
 * pembeli dengan tenggat baru.
 * ------------------------------------------------------------------------ */

const rejectTarget = ref<VerificationItem | null>(null)
const rejectBusy = ref(false)
const rejectError = ref('')

function openReject(proof: VerificationItem) {
  clearNotices()
  rejectError.value = ''
  rejectTarget.value = proof
}

async function confirmReject(reason: string) {
  const target = rejectTarget.value
  if (!target) return

  rejectError.value = ''
  rejectBusy.value = true
  try {
    if (target.kind === 'package') await decideAdminPaymentProof(target.id, { action: 'reject', reason })
    else await decideBimbelProof(target.id, { action: 'reject', reason })

    rejectTarget.value = null
    successMessage.value =
      `Konfirmasi ${target.invoice} ditolak. ${payerName(target)} diberi tahu dan bisa mengirim ulang.`
    await refreshAll()
  }
  catch (cause) {
    if (isConflict(cause)) {
      rejectTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refreshAll()
    }
    else {
      rejectError.value = tutorApiMessage(cause, DECISION_FALLBACK)
    }
  }
  finally {
    rejectBusy.value = false
  }
}

/* --------------------------------------------------------------------------
 * Pembacaan per baris.
 * ------------------------------------------------------------------------ */

const PROOF_STATUS_LABEL: Record<VerificationItem['status'], string> = {
  submitted: 'Menunggu diperiksa',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const PROOF_STATUS_TONE: Record<VerificationItem['status'], 'warning' | 'success' | 'neutral'> = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'neutral',
}

/**
 * Sudah berapa lama sejak pembeli checkout, dibulatkan kasar.
 *
 * Dipakai untuk memilah antrean, bukan untuk mencatat apa pun, jadi
 * pembulatannya tidak perlu tepat — yang dibutuhkan admin adalah melihat
 * sekilas mana yang sudah menunggu sehari dan mana yang baru lima menit lalu.
 */
function waitedSince(unixSeconds: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() / 1000 - unixSeconds) / 60))
  if (minutes < 60) return `menunggu ${minutes} menit`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `menunggu ${hours} jam`
  return `menunggu ${Math.floor(hours / 24)} hari`
}

/** Selisih nominal ditandai, karena itu alasan penolakan yang paling sering. */
function amountMismatch(proof: VerificationItem): boolean {
  return proof.paidAmount !== proof.amountDue
}

const zoomed = ref<VerificationItem | null>(null)
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[clamp(1.5rem,2.2vw,1.9rem)] leading-[1.16] tracking-[-0.03em]">
          Verifikasi pembayaran
        </h1>
        <p class="mt-2 max-w-2xl text-[0.92rem] leading-[1.6] text-muted">
          Pembelian paket siswa dan tagihan langganan bimbel yang menunggu
          diperiksa. Cocokkan nominalnya dengan mutasi bank, lalu setujui —
          persetujuan di sinilah yang melunasi pesanan atau menjalankan
          langganan. Perhatikan kolom jenisnya: akibat kedua keputusan itu
          berbeda.
        </p>
      </div>
      <DashboardBadge v-if="queueCount > 0" tone="warning">
        {{ queueCount }} perlu diperiksa
      </DashboardBadge>
    </header>

    <p
      v-if="successMessage"
      role="status"
      class="mt-6 rounded-sm border border-success-ink/25 bg-success-soft px-4 py-3 text-[0.88rem] text-success-ink"
    >
      {{ successMessage }}
    </p>
    <p
      v-else-if="conflictMessage"
      role="status"
      class="mt-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.88rem] text-amber-900"
    >
      {{ conflictMessage }}
    </p>
    <p
      v-else-if="actionError"
      role="alert"
      class="mt-6 rounded-sm border border-danger/25 bg-danger-soft px-4 py-3 text-[0.88rem] text-danger-ink"
    >
      {{ actionError }}
    </p>

    <DashboardTableToolbar
      v-model:search="search"
      v-model:filter="statusFilter"
      v-model:sort="sortOrder"
      class="mt-6"
      search-id="admin-payment-proofs-search"
      search-label="Cari konfirmasi pembayaran"
      search-placeholder="Cari invoice, pembeli, bimbel, atau nama pengirim…"
      :filter-options="FILTER_OPTIONS"
      :sort-options="SORT_OPTIONS"
      :result-count="rows.length"
      :total-count="total"
      item-noun="konfirmasi"
      :actionable-count="queueCount"
      actionable-label="perlu diperiksa"
      :active="isActive"
      @reset="reset"
    />

    <DashboardSkeleton v-if="pending && !loaded" class="mt-6" />

    <p
      v-else-if="error"
      role="alert"
      class="mt-6 rounded-sm border border-danger/25 bg-danger-soft px-4 py-3 text-[0.88rem] text-danger-ink"
    >
      {{ error }}
    </p>

    <p v-else-if="rows.length === 0" class="mt-10 text-center text-[0.92rem] text-muted">
      {{ isActive ? 'Tidak ada konfirmasi yang cocok dengan filter ini.' : 'Belum ada konfirmasi pembayaran yang menunggu.' }}
    </p>

    <ul v-else class="mt-6 grid gap-4">
      <li
        v-for="proof in rows"
        :key="proof.id"
        class="rounded-lg border border-hairline bg-surface p-5 shadow-xs"
      >
        <div class="flex flex-col gap-5 min-[820px]:flex-row">
          <!-- Lampiran, kalau ada. Diklik untuk diperbesar, karena nominal di
               tangkapan layar ponsel sering kecil. Tanpa lampiran bukan
               masalah: yang membuktikan uangnya masuk adalah mutasi bank, dan
               kode unik di kolom Tagihan yang menunjuk pesanan mana. -->
          <button
            v-if="proof.hasImage"
            type="button"
            class="shrink-0 self-start rounded-sm border border-hairline bg-white p-1.5 transition-[border-color] hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="zoomed = proof"
          >
            <img
              :src="proofImageUrl(proof)"
              :alt="`Bukti transfer untuk ${proof.invoice}`"
              loading="lazy"
              class="h-40 w-40 object-contain"
            >
            <span class="mt-1 block text-[0.75rem] text-muted">Klik untuk perbesar</span>
          </button>
          <div
            v-else
            class="grid h-40 w-40 shrink-0 place-items-center gap-1.5 self-start rounded-sm border border-dashed border-hairline-strong bg-surface-alt px-3 text-center"
          >
            <AppIcon name="receipt" :size="22" class="text-faint" aria-hidden="true" />
            <span class="text-[0.78rem] leading-[1.45] text-muted">
              Tanpa lampiran — cocokkan lewat mutasi bank
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <!-- Jenis di atas invoice, bukan di samping status: ia yang
                     menentukan bagaimana sisa kartu ini dibaca, jadi mata harus
                     menemukannya sebelum angka mana pun. -->
                <p
                  class="mb-1 inline-flex items-center rounded-full px-2 py-0.5 text-[0.72rem] font-bold tracking-wide uppercase"
                  :class="proof.kind === 'package'
                    ? 'bg-primary-soft text-primary'
                    : 'bg-amber-100 text-amber-800'"
                >
                  {{ KIND_LABEL[proof.kind] }}
                </p>
                <p class="font-bold tracking-[-0.02em] tabular-nums">{{ proof.invoice }}</p>
                <p class="mt-0.5 truncate text-[0.86rem] text-muted">
                  <template v-if="proof.kind === 'package'">
                    {{ proof.items[0]?.title ?? 'Paket tidak ditemukan' }}
                  </template>
                  <template v-else>
                    {{ bimbelPlanLabel(proof.plan) }} · {{ proof.months }} bulan · {{ proof.seatQuota }} kursi
                  </template>
                </p>
              </div>
              <DashboardBadge :tone="PROOF_STATUS_TONE[proof.status]">
                {{ PROOF_STATUS_LABEL[proof.status] }}
              </DashboardBadge>
            </div>

            <!-- Yang harus dicocokkan, berdampingan. -->
            <dl class="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Tagihan</dt>
                <dd class="mt-0.5 font-semibold tabular-nums">
                  {{ formatRupiah(proof.amountDue) }}
                  <span
                    v-if="proof.kind === 'package' && proof.uniqueCode > 0"
                    class="ml-1 text-[0.8rem] font-normal text-muted"
                  >
                    (kode unik {{ proof.uniqueCode }})
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Diklaim ditransfer</dt>
                <dd
                  class="mt-0.5 font-semibold tabular-nums"
                  :class="amountMismatch(proof) ? 'text-danger-ink' : ''"
                >
                  {{ formatRupiah(proof.paidAmount) }}
                  <span v-if="amountMismatch(proof)" class="ml-1 text-[0.8rem] font-normal">
                    · tidak cocok
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">
                  {{ proof.kind === 'package' ? 'Pembeli' : 'Bimbel' }}
                </dt>
                <dd class="mt-0.5 truncate text-[0.9rem]">
                  <template v-if="proof.kind === 'package'">
                    {{ proof.buyerName }}
                    <span class="text-muted">· {{ proof.buyerEmail }}</span>
                  </template>
                  <!-- Server sengaja tidak mengirim identitas pembayar pada
                       baris langganan, jadi tidak ada email untuk ditampilkan
                       di sini. -->
                  <template v-else>{{ proof.bimbelName }}</template>
                </dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Nama pengirim</dt>
                <dd class="mt-0.5 truncate text-[0.9rem]">{{ proof.senderName }}</dd>
              </div>
              <!-- Waktu checkout lebih dulu daripada waktu konfirmasi: itu yang
                   menentukan sudah berapa lama pembeli menunggu, dan karena
                   pembeli tidak lagi mengunggah bukti apa pun, lamanya menunggu
                   adalah satu-satunya hal yang membedakan antrean yang mendesak
                   dari yang baru masuk. -->
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Waktu checkout</dt>
                <dd class="mt-0.5 text-[0.9rem]">
                  {{ formatDateLong(proof.orderDate) }}
                  <span class="text-muted">· {{ waitedSince(proof.orderDate) }}</span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Dikonfirmasi pembeli</dt>
                <dd class="mt-0.5 text-[0.9rem]">{{ formatDateLong(proof.createdAt) }}</dd>
              </div>
            </dl>

            <p v-if="proof.note" class="mt-3.5 rounded-sm bg-surface-sunken px-3.5 py-2.5 text-[0.86rem] leading-[1.55]">
              <span class="font-semibold">Catatan pembayar:</span> {{ proof.note }}
            </p>

            <p
              v-if="proof.status === 'rejected' && proof.rejectReason"
              class="mt-3.5 rounded-sm border-l-2 border-danger/40 bg-danger-soft px-3.5 py-2.5 text-[0.86rem] leading-[1.55] text-danger-ink"
            >
              <span class="font-semibold">Alasan penolakan:</span> {{ proof.rejectReason }}
            </p>

            <div v-if="proof.status === 'submitted'" class="mt-5 flex flex-wrap gap-2.5">
              <AppButton size="sm" @click="openApprove(proof)">
                Setujui &amp; lunasi
              </AppButton>
              <!-- outline, bukan secondary: dua tombol gelap berdampingan
                   membuat menolak terbaca sepenting menyetujui. -->
              <AppButton variant="outline" size="sm" @click="openReject(proof)">
                Tolak…
              </AppButton>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <!-- Perbesar bukti. Gambar penuh, tanpa kroping, karena angka kecil di
         pojok tangkapan layar sering justru yang menentukan. -->
    <AppModal
      v-if="zoomed"
      :model-value="Boolean(zoomed)"
      title="Bukti transfer"
      :description="`${KIND_LABEL[zoomed.kind]} · ${zoomed.invoice} · tagihan ${formatRupiah(zoomed.amountDue)}`"
      @update:model-value="zoomed = null"
    >
      <img
        :src="proofImageUrl(zoomed)"
        :alt="`Bukti transfer untuk ${zoomed.invoice}`"
        class="max-h-[70vh] w-full bg-white object-contain"
      >
    </AppModal>

    <AdminConfirmModal
      :open="Boolean(approveTarget)"
      title="Setujui pembayaran ini?"
      :description="approveDescription"
      confirm-label="Setujui & lunasi"
      :busy="approveBusy"
      :error="approveError"
      @update:open="approveTarget = null"
      @confirm="confirmApprove"
    />

    <AdminReasonModal
      :open="Boolean(rejectTarget)"
      title="Tolak konfirmasi pembayaran"
      description="Pembayar akan menerima email berisi alasan ini dan bisa mengirim konfirmasi ulang. Tagihannya tidak hangus."
      placeholder="Misalnya: tidak ada mutasi masuk dengan nominal ini, atau nominalnya kurang Rp347 dari tagihan."
      confirm-label="Tolak konfirmasi"
      :busy="rejectBusy"
      :error="rejectError"
      @update:open="rejectTarget = null"
      @confirm="confirmReject"
    />
  </div>
</template>
