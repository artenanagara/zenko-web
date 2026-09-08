/**
 * Catalogue test data owned by the e2e suite.
 *
 * These are the suite's own fixtures, not a re-export of anything in `app/` —
 * `app/mocks/` is on its way out and nothing under `tests/` may depend on it.
 * The shapes below are transcribed from zenko-api's wire format
 * (`internal/model/catalog.go`, `internal/model/exam_type.go`) and the values
 * from its development seed (`internal/store/seed.go`,
 * `internal/store/seed_detail.go`). A stub that drifts from that contract is
 * worse than no stub, so two rules apply when editing this file:
 *
 *  1. Only fields the API actually serialises may appear here. In particular
 *     `soldCount`, `publishedAt` and `featured` are `json:"-"` on the Go side:
 *     they order the catalogue server-side and are never visible to the
 *     browser. That is why ordering lives in the explicit `*_ORDER` arrays
 *     below rather than in a client-side sort the suite reimplements.
 *  2. Types are declared locally rather than imported from
 *     `#shared/types/catalog` — same reason `support/auth.ts` declares its own
 *     `MockUser`: the `#shared` alias is a Nuxt build-time alias that neither
 *     Playwright's transpiler nor the stub server's plain Node runtime can
 *     resolve.
 *
 * `stub-api.mjs` serves this data over HTTP; see the header of
 * `playwright.config.ts` for why an HTTP stub rather than `page.route()`.
 */

export interface FixtureAuthor {
  name: string
  avatarUrl: string
  /**
   * Mirrors the real wire format. One fixture carries a handle and the rest
   * are empty, so the suite covers both PackageCard branches: a tutor name
   * that links to `/tutor/:username`, and a seeded paket whose name stays
   * plain text because there is no profile to link to.
   */
  username: string
}

/**
 * Bimbel pemilik paket. Absen untuk paket pribadi tutor — mayoritas fixture di
 * bawah sengaja tidak punya field ini, karena kartu tanpa bimbel adalah kasus
 * yang paling sering dirender dan paling gampang rusak tanpa disadari.
 */
export interface FixtureBimbel {
  name: string
  slug: string
  logoUrl?: string
}

/** GET /api/v1/packages — one element of the (bare, unenveloped) array. */
export interface FixturePackage {
  id: string
  slug: string
  title: string
  category: string
  thumbnailUrl: string
  author: FixtureAuthor
  bimbel?: FixtureBimbel
  rating: number
  soldLabel: string
  price: number
  priceOriginal: number
}

export interface FixtureTopic {
  title: string
  count: number
}

/** GET /api/v1/packages/:slug — the list shape plus seven detail-only fields. */
export interface FixturePackageDetail extends FixturePackage {
  description: string
  questionCount: number
  durationMinutes: number
  reviewCount: number
  includes: string[]
  topics: FixtureTopic[]
  /** Unix seconds. */
  updatedAt: number
}

/** GET /api/v1/testimonials */
export interface FixtureTestimonial {
  id: string
  name: string
  role: string
  avatarUrl: string
  quote: string
  rating: number
}

/** GET /api/v1/categories — derived server-side from the catalogue itself. */
export interface FixtureCategory {
  slug: string
  label: string
  count: number
}

const thumb = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=700&q=80`

const avatar = (id: number) => `https://i.pravatar.cc/80?img=${id}`

/**
 * Every package the stub serves, keyed by slug. Declared once here; the
 * `*_ORDER` arrays below decide what order each `?sort=` value returns them in.
 */
