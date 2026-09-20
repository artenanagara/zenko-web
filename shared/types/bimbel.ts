import type { PaymentProofStatus } from './account'

export type BimbelRole = 'owner' | 'admin' | 'teacher' | 'student'
export type BimbelStatus = 'trial' | 'active' | 'grace' | 'suspended'
/**
 * `pending` dan `invited` sama-sama berarti "belum masuk", tapi menunggu pihak
 * yang berlawanan: `pending` menunggu bimbel menjawab permintaan bergabung,
 * `invited` menunggu akun menjawab undangan. Dipisah karena satu nilai membuat
 * kedua sisi tidak bisa menampilkan daftar hal-yang-harus-dijawab.
 */
export type BimbelMemberStatus = 'pending' | 'invited' | 'active' | 'suspended' | 'left'

export interface BimbelMembership {
  bimbelId: string
  bimbelName: string
  bimbelSlug: string
  logoUrl?: string
  role: BimbelRole
  status: BimbelMemberStatus
  bimbelStatus: BimbelStatus
  joinedAt: number
}

/** Balasan atas undangan — status akhirnya `active` (diterima) atau `left` (ditolak). */
export interface InvitationAnswer {
  bimbelId: string
  bimbelName: string
  role: BimbelRole
  status: BimbelMemberStatus
}

export interface OwnershipTransfer {
  owner: BimbelMember
  previousOwner: BimbelMember
}

export interface Bimbel {
  id: string
  slug: string
  name: string
  city?: string
  description?: string
  logoUrl?: string
  joinCode?: string
  seatQuota: number
  /** Tingkat langganan yang sedang berjalan, selalu dikirim API. */
  plan: BimbelPlan
  status: BimbelStatus
  activeUntil: number
  createdAt: number
  seatsUsed: number
  /** Kursi tambahan dari tagihan yang belum diverifikasi; belum menambah kuota. */
  pendingSeatAddonSeats: number
  /** Saat ada bukti transfer yang menunggu verifikasi, status tidak boleh turun. */
  verificationHoldUntil?: number
}

export interface BimbelMember {
  bimbelId: string
  accountId: string
  email: string
  name: string
  role: BimbelRole
  status: BimbelMemberStatus
  joinedAt: number
  activatedAt?: number
}

/** GET /admin/bimbels/:id — roster dan bank paket untuk pemeriksaan admin. */
export interface AdminBimbelDetail extends Bimbel {
  members: BimbelMember[]
  products: BimbelProductSummary[]
}

export interface BimbelProductSummary {
  id: string
  title: string
  slug: string
  category: string
  price: number
  status: 'draft' | 'review' | 'live' | 'rejected' | 'archived'
  questionCount: number
  questionTarget: number
  updatedAt: number
}

export interface BimbelClass {
  id: string
  bimbelId: string
  name: string
  createdAt: number
  memberCount: number
  memberIds?: string[]
}

/**
 * Satu paket yang terbuka bagi siswa lewat keanggotaan bimbel — bukan lewat
 * pembelian. Aksesnya berlaku selama keanggotaannya aktif, jadi tidak ada
 * jadwal, batas percobaan, maupun fase yang perlu diikutkan di sini.
 */
export interface BimbelStudentPackage {
  bimbelId: string
  bimbelName: string
  productId: string
  packageSlug: string
  title: string
  category: string
  attemptsUsed: number
  /** `-1` berarti paket ini belum pernah dikerjakan. */
  bestScore: number
}

export interface BimbelApplication {
  id: string
  bimbelName: string
  contactName: string
  email: string
  whatsapp?: string
  city?: string
  studentCount?: number
  studentCountBand?: BimbelStudentCountBand
  about?: string
  /** Snapshot persetujuan syarat yang disimpan API untuk audit. */
  termsAcceptedAt?: number
  termsVersion?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  bimbelId?: string
  submittedAt: number
  decidedAt?: number
}

/**
 * Tingkat langganan bimbel — bukan "paket", yang di Zenko sudah berarti produk
 * tryout (lihat docs/konsep-bimbel-agency.md §1.2).
 */
export type BimbelPlan = 'dasar' | 'pro' | 'institusi'
export type BimbelStudentCountBand = '<25' | '25-50' | '51-150' | '>150'
export type BimbelOrderKind = 'subscription' | 'seat_addon'

/**
 * Satu tingkat seperti dikirim `GET /bimbel/:id/billing/plans`.
 *
 * `teacherLimit` dan `productLimit` memakai `0` untuk "tak terbatas", bukan
 * `null`. Karena itu keduanya tidak boleh dicetak apa adanya — `bimbelLimitLabel`
 * yang menerjemahkannya, supaya "0 pengajar" tidak pernah muncul di layar.
 */
