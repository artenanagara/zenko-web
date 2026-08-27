import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

/**
 * Langkah 1 wizard produk tutor: angka "Jumlah soal" / "Durasi" yang diketik
 * tutor harus bertahan sampai ke POST /tutor/products.
 *
 * Regresi yang dijaga di sini: memilih subtes dulu mengisikan angka template
 * sebagai titik awal (itu memang disengaja), tapi versi lama menimpa kedua
 * field TANPA SYARAT setiap kali `sectionTitle` berubah. Tutor yang mengetik
 * "35" lebih dulu lalu memilih subtes diam-diam kembali ke 30 — dan 30 itulah
 * yang terkirim ke server, jadi langkah "Isi" meminta jumlah soal template
 * alih-alih jumlah yang diminta tutor. Laporan aslinya: "jumlah soal custom,
 * tapi di isi soal masih sesuai template".
 *
 * Semuanya di-stub lewat page.route(): `/dashboard/**` adalah `ssr: false`
 * (nuxt.config.ts routeRules), jadi bahkan useFetch-nya useExamTypes() berjalan
 * di browser dan terlihat oleh page.route — spec ini tidak menyentuh stub API
 * bersama di support/stub-api.mjs sama sekali.
 */

/** Satu jenis ujian dengan dua subtes yang angkanya sengaja dibedakan. */
const EXAM_TYPES = [
  {
    slug: 'tka-smp',
    label: 'TKA SMP',
    description: 'Fixture',
    category: 'TKA SMP',
    sections: [
      {
        title: 'Bahasa Indonesia (Literasi Membaca)',
        questionTarget: 30,
        durationMinutes: 75,
        scoringMode: 'flat',
        pointsCorrect: 1,
        passingGrade: null,
        defaultKind: 'single_choice',
      },
      {
        title: 'Matematika (Numerasi)',
        questionTarget: 20,
        durationMinutes: 50,
        scoringMode: 'flat',
        pointsCorrect: 1,
        passingGrade: null,
        defaultKind: 'single_choice',
      },
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

/** AppSelect adalah combobox ARIA (app/components/core/AppSelect.vue). */
async function chooseOption(page: Page, comboboxName: string, optionName: string): Promise<void> {
  await page.getByRole('combobox', { name: comboboxName, exact: true }).click()
  await page.getByRole('option', { name: optionName, exact: false }).first().click()
}

async function openMiniTryoutStep(page: Page): Promise<void> {
  // Banner cookie-nya `fixed` di atas footer langkah dan menelan klik pertama
  // ke kontrol mana pun. Menjawabnya lewat cookie yang sama seperti pengunjung
  // yang sudah pernah memilih (useCookieConsent: `zenko_cookie_consent`) lebih
  // stabil daripada mengklik tombolnya di setiap test.
  await page.context().addCookies([
    { name: 'zenko_cookie_consent', value: 'rejected', domain: 'localhost', path: '/' },
  ])

  await page.goto('/dashboard/tutor/products/new', { waitUntil: 'networkidle' })
  await chooseOption(page, 'Kategori ujian', 'TKA SMP')
  await chooseOption(page, 'Jenis ujian', 'Mini Try Out')
}

test.describe('wizard produk tutor — jumlah soal & durasi custom (langkah 1)', () => {
  test('angka yang diketik sebelum subtes dipilih tidak ditimpa angka template', async ({ page }) => {
    await mockWizardApi(page)
    await openMiniTryoutStep(page)

    const questionTarget = page.locator('#product-question-target')
    const durationMinutes = page.locator('#product-duration-minutes')

    // Tutor mengetik angkanya lebih dulu, lalu baru memilih subtes.
    await questionTarget.fill('35')
    await durationMinutes.fill('90')
    await chooseOption(page, 'Subtes', 'Bahasa Indonesia (Literasi Membaca)')

    // Template subtes ini 30 soal / 75 menit — angka tutor yang harus menang.
    await expect(questionTarget).toHaveValue('35')
    await expect(durationMinutes).toHaveValue('90')
  })

  test('mengganti subtes tidak menimpa angka yang sudah diketik tutor', async ({ page }) => {
    await mockWizardApi(page)
    await openMiniTryoutStep(page)

    const questionTarget = page.locator('#product-question-target')
    const durationMinutes = page.locator('#product-duration-minutes')

    await chooseOption(page, 'Subtes', 'Bahasa Indonesia (Literasi Membaca)')
    await questionTarget.fill('35')
    await durationMinutes.fill('90')

    // Subtes kedua templatenya 20 soal / 50 menit.
    await chooseOption(page, 'Subtes', 'Matematika (Numerasi)')

    await expect(questionTarget).toHaveValue('35')
    await expect(durationMinutes).toHaveValue('90')
  })

  test('field yang belum disentuh tetap mengikuti template subtes yang dipilih', async ({ page }) => {
    await mockWizardApi(page)
    await openMiniTryoutStep(page)

    const questionTarget = page.locator('#product-question-target')
    const durationMinutes = page.locator('#product-duration-minutes')

    await chooseOption(page, 'Subtes', 'Bahasa Indonesia (Literasi Membaca)')
    await expect(questionTarget).toHaveValue('30')
    await expect(durationMinutes).toHaveValue('75')

    // Masih belum disentuh, jadi mengganti subtes harus ikut template baru.
    await chooseOption(page, 'Subtes', 'Matematika (Numerasi)')
    await expect(questionTarget).toHaveValue('20')
    await expect(durationMinutes).toHaveValue('50')
  })

  test('angka custom ikut terkirim di POST /tutor/products', async ({ page }) => {
    const { createdBodies } = await mockWizardApi(page)
    await openMiniTryoutStep(page)

    await page.locator('#product-question-target').fill('35')
    await page.locator('#product-duration-minutes').fill('90')
    await chooseOption(page, 'Subtes', 'Bahasa Indonesia (Literasi Membaca)')

    await page.getByRole('button', { name: 'Lanjut' }).click()

    // Langkah 2 — judul dan minimal satu "yang kamu dapatkan" wajib diisi
    // sebelum wizard mau menyimpan draft.
    await page.locator('#product-title').fill('Try Out TKA SMP Literasi')
    await page.locator('#product-description').fill('Deskripsi uji.')
    await page.locator('input[type="checkbox"]').first().check()

    await page.getByRole('button', { name: /Simpan draft/ }).click()

    await expect.poll(() => createdBodies.length).toBe(1)
    expect(createdBodies[0]).toMatchObject({
      mode: 'mini_tryout',
      sectionTitle: 'Bahasa Indonesia (Literasi Membaca)',
      questionTarget: 35,
      durationMinutes: 90,
    })
  })
})