export const PACKAGES: Record<string, FixturePackage> = {
  'cpns-2026-intensif': {
    id: 'pkg_01',
    slug: 'cpns-2026-intensif',
    title: 'Latihan CPNS 2026 Intensif SKD & SKB',
    category: 'SKD/CPNS',
    thumbnailUrl: thumb('photo-1522202176988-66273c2fd55f'),
    author: { name: 'Budi Santoso', avatarUrl: avatar(12), username: 'budi-santoso' },
    // Atribusi ganda: penulis DAN bimbel penerbitnya, keduanya tampil.
    bimbel: { name: 'Bimbel Nusantara', slug: 'bimbel-nusantara', logoUrl: '' },
    rating: 4.9,
    soldLabel: '2.1rb',
    price: 189_000,
    priceOriginal: 249_000,
  },
  'prediksi-bumn-2026': {
    id: 'pkg_02',
    slug: 'prediksi-bumn-2026',
    title: 'Prediksi BUMN 2026 Profesional',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1523240795612-9a054b0db644'),
    author: { name: 'Mira Azzahra', avatarUrl: avatar(32), username: '' },
    rating: 4.8,
    soldLabel: '1.8rb',
    price: 149_000,
    priceOriginal: 199_000,
  },
  'snbt-master-class-2026': {
    id: 'pkg_03',
    slug: 'snbt-master-class-2026',
    title: 'SNBT Master Class 2026',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1516321318423-f06f85e504b3'),
    author: { name: 'Dimas Prasetya', avatarUrl: avatar(15), username: '' },
    // Nama panjang, disengaja: kartu katalog itu grid, jadi baris atribusi
    // harus memotong namanya, bukan melebarkan kartunya.
    bimbel: { name: 'Bimbel Cendekia Nusantara Persada Mandiri', slug: 'bimbel-cendekia-nusantara' },
    rating: 4.7,
    soldLabel: '1.2rb',
    price: 219_000,
    priceOriginal: 279_000,
  },
  'tka-saintek-full-simulasi': {
    id: 'pkg_04',
    slug: 'tka-saintek-full-simulasi',
    title: 'Try Out Ujian Mandiri PTN — Saintek',
    category: 'Ujian Mandiri',
    thumbnailUrl: thumb('photo-1434030216411-0b793f4b4173'),
    author: { name: 'Rani Kusuma', avatarUrl: avatar(45), username: '' },
    rating: 4.9,
    soldLabel: '980',
    price: 179_000,
    priceOriginal: 229_000,
  },
  'paket-hemat-skd-kedinasan': {
    id: 'pkg_05',
    slug: 'paket-hemat-skd-kedinasan',
    title: 'Paket Hemat SKD Kedinasan',
    category: 'Kedinasan',
    thumbnailUrl: thumb('photo-1509062522246-3755977927d7'),
    author: { name: 'Agus Wijaya', avatarUrl: avatar(51), username: '' },
    rating: 4.6,
    soldLabel: '3.4rb',
    price: 99_000,
    priceOriginal: 149_000,
  },
  'twk-lengkap': {
    id: 'pkg_06',
    slug: 'twk-lengkap',
    title: 'Tes Wawasan Kebangsaan Lengkap',
    category: 'SKD/CPNS',
    thumbnailUrl: thumb('photo-1427504494785-3a9ca7044f45'),
    author: { name: 'Sinta Dewi', avatarUrl: avatar(20), username: '' },
    rating: 4.8,
    soldLabel: '1.5rb',
    price: 129_000,
    priceOriginal: 169_000,
  },
  'akhlak-bumn-core-values': {
    id: 'pkg_07',
    slug: 'akhlak-bumn-core-values',
    title: 'AKHLAK BUMN & Core Values',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1456513080510-7bf3a84b82f8'),
    author: { name: 'Rizky Ananda', avatarUrl: avatar(60), username: '' },
    rating: 4.7,
    soldLabel: '760',
    price: 119_000,
    priceOriginal: 159_000,
  },
  'literasi-bahasa-inggris-snbt': {
    id: 'pkg_08',
    slug: 'literasi-bahasa-inggris-snbt',
    title: 'Literasi Bahasa Inggris SNBT',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1497633762265-9d179a990aa6'),
    author: { name: 'Putri Maharani', avatarUrl: avatar(5), username: '' },
    rating: 4.9,
    soldLabel: '1.1rb',
    price: 139_000,
    priceOriginal: 189_000,
  },
  'penalaran-matematika-intensif': {
    id: 'pkg_09',
    slug: 'penalaran-matematika-intensif',
    title: 'Penalaran Matematika Intensif',
    category: 'SNBT',
    thumbnailUrl: thumb('photo-1491841550275-ad7854e35ca6'),
    author: { name: 'Hendra Gunawan', avatarUrl: avatar(68), username: '' },
    rating: 4.6,
    soldLabel: '640',
    price: 159_000,
    priceOriginal: 199_000,
  },
  'simulasi-cat-skb-guru': {
    id: 'pkg_10',
    slug: 'simulasi-cat-skb-guru',
    title: 'Simulasi CAT SKB Guru',
    category: 'SKB',
    thumbnailUrl: thumb('photo-1503676260728-1c00da094a0b'),
    author: { name: 'Nadia Salsabila', avatarUrl: avatar(25), username: '' },
    rating: 4.8,
    soldLabel: '890',
    price: 199_000,
    priceOriginal: 259_000,
  },
  'psikotes-tkd-bumn': {
    id: 'pkg_11',
    slug: 'psikotes-tkd-bumn',
    title: 'Psikotes & TKD BUMN Lengkap',
    category: 'BUMN',
    thumbnailUrl: thumb('photo-1454165804606-c3d57bc86b40'),
    author: { name: 'Fajar Ramadhan', avatarUrl: avatar(33), username: '' },
    rating: 4.7,
    soldLabel: '1.3rb',
    price: 109_000,
    priceOriginal: 149_000,
  },
  'tka-soshum-prediksi-2026': {
    id: 'pkg_12',
    slug: 'tka-soshum-prediksi-2026',
    title: 'Try Out Ujian Mandiri PTN — Soshum',
    category: 'Ujian Mandiri',
    thumbnailUrl: thumb('photo-1513258496099-48168024aec0'),
    author: { name: 'Laras Ayu', avatarUrl: avatar(47), username: '' },
    rating: 4.8,
    soldLabel: '520',
    price: 169_000,
    priceOriginal: 219_000,
  },
}

