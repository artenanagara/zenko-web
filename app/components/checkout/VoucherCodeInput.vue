<script setup lang="ts">
/**
 * Kotak kode voucher di ringkasan pesanan. Murni presentasional — validasi
 * sungguhan (POST /vouchers/validate) dan penerapan ke Total() adalah milik
 * halaman checkout, bukan komponen ini, karena useCheckout.pay() yang
 * mengirim voucherCode-nya sudah ada di sana. Komponen ini hanya mengelola
 * kotak input dan memancarkan apply/remove.
 */
const props = defineProps<{
  checking: boolean
  applied: { code: string, discountAmount: number } | null
  error: string
}>()

const emit = defineEmits<{ apply: [code: string], remove: [] }>()

const input = ref('')

function submit() {
  const code = input.value.trim()
  if (!code || props.checking) return
  emit('apply', code)
}

// Sekali diterapkan, kotak input kosong lagi — kalau buyer melepas voucher
// ini dan mau coba kode lain, mereka mulai dari kotak kosong, bukan kode
// lama yang sudah tidak berlaku.
watch(() => props.applied, (applied) => {
  if (!applied) input.value = ''
})
</script>

<template>
  <div class="border-t border-line pt-5">
    <div
      v-if="applied"
      class="flex items-center justify-between gap-3 rounded-sm border border-success bg-success-soft/40 px-3.5 py-2.5"
    >
      <span class="min-w-0">
        <span class="block truncate text-[0.88rem] font-semibold text-success-ink">
          Kode {{ applied.code }} diterapkan
        </span>
        <span class="block text-[0.82rem] text-muted">Potongan {{ formatRupiah(applied.discountAmount) }}</span>
      </span>
      <button
        type="button"
        class="shrink-0 text-[0.82rem] font-semibold text-muted hover:text-ink hover:underline"
        @click="emit('remove')"
      >
        Hapus
      </button>
    </div>

    <form v-else class="flex gap-2" @submit.prevent="submit">
      <label for="voucher-code-input" class="sr-only">Kode voucher</label>
      <input
        id="voucher-code-input"
        v-model="input"
        type="text"
        placeholder="Kode voucher"
        autocomplete="off"
        :disabled="checking"
        class="min-w-0 flex-1 rounded-sm border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] uppercase
               placeholder:text-placeholder placeholder:normal-case focus:border-primary/40
               focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)] focus:outline-none disabled:cursor-not-allowed
               disabled:bg-surface-sunken disabled:text-muted"
      >
      <AppButton type="submit" variant="outline" size="sm" :disabled="checking || !input.trim()">
        {{ checking ? 'Memeriksa...' : 'Terapkan' }}
      </AppButton>
    </form>

    <AppInlineMessage v-if="error" type="error" class="mt-2">{{ error }}</AppInlineMessage>
  </div>
</template>
