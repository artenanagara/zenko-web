import type { Purchase } from '#shared/types/account'
import type { CreateOrderRequest } from '#shared/types/order'

/**
 * Placing an order against zenko-api.
 *
 * POST /orders creates a pending purchase from a slug — the session cookie says
 * who is buying and the server prices the slug, so the browser carries neither
 * identity nor amount. What happens next depends on two flags:
 *
 * - paymentEnabled off  → nothing is created; the page says payment is not
 *   connected yet, rather than pretending an order was placed.
 * - paymentEnabled on, paymentStub off → the order is created and left pending;
 *   a real gateway will settle it later. The page shows "menunggu pembayaran".
 * - paymentEnabled on, paymentStub on  → dev only. The stub pay endpoint
 *   (POST /orders/:invoice/pay) marks it paid immediately, and the buyer lands
 *   on /akun/paket owning the package. Placeholder for the real gateway.
 *
 * A 409 means the package is already owned — send them to it. A 404 means the
 * slug is unknown — say so plainly.
 */

export type CheckoutState = 'idle' | 'submitting' | 'not-connected' | 'awaiting-payment' | 'error'

export function useCheckout() {
  const { public: config } = useRuntimeConfig()

  const state = ref<CheckoutState>('idle')
  const error = ref('')

  async function pay(request: CreateOrderRequest) {
    error.value = ''

    if (!config.paymentEnabled) {
      state.value = 'not-connected'
      return
    }

    state.value = 'submitting'
    try {
      const purchase = await $fetch<Purchase>('/orders', {
        baseURL: config.apiBase,
        method: 'POST',
        body: request,
        credentials: 'include',
      })

      // Dev stub: settle immediately, then land on the now-owned package.
      if (config.paymentStub) {
        await $fetch<Purchase>(`/orders/${purchase.invoice}/pay`, {
          baseURL: config.apiBase,
          method: 'POST',
          credentials: 'include',
        })
        await navigateTo('/akun/paket')
        return
      }

      // Real gateway still to come: the order exists and waits to be paid.
      state.value = 'awaiting-payment'
    }
    catch (cause) {
      const status = apiErrorStatus(cause)

      // Already owned — there is nothing to buy, so go straight to it.
      if (status === 409) {
        await navigateTo('/akun/paket')
        return
      }

      state.value = 'error'
      error.value = status === 404
        ? 'Paket ini tidak ditemukan. Mungkin sudah tidak dijual lagi.'
        : messageFor(cause)
    }
  }

  function reset() {
    state.value = 'idle'
    error.value = ''
  }

  return { state, error, pay, reset }
}

/** zenko-api renders every error as { error, requestId }; fall back for the rest. */
function messageFor(cause: unknown): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || 'Gagal memulai pembayaran. Coba lagi sebentar lagi.'
}
