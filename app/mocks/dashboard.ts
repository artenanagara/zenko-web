import type { TutorApplication } from '#shared/types/tutor-application'

/**
 * Sample content for the admin dashboard.
 *
 * None of this comes from the API. The tutor dashboard and the admin
 * moderation/payout queues now read real endpoints; what is left here are the
 * platform-wide totals (students, tutors) that zenko-api has no endpoint for
 * yet, plus the fixture applications used when NUXT_PUBLIC_USE_MOCK is on.
 *
 * Delete a block the moment its real endpoint lands.
 */

export interface AdminOverview {
  totalStudents: string
  totalTutors: string
}

export const adminOverview: AdminOverview = {
  totalStudents: '1.284',
  totalTutors: '48',
}

/** Same shape as the API's TutorApplication, so swapping to live data is a one-line change. */
export const adminApplications: TutorApplication[] = [
  {
    id: 'a1',
    accountId: 'acc_a1',
    name: 'Rina Kartika',
    email: 'rina.kartika@example.com',
    whatsapp: '081234567890',
    expertise: 'SNBT',
    experience: 'Mengajar bimbel SNBT selama tiga tahun, fokus di literasi.',
    portfolioUrl: 'https://instagram.com/rina.belajar',
    status: 'pending',
    submittedAt: 1_786_406_400,
  },
  {
    id: 'a2',
    accountId: 'acc_a2',
    name: 'Bagus Nugroho',
    email: 'bagus.n@example.com',
    whatsapp: '081298765432',
    expertise: 'SKD / CPNS',
    experience: 'Lulus seleksi CPNS 2023, menyusun bank soal TWK dan TIU.',
    portfolioUrl: null,
    status: 'pending',
    submittedAt: 1_786_320_000,
  },
  {
    id: 'a3',
    accountId: 'acc_a3',
    name: 'Siti Aminah',
    email: 'siti.aminah@example.com',
    whatsapp: '085711223344',
    expertise: 'BUMN',
    experience: 'Trainer persiapan rekrutmen BUMN sejak 2021.',
    portfolioUrl: 'https://linkedin.com/in/sitiaminah',
    status: 'approved',
    submittedAt: 1_786_147_200,
  },
]
