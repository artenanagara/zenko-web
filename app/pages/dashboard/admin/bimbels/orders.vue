<script setup lang="ts">
import type { BimbelOrder, BimbelOrderStatus } from '#shared/types/bimbel'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Tagihan bimbel — buku catatan langganan organisasi, bukan antrean.
 *
 * Halaman ini dulu bernama "Pembayaran bimbel" dan berdiri di sebelah
 * "Verifikasi pembayaran" dengan tombol "Verifikasi" di tiap barisnya. Dua hal
 * salah di situ. Pertama, isinya hanya tagihan `pending` — yang sedang menunggu
 * *bimbelnya* transfer, bukan menunggu Zenko — jadi tidak ada satu pun baris di
 * sana yang benar-benar antrean. Kedua, tombolnya melunasi tagihan tanpa satu
 * pun bukti di layar; teks konfirmasinya bahkan mengakui itu sendiri ("pastikan
 * pembayaran sudah benar-benar diterima"), yang adalah cara lain untuk bilang
 * bahwa pemeriksaannya diserahkan ke ingatan orang.
 *
 * Sekarang pembagiannya tegas:
 *
 * - Keputusan pembayaran cuma dibuat di satu tempat, /dashboard/admin/payments,
 *   dan selalu di atas bukti transfer yang diunggah bimbelnya. Baris
 *   `verifying` di sini tidak bisa diputuskan — ia hanya menautkan ke sana.
 * - Halaman ini menjawab "di mana posisi langganan bimbel ini": seluruh status,
 *   umur tagihan, tenggatnya, dan sisa masa aktif organisasinya.
 * - Tindakan hariannya adalah menagih, bukan meluluskan. Yang menahan tagihan
 *   `pending` adalah pembayarnya.
 * - Aktivasi manual tetap ada karena memang dibutuhkan, tetapi turun jadi aksi
 *   sekunder, dinamai apa adanya, dan wajib membawa alasan yang disimpan pada
 *   tagihannya.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Tagihan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: orders, pending, error, refresh } = useAdminBimbelOrders()
const toast = useToast()

const busyId = ref('')
/** Tagihan yang sedang diaktifkan manual; null saat dialognya tertutup. */
const activating = ref<BimbelOrder | null>(null)
const activationReason = ref('')
const activationError = ref('')

onMounted(refresh)

/* --------------------------------------------------------------------------
 * Bahasa status
 * ------------------------------------------------------------------------ */

const STATUS_LABEL: Record<BimbelOrderStatus, string> = {
  pending: 'Menunggu bayar',
  verifying: 'Bukti diperiksa',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
  expired: 'Kadaluarsa',
}

/**
 * Hanya `verifying` yang diberi warna perhatian, karena hanya ia yang menunggu
 * Zenko. `pending` sengaja netral: memberi warna peringatan pada tagihan yang
 * menunggu pelanggan akan membuat seluruh halaman ini menyala terus-menerus
 * untuk sesuatu yang bukan pekerjaan admin.
 */
const STATUS_TONE: Record<BimbelOrderStatus, 'success' | 'warning' | 'neutral'> = {
  pending: 'neutral',
  verifying: 'warning',
  paid: 'success',
  cancelled: 'neutral',
  expired: 'neutral',
}

const DAY = 24 * 60 * 60
const LAPSING_SOON = 7 * DAY

/** Detik sekarang, dibaca sekali per render supaya seluruh baris sepakat. */
const now = ref(Math.floor(Date.now() / 1000))
onMounted(() => {
  const timer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 60_000)
  onUnmounted(() => clearInterval(timer))
})

/**
 * Seberapa genting satu baris, dan itulah urutan bawaan halaman ini.
 *
 * Yang menentukan bukan umur tagihan melainkan apa yang sedang dipertaruhkan:
 * tagihan menunggu dari bimbel yang aksesnya sudah berhenti berarti ada siswa
 * yang hari ini tidak bisa mengerjakan apa pun, sementara tagihan seumur yang
 * sama dari bimbel dengan sisa dua bulan tidak merugikan siapa-siapa. Mengurut
 * menurut tanggal menaruh keduanya berdampingan seolah sama.
 */
