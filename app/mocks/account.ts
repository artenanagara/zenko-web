/**
 * Sample content for the account area (/akun).
 *
 * These are the fixtures the account composables fall back to when
 * NUXT_PUBLIC_USE_MOCK is on, so the UI can be built without a Postgres-backed
 * zenko-api running. With the flag off, the same composables call the real
 * /me and /me/purchases endpoints instead.
 *
 * The shapes live in #shared/types/account now — this file only supplies data
 * that satisfies them. Slugs, titles, and prices match app/mocks/catalog.ts on
 * purpose, so a card here links to a package that actually exists.
 */

import type { OwnedPackage, Purchase } from '#shared/types/account'

const thumb = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=700&q=80`

export const ownedPackages: OwnedPackage[] = [
  {
    slug: 'cpns-2026-intensif',
    title: 'Latihan CPNS 2026 Intensif SKD & SKB',
    category: 'SKD/CPNS',
    thumbnailUrl: thumb('photo-1522202176988-66273c2fd55f'),
    tutorName: 'Budi Santoso',
    questionCount: 120,
    durationMinutes: 100,
    purchasedAt: 1_783_054_800,
    invoice: 'ZK-2026-0703',
    attempts: [
      {
        id: 'cpns-3',
        number: 3,
        finishedAt: 1_786_510_800,
        score: 412,
        rank: '128 dari 3.402',
        sections: [
          { title: 'Tes Wawasan Kebangsaan', correct: 27, total: 35 },
          { title: 'Tes Intelegensi Umum', correct: 31, total: 40 },
          { title: 'Tes Karakteristik Pribadi', correct: 34, total: 45 },
        ],
      },
      {
        id: 'cpns-2',
        number: 2,
        finishedAt: 1_785_906_000,
        score: 374,
        rank: '486 dari 3.402',
        sections: [
          { title: 'Tes Wawasan Kebangsaan', correct: 24, total: 35 },
          { title: 'Tes Intelegensi Umum', correct: 28, total: 40 },
          { title: 'Tes Karakteristik Pribadi', correct: 32, total: 45 },
        ],
      },
      {
        id: 'cpns-1',
        number: 1,
        finishedAt: 1_785_214_800,
        score: 358,
        rank: '742 dari 3.402',
        sections: [
          { title: 'Tes Wawasan Kebangsaan', correct: 22, total: 35 },
          { title: 'Tes Intelegensi Umum', correct: 26, total: 40 },
          { title: 'Tes Karakteristik Pribadi', correct: 31, total: 45 },
        ],
      },
    ],
  },
  {
    slug: 'prediksi-bumn-2026',
    title: 'Prediksi BUMN 2026 Profesional',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1523240795612-9a054b0db644'),
    tutorName: 'Mira Azzahra',
    questionCount: 90,
    durationMinutes: 75,
    purchasedAt: 1_785_301_200,
    invoice: 'ZK-2026-0729',
    attempts: [
      {
        id: 'bumn-1',
        number: 1,
        finishedAt: 1_785_301_200,
        score: 368,
        rank: '212 dari 1.845',
        sections: [
          { title: 'Tes Kemampuan Dasar', correct: 29, total: 40 },
          { title: 'Core Values AKHLAK', correct: 21, total: 30 },
          { title: 'Bahasa Inggris', correct: 12, total: 20 },
        ],
      },
    ],
  },
  {
    slug: 'snbt-master-class-2026',
    title: 'SNBT Master Class 2026',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1516321318423-f06f85e504b3'),
    tutorName: 'Dimas Prasetya',
    questionCount: 150,
    durationMinutes: 195,
    purchasedAt: 1_786_510_800,
    invoice: 'ZK-2026-0812',
    attempts: [],
  },
]

export const purchases: Purchase[] = [
  {
    invoice: 'ZK-2026-0812',
    date: 1_786_510_800,
    paidAt: 1_786_519_320,
    method: 'QRIS',
    reference: 'QR-88213004',
    qrUrl: null,
    expiresAt: null,
    status: 'paid',
    items: [
      {
        slug: 'snbt-master-class-2026',
        title: 'SNBT Master Class 2026',
        category: 'SNBT',
        priceOriginal: 279_000,
        price: 219_000,
      },
    ],
    serviceFee: 2_500,
  },
  {
    invoice: 'ZK-2026-0729',
    date: 1_785_301_200,
    paidAt: 1_785_290_700,
    method: 'BCA Virtual Account',
    reference: 'VA-3901288471',
    qrUrl: null,
    expiresAt: null,
    status: 'paid',
    items: [
      {
        slug: 'prediksi-bumn-2026',
        title: 'Prediksi BUMN 2026 Profesional',
        category: 'BUMN',
        priceOriginal: 199_000,
        price: 149_000,
      },
    ],
    serviceFee: 4_000,
  },
  {
    invoice: 'ZK-2026-0703',
    date: 1_783_054_800,
    paidAt: 1_783_086_060,
    method: 'GoPay',
    reference: 'GP-77120553',
    qrUrl: null,
    expiresAt: null,
    status: 'paid',
    items: [
      {
        slug: 'cpns-2026-intensif',
        title: 'Latihan CPNS 2026 Intensif SKD & SKB',
        category: 'SKD/CPNS',
        priceOriginal: 249_000,
        price: 189_000,
      },
    ],
    serviceFee: 2_500,
  },
  {
    invoice: 'ZK-2026-0621',
    date: 1_782_018_000,
    paidAt: null,
    method: 'BCA Virtual Account',
    reference: null,
    qrUrl: null,
    expiresAt: null,
    // Expired, so the package never appears under "Paket saya" — keeping
    // failed transactions is what explains an absence.
    status: 'expired',
    items: [
      {
        slug: 'tka-saintek-full-simulasi',
        title: 'TKA Saintek Full Simulasi',
        category: 'TKA',
        priceOriginal: 229_000,
        price: 179_000,
      },
    ],
    serviceFee: 4_000,
  },
]
