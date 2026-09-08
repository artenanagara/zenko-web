<script setup lang="ts">
import type { AdminBimbelPaymentProof, BimbelOrderStatus } from '#shared/types/bimbel'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Verifikasi langganan — antrean bukti transfer tagihan langganan bimbel.
 *
 * Kembarannya di sisi siswa adalah /dashboard/admin/payments, dan kemiripannya
 * disengaja: jalur pembayaran langganan memang meniru jalur QRIS manual pembeli
 * (bimbel_payments.go), jadi meja verifikasinya pun tidak boleh punya bentuk
 * interaksi kedua yang harus dipelajari terpisah.
 *
 * Yang membuktikan uangnya masuk tetap mutasi di dashboard merchant. Baris di
 * sini adalah pengelola bimbel yang bilang "kami sudah transfer" — `senderName`,
 * `paidAmount`, dan `transferredAt` semuanya klaim pembayar, bukan bukti — dan
 * lampirannya hanya menolong saat nominalnya ternyata tidak cocok mutasi mana
 * pun. Karena satu keputusan lahir dari membandingkan beberapa angka
 * berdampingan (tagihan versus yang diklaim, tingkat versus kuota kursi), tiap
 * baris tampil sebagai kartu, bukan baris tabel yang harus diklik dulu.
 *
 * Menyetujui di sini adalah yang MENGAKTIFKAN langganannya: server memanggil
 * BimbelBilling.Activate yang sama persis dengan tombol aktivasi di
 * /dashboard/admin/bimbels/orders — transaksional dan idempoten, jadi tidak ada
 * jalur kedua menuju langganan berbayar. Menolak mengembalikan tagihannya ke
 * `pending` dengan tenggat baru, karena jamnya berhenti selama menunggu di
 * antrean ini.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Verifikasi Langganan Bimbel | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// 'all' sekali di muka lalu disaring di klien — persis alasan yang ditulis di
// useAdminBimbelProofs: antreannya kecil, dan pindah filter tidak boleh berarti
// menunggu jaringan.
const { data: proofs, pending, error, refresh } = useAdminBimbelProofs('all')

// Skeleton hanya untuk muat pertama; refetch setelah keputusan membiarkan
// daftar lama tampil sampai data barunya datang.
const loaded = ref(false)
onMounted(async () => {
  await refresh()
  loaded.value = true
})

/**
 * URL lampiran. Bukan berkas statis: rute ini memeriksa sesi dan peran admin,
 * karena bukti transfer memuat nama dan nominal. Dibentuk dari `apiBase` dan
 * dipasang sebagai `<img src>` biasa — sama seperti adminPaymentProofImageUrl
 * di meja verifikasi siswa — sehingga cookie sesi (HttpOnly, milik origin API)
 * ikut terkirim oleh browser tanpa perlu ditangani halaman ini.
 */
const { public: runtimeConfig } = useRuntimeConfig()

