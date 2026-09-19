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
 * Antreannya tabel, satu baris satu konfirmasi, dan dibuka pada "Semua":
 * halaman yang kosong hanya karena tidak ada yang menunggu terbaca seperti
 * belum ada konfirmasi sama sekali, padahal riwayat keputusannya justru yang
 * admin cari saat pembeli bertanya. Jumlah yang masih perlu diperiksa selalu
 * disebut di header — termasuk ketika nol, karena "nol" adalah jawaban yang
 * ingin dibaca admin, bukan ketiadaan angka.
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

function proofKindLabel(proof: VerificationItem): string {
  if (proof.kind === 'package') return 'Pembelian paket'
  return proof.orderKind === 'seat_addon' ? 'Tambah kursi bimbel' : 'Langganan bimbel'
}

/** Versi pendek untuk kolom Jenis — kolom Paket sudah menyebut bimbel/paketnya. */
function proofKindShort(proof: VerificationItem): string {
  if (proof.kind === 'package') return 'Paket'
  return proof.orderKind === 'seat_addon' ? 'Kursi' : 'Langganan'
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
  { value: 'name-asc', label: 'Nama pengirim A–Z' },
  { value: 'name-desc', label: 'Nama pengirim Z–A' },
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
    'name-asc': (a, b) => a.senderName.localeCompare(b.senderName, 'id'),
    'name-desc': (a, b) => b.senderName.localeCompare(a.senderName, 'id'),
  },
  defaultFilter: 'all',
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
const DECISION_FALLBACK = 'Keputusan belum berhasil disimpan. Coba lagi sebentar lagi.'

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
    : target.orderKind === 'seat_addon'
      ? `Tagihan ${target.invoice} akan langsung lunas dan menambah ${target.additionalSeats} kursi `
        + `${target.bimbelName}, sehingga kuotanya menjadi ${target.seatQuota} kursi. Masa aktif tidak berubah. `
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
      : target.orderKind === 'seat_addon'
        ? `Tagihan ${target.invoice} disetujui. ${target.additionalSeats} kursi ditambahkan untuk ${target.bimbelName}.`
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
  submitted: 'Perlu diperiksa',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const PROOF_STATUS_TONE: Record<VerificationItem['status'], 'warning' | 'success' | 'neutral'> = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'neutral',
}

type ProofStatus = VerificationItem['status']

/**
 * Kolom antrean — satu kolom satu fakta, seperti tabel admin lainnya.
 * Tagihan dan yang diklaim bersebelahan sebagai dua kolom angka, bukan satu
 * sel bertumpuk, supaya mata membandingkannya mendatar seperti membaca
 * mutasi bank; kode unik kolom sendiri karena ia yang dicari di mutasi.
 */
