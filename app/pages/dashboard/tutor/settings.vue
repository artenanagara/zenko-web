<script setup lang="ts">
/**
 * Profil tutor + rekening bank. Rekening dulu dikelola di
 * /dashboard/tutor/payouts, tapi dipindah ke sini per keputusan terbaru —
 * pencairan cuma perlu akses baca (last-4 + gating tombol Cairkan), jadi
 * editnya lebih pas hidup di Pengaturan bareng data profil tutor lainnya.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Pengaturan — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user } = useAuth()

const { data: bankAccount, pending: bankPending, refresh: refreshBankAccount } = useTutorBankAccount()
const {
  data: changeRequest,
  pending: changeRequestPending,
  refresh: refreshChangeRequest,
} = useTutorBankAccountChangeRequest()

// Client-only fetch: the session cookie never reaches the Nuxt server, so
// this resolves after hydration (see useTutorEarnings).
onMounted(() => {
  refreshBankAccount()
  refreshChangeRequest()
})

/* --------------------------------------------------------------------------
 * Rekening bank — tiga state:
 *  1. Belum ada rekening: form biasa, simpan via PUT.
 *  2. Rekening tersimpan, tidak ada pengajuan pending: tampilan baca-saja +
 *     badge verifikasi, dengan tombol untuk mengajukan perubahan.
 *  3. Ada pengajuan pending: banner status, tombol pengajuan disembunyikan —
 *     PUT dikunci setelah simpan pertama dan hanya satu pengajuan pending
 *     diperbolehkan (backend menjawab 409 untuk yang kedua).
 * ------------------------------------------------------------------------ */

const bankForm = reactive({ bankCode: '', accountNumber: '', holderName: '' })
const bankSaving = ref(false)
const bankError = ref('')

const bankFormValid = computed(() =>
  bankForm.bankCode !== ''
  && bankForm.accountNumber.trim() !== ''
  && bankForm.holderName.trim() !== '',
)

async function saveBankAccount() {
  bankError.value = ''

  const bank = BANK_OPTIONS.find(option => option.code === bankForm.bankCode)
  if (!bank) {
    bankError.value = 'Pilih bank terlebih dahulu.'
    return
  }

  bankSaving.value = true
  try {
    await saveTutorBankAccount({
      bankCode: bank.code,
      bankLabel: bank.label,
      accountNumber: bankForm.accountNumber.trim(),
      holderName: bankForm.holderName.trim(),
    })
    await refreshBankAccount()
  }
  catch (cause) {
    bankError.value = tutorApiMessage(cause, 'Gagal menyimpan rekening. Coba lagi sebentar lagi.')
  }
  finally {
    bankSaving.value = false
  }
}

/* --------------------------------------------------------------------------
 * Ajukan perubahan rekening — dipakai begitu rekening sudah tersimpan.
 * ------------------------------------------------------------------------ */

const changeForm = reactive({ bankCode: '', accountNumber: '', holderName: '' })
const changeFormOpen = ref(false)
const changeSaving = ref(false)
const changeError = ref('')

const changeFormValid = computed(() =>
  changeForm.bankCode !== ''
  && changeForm.accountNumber.trim() !== ''
  && changeForm.holderName.trim() !== '',
)

function openChangeForm() {
  // Mulai dari data yang sudah tersimpan, bukan form kosong — tutor biasanya
  // cuma mengubah satu-dua field, bukan mengetik ulang semuanya.
  if (bankAccount.value) {
    changeForm.bankCode = bankAccount.value.bankCode
    changeForm.accountNumber = bankAccount.value.accountNumber
    changeForm.holderName = bankAccount.value.holderName
  }
  changeError.value = ''
  changeFormOpen.value = true
}

function closeChangeForm() {
  changeFormOpen.value = false
  changeError.value = ''
}

const bankSelectOptions = BANK_OPTIONS.map(option => ({ value: option.code, label: option.label }))

