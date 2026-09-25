/**
 * Kode voucher/promo di checkout — dibuat tutor (untuk produknya sendiri)
 * atau admin (platform-wide). JSON camelCase, timestamps Unix seconds,
 * nominal rupiah bulat. Mirrors internal/handler/vouchers_crud.go di
 * zenko-api.
 */

export type VoucherDiscountType = 'flat' | 'percent'
export type VoucherScope = 'all' | 'category' | 'products'
/** Siapa yang menanggung diskon — selalu ditentukan server dari siapa pembuatnya, tidak pernah dipilih di form. */
export type VoucherAbsorbedBy = 'platform' | 'tutor'
export type VoucherCreatedByRole = 'tutor' | 'admin'

/** GET/POST/PATCH .../vouchers response shape. */
export interface Voucher {
  id: string
  code: string
  discountType: VoucherDiscountType
  discountValue: number
  maxDiscount?: number
  minOrderAmount: number
  scope: VoucherScope
  scopeCategories?: string[]
  scopeProductIds?: string[]
  usageLimitTotal?: number
  usageLimitPerUser: number
  absorbedBy: VoucherAbsorbedBy
  /** Unix seconds; kosong berarti langsung aktif. */
  startsAt?: number
  /** Unix seconds; kosong berarti tanpa kedaluwarsa. */
  expiresAt?: number
  active: boolean
  createdByRole: VoucherCreatedByRole
  internalNote?: string
  createdAt: number
  updatedAt: number
}

/** Body POST/PATCH .../vouchers — state penuh yang diinginkan, bukan patch parsial. */
export interface VoucherRequest {
  code: string
  discountType: VoucherDiscountType
  discountValue: number
  maxDiscount?: number | null
  minOrderAmount: number
  scope: VoucherScope
  scopeCategories?: string[]
  scopeProductIds?: string[]
  usageLimitTotal?: number | null
  usageLimitPerUser: number
  startsAt?: number | null
  expiresAt?: number | null
  active: boolean
  internalNote?: string
}

/** GET .../vouchers/:id/redemptions row. */
export interface VoucherRedemption {
  invoice: string
  buyerName: string
  status: 'pending' | 'verifying' | 'paid' | 'expired'
  createdAt: number
  price: number
  discount: number
}

/** POST /vouchers/step-up response. */
export interface VoucherStepUp {
  stepUpToken: string
  expiresIn: number
}