export const PACKAGE_COUNT = Object.keys(PACKAGES).length

/**
 * The three orderings `GET /api/v1/packages?sort=` answers with, written out
 * by hand rather than computed.
 *
 * zenko-api's `sortPackages` orders on fields the browser never receives, so
 * the suite cannot recompute these — and reimplementing the comparator in test
 * code would only prove the reimplementation agrees with itself. Spelling the
 * expected order out instead means a spec asserting on it is asserting against
 * a fixed, reviewable expectation.
 *
 * The trailing comments record the hidden ranking field each position comes
 * from, so a change in the API seed can be checked against this list by eye.
 */

/** sort=featured (also the default): `featured` flag first, then soldCount desc. */
export const FEATURED_ORDER: string[] = [
  'cpns-2026-intensif', //             featured, 2100 sold
  'prediksi-bumn-2026', //             featured, 1800 sold
  'snbt-master-class-2026', //         featured, 1200 sold
  'tka-saintek-full-simulasi', //      featured,  980 sold
  'paket-hemat-skd-kedinasan', //                3400 sold
  'twk-lengkap', //                              1500 sold
  'psikotes-tkd-bumn', //                        1300 sold
  'literasi-bahasa-inggris-snbt', //             1100 sold
  'simulasi-cat-skb-guru', //                     890 sold
  'akhlak-bumn-core-values', //                   760 sold
  'penalaran-matematika-intensif', //              640 sold
  'tka-soshum-prediksi-2026', //                  520 sold
]

/** sort=bestseller: soldCount desc, ignoring the curated flag entirely. */
export const BESTSELLER_ORDER: string[] = [
  'paket-hemat-skd-kedinasan', //      3400 sold
  'cpns-2026-intensif', //             2100 sold
  'prediksi-bumn-2026', //             1800 sold
  'twk-lengkap', //                    1500 sold
  'psikotes-tkd-bumn', //              1300 sold
  'snbt-master-class-2026', //         1200 sold
  'literasi-bahasa-inggris-snbt', //   1100 sold
  'tka-saintek-full-simulasi', //       980 sold
  'simulasi-cat-skb-guru', //           890 sold
  'akhlak-bumn-core-values', //         760 sold
  'penalaran-matematika-intensif', //   640 sold
  'tka-soshum-prediksi-2026', //        520 sold
]

/** sort=newest: publishedAt desc, which for this seed is pkg_01 … pkg_12. */
export const NEWEST_ORDER: string[] = [
  'cpns-2026-intensif',
  'prediksi-bumn-2026',
  'snbt-master-class-2026',
  'tka-saintek-full-simulasi',
  'paket-hemat-skd-kedinasan',
  'twk-lengkap',
  'akhlak-bumn-core-values',
  'literasi-bahasa-inggris-snbt',
  'penalaran-matematika-intensif',
  'simulasi-cat-skb-guru',
  'psikotes-tkd-bumn',
  'tka-soshum-prediksi-2026',
]

