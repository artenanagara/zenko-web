import type { Purchase } from '#shared/types/account'
import type { CreateOrderRequest } from '#shared/types/order'

/**
 * Placing an order against zenko-api.
 *
 * POST /orders creates a pending purchase from a slug — the session cookie says
 * who is buying and the server prices the slug, so the browser carries neither
 * identity nor amount. It returns the pending purchase with `expiresAt` (and,
 * on a gateway channel, `qrUrl`) filled in, which is what the payment page
 * renders while it waits.
 *
 * - paymentEnabled off → nothing is created; the page says payment is not
 *   connected yet, rather than pretending an order was placed.
 * - paymentEnabled on → the order is created and left pending. On the manual
 *   channel `purchase.qrUrl` is null — the buyer pays the static poster the
 *   payment page shows. A gateway channel would fill it with a raw QRIS
 *   payload, rendered into a scannable code client-side (see payment.vue).
 *
 * Settlement is never polled aggressively for its own sake — a short interval
 * checks `/me/purchases/:invoice` while an order is outstanding, but it is the
 * server (an admin's decision today) that actually marks the order paid;
 * polling only notices once that has already happened. A local timer flips the
 * state to 'expired' at the order's own deadline as a client-side fallback.
 *
 * A 409 means the package is already owned — send them to it. A 404 means the
 * slug is unknown — say so plainly.
 *
 * A real QR hands off to its own page (/pembayaran/:invoice) rather than
 * rendering inline here — `resumeWaiting` is what lets that page (or this one,
 * for the no-QR dev fallback) pick polling back up around an order that
 * already exists, instead of duplicating `startPolling`/`scheduleExpiry`.
 */

export type CheckoutState =
  | 'idle'
  | 'submitting'
  | 'not-connected'
  | 'awaiting-payment'
  | 'awaiting-verification'
  | 'expired'
  | 'error'

const POLL_INTERVAL_MS = 3000

/**
 * A verifying order waits on a person, not a webhook, so it is polled far less
 * often — three seconds would be asking a human "sudah?" twenty times a minute.
 * The page says the buyer will be emailed instead.
 */
