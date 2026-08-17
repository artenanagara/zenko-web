import type { Purchase } from '#shared/types/account'
import type { CreateOrderRequest } from '#shared/types/order'

/**
 * Placing an order against zenko-api.
 *
 * POST /orders creates a pending purchase from a slug — the session cookie says
 * who is buying and the server prices the slug, so the browser carries neither
 * identity nor amount. It also charges a QRIS payment through Midtrans in the
 * same request and returns the pending purchase with `qrUrl`/`expiresAt`
 * filled in, which is what the checkout page renders while it waits.
 *
 * - paymentEnabled off → nothing is created; the page says payment is not
 *   connected yet, rather than pretending an order was placed.
 * - paymentEnabled on → the order is created and left pending. With a
 *   Midtrans key configured on the backend, `purchase.qrUrl` carries a real
 *   QR code to scan; without one (local dev without MIDTRANS_SERVER_KEY) it
 *   stays null and the page falls back to a plain "waiting for payment"
 *   message, same as before this was wired up.
 *
 * Settlement is never polled aggressively for its own sake — a short interval
 * checks `/me/purchases/:invoice` while a charge is outstanding, but it is
 * Midtrans's webhook that actually marks the order paid server-side; polling
 * only notices once that has already happened. A local timer flips the state
 * to 'expired' at the QR's own deadline as a client-side fallback, in case the
 * settlement (or expiry) webhook is slow to land.
 *
 * A 409 means the package is already owned — send them to it. A 404 means the
 * slug is unknown — say so plainly.
 *
 * A real QR hands off to its own page (/pembayaran/:invoice) rather than
 * rendering inline here — `resumeWaiting` is what lets that page (or this one,
 * for the no-QR dev fallback) pick polling back up around an order that
 * already exists, instead of duplicating `startPolling`/`scheduleExpiry`.
 */

export type CheckoutState = 'idle' | 'submitting' | 'not-connected' | 'awaiting-payment' | 'expired' | 'error'

const POLL_INTERVAL_MS = 3000

export function useCheckout() {
  const { public: config } = useRuntimeConfig()

  const state = ref<CheckoutState>('idle')
  const error = ref('')
  /** The pending purchase from the last successful POST /orders — qrUrl/expiresAt live here. */
  const purchase = ref<Purchase | null>(null)

  let pollHandle: ReturnType<typeof setInterval> | null = null
  let expiryHandle: ReturnType<typeof setTimeout> | null = null

  function stopWaiting() {
    if (pollHandle !== null) {
      clearInterval(pollHandle)
      pollHandle = null
    }
    if (expiryHandle !== null) {
      clearTimeout(expiryHandle)
      expiryHandle = null
    }
  }

  /** One-shot timer at the QR's own deadline — not a ticking countdown, just the state flip. */
  function scheduleExpiry(expiresAt: number) {
    const msLeft = expiresAt * 1000 - Date.now()
    if (msLeft <= 0) {
      state.value = 'expired'
      return
    }
    expiryHandle = setTimeout(() => {
      if (state.value === 'awaiting-payment') state.value = 'expired'
    }, msLeft)
  }

  function startPolling(invoice: string) {
    pollHandle = setInterval(async () => {
      let latest: Purchase
      try {
        latest = await $fetch<Purchase>(`/me/purchases/${invoice}`, {
          baseURL: config.apiBase,
          credentials: 'include',
        })
      }
      catch {
        // Transient failure — the next tick tries again rather than
        // interrupting the wait over one dropped request.
        return
      }

      if (latest.status === 'paid') {
        stopWaiting()
        await navigateTo('/akun/paket')
      }
      else if (latest.status === 'expired') {
        stopWaiting()
        state.value = 'expired'
      }
    }, POLL_INTERVAL_MS)
  }

  /**
   * Pick up polling around a purchase that already exists, rather than one
   * just created by `pay()` — either the tail end of that same call, or a
   * dedicated page loading a still-pending invoice fresh (a bookmark, or the
   * buyer coming back later). A terminal status needs no timer at all.
   */
  function resumeWaiting(existing: Purchase) {
    stopWaiting()
    purchase.value = existing

    if (existing.status !== 'pending') {
      state.value = existing.status === 'expired' ? 'expired' : 'idle'
      return
    }

    state.value = 'awaiting-payment'
    if (existing.expiresAt) scheduleExpiry(existing.expiresAt)
    startPolling(existing.invoice)
  }

  async function pay(request: CreateOrderRequest) {
    error.value = ''
    stopWaiting()

    if (!config.paymentEnabled) {
      state.value = 'not-connected'
      return
    }

    state.value = 'submitting'
    try {
      const created = await $fetch<Purchase>('/orders', {
        baseURL: config.apiBase,
        method: 'POST',
        body: request,
        credentials: 'include',
      })

      purchase.value = created

      if (created.qrUrl) {
        // A real QR to scan — the dedicated payment page owns showing it and
        // polling for settlement from here.
        await navigateTo(`/pembayaran/${created.invoice}`)
        return
      }

      // No Midtrans key configured (local dev): stay here with the existing
      // "waiting for payment" fallback instead of sending them to a page with
      // no QR to show either.
      resumeWaiting(created)
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
    stopWaiting()
    state.value = 'idle'
    error.value = ''
    purchase.value = null
  }

  // A buyer navigating away mid-wait must not leave a timer running against
  // an unmounted page.
  onUnmounted(stopWaiting)

  return { state, error, purchase, pay, reset, resumeWaiting }
}

/** zenko-api renders every error as { error, requestId }; fall back for the rest. */
function messageFor(cause: unknown): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || 'Gagal memulai pembayaran. Coba lagi sebentar lagi.'
}