function riskRank(order: BimbelOrder): number {
  if (order.status === 'verifying') return 1
  if (order.status !== 'pending') return 4
  const activeUntil = order.bimbelActiveUntil ?? 0
  if (activeUntil > 0 && activeUntil <= now.value) return 0
  if (activeUntil > 0 && activeUntil - now.value <= LAPSING_SOON) return 2
  return 3
}

/** Tagihan menunggu dari bimbel yang masa aktifnya sudah lewat. */
const lapsedCount = computed(() => orders.value.filter(order => riskRank(order) === 0).length)

/** Satu kalimat tentang keadaan organisasinya, hanya kalau ada yang dipertaruhkan. */
function stakeNote(order: BimbelOrder): string {
  if (order.status !== 'pending') return ''
  const activeUntil = order.bimbelActiveUntil ?? 0
  if (!activeUntil) return ''
  if (activeUntil <= now.value) return `Masa aktif habis ${formatDate(activeUntil)} — akses sudah dibatasi`
  if (activeUntil - now.value <= LAPSING_SOON) return `Masa aktif berakhir ${formatDate(activeUntil)}`
  return ''
}

/** Umur tagihan, karena "dibuat 9 hari lalu" lebih terbaca daripada tanggalnya. */
function ageLabel(order: BimbelOrder): string {
  const days = Math.floor((now.value - order.createdAt) / DAY)
  if (days <= 0) return 'Dibuat hari ini'
  return `Dibuat ${days} hari lalu`
}

function reminderLabel(order: BimbelOrder): string {
  if (!order.remindedAt) return 'Belum pernah ditagih'
  const count = order.reminderCount ?? 1
  return `Ditagih ${count}× · terakhir ${formatDate(order.remindedAt)}`
}

/* --------------------------------------------------------------------------
 * Toolbar
 * ------------------------------------------------------------------------ */

const STATUS_FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu bayar' },
  { value: 'verifying', label: 'Bukti diperiksa' },
  { value: 'paid', label: 'Lunas' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'risk', label: 'Paling genting' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'amount', label: 'Nominal terbesar' },
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<BimbelOrder>(orders, {
  searchFields: order => [order.bimbelName, order.invoice],
  filters: {
    all: () => true,
    pending: order => order.status === 'pending',
    verifying: order => order.status === 'verifying',
    paid: order => order.status === 'paid',
    expired: order => order.status === 'expired',
    cancelled: order => order.status === 'cancelled',
  },
  sorts: {
    risk: (a, b) => riskRank(a) - riskRank(b) || a.createdAt - b.createdAt,
    newest: (a, b) => b.createdAt - a.createdAt,
    oldest: (a, b) => a.createdAt - b.createdAt,
    amount: (a, b) => b.amount - a.amount,
  },
  // Buku catatan, bukan antrean: yang membukanya datang untuk melihat posisi
  // sebuah bimbel, dan menyaring ke satu status akan menyembunyikan justru
  // baris yang ia cari. Sinyal yang perlu ditindak tetap terbaca lewat
  // `actionable-count` di ringkasan toolbar.
  defaultFilter: 'all',
  defaultSort: 'risk',
})

