import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

/**
 * Wizard berkelompok (rework SKD/TKA, spec §4): kelompok 1 memilih kategori →
 * sub-kategori → jenis ujian → mapel; kelompok 2 memegang jumlah soal &
 * durasi (terkunci untuk simulasi, bisa diatur untuk mini tryout).
 *
 * Yang dijaga di sini:
 * - Prefill mini tryout dari template mapel, dan angka yang diketik tutor
 *   menang atas prefill (regresi lama: template menimpa tanpa syarat).
 * - Angka custom mini tryout sampai ke POST /tutor/products.
 * - Simulasi SKD TIDAK mengirim questionTarget/durationMinutes — server
 *   menjawab 400 untuk konfigurasi terkunci yang coba di-override.
 *
 * Semuanya di-stub lewat page.route(): `/dashboard/**` adalah `ssr: false`
 * (nuxt.config.ts routeRules), jadi bahkan useFetch-nya useExamTypes() berjalan
 * di browser dan terlihat oleh page.route.
 */

/** Cermin seed pasca-rework: satu template SKD + satu template TKA. */
const EXAM_TYPES = [
  {
    slug: 'skd-cpns',
    label: 'SKD CPNS',
    description: 'Fixture SKD',
    category: 'SKD',
    subcategory: 'CPNS',
    timerPolicy: 'flat',
    theme: 'catbkn',
    cognitiveLevelEnabled: false,
    simulasiTotalMinutes: 100,
    // "Terkunci" bergantung pada fidelity sejak rework taksonomi
    // (isConfigLocked), bukan lagi pada kategorinya. Seed aslinya menandai SKD
    // CPNS sebagai official; tanpa ini fixture-nya diperlakukan sebagai
    // susunan latihan dan langkah konfigurasinya justru bisa diubah.
    fidelity: 'official',
    sections: [
      { title: 'Tes Wawasan Kebangsaan', questionTarget: 30, durationMinutes: 30, scoringMode: 'flat', pointsCorrect: 5, passingGrade: 65, defaultKind: 'single_choice', allowedKinds: ['single_choice'] },
      { title: 'Tes Intelegensi Umum', questionTarget: 35, durationMinutes: 35, scoringMode: 'flat', pointsCorrect: 5, passingGrade: 80, defaultKind: 'single_choice', allowedKinds: ['single_choice'] },
      { title: 'Tes Karakteristik Pribadi', questionTarget: 45, durationMinutes: 40, scoringMode: 'weighted', pointsCorrect: 0, passingGrade: 166, defaultKind: 'weighted', allowedKinds: ['weighted'] },
    ],
  },
  {
    slug: 'tka-smp',
    label: 'TKA SMP',
    description: 'Fixture TKA',
    category: 'TKA',
    subcategory: 'SMP',
    timerPolicy: 'flat',
    theme: 'tka',
    cognitiveLevelEnabled: true,
    sections: [
      { title: 'Bahasa Indonesia & Literasi', questionTarget: 30, durationMinutes: 75, scoringMode: 'flat', pointsCorrect: 1, defaultKind: 'single_choice' },
      { title: 'Matematika', questionTarget: 20, durationMinutes: 50, scoringMode: 'flat', pointsCorrect: 1, defaultKind: 'single_choice' },
    ],
  },
]

async function mockWizardApi(page: Page): Promise<{ createdBodies: unknown[] }> {
  const createdBodies: unknown[] = []

  await mockSignedIn(page, buildUser({ role: 'tutor', email: 'tutor@example.com', name: 'Tutor Uji' }))

  await page.route('**/exam-types', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXAM_TYPES) }))

  await page.route('**/tutor/product-pricing', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ minPrice: 0, liveProductCount: 0, hasLiveFreeProduct: false, canSubmitFreeProduct: true }),
    }))

  await page.route('**/tutor/products', (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    createdBodies.push(route.request().postDataJSON())
    // Cukup untuk membuat wizard pindah ke URL edit; isinya tidak dibaca spec.
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'prd_test_1', sections: [] }),
    })
  })

  return { createdBodies }
}

