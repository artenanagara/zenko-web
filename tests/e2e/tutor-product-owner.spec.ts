import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

/**
 * "Terbitkan sebagai" — pemilik paket jadi pilihan eksplisit di langkah 1
 * wizard (konsep-bimbel-agency §6.1). Sebelumnya kepemilikan ditentukan
 * diam-diam dari URL mana wizard dibuka.
 *
 * Empat aturan yang dijaga di sini, karena keempatnya gampang hilang tanpa
 * disadari:
 *
 *  1. Dari ruang kerja tutor, pilihan tutor sampai ke server sebagai
 *     `ownerBimbelId`, dan draft yang lahir langsung pindah ke ruang kerja
 *     bimbel pemiliknya — sisa wizard (soal, submit) hidup di sana.
 *  2. Hanya keanggotaan aktif non-student yang boleh jadi pilihan.
 *  3. Tanpa keanggotaan seperti itu, TIDAK ADA pemilih sama sekali — bukan
 *     pemilih berisi satu opsi palsu.
 *  4. Dari ruang kerja bimbel pemiliknya sudah dari URL: yang tampil adalah
 *     keadaan, dan body-nya tidak mengulang `ownerBimbelId` (server menolak
 *     body yang menyebut bimbel lain).
 *
 * Selain itu: pemilik tidak bisa dipindah, jadi mode edit tidak menampilkan
 * apa pun soal ini.
 *
 * Semuanya di-stub lewat page.route(): `/dashboard/**` adalah `ssr: false`
 * (nuxt.config.ts routeRules), jadi seluruh fetch-nya berjalan di browser.
 */

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
    sections: [
      { title: 'Tes Wawasan Kebangsaan', questionTarget: 30, durationMinutes: 30, scoringMode: 'flat', pointsCorrect: 5, passingGrade: 65, defaultKind: 'single_choice', allowedKinds: ['single_choice'] },
      { title: 'Tes Intelegensi Umum', questionTarget: 35, durationMinutes: 35, scoringMode: 'flat', pointsCorrect: 5, passingGrade: 80, defaultKind: 'single_choice', allowedKinds: ['single_choice'] },
      { title: 'Tes Karakteristik Pribadi', questionTarget: 45, durationMinutes: 40, scoringMode: 'weighted', pointsCorrect: 0, passingGrade: 166, defaultKind: 'weighted', allowedKinds: ['weighted'] },
    ],
  },
]

/** GET /me/bimbels — dua yang layak, dua yang harus disaring keluar. */
const MEMBERSHIPS = [
  { bimbelId: 'bmb-1', bimbelName: 'Bimbel Nusantara', bimbelSlug: 'bimbel-nusantara', role: 'teacher', status: 'active', bimbelStatus: 'active', joinedAt: 1 },
  { bimbelId: 'bmb-2', bimbelName: 'Bimbel Cendekia', bimbelSlug: 'bimbel-cendekia', role: 'owner', status: 'active', bimbelStatus: 'active', joinedAt: 1 },
  { bimbelId: 'bmb-3', bimbelName: 'Bimbel Siswa', bimbelSlug: 'bimbel-siswa', role: 'student', status: 'active', bimbelStatus: 'active', joinedAt: 1 },
  { bimbelId: 'bmb-4', bimbelName: 'Bimbel Pending', bimbelSlug: 'bimbel-pending', role: 'teacher', status: 'pending', bimbelStatus: 'active', joinedAt: 1 },
]

const INELIGIBLE = [MEMBERSHIPS[2]!, MEMBERSHIPS[3]!]

interface CreatedProduct { url: string, body: Record<string, unknown> }

async function mockWizard(page: Page, memberships: unknown[]): Promise<CreatedProduct[]> {
  const created: CreatedProduct[] = []

  await mockSignedIn(page, buildUser({ role: 'tutor', email: 'tutor@example.com', name: 'Tutor Uji' }))

  // useApiFetch mengambil token CSRF sebelum tiap tulisan; tanpa ini POST-nya
  // tidak pernah berangkat dan spec gagal jauh dari sebabnya.
  await page.route('**/auth/csrf', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'test-csrf' }) }))
  await page.route('**/exam-types', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXAM_TYPES) }))
  await page.route('**/me/bimbels', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(memberships) }))
  await page.route('**/product-pricing', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ minPrice: 0, liveProductCount: 0, hasLiveFreeProduct: false, canSubmitFreeProduct: true }),
    }))
  await page.route('**/products', (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    created.push({ url: route.request().url(), body: route.request().postDataJSON() })
    // Cukup untuk membuat wizard pindah ke URL edit; isinya tidak dibaca spec.
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'prd_1', sections: [] }) })
  })
  await page.route('**/products/prd_1', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'prd_1', sections: [] }) }))

  // Banner cookie-nya `fixed` di atas footer langkah dan menelan klik pertama
  // ke kontrol mana pun — jawab lewat cookie yang sama seperti pengunjung yang
  // sudah pernah memilih (useCookieConsent).
  await page.context().addCookies([
    { name: 'zenko_cookie_consent', value: 'rejected', domain: 'localhost', path: '/' },
  ])

  return created
}

