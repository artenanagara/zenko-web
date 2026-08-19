import { expect, gotoHydrated, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'

test.describe('catalog (/paket)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, '/paket')
  })

  test('renders mock packages from app/mocks/catalog.ts', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Semua paket' })
    await expect(heading).toBeVisible()

    // 12 mock packages per the fixture; the counter next to the heading
    // reflects the filtered (here: unfiltered) count.
    await expect(heading.getByText('(12)')).toBeVisible()

    await expect(page.getByRole('link', { name: /Latihan CPNS 2026 Intensif/ })).toBeVisible()
  })

  test('sort tabs change the result order', async ({ page }) => {
    const firstCardTitle = () => page.locator('a[href^="/paket/"] h3').first().innerText()

    // Default sort is "featured" (Pilihan) — curated flag first, then
    // popularity. See sortMockPackages in app/mocks/catalog.ts.
    const featuredFirst = await firstCardTitle()

    await page.getByRole('button', { name: /Urutkan/ }).click()
    await page.getByRole('menuitemradio', { name: 'Terlaris' }).click()

    await expect(page.getByRole('button', { name: /Terlaris/ })).toBeVisible()

    const bestsellerFirst = await firstCardTitle()

    // "Terlaris" (bestseller) orders purely by soldCount; the featured-first
    // package (2.1rb sold) is not the top seller (3.4rb, Paket Hemat SKD
    // Kedinasan), so the leading card must change.
    expect(bestsellerFirst).not.toBe(featuredFirst)
  })

  test('clicking a package navigates to its detail page', async ({ page }) => {
    await page.getByRole('link', { name: /Latihan CPNS 2026 Intensif/ }).click()

    await expect(page).toHaveURL('/paket/cpns-2026-intensif')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Latihan CPNS 2026 Intensif')
  })
})