/**
 * Identitas paket kini dipilih lewat dialog bertahap, bukan deretan dropdown:
 * tiap langkah adalah radiogroup berisi tombol, dan pindah langkah lewat
 * "Lanjut" sampai langkah terakhir yang tombolnya "Gunakan pilihan"
 * (ProductIdentityPicker.vue). Helper lama menekan combobox "Kategori ujian"
 * yang sudah tidak ada.
 */
async function openIdentityDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^(Pilih|Ubah)$/ }).first().click()
}

/**
 * Semua interaksi dialog di-scope ke `role="dialog"`: footer wizard di
 * halaman punya tombol "Lanjut" sendiri, jadi pencarian tanpa scope cocok ke
 * dua elemen dan Playwright menolaknya (strict mode).
 */
function identityDialog(page: Page) {
  return page.getByRole('dialog')
}

/** Pilih satu opsi pada langkah yang sedang tampil. */
async function chooseStep(page: Page, optionName: string): Promise<void> {
  await identityDialog(page).getByRole('radio', { name: optionName, exact: false }).first().click()
}

/** Pilih berurutan, "Lanjut" di antara langkah, lalu terapkan. */
async function pickIdentity(page: Page, choices: string[]): Promise<void> {
  await openIdentityDialog(page)
  for (const [index, choice] of choices.entries()) {
    await chooseStep(page, choice)
    if (index < choices.length - 1) await identityDialog(page).getByRole('button', { name: 'Lanjut' }).click()
  }
  await identityDialog(page).getByRole('button', { name: 'Gunakan pilihan' }).click()
}

async function openWizard(page: Page): Promise<void> {
  // Banner cookie-nya `fixed` di atas footer langkah dan menelan klik pertama
  // ke kontrol mana pun — jawab lewat cookie yang sama seperti pengunjung yang
  // sudah pernah memilih (useCookieConsent: `zenko_cookie_consent`).
  await page.context().addCookies([
    { name: 'zenko_cookie_consent', value: 'rejected', domain: 'localhost', path: '/' },
  ])

  await page.goto('/dashboard/tutor/products/new', { waitUntil: 'networkidle' })
}

/**
 * Identitas untuk mini tryout TKA SMP. Langkahnya: Bentuk paket → Rumpun →
 * Program → Mode → Bagian. Fixture TKA tidak membawa `family`, jadi
 * examFamilyOf memetakannya dari category 'TKA' ke rumpun "Sekolah"; yang dulu
 * dipilih sebagai "Mata pelajaran" kini adalah langkah "Bagian".
 */
async function pickTkaMiniAndGoToConfig(page: Page, mapel: string): Promise<void> {
  await pickIdentity(page, ['Simulasi ujian', 'Sekolah', 'TKA SMP', 'Mini tryout', mapel])
  // Identitas selesai; footer wizard di halaman yang membawa ke kelompok 2.
  await page.getByRole('button', { name: 'Lanjut' }).click()
}

/** Kelompok 3 (Detail Produk) diisi minimum lalu draft disimpan. */
async function fillDetailAndSaveDraft(page: Page, title: string): Promise<void> {
  await page.locator('#product-title').fill(title)
  await page.locator('#product-description').fill('Deskripsi uji.')
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: /Simpan draft/ }).click()
}

