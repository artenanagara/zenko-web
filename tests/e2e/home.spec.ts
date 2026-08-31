import { expect, gotoHydrated, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    // The auth plugin calls GET /auth/me on every boot regardless of the
    // page; keep it deterministic instead of relying on the real API being
    // unreachable.
    await mockSignedOut(page)
  })

  test('loads with the expected title', async ({ page }) => {
    await gotoHydrated(page, '/')
    await expect(page).toHaveTitle(/Zenko/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('search form submits into /paket', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.getByPlaceholder('Cari paket soal, topik materi, atau nama tutor...').fill('SNBT')
    await page.getByRole('button', { name: 'Cari Paket' }).click()

    await expect(page).toHaveURL(/\/paket\?q=SNBT/)
  })

  test('a popular-search chip navigates into /paket', async ({ page }) => {
    await gotoHydrated(page, '/')

    // Scoped to <main>: the footer links similar queries, so an unscoped
    // locator can match two elements and fail on strict mode. The chips are
    // the post-rework catalogue: SKD & TKA only (HeroSection.popularSearches).
    await page.getByRole('main').getByRole('link', { name: 'SKD CPNS', exact: true }).click()

    await expect(page).toHaveURL(/\/paket\?q=SKD(\+|%20)CPNS/)
    await expect(page.getByRole('heading', { name: 'Semua paket' })).toBeVisible()
  })
})
