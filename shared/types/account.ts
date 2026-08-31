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
 * Body of POST /me/packages/:slug/attempts. `finishedAt` is optional — the
 * server stamps its own clock when it is omitted. `answers` is what feeds
 * "Lihat pembahasan" later: zenko-api judges each one against its own copy
 * of the product (never trusting a client-claimed correctness) and stores
 * the result as the attempt's review snapshot — see TryoutAttemptReview in
 * shared/types/tryout. Optional so a sitting that could not build a full
 * answer map still gets its aggregate score saved. For SKD/TKA products the
 * aggregate numbers here are accepted for wire compatibility but overwritten
 * by the server's own recomputation.
 */
export interface RecordAttemptRequest {
  score: number
  sections: RecordAttemptSection[]
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
 */
export type OrderStatus = 'pending' | 'paid' | 'expired'

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
   * client-side (see payment.vue); null once the charge was never created. */
  qrUrl: string | null
  /** Unix seconds the QRIS code stops being payable; null alongside qrUrl. */
  expiresAt: number | null
  status: OrderStatus
  items: PurchaseItem[]
  /** Biaya layanan penyedia pembayaran, ditagihkan apa adanya. */
  serviceFee: number
}
