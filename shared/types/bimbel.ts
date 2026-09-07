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

export type AssignmentTargetKind = 'all' | 'class' | 'member'
export type AssignmentStatus = 'draft' | 'scheduled' | 'closed'
export type AssignmentPhase = 'draft' | 'scheduled' | 'ongoing' | 'closed'
export type AssignmentReviewPolicy = 'immediate' | 'after_close' | 'manual'

export interface BimbelAssignment {
  id: string
  bimbelId: string
  productId: string
  packageSlug: string
  title: string
  targetKind: AssignmentTargetKind
  targetIds?: string[]
  opensAt: number
  closesAt: number
  maxAttempts: number
  reviewPolicy: AssignmentReviewPolicy
  status: AssignmentStatus
  phase: AssignmentPhase
  createdBy: string
  createdAt: number
}

export interface AssignmentInput {
  productId: string
  title: string
  targetKind: AssignmentTargetKind
  targetIds: string[]
  opensAt: number
  closesAt: number
  maxAttempts: number
  reviewPolicy: AssignmentReviewPolicy
}

export interface StudentAssignment {
  id: string
  bimbelId: string
  bimbelName: string
  title: string
  packageSlug: string
  opensAt: number
  closesAt: number
  maxAttempts: number
  attemptsUsed: number
  phase: 'scheduled' | 'ongoing' | 'closed'
  canStart: boolean
  reviewOpen: boolean
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

export interface AssignmentResult {
  accountId: string
  name: string
  status: 'belum' | 'selesai'
  attemptId?: string
  attemptsUsed: number
  score: number
  rank: number
  finishedAt?: number
}

export interface AssignmentResults {
  assignment: BimbelAssignment
  summary: { assigned: number, submitted: number, average: number, highest: number, lowest: number }
  results: AssignmentResult[]
}