export interface BimbelPlanOption {
  plan: BimbelPlan
  name: string
  pricePerMonth: number
  /**
   * Harga satu tahun masa aktif, sudah memakai aturan "12 bulan ditagih 10"
   * dari server — kartu tinggal memilih angka ini saat toggle di Tahunan.
   */
  pricePerYear: number
  includedSeats: number
  teacherLimit: number
  productLimit: number
  /** Porsi penjualan marketplace yang menjadi hak bimbel pada tingkat ini. */
  marketplaceSharePercent: 70 | 75 | 80
}

/**
 * Jawaban `GET /bimbel/:id/billing/quote?plan=&seats=&months=`.
 *
 * Semua angka uang di halaman langganan datang dari sini apa adanya. Klien
 * tidak boleh menurunkan ulang satu pun — termasuk diskon tahunan, yang
 * terbaca dari selisih `months` dan `billedMonths`.
 */
export interface BimbelSubscriptionQuote {
  kind: 'subscription'
  plan: BimbelPlan
  planName: string
  /** Harga tingkat per bulan, sebelum kursi tambahan. */
  planPrice: number
  includedSeats: number
  seatQuota: number
  /** Kursi di atas `includedSeats`; 0 saat kuota masih di dalam tingkat. */
  extraSeats: number
  extraSeatPrice: number
  extraSeatsAmount: number
  months: number
  /**
   * Bulan yang benar-benar ditagih. Lebih kecil dari `months` saat diskon
   * tahunan berlaku — inilah satu-satunya sumber angka hematnya.
   */
  billedMonths: number
  monthlyAmount: number
  amount: number
  /**
   * Aturan bentuk isian, ikut dikirim supaya kontrol kursi bisa membatasi diri
   * tanpa permintaan kedua. Tidak ada satu pun yang boleh dihardcode di klien.
   */
  minSeatQuota: number
  seatQuotaStep: number
  maxSeatQuota: number
  maxMonths: number
  /** Siswa aktif hari ini; kuota tidak boleh turun di bawah angka ini. */
  seatsUsed: number
}

/** Quote penambahan kursi untuk sisa periode aktif; seluruh harga milik server. */
export interface BimbelSeatAddonQuote {
  kind: 'seat_addon'
  additionalSeats: number
  currentSeatQuota: number
  resultingSeatQuota: number
  remainingMonths: number
  activeUntil: number
  extraSeatPrice: number
  monthlyAmount: number
  seatQuotaStep: number
  maxSeatQuota: number
  amount: number
  canPurchase: boolean
  renewalRequired: boolean
}

export type BimbelQuote = BimbelSubscriptionQuote | BimbelSeatAddonQuote

/**
 * `verifying` punya bukti transfer di antrean admin. `expired` sengaja dipisah
 * dari `cancelled`: yang satu lewat waktunya, yang lain ditinggalkan atau
 * digantikan, dan bimbel berhak tahu bedanya.
 */
export type BimbelOrderStatus = 'pending' | 'verifying' | 'paid' | 'cancelled' | 'expired'

/**
 * Bukti transfer terbaru pada satu tagihan langganan, sebatas yang boleh
 * dilihat bimbelnya sendiri: cukup untuk menampilkan "menunggu verifikasi" dan,
 * kalau ditolak, alasannya.
 *
 * `hasImage` membedakan "tidak melampirkan" dari "lampirannya gagal dimuat".
 */
export interface BimbelProofBrief {
  status: PaymentProofStatus
  /** Unix detik bukti diunggah. */
  submittedAt: number
  /** Kosong kecuali status `rejected`; inilah yang harus diperbaiki. */
  rejectReason: string
  hasImage: boolean
}

/**
 * Jawaban `GET /bimbel/:id/billing/orders/:orderId/payment` — layar pembayaran:
 * ke siapa mentransfer, berapa persisnya, dan sampai kapan.
 *
 * `amount` adalah angka milik tagihannya sendiri, digemakan di sini supaya
 * layar pembayaran tidak pernah menghitung ulang harga yang sudah ditetapkan.
 */
export interface BimbelPaymentInstructions {
  invoice: string
  amount: number
  status: BimbelOrderStatus
  kind: BimbelOrderKind
  /** Unix detik tagihan hangus; absen kalau tidak bertenggat. */
  expiresAt?: number
  plan: BimbelPlan
  seatQuota: number
  months: number
  additionalSeats?: number
  merchantName: string
  nmid: string
  proof?: BimbelProofBrief
}

