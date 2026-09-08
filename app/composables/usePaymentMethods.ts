import type { PaymentChannel } from '#shared/types/account'
import type { PaymentMethods } from '#shared/types/order'

/**
 * Which payment paths this deployment can actually charge right now.
 *
 * Not a constant, which is why it is fetched rather than hardcoded: a
 * deployment without gateway credentials can only take manual transfers, one
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
  // Never offered for new orders, but a historical purchase can still be
  // rendered with it — see PaymentChannel in #shared/types/account.
  duitku_qris: {
    label: 'QRIS otomatis',
    hint: 'Scan dari aplikasi bank atau e-wallet apa pun',
    timing: 'Paket langsung terbuka setelah pembayaran masuk',
  },
  manual_qris: {
    label: 'Transfer QRIS manual',
    hint: 'Scan QRIS Zenko, lalu tekan "Saya sudah bayar"',
    timing: 'Dicek admin dulu — biasanya beberapa jam kerja',
  },
}

export function paymentChannelCopy(channel: PaymentChannel) {
  return COPY[channel] ?? COPY.doku_qris
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

  /** Only worth drawing a picker when there is an actual choice to make. */
  const hasChoice = computed(() => available.value.length > 1)

  return { available, selected, hasChoice, load }
}
