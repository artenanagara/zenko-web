/**
 * Placing an order.
 *
 * The checkout page posts a slug and nothing else — the session cookie decides
 * who is buying and the server recomputes the price from the slug, so the
 * browser is never trusted to carry an amount. zenko-api answers POST /orders
 * with a `Purchase` (see #shared/types/account), charged through Midtrans QRIS
 * and pending until the webhook reports it paid.
 * Keep in sync with zenko-api/internal/model/order.go.
 */

/** Body of POST /orders. The session identifies the buyer; the slug is priced server-side. */
export interface CreateOrderRequest {
  slug: string
}