const COLUMNS = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'jenis', label: 'Jenis' },
  { key: 'nama', label: 'Nama' },
  { key: 'paket', label: 'Paket' },
  { key: 'tagihan', label: 'Tagihan', align: 'right' as const },
  { key: 'kodeUnik', label: 'Kode unik', align: 'right' as const, hideOnMobile: true },
  { key: 'diklaim', label: 'Diklaim', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

/**
 * DashboardTable bekerja pada Record<string, any>, jadi tiap baris membawa
 * proof aslinya apa adanya dan slot sel membacanya dari sana — bukan
 * meratakan tiap field jadi string lebih dulu, yang akan menghilangkan cabang
 * union-nya persis di tempat template masih perlu membedakannya.
 */
const tableRows = computed(() => rows.value.map(proof => ({
  invoice: proof.invoice,
  jenis: proofKindShort(proof),
  nama: payerName(proof),
  paket: proof.kind === 'package'
    ? proof.items[0]?.title ?? 'Paket tidak ditemukan'
    : proof.orderKind === 'seat_addon'
      ? `+${proof.additionalSeats} kursi · kuota menjadi ${proof.seatQuota}`
      : `${bimbelPlanLabel(proof.plan)} · ${proof.months} bulan · ${proof.seatQuota} kursi`,
  tagihan: proof.amountDue,
  kodeUnik: proof.kind === 'package' && proof.uniqueCode > 0 ? proof.uniqueCode : null,
  diklaim: proof.paidAmount,
  proof,
})))

/**
 * Sudah berapa lama sejak pembeli checkout, dibulatkan kasar.
 *
 * Dipakai untuk memilah antrean, bukan untuk mencatat apa pun, jadi
 * pembulatannya tidak perlu tepat — yang dibutuhkan admin adalah melihat
 * sekilas mana yang sudah menunggu sehari dan mana yang baru lima menit lalu.
 */
function waitedSince(unixSeconds: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() / 1000 - unixSeconds) / 60))
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam`
  return `${Math.floor(hours / 24)} hari`
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
      <!-- Selalu tampil, juga saat nol: admin membuka halaman ini untuk
           menjawab "ada yang harus saya periksa?", dan badge yang hilang
           bukan jawaban. -->
      <DashboardBadge v-if="loaded" :tone="queueCount > 0 ? 'warning' : 'success'">
        {{ queueCount > 0 ? `${queueCount} perlu diperiksa` : 'Tidak ada yang perlu diperiksa' }}
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
      {{ isActive ? 'Tidak ada konfirmasi yang cocok dengan filter ini.' : 'Belum ada konfirmasi pembayaran yang masuk.' }}
    </p>

    <!-- Antrean sebagai tabel biasa: satu baris satu konfirmasi, satu kolom
         satu fakta. Buktinya tautan kecil yang membuka modal perbesaran —
         dibuka saat diperlukan, bukan dimuat untuk semua baris sekaligus. -->
    <DashboardTable
      v-else
      class="mt-6"
      :columns="COLUMNS"
      :data="tableRows"
      primary-key="invoice"
      action-key="aksi"
      compact
    >
      <template #cell(invoice)="{ value }">
        <span class="font-semibold tracking-[-0.02em] whitespace-nowrap text-ink tabular-nums">{{ value }}</span>
      </template>

      <template #cell(jenis)="{ item }">
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-[0.72rem] font-bold tracking-wide whitespace-nowrap uppercase"
          :class="item.proof.kind === 'package' ? 'bg-primary-soft text-primary' : 'bg-amber-100 text-amber-800'"
        >{{ item.jenis }}</span>
      </template>

      <!-- Nama pembeli/bimbel; nama pengirim transfer (yang tertulis di
           mutasi) ada di tooltip dan di modal bukti — bukan kolom sendiri,
           supaya tabelnya muat tanpa menggulung ke samping. -->
      <template #cell(nama)="{ item }">
        <span class="whitespace-nowrap" :title="`Pengirim transfer: ${item.proof.senderName}`">{{ item.nama }}</span>
      </template>

      <template #cell(paket)="{ value }">
        <span class="block max-w-[13rem] truncate" :title="value">{{ value }}</span>
      </template>

      <template #cell(tagihan)="{ value }">
        <span class="font-semibold whitespace-nowrap tabular-nums">{{ formatRupiah(value) }}</span>
      </template>

      <template #cell(kodeUnik)="{ value }">
        <span v-if="value" class="tabular-nums">{{ value }}</span>
        <span v-else class="text-muted">—</span>
      </template>

      <!-- Selisih dari tagihan ditandai: itu alasan penolakan yang paling sering. -->
      <template #cell(diklaim)="{ item }">
        <span
          class="whitespace-nowrap tabular-nums"
          :class="amountMismatch(item.proof) ? 'font-semibold text-danger-ink' : ''"
          :title="amountMismatch(item.proof) ? 'Tidak cocok dengan tagihan' : undefined"
        >{{ formatRupiah(item.proof.paidAmount) }}</span>
      </template>

      <template #cell(status)="{ item }">
        <!-- Lama menunggu menempel di badge antrean, bukan kolom sendiri:
             ia hanya berarti untuk yang belum diputuskan, dan urutan
             "Paling lama menunggu" sudah menyusunnya. -->
        <DashboardBadge
          class="whitespace-nowrap"
          :tone="PROOF_STATUS_TONE[item.proof.status as ProofStatus]"
          :title="item.proof.status === 'rejected' && item.proof.rejectReason ? item.proof.rejectReason : formatDateLong(item.proof.orderDate)"
        >
          {{ PROOF_STATUS_LABEL[item.proof.status as ProofStatus] }}<template v-if="item.proof.status === 'submitted'"> · {{ waitedSince(item.proof.orderDate) }}</template>
        </DashboardBadge>
      </template>

      <!-- Bukti transfer ikut di Aksi sebagai tombol ikon: ia dibuka
           sebelum memutuskan, jadi tempatnya persis di sebelah keputusan. -->
      <template #cell(aksi)="{ item }">
        <div class="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
          <button
            v-if="item.proof.hasImage"
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-primary transition-colors hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Lihat bukti transfer"
            aria-label="Lihat bukti transfer"
            @click="zoomed = item.proof"
          >
            <AppIcon name="image" :size="18" aria-hidden="true" />
          </button>
          <template v-if="item.proof.status === 'submitted'">
            <AppIconButton variant="ghost" size="sm" aria-label="Setujui pembayaran" ariaLabel="Setujui pembayaran" title="Setujui pembayaran" @click="openApprove(item.proof)"><AppIcon name="check-circle" :size="17" aria-hidden="true" /></AppIconButton>
            <!-- outline, bukan secondary: dua tombol gelap berdampingan
                 membuat menolak terbaca sepenting menyetujui. -->
            <AppIconButton variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" aria-label="Tolak pembayaran" ariaLabel="Tolak pembayaran" title="Tolak pembayaran" @click="openReject(item.proof)"><AppIcon name="x-circle" :size="17" aria-hidden="true" /></AppIconButton>
          </template>
          <span v-else-if="!item.proof.hasImage" class="text-[0.84rem] text-muted">—</span>
        </div>
      </template>
    </DashboardTable>

    <!-- Perbesar bukti. Gambar penuh, tanpa kroping, karena angka kecil di
         pojok tangkapan layar sering justru yang menentukan. -->
    <AppModal
      v-if="zoomed"
      :model-value="Boolean(zoomed)"
      title="Bukti transfer"
      :description="`${proofKindLabel(zoomed)} · ${zoomed.invoice} · tagihan ${formatRupiah(zoomed.amountDue)} · pengirim ${zoomed.senderName}`"
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
