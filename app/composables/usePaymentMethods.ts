import type { PaymentChannel } from '#shared/types/account'
import type { PaymentMethods } from '#shared/types/order'

/**
 * Which payment paths this deployment can actually charge right now.
 *
 * Not a constant, which is why it is fetched rather than hardcoded: a
 * deployment without DOKU credentials can only take manual transfers, one
 * without a merchant name can only take the gateway, and an operator can turn
 * either off between deploys. A picker built from a hardcoded list would
 * eventually offer a buyer a method the server then refuses.
 *
 * A failed fetch is not an error state here. The server applies its own
 * default when the browser sends no channel at all, so the honest fallback is
 * to show no picker and let it decide — one less method to choose from beats a
 * checkout page that will not render.
 */

/** Display copy per channel. Owned here, not by the API: which words a buyer
 *  reads is a frontend concern, and /payments/methods deliberately sends only
 *  identifiers so this copy can change without deploying the API. */
const COPY: Record<PaymentChannel, { label: string, hint: string, timing: string }> = {
  doku_qris: {
    label: 'QRIS otomatis',
    hint: 'Scan dari aplikasi bank atau e-wallet apa pun',
    timing: 'Paket langsung terbuka setelah pembayaran masuk',
  },
  // Retired — kept only so an old order's history still renders accurate
  // copy instead of falling through to the manual channel's. No route
  // creates this channel any more; see PaymentChannel.
  ipaymu_qris: {
    label: 'QRIS otomatis',
    hint: 'Scan dari aplikasi bank atau e-wallet apa pun',
    timing: 'Paket langsung terbuka setelah pembayaran masuk',
  },
  manual_qris: {
    label: 'Transfer QRIS manual',
    // DANA is named as the issuer, never as the method. The poster is a QRIS
    // and every QRIS-capable app can pay it; calling the option "DANA" would
    // turn away buyers without that one app from a payment they could have
    // made perfectly well.
    hint: 'QRIS Zenko terbitan DANA — bayar dari aplikasi bank atau e-wallet apa pun',
    timing: 'Dicek admin dulu — biasanya beberapa jam kerja',
  },
}

/**
 * Jalur yang sudah diumumkan tapi belum bisa dipakai.
 *
 * Ditampilkan sebagai pilihan mati berlabel "Segera", bukan disembunyikan,
 * supaya pembeli yang menimbang transfer manual tahu pembayaran seketika
 * sedang disiapkan — dan supaya jalur manual tidak terbaca sebagai
 * satu-satunya cara Zenko akan pernah menerima uang.
 *
 * Ini bukan sakelar terpisah yang bisa lupa dimatikan: begitu server menyebut
 * sebuah channel di `available`, ia berhenti muncul di sini dengan sendirinya.
 *
 * Kosong sekarang — DOKU sudah hidup, dan manual sengaja tidak diumumkan:
 * itu cadangan darurat saat DOKU maintenance (MANUAL_QRIS_FALLBACK_ENABLED
 * di API), bukan sesuatu yang pantas dijanjikan "segera" ke pembeli.
 */
const ANNOUNCED: PaymentChannel[] = []

/**
 * Copy untuk sebuah channel. Order lama bisa membawa pengenal gateway yang
 * sudah pensiun di `paymentChannel`; apa pun yang tidak dikenal jatuh ke copy
 * manual supaya riwayat pembelian tetap bisa digambar.
 */
export function paymentChannelCopy(channel: PaymentChannel | string) {
  return COPY[channel as PaymentChannel] ?? COPY.manual_qris
}

export function usePaymentMethods() {
  const { public: config } = useRuntimeConfig()

  const available = ref<PaymentChannel[]>([])
  const selected = ref<PaymentChannel | null>(null)

  async function load() {
    try {
      const methods = await useApiFetch<PaymentMethods>('/payments/methods', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
      available.value = methods.available ?? []
      selected.value = methods.default ?? methods.available?.[0] ?? null
    }
    catch {
      // See the note above: no picker, server picks.
      available.value = []
      selected.value = null
    }
  }

  /** Diumumkan tapi belum hidup — lihat ANNOUNCED. Kosong dengan sendirinya
   *  begitu server mulai menawarkannya. */
  const upcoming = computed(() =>
    ANNOUNCED.filter(channel => !available.value.includes(channel)),
  )

  /**
   * Picker digambar kalau ada yang bisa dipilih DAN ada sesuatu untuk
   * dibandingkan — entah channel kedua yang hidup, atau satu yang sedang
   * disiapkan. Satu pilihan tunggal tanpa pembanding hanya menambah langkah.
   */
  const hasChoice = computed(() =>
    available.value.length > 0 && (available.value.length > 1 || upcoming.value.length > 0),
  )

  return { available, upcoming, selected, hasChoice, load }
}