function proofImageUrl(id: string): string {
  return `${runtimeConfig.apiBase}/admin/bimbel-payment-proofs/${id}/image`
}

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'queue', label: 'Perlu diperiksa' },
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
} = useTableControls<AdminBimbelPaymentProof>(() => proofs.value, {
  // Tidak ada email pembayar di baris ini (server sengaja tidak mengirim
  // accountId maupun identitas pengirimnya), jadi yang bisa dicari adalah
  // invoice, nama bimbel, dan nama pengirim yang diketik pembayar.
  searchFields: proof => [proof.invoice, proof.bimbelName, proof.senderName],
  filters: {
    queue: proof => proof.status === 'submitted',
    approved: proof => proof.status === 'approved',
    rejected: proof => proof.status === 'rejected',
    all: () => true,
  },
  sorts: {
    // Terlama dulu: yang paling lama menunggu adalah bimbel yang paling lama
    // sudah membayar tanpa langganannya berjalan.
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

function clearNotices() {
  successMessage.value = ''
  conflictMessage.value = ''
}

const CONFLICT_NOTICE = 'Bukti ini baru saja diputuskan (mungkin oleh admin lain). Daftar dimuat ulang.'
const DECISION_FALLBACK = 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.'

/**
 * 409 di sini berarti satu hal saja: buktinya sudah punya keputusan. Server
 * menyelesaikan balapan dua admin pada penulisan keputusannya, jadi yang kalah
 * tidak pernah sampai ke aktivasi — cukup dimuat ulang, bukan diulang.
 */
function isConflict(cause: unknown): boolean {
  return (cause as { statusCode?: number } | null)?.statusCode === 409
}

/* --------------------------------------------------------------------------
 * Setujui — bukti submitted → approved, lalu Activate menyalakan langganannya.
 * Final dan menggeser tanggal berakhir langganan, jadi lewat modal konfirmasi
 * yang menyebut nominal dan tingkatnya.
 * ------------------------------------------------------------------------ */

const approveTarget = ref<AdminBimbelPaymentProof | null>(null)
const approveBusy = ref(false)
const approveError = ref('')

function openApprove(proof: AdminBimbelPaymentProof) {
  clearNotices()
  approveError.value = ''
  approveTarget.value = proof
}

const approveDescription = computed(() => {
  const target = approveTarget.value
  if (!target) return ''
  const mismatch = target.paidAmount !== target.amountDue
    ? ` Perhatikan: pembayar menuliskan ${formatRupiah(target.paidAmount)}, berbeda dari tagihan.`
    : ''
  return `Tagihan ${target.invoice} akan langsung lunas dan ${bimbelPlanLabel(target.plan)} `
    + `${target.bimbelName} berjalan ${target.months} bulan dengan kuota ${target.seatQuota} kursi. `
    + `Pastikan mutasi ${formatRupiah(target.amountDue)} benar-benar masuk.${mismatch}`
})

async function confirmApprove() {
  const target = approveTarget.value
  if (!target) return

  approveError.value = ''
  approveBusy.value = true
  try {
    await decideBimbelProof(target.id, { action: 'approve' })
    approveTarget.value = null
    successMessage.value = `Pembayaran ${target.invoice} disetujui. ${bimbelPlanLabel(target.plan)} ${target.bimbelName} sudah aktif.`
    await refresh()
  }
  catch (cause) {
    if (isConflict(cause)) {
      approveTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refresh()
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
 * Tolak — alasannya wajib (server menolak yang kosong), karena itulah yang
 * tampil di layar pembayaran bimbelnya sebagai hal yang harus diperbaiki.
 * Tagihannya dibuka kembali dengan tenggat baru, bukan dihanguskan.
 * ------------------------------------------------------------------------ */

const rejectTarget = ref<AdminBimbelPaymentProof | null>(null)
const rejectBusy = ref(false)
const rejectError = ref('')

function openReject(proof: AdminBimbelPaymentProof) {
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
    await decideBimbelProof(target.id, { action: 'reject', reason })
    rejectTarget.value = null
    successMessage.value = `Konfirmasi ${target.invoice} ditolak. ${target.bimbelName} melihat alasannya dan bisa mengirim ulang.`
    await refresh()
  }
  catch (cause) {
    if (isConflict(cause)) {
      rejectTarget.value = null
      conflictMessage.value = CONFLICT_NOTICE
      await refresh()
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

const PROOF_STATUS_LABEL: Record<AdminBimbelPaymentProof['status'], string> = {
  submitted: 'Menunggu diperiksa',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const PROOF_STATUS_TONE: Record<AdminBimbelPaymentProof['status'], 'warning' | 'success' | 'neutral'> = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'neutral',
}

/**
 * Status tagihannya sendiri ikut ditampilkan: bukti yang sudah diputuskan tidak
 * selalu berarti tagihannya bergerak seperti dugaan (aktivasi bisa gagal
 * setelah keputusannya tercatat), dan `expired`/`cancelled` memberi tahu admin
 * bahwa tidak ada lagi yang bisa diaktifkan dari baris ini.
 */
const ORDER_STATUS_LABEL: Record<BimbelOrderStatus, string> = {
  pending: 'Menunggu pembayaran',
  verifying: 'Menunggu verifikasi',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
}

/** Selisih nominal ditandai, karena itu alasan penolakan yang paling sering. */
function amountMismatch(proof: AdminBimbelPaymentProof): boolean {
  return proof.paidAmount !== proof.amountDue
}

const zoomed = ref<AdminBimbelPaymentProof | null>(null)
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[clamp(1.5rem,2.2vw,1.9rem)] leading-[1.16] tracking-[-0.03em]">
          Verifikasi langganan bimbel
        </h1>
        <p class="mt-2 max-w-2xl text-[0.92rem] leading-[1.6] text-muted">
          Bimbel yang menyatakan sudah mentransfer tagihan langganannya.
          Cocokkan nominalnya dengan mutasi merchant, lalu setujui. Persetujuan
          inilah yang melunasi tagihan sekaligus menyalakan masa langganannya.
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

    <DashboardTableToolbar
      v-model:search="search"
      v-model:filter="statusFilter"
      v-model:sort="sortOrder"
      class="mt-6"
      search-id="admin-bimbel-proofs-search"
      search-label="Cari konfirmasi langganan"
      search-placeholder="Cari invoice, nama bimbel, atau nama pengirim…"
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

    <!-- Gagal memuat tidak boleh terbaca sebagai antrean kosong: pesan galat
         punya cabangnya sendiri, di atas cabang kosong. -->
    <p
      v-else-if="error"
      role="alert"
      class="mt-6 rounded-sm border border-danger/25 bg-danger-soft px-4 py-3 text-[0.88rem] text-danger-ink"
    >
      {{ error }}
    </p>

    <p v-else-if="rows.length === 0" class="mt-10 text-center text-[0.92rem] text-muted">
      {{ isActive ? 'Tidak ada konfirmasi yang cocok dengan filter ini.' : 'Belum ada konfirmasi pembayaran langganan yang menunggu.' }}
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
               masalah: yang membuktikan uangnya masuk adalah mutasi merchant,
               dan invoice di kolom Tagihan yang menunjuk tagihan mana. -->
          <button
            v-if="proof.hasImage"
            type="button"
            class="shrink-0 self-start rounded-sm border border-hairline bg-white p-1.5 transition-[border-color] hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="zoomed = proof"
          >
            <img
              :src="proofImageUrl(proof.id)"
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
              Tanpa lampiran — cocokkan lewat mutasi merchant
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-bold tracking-[-0.02em] tabular-nums">{{ proof.invoice }}</p>
                <p class="mt-0.5 truncate text-[0.86rem] text-muted">
                  {{ proof.bimbelName || proof.bimbelId }}
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
                <dd class="mt-0.5 font-semibold tabular-nums">{{ formatRupiah(proof.amountDue) }}</dd>
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
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Yang dibeli</dt>
                <dd class="mt-0.5 text-[0.9rem]">
                  {{ bimbelPlanLabel(proof.plan) }}
                  <span class="text-muted">· {{ proof.seatQuota }} kursi · {{ proof.months }} bulan</span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Nama pengirim</dt>
                <dd class="mt-0.5 truncate text-[0.9rem]">{{ proof.senderName }}</dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Dikonfirmasi</dt>
                <dd class="mt-0.5 text-[0.9rem]">
                  {{ formatDateLong(proof.createdAt) }}
                  <span v-if="proof.transferredAt" class="text-muted">
                    · transfer {{ formatDateLong(proof.transferredAt) }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-[0.76rem] font-bold tracking-widest text-faint uppercase">Tagihan dibuat</dt>
                <dd class="mt-0.5 text-[0.9rem]">
                  {{ formatDateLong(proof.orderDate) }}
                  <span class="text-muted">· {{ ORDER_STATUS_LABEL[proof.orderStatus] }}</span>
                </dd>
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
                Setujui &amp; aktifkan
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
      :description="`${zoomed.invoice} · tagihan ${formatRupiah(zoomed.amountDue)}`"
      @update:model-value="zoomed = null"
    >
      <img
        :src="proofImageUrl(zoomed.id)"
        :alt="`Bukti transfer untuk ${zoomed.invoice}`"
        class="max-h-[70vh] w-full bg-white object-contain"
      >
    </AppModal>

    <AdminConfirmModal
      :open="Boolean(approveTarget)"
      title="Setujui pembayaran langganan ini?"
      :description="approveDescription"
      confirm-label="Setujui & aktifkan"
      :busy="approveBusy"
      :error="approveError"
      @update:open="approveTarget = null"
      @confirm="confirmApprove"
    />

    <AdminReasonModal
      :open="Boolean(rejectTarget)"
      title="Tolak konfirmasi pembayaran"
      description="Bimbel akan melihat alasan ini di layar pembayarannya dan bisa mengirim konfirmasi ulang. Tagihannya dibuka kembali dengan tenggat baru, tidak hangus."
      placeholder="Misalnya: tidak ada mutasi masuk dengan nominal ini, atau nominalnya kurang Rp50.000 dari tagihan."
      confirm-label="Tolak konfirmasi"
      :busy="rejectBusy"
      :error="rejectError"
      @update:open="rejectTarget = null"
      @confirm="confirmReject"
    />
  </div>
</template>
