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

    await page.getByPlaceholder('Cari paket, topik, atau tutor').fill('SNBT')
    await page.getByRole('button', { name: 'Cari paket' }).click()

    await expect(page).toHaveURL(/\/paket\?q=SNBT/)
  })

  test('a popular-search chip navigates into /paket', async ({ page }) => {
    await gotoHydrated(page, '/')

    // Scoped to <main>: the footer links the same query, so an unscoped
    // locator matches two elements and fails on strict mode.
    await page.getByRole('main').getByRole('link', { name: 'BUMN', exact: true }).click()

    await expect(page).toHaveURL(/\/paket\?q=BUMN/)
    await expect(page.getByRole('heading', { name: 'Semua paket' })).toBeVisible()
  })
})