/** The title a spec should see at the top of the grid for each sort tab. */
export const FIRST_BY_SORT = {
  featured: PACKAGES[FEATURED_ORDER[0]!]!.title,
  bestseller: PACKAGES[BESTSELLER_ORDER[0]!]!.title,
  newest: PACKAGES[NEWEST_ORDER[0]!]!.title,
}

/**
 * Detail payloads, only for the slugs a spec actually opens. Any other slug is
 * a deliberate 404 from the stub — the same answer zenko-api gives for an
 * unknown package — so a spec that starts depending on a new detail page fails
 * loudly here rather than silently rendering something invented.
 *
 * `includes` and `topics` are category-derived server-side (`IncludesFor`,
 * `topicsFor`); the values below are the ones those functions return for
 * `SKD/CPNS` and `Kedinasan`, which share the SKD structure. `updatedAt`
 * mirrors the package's `publishedAt` for seed packages.
 */
const SKD_TOPICS: FixtureTopic[] = [
  { title: 'Tes Wawasan Kebangsaan', count: 30 },
  { title: 'Tes Intelegensi Umum', count: 35 },
  { title: 'Tes Karakteristik Pribadi', count: 45 },
]

const SKD_INCLUDES: string[] = [
  'Pembahasan video untuk setiap soal',
  'Analisis skor per subtes',
  'Akses selamanya, bisa diulang kapan saja',
  'Grup diskusi bersama tutor',
  'Simulasi antarmuka CAT BKN',
]

export const PACKAGE_DETAILS: Record<string, FixturePackageDetail> = {
  'cpns-2026-intensif': {
    ...PACKAGES['cpns-2026-intensif']!,
    description:
      'Paket lengkap untuk menghadapi SKD dan SKB CPNS 2026. Soal disusun mengikuti '
      + 'kisi-kisi terbaru BKN, dengan tingkat kesulitan bertingkat agar kamu terbiasa '
      + 'dari dasar sampai soal HOTS.',
    questionCount: 120,
    durationMinutes: 100,
    reviewCount: 412,
    includes: SKD_INCLUDES,
    topics: SKD_TOPICS,
    updatedAt: 1754870400,
  },
  'paket-hemat-skd-kedinasan': {
    ...PACKAGES['paket-hemat-skd-kedinasan']!,
    description:
      'Paket ekonomis untuk seleksi sekolah kedinasan. Fokus pada TWK, TIU, dan TKP '
      + 'dengan porsi soal terbanyak pada bagian yang paling sering menggugurkan peserta.',
    questionCount: 110,
    durationMinutes: 100,
    reviewCount: 623,
    includes: SKD_INCLUDES,
    topics: SKD_TOPICS,
    updatedAt: 1754524800,
  },
}

/**
 * GET /api/v1/packages/:slug/sample — the "coba gratis" showcase.
 *
 * Transcribed from `internal/handler/package_sample.go`, whose defining
 * property is what is *missing*: a sample question carries no `correct`, no
 * `points` and no `scores`, because the endpoint is public and the answer key
 * is the product. Grading therefore happens over POST
 * /packages/:slug/sample/score, which is why the key below lives in a separate
 * map the blueprint is not built from — the same split the API keeps between
 * its wire DTO and the columns it reads.
 */
export interface FixtureSampleOption {
  label: string
  text: string
}

export interface FixtureSampleQuestion {
  id: string
  kind: 'objective' | 'situational'
  text: string
  options: FixtureSampleOption[]
}

export interface FixtureSampleSection {
  id: string
  code: string
  title: string
  durationMinutes: number
  questions: FixtureSampleQuestion[]
}

export interface FixtureSampleBlueprint {
  slug: string
  title: string
  theme: { system: string, agency: string, seal: string }
  mode: 'flat'
  sections: FixtureSampleSection[]
}

/** One question's key: `points` for objective items, `scores` for situational. */
interface FixtureAnswerKey {
  correct?: string
  points?: number
  scores?: Record<string, number>
}

/** POST /api/v1/packages/:slug/sample/score — mirrors handler.sampleScoreResult. */
export interface FixtureSampleScore {
  score: number
  maxScore: number
  sections: { title: string, correct: number, total: number, score: number, maxScore: number }[]
}