const VERIFY_POLL_INTERVAL_MS = 15_000

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

  /**
   * `onPaid` lets a caller show its own confirmation before leaving —
   * /pembayaran/:invoice does, with a success screen and a short auto-redirect
   * rather than snapping away the instant settlement is noticed. Without one
   * (checkout/[slug]'s no-QR dev fallback, which has no such screen) the
   * default is the original behaviour: go straight to the owned package.
   */
  function startPolling(invoice: string, onPaid?: (paid: Purchase) => void, intervalMs = POLL_INTERVAL_MS) {
    pollHandle = setInterval(async () => {
      let latest: Purchase
      try {
        latest = await useApiFetch<Purchase>(`/me/purchases/${invoice}`, {
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
        purchase.value = latest
        if (onPaid) onPaid(latest)
        else await navigateTo('/akun/paket')
      }
      else if (latest.status === 'expired') {
        stopWaiting()
        state.value = 'expired'
      }
      else {
        // Still open. The row is kept anyway, because on the manual channel
        // this is how an admin's rejection — and its reason — reaches the page:
        // the order drops back to pending carrying `paymentProof.rejectReason`.
        purchase.value = latest
        if (latest.status === 'pending' && state.value === 'awaiting-verification') {
          stopWaiting()
          resumeWaiting(latest, onPaid)
        }
      }
    }, intervalMs)
  }

  /**
   * Pick up polling around a purchase that already exists, rather than one
   * just created by `pay()` — either the tail end of that same call, or a
   * dedicated page loading a still-open invoice fresh (a bookmark, or the buyer
   * coming back later). A terminal status needs no timer at all.
   */
  function resumeWaiting(existing: Purchase, onPaid?: (paid: Purchase) => void) {
    stopWaiting()
    purchase.value = existing

    // Waiting on an admin rather than on the buyer: no countdown to run — the
    // deadline stopped applying the moment the buyer confirmed — and a much
    // slower poll.
    if (existing.status === 'verifying') {
      state.value = 'awaiting-verification'
      startPolling(existing.invoice, onPaid, VERIFY_POLL_INTERVAL_MS)
      return
    }

    if (existing.status !== 'pending') {
      state.value = existing.status === 'expired' ? 'expired' : 'idle'
      return
    }

    state.value = 'awaiting-payment'
    if (existing.expiresAt) scheduleExpiry(existing.expiresAt)
    startPolling(existing.invoice, onPaid)
  }

  /**
   * Konfirmasi "saya sudah transfer" untuk pesanan QRIS manual.
   *
   * Lampirannya opsional. Yang membuktikan uangnya masuk adalah mutasi di
   * dashboard merchant — kode unik di nominalnya yang menunjuk pesanan mana —
   * dan tangkapan layar justru bukti yang lebih lemah karena bisa dipalsukan.
   * Permintaan ini ada untuk dua hal yang tidak bisa dikerjakan kode unik:
   * memberi tahu bahwa ada yang harus diperiksa, dan menghentikan hitungan
   * kedaluwarsa supaya pesanan yang sudah dibayar tidak hangus saat menunggu.
   *
   * Nama pengirim dan nominal adalah keterangan pembeli, bukan bukti. Keduanya
   * berguna justru saat nominalnya salah ketik: mutasinya jadi tidak cocok
   * pesanan mana pun, dan namanya satu-satunya benang untuk melacak.
   */
  async function confirmPayment(
    invoice: string,
    payload: { file?: File | null, senderName?: string, paidAmount?: number, note?: string } = {},
  ): Promise<Purchase | null> {
    error.value = ''

    // Every field is optional now, and the package checkout sends none of
    // them: the unique code in the amount already identifies the order in the
    // merchant's mutation list, so a retyped name and figure add no evidence
    // and only add ways for an honest payer to get stuck. The parameters stay
    // because bimbel invoice payment still collects them.
    const body = new FormData()
    if (payload.file) body.append('proof', payload.file)
    if (payload.senderName) body.append('senderName', payload.senderName)
    if (payload.paidAmount) body.append('paidAmount', String(payload.paidAmount))
    body.append('transferredAt', String(Math.floor(Date.now() / 1000)))
    if (payload.note) body.append('note', payload.note)

    try {
      // Deliberately does not start waiting here. The caller owns the wait —
      // otherwise a form nested inside a page that already polls would leave
      // two timers running against the same invoice.
      return await useApiFetch<Purchase>(`/me/purchases/${invoice}/payment-proof`, {
        baseURL: config.apiBase,
        method: 'POST',
        body,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = messageFor(cause)
      return null
    }
  }

  /**
   * `free` is a client-side hint only — the package's own price, already on
   * screen before this is ever called — never trusted as the actual charge.
   * zenko-api recomputes the total from `request.slug` and independently
   * decides whether the resulting order needs a gateway at all (see
   * Orders.Create: a Rp0 total skips ChargeQRIS and is written paid outright).
   * This just decides whether `!config.paymentEnabled` should still block the
   * attempt: that flag exists to stop a real charge from being attempted
   * against a gateway that isn't live, and a free order was never going to
   * touch the gateway in the first place.
   */
  async function pay(request: CreateOrderRequest, free = false) {
    error.value = ''
    stopWaiting()

    if (!free && !config.paymentEnabled) {
      state.value = 'not-connected'
      return
    }

    state.value = 'submitting'
    try {
      const created = await useApiFetch<Purchase>('/orders', {
        baseURL: config.apiBase,
        method: 'POST',
        body: request,
        credentials: 'include',
      })

      purchase.value = created

      if (created.status === 'paid') {
        // Rp0 total: zenko-api settled it on creation, nothing to charge or
        // wait on. Tetap lewat /pembayaran/:invoice, bukan langsung ke
        // dokumen invoice — pembeli baru butuh konfirmasi bahwa paketnya
        // sudah jadi miliknya dan jalan masuk ke pengerjaannya, bukan bukti
        // pembayaran. Halaman itu menampilkan layar "Pembayaran berhasil"
        // dengan tombol "Lihat paket saya" dan hitung mundur otomatis ke
        // /akun/paket — persis yang dilihat pembayaran QRIS sungguhan begitu
        // lunas. Invoice-nya tetap tersimpan di Riwayat pembelian.
        await navigateTo(`/pembayaran/${created.invoice}`, { replace: true })
        return
      }

      if (created.qrUrl || created.paymentChannel === 'manual_qris') {
        // Something to pay: a per-order QR from a gateway, or the static QRIS
        // poster and its receipt upload. Either way the dedicated payment page
        // owns showing it and waiting from here.
        await navigateTo(`/pembayaran/${created.invoice}`)
        return
      }

      // No payment gateway key configured (local dev): stay here with the existing
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

  return { state, error, purchase, pay, reset, resumeWaiting, confirmPayment }
}

/** zenko-api renders every error as { error, requestId }; fall back for the rest. */
function messageFor(cause: unknown): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || 'Pembayaran belum bisa dimulai. Coba lagi sebentar lagi.'
}
