import type { Package, SortKey, Testimonial } from '#shared/types/catalog'

/**
 * Local fixtures used when NUXT_PUBLIC_USE_MOCK=true, so the UI can be worked
 * on without zenko-api running.
 *
 * Mirrors zenko-api/internal/store/seed.go — update both together.
 */

/** Package plus the ranking fields the API keeps server-side (json:"-"). */
export interface MockPackage extends Package {
  soldCount: number
  /** Unix seconds, newest first when sorting by `newest`. */
  publishedAt: number
  featured: boolean
}

const thumb = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=700&q=80`

const avatar = (id: number) => `https://i.pravatar.cc/80?img=${id}`

export const mockPackages: MockPackage[] = [
  {
    id: 'pkg_01',
    slug: 'cpns-2026-intensif',
    title: 'Latihan CPNS 2026 Intensif SKD & SKB',
    category: 'SKD/CPNS',
    thumbnailUrl: thumb('photo-1522202176988-66273c2fd55f'),
    author: { name: 'Budi Santoso', avatarUrl: avatar(12) },
    rating: 4.9,
    soldLabel: '2.1rb',
    price: 189_000,
    priceOriginal: 249_000,
    soldCount: 2100,
    publishedAt: 1754870400,
    featured: true,
  },
  {
    id: 'pkg_02',
    slug: 'prediksi-bumn-2026',
    title: 'Prediksi BUMN 2026 Profesional',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1523240795612-9a054b0db644'),
    author: { name: 'Mira Azzahra', avatarUrl: avatar(32) },
    rating: 4.8,
    soldLabel: '1.8rb',
    price: 149_000,
    priceOriginal: 199_000,
    soldCount: 1800,
    publishedAt: 1754784000,
    featured: true,
  },
  {
    id: 'pkg_03',
    slug: 'snbt-master-class-2026',
    title: 'SNBT Master Class 2026',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1516321318423-f06f85e504b3'),
    author: { name: 'Dimas Prasetya', avatarUrl: avatar(15) },
    rating: 4.7,
    soldLabel: '1.2rb',
    price: 219_000,
    priceOriginal: 279_000,
    soldCount: 1200,
    publishedAt: 1754697600,
    featured: true,
  },
  {
    id: 'pkg_04',
    slug: 'tka-saintek-full-simulasi',
    title: 'TKA Saintek Full Simulasi',
    category: 'TKA',
    thumbnailUrl: thumb('photo-1434030216411-0b793f4b4173'),
    author: { name: 'Rani Kusuma', avatarUrl: avatar(45) },
    rating: 4.9,
    soldLabel: '980',
    price: 179_000,
    priceOriginal: 229_000,
    soldCount: 980,
    publishedAt: 1754611200,
    featured: true,
  },
  {
    id: 'pkg_05',
    slug: 'paket-hemat-skd-kedinasan',
    title: 'Paket Hemat SKD Kedinasan',
    category: 'Kedinasan',
    thumbnailUrl: thumb('photo-1509062522246-3755977927d7'),
    author: { name: 'Agus Wijaya', avatarUrl: avatar(51) },
    rating: 4.6,
    soldLabel: '3.4rb',
    price: 99_000,
    priceOriginal: 149_000,
    soldCount: 3400,
    publishedAt: 1754524800,
    featured: false,
  },
  {
    id: 'pkg_06',
    slug: 'twk-lengkap',
    title: 'Tes Wawasan Kebangsaan Lengkap',
    category: 'SKD/CPNS',
    thumbnailUrl: thumb('photo-1427504494785-3a9ca7044f45'),
    author: { name: 'Sinta Dewi', avatarUrl: avatar(20) },
    rating: 4.8,
    soldLabel: '1.5rb',
    price: 129_000,
    priceOriginal: 169_000,
    soldCount: 1500,
    publishedAt: 1754438400,
    featured: false,
  },
  {
    id: 'pkg_07',
    slug: 'akhlak-bumn-core-values',
    title: 'AKHLAK BUMN & Core Values',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1456513080510-7bf3a84b82f8'),
    author: { name: 'Rizky Ananda', avatarUrl: avatar(60) },
    rating: 4.7,
    soldLabel: '760',
    price: 119_000,
    priceOriginal: 159_000,
    soldCount: 760,
    publishedAt: 1754352000,
    featured: false,
  },
  {
    id: 'pkg_08',
    slug: 'literasi-bahasa-inggris-snbt',
    title: 'Literasi Bahasa Inggris SNBT',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1497633762265-9d179a990aa6'),
    author: { name: 'Putri Maharani', avatarUrl: avatar(5) },
    rating: 4.9,
    soldLabel: '1.1rb',
    price: 139_000,
    priceOriginal: 189_000,
    soldCount: 1100,
    publishedAt: 1754265600,
    featured: false,
  },
  {
    id: 'pkg_09',
    slug: 'penalaran-matematika-intensif',
    title: 'Penalaran Matematika Intensif',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1491841550275-ad7854e35ca6'),
    author: { name: 'Hendra Gunawan', avatarUrl: avatar(68) },
    rating: 4.6,
    soldLabel: '640',
    price: 159_000,
    priceOriginal: 199_000,
    soldCount: 640,
    publishedAt: 1754179200,
    featured: false,
  },
  {
    id: 'pkg_10',
    slug: 'simulasi-cat-skb-guru',
    title: 'Simulasi CAT SKB Guru',
    category: 'SKB',
    thumbnailUrl: thumb('photo-1503676260728-1c00da094a0b'),
    author: { name: 'Nadia Salsabila', avatarUrl: avatar(25) },
    rating: 4.8,
    soldLabel: '890',
    price: 199_000,
    priceOriginal: 259_000,
    soldCount: 890,
    publishedAt: 1754092800,
    featured: false,
  },
  {
    id: 'pkg_11',
    slug: 'psikotes-tkd-bumn',
    title: 'Psikotes & TKD BUMN Lengkap',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1454165804606-c3d57bc86b40'),
    author: { name: 'Fajar Ramadhan', avatarUrl: avatar(33) },
    rating: 4.7,
    soldLabel: '1.3rb',
    price: 109_000,
    priceOriginal: 149_000,
    soldCount: 1300,
    publishedAt: 1754006400,
    featured: false,
  },
  {
    id: 'pkg_12',
    slug: 'tka-soshum-prediksi-2026',
    title: 'TKA Soshum Prediksi 2026',
    category: 'TKA',
    thumbnailUrl: thumb('photo-1513258496099-48168024aec0'),
    author: { name: 'Laras Ayu', avatarUrl: avatar(47) },
    rating: 4.8,
    soldLabel: '520',
    price: 169_000,
    priceOriginal: 219_000,
    soldCount: 520,
    publishedAt: 1753920000,
    featured: false,
  },
]