function objectiveFixture(id: string, text: string): FixtureSampleQuestion {
  return {
    id,
    kind: 'objective',
    text,
    options: [
      { label: 'A', text: 'Pilihan A' },
      { label: 'B', text: 'Pilihan B' },
      { label: 'C', text: 'Pilihan C' },
    ],
  }
}

function situationalFixture(id: string, text: string): FixtureSampleQuestion {
  return {
    id,
    kind: 'situational',
    text,
    options: [
      { label: 'A', text: 'Mengambil keputusan sendiri agar cepat selesai' },
      { label: 'B', text: 'Menunda pembangunan sampai semua warga sepakat' },
      { label: 'C', text: 'Memfasilitasi musyawarah lanjutan' },
    ],
  }
}

/** Five questions across two subtests, the shape the API's round-robin produces. */
export const SAMPLE_BLUEPRINTS: Record<string, FixtureSampleBlueprint> = {
  'cpns-2026-intensif': {
    slug: 'cpns-2026-intensif',
    title: PACKAGES['cpns-2026-intensif']!.title,
    theme: { system: 'CAT BKN', agency: 'Badan Kepegawaian Negara', seal: 'BKN' },
    mode: 'flat',
    sections: [
      {
        id: 'twk',
        code: 'TWK',
        title: 'Tes Wawasan Kebangsaan',
        durationMinutes: 3,
        questions: [
          objectiveFixture('twk-1', 'Dasar negara Republik Indonesia adalah…'),
          objectiveFixture('twk-2', 'Sidang BPUPKI pertama membahas…'),
          objectiveFixture('twk-3', 'Semboyan Bhinneka Tunggal Ika berasal dari…'),
        ],
      },
      {
        id: 'tkp',
        code: 'TKP',
        title: 'Tes Karakteristik Pribadi',
        durationMinutes: 2,
        questions: [
          situationalFixture('tkp-1', 'Warga tidak mencapai mufakat soal lokasi sumur bor…'),
          situationalFixture('tkp-2', 'Rekan kerjamu terlambat menyelesaikan bagiannya…'),
        ],
      },
    ],
  },
}

/**
 * The key the sample response withholds, kept here so the stub can grade the
 * way the API does. B is the right answer on every objective item and the best
 * option on every situational one, so a spec that answers B everywhere expects
 * a perfect score.
 */
const SAMPLE_ANSWER_KEYS: Record<string, Record<string, FixtureAnswerKey>> = {
  'cpns-2026-intensif': {
    'twk-1': { correct: 'B', points: 5 },
    'twk-2': { correct: 'B', points: 5 },
    'twk-3': { correct: 'B', points: 5 },
    'tkp-1': { scores: { A: 2, B: 5, C: 3 } },
    'tkp-2': { scores: { A: 1, B: 5, C: 4 } },
  },
}

/**
 * Grades a submission the way handler.scoreSampleAnswers does: totals come
 * from the sample's own questions, so an unanswered question costs points
 * without shrinking the denominator. Returns null for a slug with no sample,
 * which the stub answers as the API's 404.
 */
export function scoreSample(slug: string, answers: Record<string, string>): FixtureSampleScore | null {
  const blueprint = SAMPLE_BLUEPRINTS[slug]
  const keys = SAMPLE_ANSWER_KEYS[slug]
  if (!blueprint || !keys) return null

  const sections = blueprint.sections.map((section) => {
    const row = { title: section.title, correct: 0, total: section.questions.length, score: 0, maxScore: 0 }
    for (const question of section.questions) {
      const key = keys[question.id] ?? {}
      const picked = (answers[question.id] ?? '').toUpperCase()
      if (question.kind === 'objective') {
        const points = key.points ?? 0
        row.maxScore += points
        if (key.correct && picked === key.correct) {
          row.score += points
          row.correct += 1
        }
        continue
      }
      const scores = key.scores ?? {}
      const best = Math.max(0, ...Object.values(scores))
      const points = scores[picked] ?? 0
      row.maxScore += best
      row.score += points
      if (best > 0 && points === best) row.correct += 1
    }
    return row
  })

  return {
    score: sections.reduce((sum, section) => sum + section.score, 0),
    maxScore: sections.reduce((sum, section) => sum + section.maxScore, 0),
    sections,
  }
}