/** AppSelect adalah combobox ARIA (design system AppSelect.vue). */
async function choose(page: Page, combobox: string, option: string): Promise<void> {
  await page.getByRole('combobox', { name: combobox, exact: true }).click()
  await page.getByRole('option', { name: option, exact: false }).first().click()
}

/** Simulasi SKD CPNS dari langkah 1 sampai draft tersimpan. */
async function walkToDraft(page: Page, title: string): Promise<void> {
  await choose(page, 'Kategori ujian', 'SKD')
  await choose(page, 'Sub-kategori', 'CPNS')
  await page.getByRole('button', { name: 'Lanjut' }).click()
  await page.getByRole('button', { name: 'Lanjut' }).click()

  await page.locator('#product-title').fill(title)
  await page.locator('#product-description').fill('Deskripsi uji.')
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: /Simpan draft/ }).click()
}

test.describe('wizard — Terbitkan sebagai (ruang kerja tutor)', () => {
  test('pilihan bimbel terkirim sebagai ownerBimbelId, dan draftnya pindah ke ruang kerja bimbel', async ({ page }) => {
    const created = await mockWizard(page, MEMBERSHIPS)
    await page.goto('/dashboard/tutor/products/new', { waitUntil: 'networkidle' })

    const owner = page.getByRole('combobox', { name: 'Terbitkan sebagai', exact: true })
    await expect(owner).toBeVisible()
    await owner.click()

    // Siswa dan anggota yang belum aktif bukan pilihan: server menolak
    // keduanya, jadi menawarkannya hanya menjanjikan penolakan.
    await expect(page.getByRole('option', { name: 'Bimbel Siswa' })).toHaveCount(0)
    await expect(page.getByRole('option', { name: 'Bimbel Pending' })).toHaveCount(0)
    await page.getByRole('option', { name: 'Bimbel Cendekia', exact: true }).click()

    await walkToDraft(page, 'Simulasi SKD CPNS')

    await expect.poll(() => created.length).toBe(1)
    expect(created[0]!.url).toContain('/tutor/products')
    expect(created[0]!.body).toMatchObject({ ownerBimbelId: 'bmb-2' })
    await expect(page).toHaveURL(/\/dashboard\/bimbel\/bmb-2\/products\/prd_1\/edit/)
  })

  test('paket pribadi tetap default dan tidak membawa ownerBimbelId', async ({ page }) => {
    const created = await mockWizard(page, MEMBERSHIPS)
    await page.goto('/dashboard/tutor/products/new', { waitUntil: 'networkidle' })

    await expect(page.getByRole('combobox', { name: 'Terbitkan sebagai', exact: true }))
      .toContainText('Saya sendiri')

    await walkToDraft(page, 'Simulasi SKD CPNS')

    await expect.poll(() => created.length).toBe(1)
    expect(created[0]!.body.ownerBimbelId).toBeUndefined()
    await expect(page).toHaveURL(/\/dashboard\/tutor\/products\/prd_1\/edit/)
  })

  test('tanpa keanggotaan aktif non-student, pemilihnya tidak ada sama sekali', async ({ page }) => {
    await mockWizard(page, INELIGIBLE)
    await page.goto('/dashboard/tutor/products/new', { waitUntil: 'networkidle' })

    // Langkah 1 memang sudah dirender — jadi absennya pemilih bukan sekadar
    // halaman yang belum selesai memuat.
    await expect(page.getByRole('combobox', { name: 'Tipe', exact: true })).toBeVisible()
    await expect(page.getByText('Terbitkan sebagai')).toHaveCount(0)
  })
})

test.describe('wizard — Terbitkan sebagai (ruang kerja bimbel)', () => {
  test('pemiliknya keadaan, bukan pilihan, dan tidak diulang di body', async ({ page }) => {
    const created = await mockWizard(page, MEMBERSHIPS)
    await page.goto('/dashboard/bimbel/bmb-1/products/new', { waitUntil: 'networkidle' })

    await expect(page.getByRole('combobox', { name: 'Terbitkan sebagai', exact: true })).toHaveCount(0)
    await expect(page.getByText('Paket ini dibuat di ruang kerja')).toBeVisible()

    await walkToDraft(page, 'Paket Bimbel')

    await expect.poll(() => created.length).toBe(1)
    expect(created[0]!.url).toContain('/bimbel/bmb-1/products')
    expect(created[0]!.body.ownerBimbelId).toBeUndefined()
  })
})

test.describe('wizard — pemilik tidak bisa dipindah', () => {
  test('mode edit tidak menampilkan apa pun soal kepemilikan', async ({ page }) => {
    await mockWizard(page, MEMBERSHIPS)
    await page.route('**/tutor/products/prd_1', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'prd_1',
          type: 'single',
          title: 'Draft',
          status: 'draft',
          examType: 'skd-cpns',
          category: 'SKD/CPNS',
          mode: 'simulasi',
          sections: [],
          includes: [],
          price: 0,
          priceOriginal: 0,
          description: '',
          thumbnailUrl: '',
        }),
      }))
    await page.goto('/dashboard/tutor/products/prd_1/edit?langkah=1', { waitUntil: 'networkidle' })

    await expect(page.getByRole('combobox', { name: 'Tipe', exact: true })).toBeVisible()
    await expect(page.getByText('Terbitkan sebagai')).toHaveCount(0)
  })
})