export const mockTestimonials: Testimonial[] = [
  {
    id: 'tst_01',
    name: 'Annisa R.',
    role: 'Peserta CPNS 2025',
    avatarUrl: avatar(47),
    rating: 5,
    quote:
      'Soal-soalnya mirip banget dengan pola ujian sebenarnya. Saya jadi lebih siap dan terbiasa menghadapi tekanan waktu.',
  },
  {
    id: 'tst_02',
    name: 'Fadli M.',
    role: 'Peserta BUMN',
    avatarUrl: avatar(28),
    rating: 5,
    quote:
      'Belajar jadi lebih fokus karena ada pembahasan yang jelas dan waktu pengerjaan yang realistis. Sangat worth it.',
  },
  {
    id: 'tst_03',
    name: 'Dinda P.',
    role: 'Peserta SNBT',
    avatarUrl: avatar(9),
    rating: 4,
    quote:
      'Konsisten update soal dan tipsnya membantu banget. Saya jadi tahu materi yang perlu ditingkatkan tiap minggu.',
  },
]

/**
 * Client-side mirror of sortPackages in zenko-api/internal/service/catalog.go,
 * so the sort tabs still respond in mock mode.
 */
export function sortMockPackages(items: MockPackage[], sort: SortKey): MockPackage[] {
  const sorted = [...items]

  switch (sort) {
    case 'bestseller':
      return sorted.sort((a, b) => b.soldCount - a.soldCount)
    case 'newest':
      return sorted.sort((a, b) => b.publishedAt - a.publishedAt)
    default:
      // featured: curated flag first, then popularity
      return sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return b.soldCount - a.soldCount
      })
  }
}
