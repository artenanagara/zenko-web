<script setup lang="ts">
import type { BimbelSubscriptionQuote } from '#shared/types/bimbel'

/**
 * Ringkasan tagihan langganan, dibaca tepat sebelum tagihannya dibuat.
 *
 * Dulu ini panel yang menempel di sisi kanan halaman langganan dan selalu
 * terlihat — ringkasan atas keputusan yang belum diambil, lengkap dengan tombol
 * "Buat tagihan" yang menyala sejak halaman dibuka. Sebagai modal ia baru
 * muncul setelah sebuah tingkat dipilih, jadi urutannya kembali seperti yang
 * dilakukan orang: pilih dulu, baca ringkasannya, baru bayar.
 *
 * Periodenya bisa diubah dari dalam modal karena itu satu-satunya hal yang
 * masih mungkin dikoreksi di layar ini; tingkatnya diubah dengan menutup modal
 * dan memilih kartu lain.
 *
 * Murni presentasi. Tidak ada satu angka pun yang dihitung di sini — seluruh
 * isi `quote` datang dari `/billing/quote`, dan mengganti periode hanya memilih
 * quote mana yang dibacakan.
 */
const props = defineProps<{
  quote: BimbelSubscriptionQuote | null
  pending: boolean
  error: string
  /** Bulan gratis pada periode tahunan; kosongkan kalau tidak ada. */
  freeMonths?: number
  /** Unix detik masa aktif sekarang, untuk catatan bahwa hari terbayar tidak hilang. */
  activeUntil?: number
  ordering: boolean
}>()

const emit = defineEmits<{ confirm: [], retry: [] }>()

const open = defineModel<boolean>({ required: true })
const period = defineModel<1 | 12>('period', { required: true })

const canOrder = computed(() => !props.pending && !!props.quote && props.quote.amount > 0 && !props.ordering)
</script>

<template>
  <AppModal
    v-model="open"
    title="Ringkasan langganan"
    description="Periksa tingkat, masa aktif, dan totalnya sebelum tagihan dibuat."
  >
    <div class="grid gap-5">
      <BimbelBillingToggle v-model="period">
        <template v-if="freeMonths" #note>
          <AppLozenge appearance="success">Gratis {{ freeMonths }} bulan</AppLozenge>
        </template>
      </BimbelBillingToggle>

      <AppInlineMessage v-if="error" type="error">
        {{ error }}
        <button type="button" class="ml-1 font-semibold underline" @click="emit('retry')">Muat ulang</button>
      </AppInlineMessage>
      <DashboardSkeleton v-else-if="pending" :count="3" label="Menghitung harga…" />
      <template v-else-if="quote">
        <dl class="grid gap-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <dt class="text-muted">Tingkat</dt>
            <dd class="text-right font-semibold">{{ bimbelPlanLabel(quote.plan, quote.planName) }}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-muted">Kursi termasuk</dt>
            <dd class="font-semibold tabular-nums">{{ quote.includedSeats }}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-muted">Harga tingkat</dt>
            <dd class="text-right font-semibold tabular-nums">{{ formatRupiah(quote.planPrice) }} / bulan</dd>
          </div>
          <div v-if="quote.extraSeats > 0" class="flex items-start justify-between gap-4">
            <dt class="text-muted">{{ quote.extraSeats }} kursi diteruskan</dt>
            <dd class="text-right font-semibold tabular-nums">{{ formatRupiah(quote.extraSeatsAmount) }} / bulan</dd>
          </div>
          <div class="flex items-start justify-between gap-4 border-t border-hairline pt-3">
            <dt class="text-muted">Masa aktif</dt>
            <dd class="font-semibold">{{ quote.months }} bulan</dd>
          </div>
          <div v-if="quote.months > quote.billedMonths" class="flex items-start justify-between gap-4">
            <dt class="text-muted">Ditagih</dt>
            <dd class="font-semibold">{{ quote.billedMonths }} bulan</dd>
          </div>
        </dl>

        <div class="border-t border-hairline pt-4">
          <p class="text-xs font-semibold tracking-wide text-muted uppercase">Total tagihan</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">{{ formatRupiah(quote.amount) }}</p>
          <p v-if="activeUntil" class="mt-3 text-xs leading-relaxed text-muted">
            Perpanjangan dimulai setelah masa aktif saat ini berakhir, jadi hari yang sudah dibayar tidak hilang.
          </p>
        </div>
      </template>
    </div>

    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="ordering" @click="open = false">Batal</AppButton>
      <AppButton size="sm" :loading="ordering" :disabled="!canOrder" @click="emit('confirm')">Buat tagihan</AppButton>
    </template>
  </AppModal>
</template>
