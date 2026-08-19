<script setup lang="ts">
import type {
  AdminBankAccount,
  AdminBankAccountChangeRequest,
  AdminPayout,
  AdminProductDetail,
  AdminProductSummary,
} from '#shared/types/admin-moderation'
import { adminOverview } from '~/mocks/dashboard'

definePageMeta({
  path: '/dashboard/admin',
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Dashboard admin — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Applications, product moderation, and payouts have real endpoints; the
// student/tutor totals still render fixtures (see app/mocks/dashboard.ts).
const { data: applications, pending, error, refresh } = useAdminTutorApplications()
const { data: productQueue, pending: queuePending, error: queueError, refresh: refreshQueue } = useAdminProductQueue()
const { data: payoutQueue, pending: payoutsPending, error: payoutsError, refresh: refreshPayouts } = useAdminPayoutQueue()
const { data: bankAccounts, pending: bankAccountsPending, error: bankAccountsError, refresh: refreshBankAccounts } = useAdminBankAccounts()
const { data: bankChangeRequests, pending: bankChangePending, error: bankChangeError, refresh: refreshBankChanges } = useAdminBankAccountChangeRequests()

// Client-only fetches — the session cookie is HttpOnly on the API origin
// (see useAdminModeration).
onMounted(() => {
  refreshQueue()
  refreshPayouts()
  refreshBankAccounts()
  refreshBankChanges()
})

const stats = computed(() => [
  { label: 'Siswa terdaftar', value: adminOverview.totalStudents },
  { label: 'Tutor aktif', value: adminOverview.totalTutors },
  { label: 'Pengajuan menunggu', value: String(applications.value.filter(a => a.status === 'pending').length) },
  { label: 'Produk menunggu moderasi', value: String(productQueue.value.length) },
])

const STATUS_LABEL = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
} as const

const STATUS_TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'neutral',
} as const

/* --------------------------------------------------------------------------
 * Moderasi produk — klik baris antrean → detail inline → setujui/tolak.
 * ------------------------------------------------------------------------ */

const detail = ref<AdminProductDetail | null>(null)
const detailPending = ref(false)
const detailError = ref('')

/** Reject needs a reason; the form only shows after "Tolak" is clicked. */
const productRejecting = ref(false)
const productRejectReason = ref('')
const productBusy = ref(false)
const productActionError = ref('')

async function openProduct(product: AdminProductSummary) {
  productRejecting.value = false
  productRejectReason.value = ''
  productActionError.value = ''
  detailError.value = ''
  detailPending.value = true
  detail.value = null
  try {
    detail.value = await fetchAdminProduct(product.id)
    // Kalau daftar tidak menyertakan author di detail, pakai punya baris antrean.
    detail.value.author ??= product.author
  }
  catch (cause) {
    detailError.value = tutorApiMessage(cause, 'Gagal memuat detail produk.')
  }
  finally {
    detailPending.value = false
  }
}

function closeProduct() {
  detail.value = null
  detailError.value = ''
  productRejecting.value = false
  productRejectReason.value = ''
  productActionError.value = ''
}