export const TESTIMONIALS: FixtureTestimonial[] = [
  {
    id: 'tst_01',
    name: 'Annisa R.',
    role: 'Peserta CPNS 2025',
    avatarUrl: avatar(47),
    rating: 5,
    quote:
      'Soal-soalnya mirip banget dengan pola ujian sebenarnya. Saya jadi lebih siap dan '
      + 'terbiasa menghadapi tekanan waktu.',
  },
  {
    id: 'tst_02',
    name: 'Fadli M.',
    role: 'Peserta BUMN',
    avatarUrl: avatar(28),
    rating: 5,
    quote:
      'Belajar jadi lebih fokus karena ada pembahasan yang jelas dan waktu pengerjaan '
      + 'yang realistis. Sangat worth it.',
  },
  {
    id: 'tst_03',
    name: 'Dinda P.',
    role: 'Peserta SNBT',
    avatarUrl: avatar(9),
    rating: 4,
    quote:
      'Konsisten update soal dan tipsnya membantu banget. Saya jadi tahu materi yang '
      + 'perlu ditingkatkan tiap minggu.',
  },
]

/**
 * GET /api/v1/categories. zenko-api derives this from the catalogue in
 * first-appearance order of the label, with `slug` = label lowercased and
 * `/` and spaces turned into `-`.
 *
 * Nothing in zenko-web consumes this endpoint today — the catalogue sidebar
 * builds its own facets from the package list (see `usePackageFilters`) — but
 * the stub answers it so an SSR page that starts calling it gets the real
 * contract rather than a 404.
 */
export const CATEGORIES: FixtureCategory[] = [
  { slug: 'skd-cpns', label: 'SKD/CPNS', count: 2 },
  { slug: 'bumn', label: 'BUMN', count: 3 },
  { slug: 'snbt', label: 'SNBT', count: 3 },
  { slug: 'ujian-mandiri', label: 'Ujian Mandiri', count: 2 },
  { slug: 'kedinasan', label: 'Kedinasan', count: 1 },
  { slug: 'skb', label: 'SKB', count: 1 },
]

/* ------------------------------------------------------------------ tutor
 *
 * GET /api/v1/tutors/:username and .../reviews, backing /tutor/:username.
 *
 * The counts are picked to exercise the page's client-side paging and star
 * filter rather than to look realistic: 15 products against a 12-per-page
 * limit, and 11 reviews against 8, so both "muat lagi" buttons appear and both
 * disappear after exactly one press. The rating spread deliberately leaves
 * 2 bintang empty — a bucket with no reviews must render as a dead label, not
 * a filter button that would produce a blank list.
 */

const TUTOR_USERNAME = 'budi-santoso'

/** Categories dealt round-robin across the tutor's products. */
export const TUTOR_CATEGORY_CYCLE = ['SKD/CPNS', 'SNBT', 'BUMN']

/** Index of the one product given a 5.0, ranked above every other. */
export const TUTOR_TOP_RATED_INDEX = 9

/** 6×5★, 3×4★, 1×3★, 1×1★ — average 46/11 = 4.18, shown as "4.2". */
const REVIEW_RATINGS = [5, 5, 5, 5, 5, 5, 4, 4, 4, 3, 1]

export const TUTOR_REVIEW_COUNT = REVIEW_RATINGS.length
export const TUTOR_PRODUCT_COUNT = 15

