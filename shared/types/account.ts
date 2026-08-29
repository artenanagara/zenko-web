/**
 * The signed-in learner's own data: packages they own, attempts they have sat,
 * and the purchases behind them. Wire format returned by zenko-api's /me and
 * /me/purchases endpoints — keep in sync with zenko-api's model package.
 *
 * These interfaces are the contract: they are written out here in full and
 * derive from nothing else, so `shared/` never depends on app-side fixtures.
 */

/** One subtest inside an attempt, mirroring "Materi yang dibahas" in the catalogue. */
export interface AttemptSection {
  title: string
  correct: number
  total: number
}

/** One sitting. A package may be redone, so a package has many attempts. */
export interface Attempt {
  id: string
  /** 1-based attempt number. */
  number: number
  /** Unix seconds the sitting finished. */
  finishedAt: number
  /** Final mark on the package's own scale, e.g. 412. */
  score: number
  rank: string
  sections: AttemptSection[]
}

/**
 * A package this account owns.
 *
 * One package is one try out: its question count and duration are exactly what
 * the catalogue promised. What grows each time it is worked through is
 * `attempts`, never the package's contents. There is no expiry — an owned
 * package stays owned.
 */
export interface OwnedPackage {
  slug: string
  title: string
  category: string
  thumbnailUrl: string
  tutorName: string
  /** Same value as PackageDetail.questionCount in the catalogue. */
  questionCount: number
  /** Same value as PackageDetail.durationMinutes in the catalogue. */
  durationMinutes: number
  /** Unix seconds, like every other timestamp in the API. */
  purchasedAt: number
  /** The invoice it was bought on, so a card can point at its proof. */
  invoice: string
  /** Newest first. Empty means never attempted. */
  attempts: Attempt[]
}

/**
 * One question's answer as posted alongside a finished sitting. Mirrors
 * TryoutAnswerState in shared/types/tryout, kept as its own shape here
 * (rather than imported) so this file keeps deriving from nothing else, per
 * the header note above — selected is `string | null` rather than
 * `OptionLabel | null` for the same reason.
 */
export interface RecordAttemptAnswer {
  selected: string | null
  value?: string | string[] | Record<string, string | boolean> | null
  doubtful: boolean
}

/**
 * Body of POST /me/packages/:slug/attempts. `finishedAt` is optional — the
 * server stamps its own clock when it is omitted. `answers` is what feeds
 * "Lihat pembahasan" later: zenko-api judges each one against its own copy
 * of the product (never trusting a client-claimed correctness) and stores
 * the result as the attempt's review snapshot — see TryoutAttemptReview in
 * shared/types/tryout. Optional so a sitting that could not build a full
 * answer map still gets its aggregate score saved.
 */
export interface RecordAttemptRequest {
  score: number
  sections: AttemptSection[]
  finishedAt?: number
  answers?: Record<string, RecordAttemptAnswer>
}

/** One package line on an invoice. Whole rupiah, like the catalogue API. */
export interface PurchaseItem {
  slug: string
  title: string
  category: string
  priceOriginal: number
  price: number
}

/**
 * Canonical purchase status as zenko-api stores it. The UI never shows these
 * strings directly — purchaseStatusLabel maps them to Indonesian labels — so
 * the API stays the single source of truth for the state itself.
 *
 * `pending` covers "waiting for the buyer to pay": with virtual accounts and
 * QRIS that window is hours, a normal resting state rather than a hiccup.
 *
 * `verifying` exists only on the manual QRIS channel: the buyer has uploaded a
 * transfer receipt and no admin has looked at it yet. It is emphatically not
 * paid — ownership still comes from `paid` alone — but it is no longer the
 * buyer's move either, which is why it reads differently on screen.
 */
export type OrderStatus = 'pending' | 'verifying' | 'paid' | 'expired'

/** How an order is meant to be paid. Chosen by the server, never the browser. */
export type PaymentChannel = 'duitku_qris' | 'manual_qris'

/** Where the buyer's newest transfer receipt stands. */
export type PaymentProofStatus = 'submitted' | 'approved' | 'rejected'

/**
 * What a buyer may see about their own receipt.
 *
 * It rides along on the purchase rather than living behind its own endpoint, so
 * the payment page's existing poll picks up the verification outcome — and a
 * rejection's reason — without a second request.
 */
export interface PaymentProofBrief {
  status: PaymentProofStatus
  /** Unix seconds the receipt was uploaded. */
  submittedAt: number
  /** Empty unless status is 'rejected'; this is what the buyer has to fix. */
  rejectReason: string
}

export interface Purchase {
  /** Nomor invoice, sekaligus kunci baris tabel dan URL detailnya. */
  invoice: string
  /** Unix detik invoice dibuat. */
  date: number
  /** Unix seconds payment was received; null while unpaid. */
  paidAt: number | null
  /** Null until a payment channel is chosen/settled. */
  method: string | null
  /** Nomor rujukan dari penyedia pembayaran; null sebelum ada. */
  reference: string | null
  /** Duitku's raw QRIS payload string, rendered into a scannable code
   * client-side (see payment.vue); null once the charge was never created.
   * Always null on the manual channel — one static poster serves every buyer,
   * so there is no per-order code. */
  qrUrl: string | null
  /** Unix seconds the payment window closes; null when there is no deadline. */
  expiresAt: number | null
  status: OrderStatus
  items: PurchaseItem[]
  /** Biaya layanan penyedia pembayaran, ditagihkan apa adanya. */
  serviceFee: number
  /** Which payment path this order took — see PaymentChannel. */
  paymentChannel: PaymentChannel
  /**
   * Tiga digit yang ditambahkan ke nominal transfer pada jalur QRIS manual,
   * supaya dua pesanan untuk paket yang sama tidak pernah meminta angka yang
   * persis sama dan admin bisa mencocokkannya dengan mutasi bank.
   *
   * Bukan bagian dari harga: bagi hasil tutor tetap dihitung dari harga item.
   * 0 pada jalur Duitku.
   */
  uniqueCode: number
  /** Bukti transfer terbaru pada pesanan ini; null kalau belum pernah unggah. */
  paymentProof: PaymentProofBrief | null
}
