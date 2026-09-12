/**
 * Jadwal bagi hasil tutor. JSON camelCase dan seluruh waktu berupa Unix
 * seconds UTC. `percent: null` pada jadwal berarti kembali ke tarif standar.
 */

export interface TutorSharePoint {
  id: string
  changeId: string
  startsAt: number
  percent: number | null
  createdAt: number
  supersededAt?: number
}

export interface TutorShareChange {
  id: string
  percent: number | null
  startsAt: number
  endsAt?: number | null
  /** Hanya ada pada respons pemilik. */
  internalReason?: string
  noteForTutor: string
  /** Hanya ada pada respons pemilik. */
  createdBy?: string
  createdAt: number
  baseVersion: number
  resultingVersion: number
  cancelledAt?: number
}

export interface TutorShareNotification {
  id: string
  changeId: string
  channel: 'dashboard' | 'email'
  content: string
  queuedAt: number
  publishedAt?: number
  sentAt?: number
  failedAt?: number
  attemptCount: number
}

export interface TutorShareNextChange {
  startsAt: number
  effectivePercent: number
}

export interface TutorShareView {
  serverTime: number
  scheduleVersion: number
  effectivePercent: number
  effectiveSince?: number
  nextChange: TutorShareNextChange | null
  notificationStatus: string
  schedule?: TutorSharePoint[]
  changeHistory: TutorShareChange[]
  notifications?: TutorShareNotification[]
  /** Versi aktif yang harus diterima tutor sebelum jadwal pertama dibuat. */
  termsVersion: string
  /** False berarti UI perlu meminta persetujuan eksplisit. */
  termsAccepted: boolean
}

export interface TutorShareMutationInput {
  percent: number | null
  startsAt: number
  endsAt?: number | null
  internalReason: string
  noteForTutor: string
}

export interface TutorSharePreview {
  serverTime: number
  scheduleVersion: number
  current: TutorShareView
  proposed: TutorShareMutationInput
  valid: boolean
  earliestDecreaseAt: number
  violationAt: number | null
  proposedTimeline: Array<{ startsAt: number, effectivePercent: number }>
  example: { price: number, tutorShare: number, zenkoShare: number }
}

export interface TutorShareCancelInput {
  internalReason: string
  noteForTutor: string
}

export interface TutorTermsAcceptanceInput {
  termsVersion: string
  accepted: true
}
