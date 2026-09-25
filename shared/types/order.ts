import type { PaymentChannel } from '#shared/types/account'

/**
 * Placing an order.
 *
 * The checkout page posts a slug and nothing else — the session cookie decides
 * who is buying and the server recomputes the price from the slug, so the
 * browser is never trusted to carry an amount. zenko-api answers POST /orders
 * with a `Purchase` (see #shared/types/account) that stays pending until it
 * is paid — through DOKU's QRIS code, or by transfer to Zenko's static
 * poster that an admin verifies.
 * Keep in sync with zenko-api/internal/model/order.go.
 */

/** Body of POST /orders. The session identifies the buyer; the slug is priced server-side. */
export interface CreateOrderRequest {
  slug: string
  /**
   * Which payment path the buyer picked, from GET /payments/methods.
   *
   * The one payment decision the browser is allowed to make — and still not a
   * trusted one: the server checks it against its own list and refuses
   * anything it cannot serve rather than quietly substituting a default.
   * Omit it to take whatever the server prefers.
   */
  paymentChannel?: PaymentChannel
}

/** GET /payments/methods — which paths this deployment can actually charge. */
export interface PaymentMethods {
  available: PaymentChannel[]
  default: PaymentChannel
}
