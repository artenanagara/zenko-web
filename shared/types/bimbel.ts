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
  status: BimbelStatus
  activeUntil: number
  createdAt: number
  seatsUsed: number
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
  whatsapp: string
  city?: string
  studentCount: number
  about: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  bimbelId?: string
  submittedAt: number
  decidedAt?: number
}

export interface BimbelQuote {
  seatPricePerMonth: number
  minSeatQuota: number
  seatQuotaStep: number
  maxSeatQuota: number
  maxMonths: number
  seatQuota?: number
  months?: number
  amount?: number
  seatsUsed: number
}

export interface BimbelOrder {
  id: string
  bimbelId: string
  bimbelName?: string
  invoice: string
  kind: string
  seatQuota: number
  months: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: number
  paidAt?: number
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
