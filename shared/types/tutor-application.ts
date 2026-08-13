/**
 * Become-a-tutor submissions, mirroring
 * zenko-api/internal/model/tutor_application.go.
 */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface TutorApplication {
  id: string
  /** The account that applied — the same value as User.id, not the email. */
  accountId: string
  name: string
  email: string
  whatsapp: string
  expertise: string
  experience: string
  /** Optional: null when the applicant left the field blank. */
  portfolioUrl: string | null
  status: ApplicationStatus
  /** Unix seconds. */
  submittedAt: number
}

/**
 * Wire shape posted by the form. No name or email: the server reads those from
 * the session, so an applicant cannot submit someone else's identity.
 */
export interface TutorApplicationDraft {
  whatsapp: string
  expertise: string
  experience: string
  portfolioUrl: string | null
}
