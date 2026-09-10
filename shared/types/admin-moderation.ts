/**
 * Panel admin: antrean moderasi produk dan antrean pencairan. Mirrors the
 * /admin/* section of docs/tutor-flow-contract.md.
 */

import type { AdminBimbelPaymentProof } from '#shared/types/bimbel'
import type { OrderStatus, PaymentProofStatus, PurchaseItem } from './account'
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
  /**
   * Nomor transaksi bank yang membawa pencairan ini. Wajib pada aksi
   * `transfer`: tanpa itu tidak ada yang menghubungkan status "sudah
   * ditransfer" dengan mutasi bank yang mendukungnya, dan server menolaknya.
   */
  reference?: string
}

/**
 * Row shape of GET /admin/payment-proofs?status= — satu bukti transfer yang
 * diunggah pembeli pada jalur QRIS manual, lengkap dengan konteks pesanannya.
 *
 * Flat, bukan `{ proof: {...} }`: Go's model.AdminPaymentProof MENYERAP
 * PaymentProof, jadi field buktinya ikut serialisasi di level atas bersama
 * invoice dan konteks pesanan.
 *
 * `senderName` dan `paidAmount` adalah klaim pembeli, bukan kebenaran. Yang
 * dicocokkan admin adalah `amountDue` dengan mutasi bank — kode uniknya yang
 * menunjuk pesanan mana. Keduanya berguna justru saat nominalnya salah ketik:
 * mutasinya tidak cocok pesanan mana pun, dan nama pengirim satu-satunya
 * benang untuk melacak. Tidak ada jalur server yang melunasi pesanan dari
 * angka yang diketik pembeli.
 */
export interface AdminPaymentProof {
  id: string
  status: PaymentProofStatus
  /**
   * Apakah ada lampiran gambar. Lampiran bersifat opsional — yang membuktikan
   * uangnya masuk adalah mutasi bank, bukan tangkapan layar — jadi meja admin
   * perlu membedakan "tidak melampirkan" dari "gambarnya gagal dimuat".
   */
  hasImage: boolean
  senderName: string
  paidAmount: number
  /** Unix seconds menurut pembeli; absen kalau dikosongkan. */
  transferredAt?: number
  note: string
  /** Unix seconds; ada setelah admin memutuskan. */
  reviewedAt?: number
  rejectReason: string
  /** Unix seconds bukti diunggah. */
  createdAt: number

  invoice: string
  buyerName: string
  buyerEmail: string
  /** Nominal yang seharusnya ditransfer — harga + biaya layanan + kode unik. */
  amountDue: number
  uniqueCode: number
  orderStatus: OrderStatus
  /** Unix seconds pesanan dibuat. */
  orderDate: number
  items: PurchaseItem[]
}

export type PaymentProofAction = 'approve' | 'reject'

/**
 * POST /admin/payment-proofs/:id/decision — `reason` wajib saat reject (itulah
 * yang sampai ke pembeli lewat email dan banner), `reference` opsional saat
 * approve untuk mencatat nomor mutasi banknya.
 */
export interface PaymentProofDecisionRequest {
  action: PaymentProofAction
  reason?: string
  reference?: string
}

/**
 * Row shape of GET /admin/bank-accounts — satu baris per rekening tersimpan.
 * `verifiedAt` kosong/absen sampai admin memverifikasi secara manual.
 *
 * Flat, bukan `{ bankAccount: {...} }`: Go's model.AdminBankAccount EMBEDS
 * BankAccount, so bankLabel/accountNumber/holderName/verifiedAt serialise at
 * the top level next to accountId and tutor.
 */
export interface AdminBankAccount extends BankAccount {
  accountId: string
  tutor: AdminAuthor
}

/** requested via /jadi-tutor's account form, then pending admin review. */
export type BankAccountChangeStatus = 'pending' | 'approved' | 'rejected'

/**
 * Row shape of GET /admin/bank-account-change-requests?status=. Rekening
 * tutor terkunci setelah tersimpan pertama kali, jadi perubahan berikutnya
 * lewat alur ini dan butuh persetujuan admin.
 */
export interface AdminBankAccountChangeRequest {
  id: string
  tutor: AdminAuthor
  currentAccount: BankAccount
  newAccount: BankAccount
  status: BankAccountChangeStatus
  /** Unix seconds. */
  requestedAt: number
  /** Unix seconds; present once approved/rejected. */
  decidedAt?: number
  rejectReason?: string
}

/** POST /admin/bank-account-change-requests/:id/decision — reason wajib saat reject. */
export interface BankAccountChangeDecisionRequest {
  approve: boolean
  reason?: string
}

/**
 * GET /admin/summary — jumlah antrean per halaman admin, dipakai badge
 * sidebar dan kartu Ringkasan. Badge "Rekening bank" =
 * pendingBankVerifications + pendingBankChangeRequests.
 */
export interface AdminSummary {
  pendingTutorApplications: number
  pendingProducts: number
  pendingPayouts: number
  pendingBankVerifications: number
  pendingBankChangeRequests: number
  /**
   * Bukti transfer QRIS manual yang menunggu diperiksa. Optional karena API
   * lama belum mengirimkannya, dan karena pada jalur otomatis antrean ini
   * memang tidak pernah terisi.
   */
  pendingPaymentProofs?: number
  /**
   * Separuh langganan dari antrean verifikasi yang sama. Dikirim terpisah,
   * bukan dijumlahkan server, supaya dashboard masih bisa menyebut jenis
   * pekerjaan yang menunggu — bukan cuma banyaknya.
   */
  pendingBimbelPaymentProofs?: number
  /**
   * Current headcount per role, not a queue — backs the Ringkasan page's
   * stat cards. Optional so older API responses (before the backend shipped
   * these fields) don't break the type; the page falls back to an em-dash
   * when either is undefined.
   */
  totalStudents?: number
  totalTutors?: number
}

/**
 * Satu baris di meja verifikasi pembayaran, apa pun jenisnya.
 *
 * Dua jenis pembayaran mendarat di meja yang sama karena pekerjaannya identik:
 * cocokkan nominal dengan mutasi bank, lalu setujui atau tolak. Yang tidak
 * identik adalah akibatnya — menyetujui pembelian paket melunasi satu pesanan
 * dan mencatat bagi hasil tutor, sedangkan menyetujui langganan MENGAKTIFKAN
 * langganan bimbel dengan kuota kursi dan durasinya. Karena itu ini union
 * dengan pembeda, bukan satu bentuk rata: tiap cabang tetap membawa data yang
 * dibutuhkan untuk memutuskan jenisnya, dan tiap keputusan tetap dikirim ke
 * endpoint-nya sendiri.
 *
 * Field yang sama-sama dimiliki keduanya (invoice, status, amountDue,
 * paidAmount, orderDate, createdAt, senderName, note, rejectReason, hasImage)
 * bisa dibaca langsung dari union tanpa menyempitkan tipenya lebih dulu.
 */
export type VerificationKind = 'package' | 'subscription'

export type VerificationItem =
  | ({ kind: 'package' } & AdminPaymentProof)
  | ({
      kind: 'subscription'
      /** Jenis tagihan bimbel dari API; dipisah dari discriminator antrean. */
      orderKind: AdminBimbelPaymentProof['kind']
    } & Omit<AdminBimbelPaymentProof, 'kind'>)
