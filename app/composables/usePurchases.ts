import type { OrderStatus, Purchase } from '#shared/types/account'
import type { AsyncResource } from '~/composables/useAccountResource'
import { purchases } from '~/mocks/account'

/**
 * Purchase history.
 *
 * Live it reads zenko-api's /me/purchases; with NUXT_PUBLIC_USE_MOCK on it
 * falls back to fixtures. Like useOwnedPackages, the calculations work on the
 * `Purchase` type so they do not care which source answered.
 */

export interface InvoiceTotals {
  /** Sum of the items' original prices. */
  subtotal: number
  discount: number
  serviceFee: number
  total: number
}

/** Computed from the line items, never stored — totals must match their own breakdown. */
export function invoiceTotals(purchase: Purchase): InvoiceTotals {
  const subtotal = purchase.items.reduce((sum, item) => sum + item.priceOriginal, 0)
  const paidForItems = purchase.items.reduce((sum, item) => sum + item.price, 0)

  return {
    subtotal,
    discount: subtotal - paidForItems,
    serviceFee: purchase.serviceFee,
    total: paidForItems + purchase.serviceFee,
  }
}

export function usePurchases(): AsyncResource<Purchase[]> {
  const { public: config } = useRuntimeConfig()

  if (config.useMock) return settledResource<Purchase[]>(purchases)

  return useSessionCollection<Purchase>('/me/purchases')
}

/** One invoice; an unknown number 404s. */
export function usePurchase(invoice: string): AsyncResource<Purchase | null> {
  const { public: config } = useRuntimeConfig()

  if (config.useMock) {
    const item = purchases.find(purchase => purchase.invoice === invoice)
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invoice tidak ditemukan',
        fatal: true,
      })
    }
    return settledResource<Purchase | null>(item)
  }

  return useSessionItem<Purchase>(`/me/purchases/${invoice}`, 'Invoice tidak ditemukan')
}

/**
 * Canonical status → Indonesian label. The API is the source of truth for the
 * status itself; every page renders it through this one map so the wording
 * stays identical across the table, the badge, and the invoice.
 */
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu pembayaran',
  paid: 'Lunas',
  expired: 'Kedaluwarsa',
}

export function purchaseStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status]
}

/** Canonical status → DashboardBadge tone, kept beside the labels for one place to change. */
const STATUS_TONES: Record<OrderStatus, 'success' | 'warning' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  expired: 'neutral',
}

export function purchaseStatusTone(status: OrderStatus): 'success' | 'warning' | 'neutral' {
  return STATUS_TONES[status]
}
