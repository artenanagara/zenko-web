import type { PackageDetail, Topic } from '~~/types/catalog'
import { mockPackages } from '~/mocks/catalog'

/**
 * Detail fixtures for mock mode.
 *
 * Mirrors zenko-api/internal/store/seed_detail.go — material breakdown and
 * inclusions are derived from the category there too, so a new package only
 * needs the four values below.
 */

interface DetailSeed {
  description: string
  questions: number
  minutes: number
  reviews: number
}

const detailSeeds: Record<string, DetailSeed> = {
  'cpns-2026-intensif': {
    description:
      'Paket lengkap untuk menghadapi SKD dan SKB CPNS 2026. Soal disusun mengikuti kisi-kisi terbaru BKN, dengan tingkat kesulitan bertingkat agar kamu terbiasa dari dasar sampai soal HOTS. Setiap butir dilengkapi pembahasan video dan analisis kenapa jawaban lain keliru.',
    questions: 120,
    minutes: 100,
    reviews: 412,
  },
  'prediksi-bumn-2026': {
    description:
      'Simulasi rekrutmen bersama BUMN dengan komposisi soal mengikuti pola tiga tahun terakhir. Termasuk TKD, AKHLAK, dan Bahasa Inggris, lengkap dengan ambang batas per subtes supaya kamu tahu bagian mana yang masih di bawah standar.',
    questions: 90,
    minutes: 75,
    reviews: 356,
  },
  'snbt-master-class-2026': {
    description:
      'Kelas intensif SNBT yang menekankan penalaran, bukan hafalan. Materi disusun per subtes dengan strategi pengerjaan cepat, dan tiap simulasi memakai skema penilaian IRT seperti ujian aslinya.',
    questions: 150,
    minutes: 195,
    reviews: 288,
  },
  'tka-saintek-full-simulasi': {
    description:
      'Simulasi penuh TKA Saintek: Matematika, Fisika, Kimia, dan Biologi dalam satu rangkaian waktu ujian. Cocok dipakai sebagai gladi bersih beberapa minggu sebelum hari-H.',
    questions: 160,
    minutes: 180,
    reviews: 194,
  },
  'paket-hemat-skd-kedinasan': {
    description:
      'Paket ekonomis untuk seleksi sekolah kedinasan. Fokus pada TWK, TIU, dan TKP dengan porsi soal terbanyak pada bagian yang paling sering menggugurkan peserta, yaitu ambang batas TKP.',
    questions: 110,
    minutes: 100,
    reviews: 623,
  },
  'twk-lengkap': {
    description:
      'Pendalaman khusus Tes Wawasan Kebangsaan: Pancasila, UUD 1945, bhinneka tunggal ika, NKRI, dan bela negara. Dilengkapi rangkuman materi yang bisa dibaca ulang sebelum mengerjakan.',
    questions: 100,
    minutes: 80,
    reviews: 301,
  },
  'akhlak-bumn-core-values': {
    description:
      'Latihan terfokus pada core values AKHLAK yang kini menjadi penentu kelulusan tahap awal BUMN. Setiap soal situasional disertai penjelasan nilai mana yang sedang diuji dan mengapa satu respons lebih tepat dari lainnya.',
    questions: 80,
    minutes: 60,
    reviews: 142,
  },
  'literasi-bahasa-inggris-snbt': {
    description:
      'Subtes Literasi Bahasa Inggris SNBT dengan teks otentik setara level ujian. Menekankan strategi membaca cepat, menemukan gagasan utama, dan menyimpulkan tanpa harus memahami setiap kata.',
    questions: 95,
    minutes: 90,
    reviews: 217,
  },
  'penalaran-matematika-intensif': {
    description:
      'Latihan Penalaran Matematika dari konsep dasar sampai soal aplikasi kontekstual. Pembahasan menunjukkan jalur pengerjaan tercepat, bukan hanya jawaban akhir.',
    questions: 85,
    minutes: 90,
    reviews: 128,
  },
  'simulasi-cat-skb-guru': {
    description:
      'Simulasi CAT untuk SKB formasi guru, mencakup pedagogik dan kompetensi bidang. Antarmuka pengerjaan dibuat semirip mungkin dengan aplikasi CAT BKN agar tidak ada kejutan saat ujian.',
    questions: 100,
    minutes: 120,
    reviews: 176,
  },
  'psikotes-tkd-bumn': {
    description:
      'Gabungan psikotes dan TKD BUMN dalam satu paket: deret angka, analogi, silogisme, dan tes kepribadian. Hasil disajikan per kategori supaya kelemahan terlihat jelas.',
    questions: 130,
    minutes: 110,
    reviews: 245,
  },
  'tka-soshum-prediksi-2026': {
    description:
      'Prediksi TKA Soshum untuk Ekonomi, Sejarah, Geografi, dan Sosiologi. Disusun dari tren soal beberapa tahun terakhir dengan penekanan pada analisis data dan sumber.',
    questions: 140,
    minutes: 165,
    reviews: 96,
  },
}

function topicsFor(category: string): Topic[] {
  switch (category) {
    case 'BUMN':
      return [
        { title: 'Tes Kemampuan Dasar', count: 40 },
        { title: 'Core Values AKHLAK', count: 30 },
        { title: 'Bahasa Inggris', count: 20 },
      ]
    case 'SNBT':
      return [
        { title: 'Penalaran Umum', count: 30 },
        { title: 'Literasi Bahasa Indonesia & Inggris', count: 45 },
        { title: 'Penalaran Matematika', count: 20 },
        { title: 'Pengetahuan Kuantitatif', count: 20 },
      ]
    case 'TKA':
      return [
        { title: 'Paket simulasi penuh', count: 4 },
        { title: 'Latihan per mata pelajaran', count: 12 },
        { title: 'Pembahasan tertulis', count: 160 },
      ]
    case 'SKB':
      return [
        { title: 'Kompetensi pedagogik', count: 40 },
        { title: 'Kompetensi bidang', count: 60 },
      ]
    default:
      // SKD/CPNS dan Kedinasan memakai struktur SKD yang sama
      return [
        { title: 'Tes Wawasan Kebangsaan', count: 30 },
        { title: 'Tes Intelegensi Umum', count: 35 },
        { title: 'Tes Karakteristik Pribadi', count: 45 },
      ]
  }
}

function includesFor(category: string): string[] {
  const base = [
    'Pembahasan video untuk setiap soal',
    'Analisis skor per subtes',
    'Akses selamanya, bisa diulang kapan saja',
    'Grup diskusi bersama tutor',
  ]

  switch (category) {
    case 'SKD/CPNS':
    case 'Kedinasan':
    case 'SKB':
      return [...base, 'Simulasi antarmuka CAT BKN']
    case 'SNBT':
    case 'TKA':
      return [...base, 'Perhitungan skor dengan skema IRT']
    default:
      return base
  }
}

/** Returns the mock detail for a slug, or null when the slug is unknown. */
export function findMockDetail(slug: string): PackageDetail | null {
  const pkg = mockPackages.find((item) => item.slug === slug)
  const seed = pkg && detailSeeds[pkg.slug]
  if (!pkg || !seed) return null

  return {
    ...pkg,
    description: seed.description,
    questionCount: seed.questions,
    durationMinutes: seed.minutes,
    reviewCount: seed.reviews,
    includes: includesFor(pkg.category),
    topics: topicsFor(pkg.category),
    updatedAt: pkg.publishedAt,
  }
}