async function decideProduct(approve: boolean) {
  if (!detail.value) return
  if (!approve && productRejectReason.value.trim() === '') return

  productActionError.value = ''
  productBusy.value = true
  try {
    await decideAdminProduct(detail.value.id, {
      approve,
      reason: approve ? undefined : productRejectReason.value.trim(),
    })
    closeProduct()
    await refreshQueue()
  }
  catch (cause) {
    productActionError.value = tutorApiMessage(cause, 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.')
  }
  finally {
    productBusy.value = false
  }
}

/* --------------------------------------------------------------------------
 * Pencairan — requested → proses, processing → tandai ditransfer,
 * keduanya bisa ditolak dengan alasan.
 * ------------------------------------------------------------------------ */

const payoutBusyId = ref('')
const payoutActionError = ref('')
/** Baris yang sedang membuka form alasan penolakan. */
const payoutRejectingId = ref('')
const payoutRejectReason = ref('')

const actionablePayout = (payout: AdminPayout) =>
  payout.status === 'requested' || payout.status === 'processing'

function openPayoutReject(payout: AdminPayout) {
  payoutRejectingId.value = payout.id
  payoutRejectReason.value = ''
  payoutActionError.value = ''
}

function closePayoutReject() {  
  payoutRejectingId.value = ''
  payoutRejectReason.value = ''
}

async function decidePayout(payout: AdminPayout, action: 'process' | 'transfer' | 'reject') {
  if (action === 'reject' && payoutRejectReason.value.trim() === '') return

  payoutActionError.value = ''
  payoutBusyId.value = payout.id
  try {
    await decideAdminPayout(payout.id, {
      action,
      reason: action === 'reject' ? payoutRejectReason.value.trim() : undefined,
    })
    closePayoutReject()
    await refreshPayouts()
  }
  catch (cause) {
    payoutActionError.value = tutorApiMessage(cause, 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.')
  }
  finally {
    payoutBusyId.value = ''
  }
}

/* --------------------------------------------------------------------------
 * Rekening bank tutor — verifikasi manual, satu tombol per baris belum
 * terverifikasi.
 * ------------------------------------------------------------------------ */

const bankVerifyBusyId = ref('')
const bankVerifyActionError = ref('')

async function verifyBankAccount(account: AdminBankAccount) {
  bankVerifyActionError.value = ''
  bankVerifyBusyId.value = account.accountId
  try {
    await verifyAdminBankAccount(account.accountId)
    await refreshBankAccounts()
  }
  catch (cause) {
    bankVerifyActionError.value = tutorApiMessage(cause, 'Gagal memverifikasi rekening. Coba lagi sebentar lagi.')
  }
  finally {
    bankVerifyBusyId.value = ''
  }
}

/* --------------------------------------------------------------------------
 * Pengajuan perubahan rekening — rekening tutor terkunci setelah tersimpan
 * pertama kali, jadi perubahan lewat sini. Setujui langsung, tolak wajib
 * alasan (sama seperti pencairan).
 * ------------------------------------------------------------------------ */

const bankChangeBusyId = ref('')
const bankChangeActionError = ref('')
/** Baris yang sedang membuka form alasan penolakan. */
const bankChangeRejectingId = ref('')
const bankChangeRejectReason = ref('')

function openBankChangeReject(request: AdminBankAccountChangeRequest) {
  bankChangeRejectingId.value = request.id
  bankChangeRejectReason.value = ''
  bankChangeActionError.value = ''
}

function closeBankChangeReject() {
  bankChangeRejectingId.value = ''
  bankChangeRejectReason.value = ''
}

async function decideBankChange(request: AdminBankAccountChangeRequest, approve: boolean) {
  if (!approve && bankChangeRejectReason.value.trim() === '') return

  bankChangeActionError.value = ''
  bankChangeBusyId.value = request.id
  try {
    await decideAdminBankAccountChange(request.id, {
      approve,
      reason: approve ? undefined : bankChangeRejectReason.value.trim(),
    })
    closeBankChangeReject()
    await refreshBankChanges()
  }
  catch (cause) {
    bankChangeActionError.value = tutorApiMessage(cause, 'Gagal menyimpan keputusan. Coba lagi sebentar lagi.')
  }
  finally {
    bankChangeBusyId.value = ''
  }
}

// formatDate comes from useDateFormat: one date must read the same on the
// dashboard, the account pages, and invoices.
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Ringkasan</h1>
      <p class="mt-1.5 text-muted">Kondisi platform hari ini dan antrean yang menunggu keputusanmu.</p>
    </header>

    <DashboardStats :items="stats" />

    <DashboardPanel
      id="pengajuan"
      title="Pengajuan tutor"
      description="Dari form /jadi-tutor, terbaru di atas."
    >
      <template #action>
        <button
          type="button"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
          @click="refresh()"
        >
          Muat ulang
        </button>
      </template>

      <p v-if="pending" class="py-6 text-center text-muted">Memuat pengajuan…</p>

      <p v-else-if="error" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        Daftar pengajuan gagal dimuat. Pastikan zenko-api berjalan dan akunmu punya peran admin.
      </p>

      <p v-else-if="!applications.length" class="py-6 text-center text-muted">
        Belum ada pengajuan masuk.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Nama</th>
              <th class="pb-3 font-bold">Bidang</th>
              <th class="pb-3 font-bold">Kontak</th>
              <th class="pb-3 font-bold">Masuk</th>
              <th class="pb-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in applications" :key="item.id" class="border-t border-hairline">
              <td class="py-3.5 pr-4">
                <span class="block font-semibold tracking-[-0.02em]">{{ item.name }}</span>
                <span class="block text-[0.82rem] text-muted">{{ item.email }}</span>
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem]">{{ item.expertise }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ item.whatsapp }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ formatDate(item.submittedAt) }}</td>
              <td class="py-3.5">
                <DashboardBadge :tone="STATUS_TONE[item.status]">
                  {{ STATUS_LABEL[item.status] }}
                </DashboardBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>

    <DashboardPanel
      id="paket"
      title="Moderasi produk"
      description="Produk tutor berstatus ditinjau. Setujui untuk menayangkan ke katalog."
    >
      <template #action>
        <button
          type="button"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
          @click="refreshQueue()"
        >
          Muat ulang
        </button>
      </template>

      <p v-if="queuePending" class="py-6 text-center text-muted">Memuat antrean moderasi…</p>

      <p v-else-if="queueError" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ queueError }}
      </p>

      <p v-else-if="!productQueue.length" class="py-6 text-center text-muted">
        Antrean kosong — tidak ada produk yang menunggu ditinjau.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Produk</th>
              <th class="pb-3 font-bold">Tipe</th>
              <th class="pb-3 font-bold">Author</th>
              <th class="pb-3 font-bold">Harga</th>
              <th class="pb-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in productQueue" :key="product.id" class="border-t border-hairline">
              <td class="max-w-72 py-3.5 pr-4 font-semibold tracking-[-0.02em]">{{ product.title }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ PRODUCT_TYPE_LABEL[product.type] }}</td>
              <td class="py-3.5 pr-4">
                <span class="block text-[0.9rem]">{{ product.author.name }}</span>
                <span class="block text-[0.82rem] text-muted">{{ product.author.email }}</span>
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] tabular-nums">{{ formatRupiah(product.price) }}</td>
              <td class="py-3.5 text-right">
                <button
                  v-if="detail?.id !== product.id"
                  type="button"
                  class="text-[0.86rem] font-semibold text-primary hover:underline"
                  @click="openProduct(product)"
                >
                  Lihat detail
                </button>
                <button
                  v-else
                  type="button"
                  class="text-[0.86rem] font-semibold text-muted hover:underline"
                  @click="closeProduct"
                >
                  Tutup
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="detailPending" class="mt-4 py-4 text-center text-muted">Memuat detail produk…</p>

      <p v-else-if="detailError" role="alert" class="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ detailError }}
      </p>

      <!-- Detail inline: enough to judge the product without leaving the queue. -->
      <div v-else-if="detail" class="mt-4 rounded-sm border border-hairline bg-surface-alt p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-[1.05rem] font-bold tracking-[-0.03em]">{{ detail.title }}</h3>
            <p class="mt-1 text-[0.86rem] text-muted">
              {{ PRODUCT_TYPE_LABEL[detail.type] }}
              <template v-if="detail.category"> · {{ detail.category }}</template>
              <template v-if="detail.author"> · {{ detail.author.name }} ({{ detail.author.email }})</template>
            </p>
          </div>
          <p class="text-[1.05rem] font-bold tabular-nums">
            {{ formatRupiah(detail.price) }}
            <span v-if="detail.priceOriginal > detail.price" class="ml-1.5 text-[0.86rem] font-normal text-muted line-through">
              {{ formatRupiah(detail.priceOriginal) }}
            </span>
          </p>
        </div>

        <p v-if="detail.description" class="mt-3 max-w-prose text-[0.9rem] leading-[1.7] text-muted">
          {{ detail.description }}
        </p>

        <!-- Single: subtes + jumlah soal. Bundle: daftar isi tanpa soal. -->
        <div v-if="detail.type === 'single' && detail.sections" class="mt-4">
          <h4 class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">Subtes</h4>
          <ul class="mt-2 grid gap-2">
            <li
              v-for="section in detail.sections"
              :key="section.id"
              class="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2 text-[0.9rem] last:border-0 last:pb-0"
            >
              <span class="font-semibold tracking-[-0.02em]">{{ section.title }}</span>
              <span class="text-muted tabular-nums">
                {{ section.questions.length }}/{{ section.questionTarget }} soal · {{ formatDuration(section.durationMinutes) }}
              </span>
            </li>
          </ul>
        </div>

        <div v-else-if="detail.type === 'bundle' && detail.items" class="mt-4">
          <h4 class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">Isi bundling</h4>
          <ul class="mt-2 grid gap-2">
            <li
              v-for="item in detail.items"
              :key="item.productId"
              class="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2 text-[0.9rem] last:border-0 last:pb-0"
            >
              <span class="font-semibold tracking-[-0.02em]">{{ item.title }}</span>
              <span class="flex items-center gap-2.5">
                <span class="text-muted tabular-nums">{{ formatRupiah(item.price) }}</span>
                <DashboardBadge :tone="PRODUCT_STATUS_TONE[item.status]">
                  {{ PRODUCT_STATUS_LABEL[item.status] }}
                </DashboardBadge>
              </span>
            </li>
          </ul>
        </div>

        <p v-if="productActionError" role="alert" class="mt-4 text-[0.82rem] text-red-600">
          {{ productActionError }}
        </p>

        <!-- Tolak wajib alasan: the reason form replaces the two buttons. -->
        <form
          v-if="productRejecting"
          class="mt-4 grid gap-3"
          @submit.prevent="decideProduct(false)"
        >
          <div>
            <label for="product-reject-reason" :class="FIELD_LABEL_CLASS">Alasan penolakan</label>
            <textarea
              id="product-reject-reason"
              v-model="productRejectReason"
              rows="3"
              :class="FIELD_CLASS"
              placeholder="Jelaskan apa yang perlu diperbaiki tutor."
              required
            />
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="submit"
              class="inline-flex min-h-10 items-center justify-center rounded-xs bg-red-600 px-4 text-[0.86rem] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              :disabled="productBusy || productRejectReason.trim() === ''"
            >
              {{ productBusy ? 'Menyimpan…' : 'Tolak produk' }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center rounded-xs border border-line px-4 text-[0.86rem] font-semibold text-muted transition-colors hover:text-ink"
              @click="productRejecting = false"
            >
              Batal
            </button>
          </div>
        </form>

        <div v-else class="mt-4 flex flex-wrap gap-3">
          <AppButton size="sm" :disabled="productBusy" @click="decideProduct(true)">
            {{ productBusy ? 'Menyimpan…' : 'Setujui & tayangkan' }}
          </AppButton>
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-xs border border-line px-4 text-[0.86rem] font-semibold text-red-600 transition-colors hover:bg-red-50"
            :disabled="productBusy"
            @click="productRejecting = true"
          >
            Tolak…
          </button>
        </div>
      </div>
    </DashboardPanel>

    <DashboardPanel
      id="pencairan"
      title="Pencairan"
      description="Pengajuan pencairan tutor. Proses dulu, lalu tandai ditransfer setelah dana dikirim."
    >
      <template #action>
        <button
          type="button"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
          @click="refreshPayouts()"
        >
          Muat ulang
        </button>
      </template>

      <p v-if="payoutsPending" class="py-6 text-center text-muted">Memuat antrean pencairan…</p>

      <p v-else-if="payoutsError" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ payoutsError }}
      </p>

      <p v-else-if="!payoutQueue.length" class="py-6 text-center text-muted">
        Belum ada pengajuan pencairan.
      </p>

      <div v-else class="overflow-x-auto">
        <p v-if="payoutActionError" role="alert" class="mb-3 text-[0.82rem] text-red-600">
          {{ payoutActionError }}
        </p>

        <table class="w-full min-w-200 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Tutor</th>
              <th class="pb-3 font-bold">Rekening</th>
              <th class="pb-3 font-bold">Nominal</th>
              <th class="pb-3 font-bold">Diajukan</th>
              <th class="pb-3 font-bold">Status</th>
              <th class="pb-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="payout in payoutQueue" :key="payout.id">
              <tr class="border-t border-hairline align-top">
                <td class="py-3.5 pr-4">
                  <span class="block font-semibold tracking-[-0.02em]">{{ payout.tutor.name }}</span>
                  <span class="block text-[0.82rem] text-muted">{{ payout.tutor.email }}</span>
                </td>
                <td class="py-3.5 pr-4">
                  <span class="block text-[0.9rem]">{{ payout.bankAccount.bankLabel }} · {{ payout.bankAccount.accountNumber }}</span>
                  <span class="block text-[0.82rem] text-muted">a.n. {{ payout.bankAccount.holderName }}</span>
                </td>
                <td class="py-3.5 pr-4 text-[0.9rem] font-semibold tabular-nums">{{ formatRupiah(payout.amount) }}</td>
                <td class="py-3.5 pr-4 text-[0.9rem] whitespace-nowrap text-muted">{{ formatDate(payout.requestedAt) }}</td>
                <td class="py-3.5 pr-4">
                  <DashboardBadge :tone="PAYOUT_STATUS_TONE[payout.status]">
                    {{ PAYOUT_STATUS_LABEL[payout.status] }}
                  </DashboardBadge>
                  <span
                    v-if="payout.status === 'rejected' && payout.rejectReason"
                    class="mt-1 block max-w-56 text-[0.82rem] text-muted"
                  >
                    {{ payout.rejectReason }}
                  </span>
                </td>
                <td class="py-3.5 text-right">
                  <span v-if="actionablePayout(payout)" class="inline-flex items-center gap-3 whitespace-nowrap">
                    <button
                      type="button"
                      class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                      :disabled="payoutBusyId === payout.id"
                      @click="decidePayout(payout, payout.status === 'requested' ? 'process' : 'transfer')"
                    >
                      {{ payoutBusyId === payout.id
                        ? 'Menyimpan…'
                        : payout.status === 'requested' ? 'Proses' : 'Tandai ditransfer' }}
                    </button>
                    <button
                      type="button"
                      class="text-[0.86rem] font-semibold text-red-600 hover:underline disabled:opacity-50"
                      :disabled="payoutBusyId === payout.id"
                      @click="payoutRejectingId === payout.id ? closePayoutReject() : openPayoutReject(payout)"
                    >
                      Tolak…
                    </button>
                  </span>
                  <span v-else class="text-[0.86rem] text-muted">—</span>
                </td>
              </tr>

              <!-- Alasan penolakan, inline di bawah baris yang bersangkutan. -->
              <tr v-if="payoutRejectingId === payout.id">
                <td colspan="6" class="pb-4">
                  <form
                    class="grid gap-3 rounded-sm border border-hairline bg-surface-alt p-4"
                    @submit.prevent="decidePayout(payout, 'reject')"
                  >
                    <div>
                      <label :for="`payout-reject-${payout.id}`" :class="FIELD_LABEL_CLASS">
                        Alasan penolakan
                      </label>
                      <textarea
                        :id="`payout-reject-${payout.id}`"
                        v-model="payoutRejectReason"
                        rows="2"
                        :class="FIELD_CLASS"
                        placeholder="Mis. nomor rekening tidak valid."
                        required
                      />
                      <p class="mt-2 text-[0.82rem] text-muted">
                        Saldo tutor dikembalikan otomatis saat pengajuan ditolak.
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        class="inline-flex min-h-10 items-center justify-center rounded-xs bg-red-600 px-4 text-[0.86rem] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        :disabled="payoutBusyId === payout.id || payoutRejectReason.trim() === ''"
                      >
                        {{ payoutBusyId === payout.id ? 'Menyimpan…' : 'Tolak pencairan' }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex min-h-10 items-center justify-center rounded-xs border border-line px-4 text-[0.86rem] font-semibold text-muted transition-colors hover:text-ink"
                        @click="closePayoutReject"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </DashboardPanel>

    <DashboardPanel
      id="rekening-bank"
      title="Rekening bank tutor"
      description="Rekening yang disimpan tutor untuk pencairan. Verifikasi setelah dicocokkan secara manual."
    >
      <template #action>
        <button
          type="button"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
          @click="refreshBankAccounts()"
        >
          Muat ulang
        </button>
      </template>

      <p v-if="bankAccountsPending" class="py-6 text-center text-muted">Memuat rekening bank…</p>

      <p v-else-if="bankAccountsError" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ bankAccountsError }}
      </p>

      <p v-else-if="!bankAccounts.length" class="py-6 text-center text-muted">
        Belum ada rekening bank tersimpan.
      </p>

      <div v-else class="overflow-x-auto">
        <p v-if="bankVerifyActionError" role="alert" class="mb-3 text-[0.82rem] text-red-600">
          {{ bankVerifyActionError }}
        </p>

        <table class="w-full min-w-160 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Tutor</th>
              <th class="pb-3 font-bold">Rekening</th>
              <th class="pb-3 font-bold">Status</th>
              <th class="pb-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in bankAccounts" :key="account.accountId" class="border-t border-hairline align-top">
              <td class="py-3.5 pr-4">
                <span class="block font-semibold tracking-[-0.02em]">{{ account.tutor.name }}</span>
                <span class="block text-[0.82rem] text-muted">{{ account.tutor.email }}</span>
              </td>
              <td class="py-3.5 pr-4">
                <span class="block text-[0.9rem]">{{ account.bankAccount.bankLabel }} · {{ account.bankAccount.accountNumber }}</span>
                <span class="block text-[0.82rem] text-muted">a.n. {{ account.bankAccount.holderName }}</span>
              </td>
              <td class="py-3.5 pr-4">
                <DashboardBadge :tone="account.bankAccount.verifiedAt ? 'success' : 'warning'">
                  {{ account.bankAccount.verifiedAt ? 'Terverifikasi' : 'Belum diverifikasi' }}
                </DashboardBadge>
              </td>
              <td class="py-3.5 text-right">
                <button
                  v-if="!account.bankAccount.verifiedAt"
                  type="button"
                  class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                  :disabled="bankVerifyBusyId === account.accountId"
                  @click="verifyBankAccount(account)"
                >
                  {{ bankVerifyBusyId === account.accountId ? 'Menyimpan…' : 'Verifikasi' }}
                </button>
                <span v-else class="text-[0.86rem] text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>

    <DashboardPanel
      id="perubahan-rekening"
      title="Pengajuan perubahan rekening"
      description="Rekening tutor terkunci setelah tersimpan pertama kali; perubahan butuh persetujuanmu."
    >
      <template #action>
        <button
          type="button"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
          @click="refreshBankChanges()"
        >
          Muat ulang
        </button>
      </template>

      <p v-if="bankChangePending" class="py-6 text-center text-muted">Memuat pengajuan perubahan rekening…</p>

      <p v-else-if="bankChangeError" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ bankChangeError }}
      </p>

      <p v-else-if="!bankChangeRequests.length" class="py-6 text-center text-muted">
        Tidak ada pengajuan perubahan rekening yang menunggu.
      </p>

      <div v-else class="overflow-x-auto">
        <p v-if="bankChangeActionError" role="alert" class="mb-3 text-[0.82rem] text-red-600">
          {{ bankChangeActionError }}
        </p>

        <table class="w-full min-w-200 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Tutor</th>
              <th class="pb-3 font-bold">Rekening saat ini</th>
              <th class="pb-3 font-bold">Rekening baru</th>
              <th class="pb-3 font-bold">Diajukan</th>
              <th class="pb-3 font-bold">Status</th>
              <th class="pb-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="request in bankChangeRequests" :key="request.id">
              <tr class="border-t border-hairline align-top">
                <td class="py-3.5 pr-4">
                  <span class="block font-semibold tracking-[-0.02em]">{{ request.tutor.name }}</span>
                  <span class="block text-[0.82rem] text-muted">{{ request.tutor.email }}</span>
                </td>
                <td class="py-3.5 pr-4">
                  <span class="block text-[0.9rem]">{{ request.currentAccount.bankLabel }} · {{ request.currentAccount.accountNumber }}</span>
                  <span class="block text-[0.82rem] text-muted">a.n. {{ request.currentAccount.holderName }}</span>
                </td>
                <td class="py-3.5 pr-4">
                  <span class="block text-[0.9rem]">{{ request.newAccount.bankLabel }} · {{ request.newAccount.accountNumber }}</span>
                  <span class="block text-[0.82rem] text-muted">a.n. {{ request.newAccount.holderName }}</span>
                </td>
                <td class="py-3.5 pr-4 text-[0.9rem] whitespace-nowrap text-muted">{{ formatDate(request.requestedAt) }}</td>
                <td class="py-3.5 pr-4">
                  <DashboardBadge :tone="STATUS_TONE[request.status]">
                    {{ STATUS_LABEL[request.status] }}
                  </DashboardBadge>
                  <span
                    v-if="request.status === 'rejected' && request.rejectReason"
                    class="mt-1 block max-w-56 text-[0.82rem] text-muted"
                  >
                    {{ request.rejectReason }}
                  </span>
                </td>
                <td class="py-3.5 text-right">
                  <span v-if="request.status === 'pending'" class="inline-flex items-center gap-3 whitespace-nowrap">
                    <button
                      type="button"
                      class="text-[0.86rem] font-semibold text-primary hover:underline disabled:opacity-50"
                      :disabled="bankChangeBusyId === request.id"
                      @click="decideBankChange(request, true)"
                    >
                      {{ bankChangeBusyId === request.id ? 'Menyimpan…' : 'Setujui' }}
                    </button>
                    <button
                      type="button"
                      class="text-[0.86rem] font-semibold text-red-600 hover:underline disabled:opacity-50"
                      :disabled="bankChangeBusyId === request.id"
                      @click="bankChangeRejectingId === request.id ? closeBankChangeReject() : openBankChangeReject(request)"
                    >
                      Tolak…
                    </button>
                  </span>
                  <span v-else class="text-[0.86rem] text-muted">—</span>
                </td>
              </tr>

              <!-- Alasan penolakan, inline di bawah baris yang bersangkutan. -->
              <tr v-if="bankChangeRejectingId === request.id">
                <td colspan="6" class="pb-4">
                  <form
                    class="grid gap-3 rounded-sm border border-hairline bg-surface-alt p-4"
                    @submit.prevent="decideBankChange(request, false)"
                  >
                    <div>
                      <label :for="`bank-change-reject-${request.id}`" :class="FIELD_LABEL_CLASS">
                        Alasan penolakan
                      </label>
                      <textarea
                        :id="`bank-change-reject-${request.id}`"
                        v-model="bankChangeRejectReason"
                        rows="2"
                        :class="FIELD_CLASS"
                        placeholder="Mis. nama pemilik rekening tidak cocok."
                        required
                      />
                    </div>
                    <div class="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        class="inline-flex min-h-10 items-center justify-center rounded-xs bg-red-600 px-4 text-[0.86rem] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        :disabled="bankChangeBusyId === request.id || bankChangeRejectReason.trim() === ''"
                      >
                        {{ bankChangeBusyId === request.id ? 'Menyimpan…' : 'Tolak pengajuan' }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex min-h-10 items-center justify-center rounded-xs border border-line px-4 text-[0.86rem] font-semibold text-muted transition-colors hover:text-ink"
                        @click="closeBankChangeReject"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  </div>
</template>
