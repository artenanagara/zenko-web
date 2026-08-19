/**
 * Alur tutor: penjualan, saldo, rekening bank, dan pencairan. Mirrors
 * docs/tutor-flow-contract.md — the contract the backend is being built
 * against. JSON camelCase, timestamps Unix seconds, amounts integer rupiah.
 */

/** Porsi tutor per penjualan: tertahan 7 hari → tersedia → ikut dicairkan. */
export type ShareStatus = 'held' | 'available' | 'paid_out'

/** One row of GET /tutor/sales. */
export interface TutorSale {
  orderId: string
  invoice: string
  /** Unix seconds. */
  paidAt: number
  productId: string
  productTitle: string
  productType: 'single' | 'bundle'
  /** Disamarkan oleh server, mis. "Ra*** P.". */
  buyerName: string
  /** Harga yang dibayar pembeli. */
  price: number
  /** Porsi tutor: 70% × harga bayar. */
  share: number
  shareStatus: ShareStatus
}

export interface TutorSalesSummary {
  count: number
  gross: number
  share: number
}

/** GET /tutor/sales?from=&to=&productId= */
export interface TutorSalesResponse {
  summary: TutorSalesSummary
  sales: TutorSale[]
}

/** GET /tutor/balance — agregat ledger, semua dalam rupiah. */
export interface TutorBalance {
  available: number
  held: number
  totalPaidOut: number
}

/** GET/PUT /tutor/bank-account. GET menjawab 404 bila belum tersimpan. */
export interface BankAccount {
  bankCode: string
  bankLabel: string
  accountNumber: string
  holderName: string
  /**
   * Unix seconds; null/absent sampai admin memverifikasi manual. Murni
   * informasional — tidak memengaruhi apakah rekening bisa diubah.
   */
  verifiedAt?: number | null
}

/** Bentuk field yang sama dipakai PUT /tutor/bank-account dan POST change-request. */
export interface BankAccountInput {
  bankCode: string
  bankLabel: string
  accountNumber: string
  holderName: string
}

/** pending → approved | rejected, hasil review admin atas perubahan rekening. */
export type BankAccountChangeRequestStatus = 'pending' | 'approved' | 'rejected'

/**
 * GET/POST /tutor/bank-account/change-request. Setelah rekening pertama kali
 * tersimpan, PUT dikunci (409) — perubahan berikutnya lewat alur ini dan
 * menunggu persetujuan admin. GET menjawab 404 bila tidak ada yang pending.
 */
export interface BankAccountChangeRequest {
  id: string
  newAccount: BankAccountInput
  status: BankAccountChangeRequestStatus
  /** Unix seconds. */
  requestedAt: number
  /** Unix seconds; hadir setelah disetujui/ditolak. */
  decidedAt?: number
  /** Hadir bila status `rejected`. */
  rejectReason?: string
}

/** requested → processing → transferred | rejected */
export type PayoutStatus = 'requested' | 'processing' | 'transferred' | 'rejected'

/** One row of GET /tutor/payouts. */
export interface TutorPayout {
  id: string
  amount: number
  status: PayoutStatus
  /** Unix seconds. */
  requestedAt: number
  /** Unix seconds; present once processed/transferred/rejected. */
  processedAt?: number
  /** Present when status is `rejected`. */
  rejectReason?: string
}
