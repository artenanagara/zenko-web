/**
 * Panel admin: antrean moderasi produk dan antrean pencairan. Mirrors the
 * /admin/* section of docs/tutor-flow-contract.md.
 */

import type { TutorProductDetail, TutorProductSummary } from './tutor-product'
import type { BankAccount, PayoutStatus } from './tutor-earnings'

/** Pemilik produk / pemohon pencairan, seperti dikirim endpoint admin. */
export interface AdminAuthor {
  name: string
  email: string
}

/** Row shape of GET /admin/products?status= — ringkasan tutor + author. */
export interface AdminProductSummary extends TutorProductSummary {
  author: AdminAuthor
}

/**
 * GET /admin/products/:id — bentuk sama dengan detail tutor. The author is
 * optional here because the contract only promises it on the list rows.
 */
export interface AdminProductDetail extends TutorProductDetail {
  author?: AdminAuthor
}

/** POST /admin/products/:id/decision — reason wajib saat reject. */
export interface ProductDecisionRequest {
  approve: boolean
  reason?: string
}

/** Row shape of GET /admin/payouts?status=. */
export interface AdminPayout {
  id: string
  amount: number
  status: PayoutStatus
  /** Unix seconds. */
  requestedAt: number
  /** Unix seconds; present once processed/transferred/rejected. */
  processedAt?: number
  rejectReason?: string
  tutor: AdminAuthor
  bankAccount: BankAccount
}

export type PayoutAction = 'process' | 'transfer' | 'reject'

/** POST /admin/payouts/:id/decision — reason wajib saat reject. */
export interface PayoutDecisionRequest {
  action: PayoutAction
  reason?: string
}
