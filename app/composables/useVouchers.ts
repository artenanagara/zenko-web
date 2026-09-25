import type {
  Voucher,
  VoucherRedemption,
  VoucherRequest,
  VoucherStepUp,
} from '#shared/types/voucher'

/**
 * Kode voucher/promo — dibuat tutor (produknya sendiri) atau admin
 * (platform-wide). Mirrors internal/handler/vouchers_crud.go.
 *
 * `useApiFetch` sudah menangani CSRF secara otomatis (lihat useApiFetch.ts),
 * jadi composable ini tidak perlu menyentuhnya sendiri — sama seperti
 * useTutorShare.ts.
 */

const STEP_UP_HEADER = 'X-Voucher-Step-Up'

/** Ambang yang sama dengan model.VoucherHighRiskDiscountPercent di backend —
 * dipakai untuk menampilkan field step-up sebelum submit, bukan sumber
 * kebenaran (server tetap memvalidasi ulang penuh). */
const HIGH_RISK_DISCOUNT_PERCENT = 80

/** Cermin client-side dari model.VoucherCode.IsHighRisk di backend — kode
 * dengan potongan sebesar ini butuh batas total pemakaian dan step-up
 * password sebelum bisa disimpan. */
export function isHighRiskVoucherInput(input: Pick<VoucherRequest, 'discountType' | 'discountValue' | 'maxDiscount'>): boolean {
  return input.discountType === 'percent'
    && input.discountValue >= HIGH_RISK_DISCOUNT_PERCENT
    && !input.maxDiscount
}

export async function stepUpVoucher(password: string): Promise<VoucherStepUp> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<VoucherStepUp>('/vouchers/step-up', {
    baseURL: config.apiBase,
    method: 'POST',
    body: { password },
    credentials: 'include',
  })
}

function stepUpHeaders(stepUpToken?: string): Headers | undefined {
  if (!stepUpToken) return undefined
  const headers = new Headers()
  headers.set(STEP_UP_HEADER, stepUpToken)
  return headers
}

/** Daftar voucher milik tutor yang login — "voucher saya". */
export function useTutorVouchers() {
  return useSessionCollection<Voucher>('/tutor/vouchers')
}

export async function createTutorVoucher(input: VoucherRequest, stepUpToken?: string): Promise<Voucher> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<Voucher>('/tutor/vouchers', {
    baseURL: config.apiBase,
    method: 'POST',
    body: input,
    headers: stepUpHeaders(stepUpToken),
    credentials: 'include',
  })
}

export async function updateTutorVoucher(id: string, input: VoucherRequest, stepUpToken?: string): Promise<Voucher> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<Voucher>(`/tutor/vouchers/${id}`, {
    baseURL: config.apiBase,
    method: 'PATCH',
    body: input,
    headers: stepUpHeaders(stepUpToken),
    credentials: 'include',
  })
}

export async function tutorVoucherRedemptions(id: string): Promise<VoucherRedemption[]> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<VoucherRedemption[]>(`/tutor/vouchers/${id}/redemptions`, {
    baseURL: config.apiBase,
    credentials: 'include',
  })
}

/** Daftar seluruh voucher lintas pembuat — tampilan oversight admin. */
export function useAdminVouchers() {
  return useSessionCollection<Voucher>('/admin/vouchers')
}

export async function createAdminVoucher(input: VoucherRequest, stepUpToken?: string): Promise<Voucher> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<Voucher>('/admin/vouchers', {
    baseURL: config.apiBase,
    method: 'POST',
    body: input,
    headers: stepUpHeaders(stepUpToken),
    credentials: 'include',
  })
}

/** Full edit — server menolak (403) kalau target bukan voucher buatan admin. */
export async function updateAdminVoucher(id: string, input: VoucherRequest, stepUpToken?: string): Promise<Voucher> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<Voucher>(`/admin/vouchers/${id}`, {
    baseURL: config.apiBase,
    method: 'PATCH',
    body: input,
    headers: stepUpHeaders(stepUpToken),
    credentials: 'include',
  })
}