interface BimbelOrderBase {
  id: string
  bimbelId: string
  bimbelName?: string
  invoice: string
  kind: BimbelOrderKind
  /**
   * `plan` dan `includedSeats` memotret tingkat yang menjadi dasar harga
   * tagihan ini, jadi perubahan tabel tingkat nanti tidak bisa menulis ulang
   * apa yang sudah disepakati. Sekaligus yang membuat riwayat tagihan bisa
   * menyebut tingkatnya, bukan kursinya saja.
   */
  amount: number
  status: BimbelOrderStatus
  /** Unix detik tagihan hangus; absen pada tagihan tanpa tenggat. */
  expiresAt?: number
  createdAt: number
  paidAt?: number
  /** Bukti transfer terbaru pada tagihan ini; absen kalau belum pernah diunggah. */
  proof?: BimbelProofBrief
  /**
   * Alasan tagihan ini diaktifkan tanpa bukti transfer di sistem, dan sekaligus
   * penandanya: tagihan yang lewat antrean verifikasi selalu mengosongkannya.
   * Ada isinya berarti periode berbayar diberikan atas keterangan admin, bukan
   * atas transfer yang terekam — itulah baris yang perlu ditemukan lagi saat
   * ada yang mempertanyakan langganan.
   */
  activationNote?: string
  /** Admin yang mengaktifkannya, untuk jejak yang sama. */
  activatedByName?: string
  /** Kapan terakhir ditagih, dan sudah berapa kali. Nol berarti belum pernah. */
  remindedAt?: number
  reminderCount?: number
  /**
   * Masa aktif organisasinya, ikut dikirim supaya daftar tagihan bisa
   * mengurutkan menurut yang benar-benar dipertaruhkan: tagihan menunggu dari
   * bimbel yang aksesnya sudah berhenti berbeda persoalan dari tagihan seumur
   * sama dari bimbel yang masih punya dua bulan. Dikirim sebagai waktu, bukan
   * status, karena status diturunkan malas dan bisa tertinggal satu pembacaan.
   */
  bimbelActiveUntil?: number
}

export interface BimbelSubscriptionOrder extends BimbelOrderBase {
  kind: 'subscription'
  plan: BimbelPlan
  includedSeats: number
  /** Kuota yang diteruskan server ke periode berikutnya. */
  seatQuota?: number
  months: number
}

export interface BimbelSeatAddonOrder extends BimbelOrderBase {
  kind: 'seat_addon'
  additionalSeats: number
  /** Snapshot opsional untuk surface admin lama; bukan input transaksi. */
  plan?: BimbelPlan
  includedSeats?: number
  seatQuota?: number
  months?: number
}

export type BimbelOrder = BimbelSubscriptionOrder | BimbelSeatAddonOrder

/**
 * Satu baris antrean verifikasi pembayaran langganan bimbel
 * (`GET /admin/bimbel-payment-proofs?status=`).
 *
 * Datar, bukan `{ proof: {...} }`: `model.AdminBimbelPaymentProof` MENYERAP
 * `BimbelPaymentProof`, jadi field buktinya ikut terserialisasi di level atas
 * bersama konteks tagihannya.
 *
 * `senderName`, `paidAmount`, dan `transferredAt` adalah klaim pembayar, bukan
 * bukti. Yang dicocokkan admin adalah `amountDue` dengan mutasi merchant; tidak
 * ada jalur server yang melunasi tagihan dari angka yang diketik pembayar.
 */
export interface AdminBimbelPaymentProof {
  id: string
  status: PaymentProofStatus
  hasImage: boolean
  senderName: string
  paidAmount: number
  /** Unix detik menurut pembayar; absen kalau dikosongkan. */
  transferredAt?: number
  note: string
  /** Unix detik; ada setelah admin memutuskan. */
  reviewedAt?: number
  rejectReason: string
  /** Unix detik bukti diunggah. */
  createdAt: number

  invoice: string
  bimbelId: string
  bimbelName: string
  plan: BimbelPlan
  kind: BimbelOrderKind
  seatQuota: number
  additionalSeats?: number
  months: number
  /** Nominal yang seharusnya ditransfer. */
  amountDue: number
  orderStatus: BimbelOrderStatus
  /** Unix detik tagihan dibuat. */
  orderDate: number
}

/**
 * `POST /admin/bimbel-payment-proofs/:id/decision` — `reason` wajib saat
 * reject, dan itulah yang sampai ke bimbel sebagai alasan di layar pembayaran.
 */
export interface BimbelProofDecisionRequest {
  action: 'approve' | 'reject'
  reason?: string
}

export interface BimbelProductResultRow {
  accountId: string
  name: string
  attemptsUsed: number
  score: number
  rank: number
  finishedAt: number
}

/**
 * Rekap satu paket lintas anggota bimbel.
 *
 * `rows` hanya berisi anggota yang pernah mengerjakan. Tanpa daftar sasaran
 * tidak ada himpunan "seharusnya mengerjakan", jadi "siapa yang belum" memang
 * tidak dapat diturunkan — dan tidak boleh dikarang di UI.
 */
export interface BimbelProductResults {
  summary: { attempted: number, average: number, highest: number, lowest: number }
  rows: BimbelProductResultRow[]
}