export const TUTOR = {
  id: 'usr_budi',
  username: TUTOR_USERNAME,
  name: 'Budi Santoso',
  avatarUrl: avatar(12),
  verified: true,
  profile: {
    accountId: 'usr_budi',
    displayName: 'Budi Santoso',
    avatarUrl: avatar(12),
    username: TUTOR_USERNAME,
    usernameChangedAt: 0,
    bio: 'Pengajar SKD sejak 2016.',
    experience: 'Mengajar bimbel CPNS selama 8 tahun.',
    specializations: ['SKD/CPNS', 'TIU'],
    education: 'S1 Statistika',
    portfolioUrl: '',
    instagramUrl: 'https://instagram.com/budi',
    tiktokUrl: '',
    linkedinUrl: '',
    youtubeUrl: '',
    websiteUrl: '',
    updatedAt: 1_760_000_000,
  },
  products: Array.from({ length: TUTOR_PRODUCT_COUNT }, (_, i) => ({
    id: `prd_${i + 1}`,
    type: i % 5 === 0 ? 'bundle' : 'single',
    title: `Paket latihan nomor ${i + 1}`,
    slug: `paket-latihan-${i + 1}`,
    // Three categories, so the profile's category dropdown has something to
    // choose between. A single-category tutor hides that control entirely,
    // which TUTOR_SINGLE_CATEGORY below covers instead.
    category: TUTOR_CATEGORY_CYCLE[i % TUTOR_CATEGORY_CYCLE.length],
    thumbnailUrl: thumb('photo-1522202176988-66273c2fd55f'),
    // i = 0 is the only free paket, and the cheapest; price climbs with i, so
    // "harga terendah" and "harga tertinggi" have unambiguous winners.
    price: i === 0 ? 0 : 50_000 + i * 1000,
    priceOriginal: i === 0 ? 0 : 80_000 + i * 1000,
    status: 'live',
    questionCount: 100 + i,
    questionTarget: 100 + i,
    // Descending with i apart from one deliberate standout, so "rating
    // tertinggi" has a single unambiguous winner that is not also the newest.
    rating: i === TUTOR_TOP_RATED_INDEX ? 5 : Math.round((4.8 - i * 0.1) * 10) / 10,
    attemptLabel: String(i * 10),
    updatedAt: 1_760_000_000 - i,
  })),
  stats: {
    activePackages: TUTOR_PRODUCT_COUNT,
    ratingAverage: REVIEW_RATINGS.reduce((sum, r) => sum + r, 0) / REVIEW_RATINGS.length,
    ratingCount: TUTOR_REVIEW_COUNT,
  },
}

export const TUTOR_REVIEWS = REVIEW_RATINGS.map((rating, i) => ({
  id: `rev_${i + 1}`,
  productId: `prd_${(i % TUTOR_PRODUCT_COUNT) + 1}`,
  attemptId: `att_${i + 1}`,
  productSlug: `paket-latihan-${(i % TUTOR_PRODUCT_COUNT) + 1}`,
  productTitle: `Paket latihan nomor ${(i % TUTOR_PRODUCT_COUNT) + 1}`,
  authorName: `Siswa ${i + 1}`,
  rating,
  tags: [],
  reviewText: `Ulasan contoh nomor ${i + 1}.`,
  isAnonymous: i === 0,
  isPublished: true,
  createdAt: 1_760_000_000 - i * 86_400,
  updatedAt: 1_760_000_000 - i * 86_400,
}))

/**
 * A tutor with everything in one category and no reviews. Exists to pin the
 * two "hide the control" rules: a category dropdown with a single option is
 * noise, and a rating summary needs ratings to summarise.
 */
export const TUTOR_SOLO_USERNAME = 'sinta-dewi'
export const TUTOR_SOLO_PRODUCT_COUNT = 3

export const TUTOR_SOLO = {
  ...TUTOR,
  id: 'usr_sinta',
  username: TUTOR_SOLO_USERNAME,
  name: 'Sinta Dewi',
  verified: false,
  profile: {
    ...TUTOR.profile,
    accountId: 'usr_sinta',
    displayName: 'Sinta Dewi',
    username: TUTOR_SOLO_USERNAME,
    specializations: ['SNBT'],
  },
  products: TUTOR.products.slice(0, TUTOR_SOLO_PRODUCT_COUNT).map((product, i) => ({
    ...product,
    id: `sol_${i + 1}`,
    slug: `paket-sinta-${i + 1}`,
    title: `Paket Sinta nomor ${i + 1}`,
    category: 'SNBT',
  })),
  stats: { activePackages: TUTOR_SOLO_PRODUCT_COUNT, ratingAverage: 0, ratingCount: 0 },
}

export const TUTORS = {
  [TUTOR_USERNAME]: TUTOR,
  [TUTOR_SOLO_USERNAME]: TUTOR_SOLO,
}
export const TUTOR_REVIEWS_BY_USERNAME = {
  [TUTOR_USERNAME]: TUTOR_REVIEWS,
  [TUTOR_SOLO_USERNAME]: [],
}
