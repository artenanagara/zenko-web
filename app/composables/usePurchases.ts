import type { OrderStatus, Purchase } from '#shared/types/account'
import type { AsyncResource } from '~/composables/useAccountResource'

/**
 * Purchase history, read from zenko-api's /me/purchases.
 */

export interface InvoiceTotals {
  /** Sum of the items' original prices. */
  subtotal: number
  discount: number
  serviceFee: number
  /**
   * Kode unik QRIS manual, dibawa sebagai barisnya sendiri supaya rincian
   * invoice tetap berjumlah persis. 0 pada pesanan gratis.
   */
  uniqueCode: number
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
    uniqueCode: purchase.uniqueCode,
    total: paidForItems + purchase.serviceFee + purchase.uniqueCode,
  }
}

/**
 * Payment channel as a label that is never blank.
 *
 * `method` is null for two very different orders: one nobody has paid yet
 * (no channel chosen), and a Rp0 order that zenko-api settles as `paid`
 * without ever creating a charge — no method, reference, QR code, or expiry.
 * Rendering `method` raw left that second case as an empty cell, so the
 * total decides which of the two a null means.
 */
export function purchaseMethodLabel(purchase: Purchase): string {
  if (purchase.method) return purchase.method
  if (invoiceTotals(purchase).total === 0) return 'Gratis'
  return 'Belum dipilih'
}

export function usePurchases(): AsyncResource<Purchase[]> {
  return useSessionCollection<Purchase>('/me/purchases')
}

/** One invoice; an unknown number 404s. */
export function usePurchase(invoice: string): AsyncResource<Purchase | null> {
  return useSessionItem<Purchase>(`/me/purchases/${invoice}`, 'Invoice tidak ditemukan')
}

/**
 * Canonical status → Indonesian label. The API is the source of truth for the
 * status itself; every page renders it through this one map so the wording
 * stays identical across the table, the badge, and the invoice.
 */
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu pembayaran',
  // Deliberately not "Menunggu pembayaran": the buyer has already paid as far
  // as they are concerned, and the wait is now on Zenko's side.
  verifying: 'Menunggu verifikasi',
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
  verifying: 'warning',
  expired: 'neutral',
}

export function purchaseStatusTone(status: OrderStatus): 'success' | 'warning' | 'neutral' {
  return STATUS_TONES[status]
}

/**
 * Nominal yang harus ditransfer, dipisah dari harga paketnya.
 *
 * Angka bulat dan kode unik ditampilkan terpisah lalu dijumlahkan, karena satu
 * digit yang salah ketik membuat admin tidak bisa mencocokkan transfernya —
 * jadi pembeli harus melihat dari mana angka ganjil itu datang.
 */
export function manualTransferBreakdown(purchase: Purchase) {
  const totals = invoiceTotals(purchase)
  return {
    base: totals.total - totals.uniqueCode,
    uniqueCode: totals.uniqueCode,
    total: totals.total,
  }
}