/** Kill switch moderasi — jalan untuk voucher siapa pun, hanya menyentuh Active. */
export async function setAdminVoucherActive(id: string, active: boolean): Promise<Voucher> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<Voucher>(`/admin/vouchers/${id}/active`, {
    baseURL: config.apiBase,
    method: 'PATCH',
    body: { active },
    credentials: 'include',
  })
}

export async function adminVoucherRedemptions(id: string): Promise<VoucherRedemption[]> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<VoucherRedemption[]>(`/admin/vouchers/${id}/redemptions`, {
    baseURL: config.apiBase,
    credentials: 'include',
  })
}

/** zenko-api merender error sebagai { error, requestId[, code] }. */
export function voucherApiMessage(cause: unknown, fallback: string): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || fallback
}

/** Kode mesin-baca seperti "step_up_required" — lihat CodedError di backend. */
export function voucherErrorCode(cause: unknown): string {
  return (cause as { data?: { code?: string } })?.data?.code ?? ''
}

/* --------------------------------------------------------------------------
 * Tanggal WIB — input datetime-local ↔ Unix seconds. Duplikat kecil dari pola
 * yang sama di dashboard/admin/tutors/[id].vue dan tutor/sales.vue (keduanya
 * page-local); disatukan di sini karena dua halaman voucher baru + dua modal
 * baru sama-sama membutuhkannya.
 * ------------------------------------------------------------------------ */

export function parseWibInput(value: string): number | undefined {
  if (!value) return undefined
  return Math.floor(new Date(`${value}:00+07:00`).getTime() / 1000)
}

export function wibInputValue(seconds?: number): string {
  if (!seconds) return ''
  const shifted = new Date((seconds + 7 * 60 * 60) * 1000)
  return shifted.toISOString().slice(0, 16)
}

export function formatWibDateTime(seconds?: number | null): string {
  if (!seconds) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(seconds * 1000) + ' WIB'
}

/* --------------------------------------------------------------------------
 * UI labels — satu tempat, supaya nilai wire tidak pernah dirender apa adanya.
 * ------------------------------------------------------------------------ */

export const VOUCHER_DISCOUNT_TYPE_LABEL: Record<Voucher['discountType'], string> = {
  flat: 'Nominal tetap',
  percent: 'Persentase',
}

export const VOUCHER_SCOPE_LABEL: Record<Voucher['scope'], string> = {
  all: 'Semua paket',
  category: 'Kategori tertentu',
  products: 'Paket tertentu',
}

export const VOUCHER_ABSORBED_BY_LABEL: Record<Voucher['absorbedBy'], string> = {
  platform: 'Ditanggung Zenko',
  tutor: 'Ditanggung tutor',
}

export function voucherDiscountLabel(voucher: Pick<Voucher, 'discountType' | 'discountValue' | 'maxDiscount'>): string {
  if (voucher.discountType === 'percent') {
    const cap = voucher.maxDiscount ? ` (maks. ${formatRupiah(voucher.maxDiscount)})` : ''
    return `${voucher.discountValue}%${cap}`
  }
  return formatRupiah(voucher.discountValue)
}

export type VoucherStatusTone = 'success' | 'warning' | 'neutral'

/** Status yang dirender — diturunkan dari active + jendela waktu, bukan kolom tersendiri. */
export function voucherStatus(voucher: Voucher, now = Date.now() / 1000): { label: string, tone: VoucherStatusTone } {
  if (!voucher.active) return { label: 'Nonaktif', tone: 'neutral' }
  if (voucher.expiresAt && now >= voucher.expiresAt) return { label: 'Kedaluwarsa', tone: 'neutral' }
  if (voucher.startsAt && now < voucher.startsAt) return { label: 'Terjadwal', tone: 'warning' }
  return { label: 'Aktif', tone: 'success' }
}