const columns = [
  { key: 'bimbel', label: 'Bimbel' },
  { key: 'paket', label: 'Langganan', hideOnMobile: true },
  { key: 'amount', label: 'Nominal', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// Slot cell DashboardTable menyerahkan `item` sebagai Record<string, any>, jadi
// barisnya diambil kembali dari `rows` lewat id — bukan dengan meneruskan
// `item` yang tipenya sudah terhapus.
function findOrder(id: string): BimbelOrder | undefined {
  return rows.value.find(order => order.id === id)
}

function orderTitle(order: BimbelOrder): string {
  return order.kind === 'seat_addon' ? 'Tambah kursi' : bimbelPlanLabel(order.plan)
}

function orderDetail(order: BimbelOrder): string {
  return order.kind === 'seat_addon'
    ? `${order.additionalSeats} kursi tambahan`
    : `${order.seatQuota ?? order.includedSeats} kursi · ${order.months} bulan`
}

function activationConsequence(order: BimbelOrder): string {
  return order.kind === 'seat_addon'
    ? `kuota bertambah ${order.additionalSeats} kursi tanpa mengubah masa aktif`
    : `${order.seatQuota ?? order.includedSeats} kursi selama ${order.months} bulan`
}

/* --------------------------------------------------------------------------
 * Aksi
 * ------------------------------------------------------------------------ */

async function remind(order: BimbelOrder) {
  busyId.value = order.id
  try {
    await remindBimbelOrder(order.id)
    await refresh()
    toast.success('Pengingat dikirim.', `${order.bimbelName || order.bimbelId} ditagih lewat email pemiliknya.`)
  }
  catch (cause) {
    toast.error('Pengingat belum terkirim.', tutorApiMessage(cause, 'Coba lagi sebentar.'))
  }
  finally {
    busyId.value = ''
  }
}

function openActivate(order: BimbelOrder) {
  activating.value = order
  activationReason.value = ''
  activationError.value = ''
}

/** Overlay/Escape tidak boleh menutup saat permintaan sedang dikirim. */
function closeActivate() {
  if (busyId.value) return
  activating.value = null
}

async function confirmActivate() {
  const order = activating.value
  if (!order || !activationReason.value.trim() || busyId.value) return

  busyId.value = order.id
  activationError.value = ''
  try {
    await activateBimbelOrder(order.id, activationReason.value.trim())
    activating.value = null
    await refresh()
    toast.success('Langganan diaktifkan manual.', `${order.bimbelName || order.bimbelId} — alasannya tersimpan di tagihan ini.`)
  }
  catch (cause) {
    activationError.value = tutorApiMessage(cause, 'Coba lagi sebentar.')
  }
  finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Tagihan bimbel"
      description="Seluruh tagihan langganan organisasi dan posisinya. Keputusan pembayaran dibuat di Verifikasi pembayaran, di atas bukti transfer — bukan di sini."
    />

    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat tagihan bimbel…" />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refresh">
          Coba lagi
        </button>
      </div>

      <AppEmptyState
        v-else-if="orders.length === 0"
        title="Belum ada tagihan"
        description="Tagihan muncul di sini setelah sebuah bimbel memilih tingkat langganannya."
      />

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="bimbel-orders-search"
          search-label="Cari tagihan"
          search-placeholder="Cari nama bimbel atau nomor invoice…"
          :filter-options="STATUS_FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="tagihan"
          :actionable-count="lapsedCount"
          actionable-label="dari bimbel yang aksesnya sudah berhenti"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada tagihan yang cocok dengan kata kunci atau status yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="bimbel" action-key="aksi">
          <template #cell(bimbel)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">
              {{ item.bimbelName || item.bimbelId }}
            </span>
            <span class="block text-[0.82rem] text-muted">{{ item.invoice }}</span>
          </template>

          <template #cell(paket)="{ item }">
            <template v-for="order in [findOrder(item.id)]" :key="item.id">
              <span v-if="order" class="block">
                <span class="block text-[0.86rem]">{{ orderTitle(order) }}</span>
                <span class="block text-[0.82rem] text-muted">{{ orderDetail(order) }}</span>
              </span>
            </template>
          </template>

          <template #cell(amount)="{ item }">
            <span class="font-semibold whitespace-nowrap tabular-nums">{{ formatRupiah(item.amount) }}</span>
          </template>

          <template #cell(status)="{ item }">
            <template v-for="order in [findOrder(item.id)]" :key="item.id">
              <div v-if="order" class="grid gap-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <DashboardBadge :tone="STATUS_TONE[order.status]">
                    {{ STATUS_LABEL[order.status] }}
                  </DashboardBadge>
                  <!-- Periode yang diberikan tanpa bukti. Ini yang dicari saat
                       ada yang mempertanyakan kenapa sebuah bimbel aktif. -->
                  <DashboardBadge v-if="order.activationNote" tone="warning">
                    Aktivasi manual
                  </DashboardBadge>
                </div>

                <span v-if="stakeNote(order)" class="text-[0.78rem] text-danger">
                  {{ stakeNote(order) }}
                </span>
                <span v-else-if="order.status === 'pending'" class="text-[0.78rem] text-muted">
                  {{ ageLabel(order) }}
                </span>
                <span v-if="order.status === 'pending'" class="text-[0.78rem] text-muted">
                  {{ reminderLabel(order) }}
                </span>
                <span v-else-if="order.status === 'paid' && order.paidAt" class="text-[0.78rem] text-muted">
                  Lunas {{ formatDate(order.paidAt) }}
                </span>

                <!-- Catatan aktivasi manual dicetak utuh, bukan disembunyikan di
                     balik tooltip: ia satu-satunya keterangan tentang periode
                     yang tidak punya bukti, dan yang membacanya sedang mencari
                     tepat kalimat ini. -->
                <span v-if="order.activationNote" class="text-[0.78rem] text-muted italic">
                  “{{ order.activationNote }}”{{ order.activatedByName ? ` — ${order.activatedByName}` : '' }}
                </span>
              </div>
            </template>
          </template>

          <template #cell(aksi)="{ item }">
            <template v-for="order in [findOrder(item.id)]" :key="item.id">
              <div v-if="order?.status === 'pending'" class="flex flex-wrap justify-end gap-2">
                <AppButton
                  size="sm"
                  class="w-full md:w-auto"
                  :loading="busyId === order.id && !activating"
                  :disabled="Boolean(busyId)"
                  @click="remind(order)"
                >
                  Ingatkan
                </AppButton>
                <!-- Sekunder dan bernama apa adanya. Dulu ini tombol utama
                     bertuliskan "Verifikasi", padahal tidak ada apa pun yang
                     diverifikasi: tidak ada bukti untuk dilihat. -->
                <AppButton
                  size="sm"
                  variant="ghost"
                  class="w-full md:w-auto"
                  :disabled="Boolean(busyId)"
                  @click="openActivate(order)"
                >
                  Aktifkan manual
                </AppButton>
              </div>

              <!-- Satu keputusan, satu tempat. Baris yang buktinya sudah masuk
                   tidak bisa diputuskan dari sini. -->
              <NuxtLink
                v-else-if="order?.status === 'verifying'"
                to="/dashboard/admin/payments"
                class="text-[0.86rem] font-semibold whitespace-nowrap text-primary hover:underline"
              >
                Periksa buktinya →
              </NuxtLink>

              <span v-else class="text-[0.86rem] text-muted">—</span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <AppModal
      :model-value="Boolean(activating)"
      title="Aktifkan langganan tanpa bukti transfer"
      description="Jalur biasanya adalah antrean bukti transfer. Pakai ini hanya kalau pembayaran diketahui lewat cara lain — dan tuliskan dari mana."
      @update:model-value="value => { if (!value) closeActivate() }"
    >
      <div v-if="activating" class="grid gap-4">
        <!-- Konsekuensinya disebut dengan angka, bukan sebagai peringatan umum:
             "pastikan pembayaran sudah diterima" tidak memberi tahu apa pun
             tentang apa yang sedang diberikan. -->
        <AppSectionMessage appearance="warning" title="Yang diberikan oleh tombol ini">
          {{ activating.bimbelName || activating.bimbelId }} mendapat
          <b>{{ activationConsequence(activating) }}</b>
          ({{ formatRupiah(activating.amount) }}, invoice {{ activating.invoice }}),
          tanpa satu pun bukti transfer tersimpan di sistem.
        </AppSectionMessage>

        <AppTextarea
          v-model="activationReason"
          label="Alasan aktivasi manual"
          placeholder="Contoh: Transfer masuk 12 Sep a.n. Yayasan Nusantara, dicek di mutasi BCA. Bimbel tidak berhasil mengunggah bukti."
          hint="Tersimpan di tagihan ini dan tampil di daftar. Inilah satu-satunya keterangan yang tersisa saat periode ini dipertanyakan."
          :disabled="Boolean(busyId)"
          required
        />

        <AppInlineMessage v-if="activationError" type="error">{{ activationError }}</AppInlineMessage>
      </div>

      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="Boolean(busyId)" @click="closeActivate()">
          Batal
        </AppButton>
        <AppButton
          size="sm"
          :loading="Boolean(busyId)"
          :disabled="!activationReason.trim() || Boolean(busyId)"
          @click="confirmActivate()"
        >
          Aktifkan manual
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
