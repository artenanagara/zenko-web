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
  /**
   * Hasil hitungan server (rework SKD/TKA): skor poin CAT untuk SKD
   * (benar ×5 untuk TWK/TIU, jumlah bobot untuk TKP), normalisasi 0–100 untuk
   * TKA. 0 pada attempt lama/kategori yang tidak dinilai server.
   */
  score: number
  maxScore: number
  /** Ambang batas subtes; absen saat perbandingannya tidak berlaku. */
  passingGrade?: number
  /** Memenuhi/Tidak Memenuhi terhadap passingGrade; absen bersama passingGrade. */
  passed?: boolean
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
  /**
   * Batas atas `score` saat server menghitung ulang hasil (550 simulasi SKD,
   * 100 per mapel TKA); 0 untuk attempt yang tidak dinilai server.
   */
  maxScore: number
  /** Verdict keseluruhan simulasi SKD (semua subtes memenuhi ambang); absen saat tidak berlaku. */
  passed?: boolean
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
 * One section tally as POSTED with a finished sitting — only what the client
 * counts (correct/total). The scored fields on AttemptSection (score,
 * maxScore, passingGrade, passed) are computed by the server and never sent
 * up: since the SKD/TKA rework the server recomputes everything it displays
 * from its own review snapshot anyway.
 */
export interface RecordAttemptSection {
  title: string
  correct: number
  total: number
}

/**
 * Body of POST /me/packages/:slug/attempts.
 *
 * `answers` is the part that matters: zenko-api judges each one against its own
 * copy of the product (never trusting a client-claimed correctness), stores
 * that as the attempt's review snapshot — see TryoutAttemptReview in
 * shared/types/tryout — and computes the score from it.
 *
 * `score` and `sections` are wire compatibility only. The server recomputes
 * both and overwrites whatever arrives here; the room cannot compute them
 * honestly any more either, since the blueprint it works from carries no
 * answer key. `finishedAt` is likewise ignored — the server stamps its own
 * clock, because a submission that could name its own finish time could name
 * one inside a deadline it had already passed.
 *
 * `sittingId` is the handle POST /tryout/start issued. It names the clock this
 * run was worked under, and it can be spent exactly once.
 */
export interface RecordAttemptRequest {
  score: number
  sections: RecordAttemptSection[]
  sittingId?: string
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

/**
 * How an order is meant to be paid.
 *
 * The buyer picks between whatever GET /payments/methods says this deployment
 * can offer; the server still validates the choice and derives every amount
 * itself, so picking a channel changes how an order is paid and never how much
 * it costs.
 *
 * - `doku_qris`: a per-order QRIS code from DOKU, carried in `qrUrl` and
 *   valid until `expiresAt`; the server settles it from DOKU's record. An
 *   expired code is replaced in place on the same order rather than
 *   forcing a new one, so `qrUrl`/`expiresAt` can change under a purchase
 *   already on screen.
 * - `manual_qris`: transfer to Zenko's static QRIS poster, verified by an
 *   admin.
 *
 * `ipaymu_qris` is a retired gateway: no route creates it any more, but
 * older orders still carry it in `paymentChannel` and must keep rendering.
 * Treat anything unknown the same way — as "not manual, not doku" — rather
 * than matching it as if it were live. See paymentChannelCopy.
 */
export type PaymentChannel = 'doku_qris' | 'ipaymu_qris' | 'manual_qris'

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
  /** iPaymu's raw QRIS payload for this order, rendered into a scannable
   * code client-side (see payment.vue); null when no charge was created.
   * Always null on the manual channel — one static poster serves every
   * buyer, so there is no per-order code. */
  qrUrl: string | null
  /** Unix seconds the payment window closes; null when there is no deadline. */
  expiresAt: number | null
  /** iPaymu's transaction id for the pending charge (captured at QR
   * creation, like qrUrl/expiresAt) — distinct from `reference`, which stays
   * null until payment settles. Null if no charge was created. */
  chargeReference: string | null
  status: OrderStatus
  items: PurchaseItem[]
  /** Biaya layanan penyedia pembayaran, ditagihkan apa adanya. */
  serviceFee: number
  /** Which payment path this order took — see PaymentChannel. */
  paymentChannel: PaymentChannel
  /**
   * Tiga digit yang ditambahkan ke nominal yang harus dibayar, supaya dua
   * pesanan untuk paket yang sama tidak pernah meminta angka yang persis sama.
   *
   * Di jalur manual angka inilah satu-satunya pegangan admin untuk mencocokkan
   * mutasi bank dengan pesanan — tidak ada bukti transfer yang diunggah. Di
   * jalur iPaymu nilainya 0: QRIS dinamis membawa nominalnya sendiri dan
   * pembeli membayar persis harga paket.
   *
   * Bukan bagian dari harga: bagi hasil tutor tetap dihitung dari harga item.
   * 0 pada pesanan gratis.
   */
  uniqueCode: number
  /** Bukti transfer terbaru pada pesanan ini; null kalau belum pernah unggah. */
  paymentProof: PaymentProofBrief | null
}