async function submitChangeRequest() {
  changeError.value = ''

  const bank = BANK_OPTIONS.find(option => option.code === changeForm.bankCode)
  if (!bank) {
    changeError.value = 'Pilih bank terlebih dahulu.'
    return
  }

  changeSaving.value = true
  try {
    await requestTutorBankAccountChange({
      bankCode: bank.code,
      bankLabel: bank.label,
      accountNumber: changeForm.accountNumber.trim(),
      holderName: changeForm.holderName.trim(),
    })
    changeFormOpen.value = false
    await refreshChangeRequest()
  }
  catch (cause) {
    changeError.value = tutorApiMessage(cause, 'Gagal mengirim pengajuan perubahan. Coba lagi sebentar lagi.')
  }
  finally {
    changeSaving.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Pengaturan"
      description="Profil tutor dan rekening bank untuk pencairan."
    />

    <DashboardPanel title="Profil tutor" description="Nama dan foto ikut akun Google yang dipakai untuk masuk.">
      <div v-if="user" class="flex items-center gap-4">
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          alt=""
          referrerpolicy="no-referrer"
          class="h-14 w-14 shrink-0 rounded-full object-cover"
        >
        <span
          v-else
          aria-hidden="true"
          class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[1.2rem] font-bold text-muted"
        >{{ user.name.trim().charAt(0).toUpperCase() || '?' }}</span>

        <div class="min-w-0">
          <p class="truncate font-semibold tracking-[-0.02em]">{{ user.name }}</p>
          <p class="mt-0.5 truncate text-[0.88rem] text-muted">{{ user.email }}</p>
        </div>
      </div>

      <AppSectionMessage appearance="warning" class="mt-5">
        Bio singkat dan spesialisasi (mis. "SKD & SNBT") belum bisa diisi di sini — baru sebatas
        nama dan foto dari Google. Bagian ini menyusul.
      </AppSectionMessage>
    </DashboardPanel>

    <DashboardPanel
      id="rekening"
      title="Rekening bank"
      description="Tujuan transfer pencairan. Pastikan nama pemilik sesuai buku tabungan."
    >
      <DashboardSkeleton v-if="bankPending || changeRequestPending" :count="3" label="Memuat rekening..." />

      <!-- State 1: belum ada rekening — form biasa, simpan via PUT. -->
      <form v-else-if="!bankAccount" class="grid gap-5" @submit.prevent="saveBankAccount">
        <AppSelect
          :options="bankSelectOptions"
          :model-value="bankForm.bankCode"
          label="Bank"
          placeholder="Pilih bank"
          @update:model-value="bankForm.bankCode = String($event)"
        />

        <FormField
          id="bank-account-number"
          v-model="bankForm.accountNumber"
          label="Nomor rekening"
          type="tel"
          placeholder="1234567890"
          autocomplete="off"
        />

        <FormField
          id="bank-holder-name"
          v-model="bankForm.holderName"
          label="Nama pemilik rekening"
          placeholder="Sesuai buku tabungan"
          autocomplete="name"
        />

        <AppInlineMessage v-if="bankError" type="error">{{ bankError }}</AppInlineMessage>

        <div>
          <AppButton type="submit" size="sm" :disabled="!bankFormValid || bankSaving">
            {{ bankSaving ? 'Menyimpan...' : 'Simpan rekening' }}
          </AppButton>
        </div>
      </form>

      <!-- State 2/3: rekening sudah tersimpan — baca-saja, dengan alur pengajuan
           perubahan terpisah (PUT dikunci setelah simpan pertama). -->
      <div v-else class="grid gap-5">
        <!-- State 3: ada pengajuan pending — banner status, tombol pengajuan
             disembunyikan (backend cuma izinkan satu pending sekaligus). -->
        <AppSectionMessage v-if="changeRequest" appearance="warning" title="Menunggu persetujuan admin">
          <p>
            Pengajuan perubahan rekening dikirim {{ formatDate(changeRequest.requestedAt) }} dan sedang ditinjau admin.
          </p>
          <dl class="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt class="text-[0.7rem]">Bank baru</dt>
              <dd class="font-semibold text-ink">{{ changeRequest.newAccount.bankLabel }}</dd>
            </div>
            <div>
              <dt class="text-[0.7rem]">Nomor rekening baru</dt>
              <dd class="font-semibold text-ink">{{ changeRequest.newAccount.accountNumber }}</dd>
            </div>
            <div>
              <dt class="text-[0.7rem]">Nama pemilik baru</dt>
              <dd class="font-semibold text-ink">{{ changeRequest.newAccount.holderName }}</dd>
            </div>
          </dl>
        </AppSectionMessage>

        <!-- State 2: rekening tersimpan, tampilan baca-saja + badge verifikasi. -->
        <div>
          <dl class="grid gap-4 sm:grid-cols-3">
            <div>
              <dt :class="FIELD_LABEL_CLASS">Bank</dt>
              <dd class="font-semibold">{{ bankAccount.bankLabel }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Nomor rekening</dt>
              <dd class="font-semibold tabular-nums">{{ bankAccount.accountNumber }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Nama pemilik rekening</dt>
              <dd class="font-semibold">{{ bankAccount.holderName }}</dd>
            </div>
          </dl>

          <div class="mt-4">
            <DashboardBadge :tone="bankAccount.verifiedAt ? 'success' : 'warning'">
              {{ bankAccount.verifiedAt ? 'Terverifikasi' : 'Menunggu verifikasi' }}
            </DashboardBadge>
          </div>
        </div>

        <div v-if="!changeRequest">
          <AppButton v-if="!changeFormOpen" variant="outline" size="sm" @click="openChangeForm">
            Ajukan perubahan rekening
          </AppButton>

          <form v-else class="grid gap-5" @submit.prevent="submitChangeRequest">
            <AppSelect
              :options="bankSelectOptions"
              :model-value="changeForm.bankCode"
              label="Bank"
              placeholder="Pilih bank"
              @update:model-value="changeForm.bankCode = String($event)"
            />

            <FormField
              id="change-bank-account-number"
              v-model="changeForm.accountNumber"
              label="Nomor rekening"
              type="tel"
              placeholder="1234567890"
              autocomplete="off"
            />

            <FormField
              id="change-bank-holder-name"
              v-model="changeForm.holderName"
              label="Nama pemilik rekening"
              placeholder="Sesuai buku tabungan"
              autocomplete="name"
            />

            <AppInlineMessage v-if="changeError" type="error">{{ changeError }}</AppInlineMessage>

            <div class="flex items-center gap-3">
              <AppButton type="submit" size="sm" :disabled="!changeFormValid || changeSaving">
                {{ changeSaving ? 'Mengirim...' : 'Kirim pengajuan' }}
              </AppButton>
              <AppButton type="button" variant="outline" size="sm" @click="closeChangeForm">
                Batal
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardPanel>
  </div>
</template>