test.describe('wizard berkelompok — konfigurasi mini tryout (kelompok 2)', () => {
  test('jumlah soal & durasi terisi dari template mapel yang dipilih', async ({ page }) => {
    await mockWizardApi(page)
    await openWizard(page)
    await pickTkaMiniAndGoToConfig(page, 'Bahasa Indonesia & Literasi')

    await expect(page.locator('#product-question-target')).toHaveValue('30')
    await expect(page.locator('#product-duration-minutes')).toHaveValue('75')
  })

  test('angka yang diketik tutor bertahan saat bolak-balik antar kelompok', async ({ page }) => {
    await mockWizardApi(page)
    await openWizard(page)
    await pickTkaMiniAndGoToConfig(page, 'Bahasa Indonesia & Literasi')

    const questionTarget = page.locator('#product-question-target')
    const durationMinutes = page.locator('#product-duration-minutes')
    await questionTarget.fill('35')
    await durationMinutes.fill('90')

    // Kembali ke kelompok 1 lalu maju lagi — angka custom tidak boleh
    // ditimpa ulang oleh prefill template.
    await page.getByRole('button', { name: 'Kembali' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()

    await expect(questionTarget).toHaveValue('35')
    await expect(durationMinutes).toHaveValue('90')
  })

  test('angka custom mini tryout ikut terkirim di POST /tutor/products', async ({ page }) => {
    const { createdBodies } = await mockWizardApi(page)
    await openWizard(page)
    await pickTkaMiniAndGoToConfig(page, 'Bahasa Indonesia & Literasi')

    await page.locator('#product-question-target').fill('35')
    await page.locator('#product-duration-minutes').fill('90')
    await page.getByRole('button', { name: 'Lanjut' }).click()

    await fillDetailAndSaveDraft(page, 'Try Out TKA SMP Literasi')

    await expect.poll(() => createdBodies.length).toBe(1)
    expect(createdBodies[0]).toMatchObject({
      examTypeSlug: 'tka-smp',
      mode: 'mini_tryout',
      sectionTitle: 'Bahasa Indonesia & Literasi',
      questionTarget: 35,
      durationMinutes: 90,
    })
  })
})

test.describe('wizard berkelompok — simulasi SKD terkunci', () => {
  test('simulasi SKD tidak mengirim questionTarget/durationMinutes', async ({ page }) => {
    const { createdBodies } = await mockWizardApi(page)
    await openWizard(page)

    // Simulasi lengkap SKD: langkah "Bagian" tidak pernah muncul, karena
    // ketiga subtes resmi terpasang otomatis dan tidak boleh dipilih satu per
    // satu — jadi "Mode" sudah langkah terakhir dan tombolnya "Gunakan
    // pilihan". Diuji lewat ketiadaan langkahnya, bukan lewat kalimat
    // penjelas: kalimat yang dulu diassert di sini sudah lama hilang dari UI
    // dan test-nya ikut mati diam-diam.
    await openIdentityDialog(page)
    await chooseStep(page, 'Simulasi ujian')
    await identityDialog(page).getByRole('button', { name: 'Lanjut' }).click()
    await chooseStep(page, 'ASN')
    await identityDialog(page).getByRole('button', { name: 'Lanjut' }).click()
    await chooseStep(page, 'SKD CPNS')
    await identityDialog(page).getByRole('button', { name: 'Lanjut' }).click()
    await chooseStep(page, 'Simulasi lengkap')
    await expect(identityDialog(page).getByRole('button', { name: 'Lanjut' })).toHaveCount(0)
    await identityDialog(page).getByRole('button', { name: 'Gunakan pilihan' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()

    // Kelompok 2: konfigurasi simulasi terkunci standar resmi, jadi tidak ada
    // satu pun kolom yang bisa mengubahnya.
    //
    // Sama seperti di atas, diuji lewat ketiadaan kontrolnya. Kotak berlabel
    // "terkunci mengikuti standar resmi" yang dulu diassert di sini sudah
    // diganti tabel ringkas per subtes, dan assertion-nya ikut basi tanpa ada
    // yang menyadarinya.
    await expect(page.locator('#product-question-target')).toHaveCount(0)
    await expect(page.locator('#product-duration-minutes')).toHaveCount(0)
    await page.getByRole('button', { name: 'Lanjut' }).click()

    await fillDetailAndSaveDraft(page, 'Simulasi SKD CPNS Lengkap')

    await expect.poll(() => createdBodies.length).toBe(1)
    const body = createdBodies[0] as Record<string, unknown>
    expect(body).toMatchObject({ examTypeSlug: 'skd-cpns', mode: 'simulasi' })
    expect(body.questionTarget).toBeUndefined()
    expect(body.durationMinutes).toBeUndefined()
    expect(body.sectionTitle).toBeUndefined()
  })
})
