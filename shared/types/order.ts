/**
 * Placing an order.
 *
 * The checkout page posts a slug and nothing else — the session cookie decides
 * who is buying and the server recomputes the price from the slug, so the
 * browser is never trusted to carry an amount. zenko-api answers POST /orders
 * with a `Purchase` (see #shared/types/account), pending until it is paid.
 * Keep in sync with zenko-api/internal/model/order.go.
 */

/**
 * Payment families rather than individual banks. The gateway expands one of
 * these into the concrete channels it supports, which is where bank-by-bank
 * detail belongs — it changes with the provider, not with Zenko. Shown on the
 * checkout page while a gateway is being wired up; not part of the order body
 * yet, since the current backend records only the slug.
 */
export type PaymentMethodId = 'va' | 'qris' | 'ewallet' | 'card'

/** Body of POST /orders. The session identifies the buyer; the slug is priced server-side. */
export interface CreateOrderRequest {
  slug: string
}
