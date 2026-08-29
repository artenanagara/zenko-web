<script setup lang="ts">
import type { Purchase } from '#shared/types/account'

/**
 * Formulir bukti transfer untuk pesanan QRIS manual.
 *
 * Nama pengirim dan nominal yang diketik di sini adalah keterangan pembeli,
 * bukan bukti: server tidak pernah melunasi pesanan dari angka ini — keduanya
 * hanya bahan pencocokan buat mata admin. Yang dilakukan formulir ini adalah
 * memindahkan pesanan ke antrean verifikasi.
 */

const props = defineProps<{ purchase: Purchase }>()
const emit = defineEmits<{ uploaded: [Purchase] }>()

const { error: checkoutError, uploadProof } = useCheckout()

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED = 'image/png,image/jpeg,image/webp,image/gif'

const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const senderName = ref('')
const amount = ref<number | null>(manualTransferBreakdown(props.purchase).total)
const note = ref('')
const localError = ref('')
const submitting = ref(false)

/** Kesalahan dari server dan dari pemeriksaan di browser tampil di satu tempat. */
const message = computed(() => localError.value || checkoutError.value)

function releasePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0] ?? null

  localError.value = ''
  releasePreview()
  file.value = null

  if (!picked) return

  // Dicek di sini supaya pembeli tahu sebelum menunggu unggahan gagal. Server
  // memeriksa ulang tipe aslinya dari isi berkas, bukan dari namanya.
  if (!ACCEPTED.split(',').includes(picked.type)) {
    localError.value = 'Format gambar harus PNG, JPEG, WebP, atau GIF.'
    input.value = ''
    return
  }
  if (picked.size > MAX_FILE_BYTES) {
    localError.value = 'Ukuran gambar maksimal 5 MB.'
    input.value = ''
    return
  }

  file.value = picked
  previewUrl.value = URL.createObjectURL(picked)
}

onUnmounted(releasePreview)

async function submit() {
  localError.value = ''

  if (!file.value) {
    localError.value = 'Pilih gambar bukti transfernya dulu.'
    return
  }
  if (!senderName.value.trim()) {
    localError.value = 'Isi nama pengirim seperti yang tertera di rekeningmu.'
    return
  }
  if (!amount.value || amount.value <= 0) {
    localError.value = 'Isi nominal yang kamu transfer.'
    return
  }

  submitting.value = true
  const updated = await uploadProof(props.purchase.invoice, {
    file: file.value,
    senderName: senderName.value.trim(),
    paidAmount: amount.value,
    note: note.value.trim() || undefined,
  })
  submitting.value = false

  if (updated) {
    releasePreview()
    // Pesanan yang dikembalikan server sudah berstatus verifying dan membawa
    // buktinya. Halaman induk yang memutuskan apa yang tampil sesudahnya.
    emit('uploaded', updated)
  }
}
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <h3 class="font-bold tracking-[-0.02em]">Unggah bukti transfer</h3>
    <p class="mt-1.5 text-[0.88rem] leading-[1.6] text-muted">
      Tangkapan layar dari aplikasi bank atau e-wallet sudah cukup, asal nominal
      dan waktunya terbaca jelas.
    </p>

    <div class="mt-5 grid gap-4">
      <div>
        <label for="proof-file" class="text-[0.86rem] font-semibold">Gambar bukti transfer</label>
        <input
          id="proof-file"
          type="file"
          :accept="ACCEPTED"
          class="mt-1.5 block w-full cursor-pointer rounded-sm border border-hairline-strong bg-surface px-3.5 py-2.5 text-[0.88rem] file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface-sunken file:px-3 file:py-1.5 file:text-[0.84rem] file:font-semibold"
          @change="onFileChange"
        >
        <div v-if="previewUrl" class="mt-3 flex items-start gap-3">
          <img
            :src="previewUrl"
            alt="Pratinjau bukti transfer yang dipilih"
            class="h-24 w-24 rounded-sm border border-hairline bg-white object-contain"
          >
          <p class="pt-1 text-[0.82rem] text-muted">
            {{ file?.name }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="proof-sender" class="text-[0.86rem] font-semibold">Nama pengirim</label>
          <input
            id="proof-sender"
            v-model="senderName"
            type="text"
            maxlength="120"
            autocomplete="name"
            placeholder="Nama di rekening pengirim"
            class="mt-1.5 block w-full rounded-sm border border-hairline-strong bg-surface px-3.5 py-2.5 text-[0.9rem]"
          >
        </div>
        <div>
          <label for="proof-amount" class="text-[0.86rem] font-semibold">Nominal ditransfer</label>
          <input
            id="proof-amount"
            v-model.number="amount"
            type="number"
            inputmode="numeric"
            min="1"
            class="mt-1.5 block w-full rounded-sm border border-hairline-strong bg-surface px-3.5 py-2.5 text-[0.9rem] tabular-nums"
          >
        </div>
      </div>

      <div>
        <label for="proof-note" class="text-[0.86rem] font-semibold">
          Catatan <span class="font-normal text-muted">(opsional)</span>
        </label>
        <textarea
          id="proof-note"
          v-model="note"
          rows="2"
          maxlength="500"
          placeholder="Misalnya: transfer dari BCA a.n. kakak saya"
          class="mt-1.5 block w-full rounded-sm border border-hairline-strong bg-surface px-3.5 py-2.5 text-[0.9rem]"
        />
      </div>
    </div>

    <p
      v-if="message"
      role="alert"
      class="mt-4 rounded-sm border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[0.86rem] text-danger-ink"
    >
      {{ message }}
    </p>

    <AppButton type="submit" size="lg" class="mt-5 w-full" :disabled="submitting">
      <IconSpinner v-if="submitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
      {{ submitting ? 'Mengirim…' : 'Kirim bukti transfer' }}
    </AppButton>
  </form>
</template>
