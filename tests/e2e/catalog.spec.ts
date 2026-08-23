import { expect, gotoHydrated, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'
import { FIRST_BY_SORT, PACKAGES, PACKAGE_COUNT } from './support/catalog'

const CPNS = PACKAGES['cpns-2026-intensif']!

test.describe('catalog (/paket)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, '/paket')
  })

  test('renders the packages the API returns', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Semua paket' })
    await expect(heading).toBeVisible()

    // The counter next to the heading reflects the filtered count; nothing is
    // filtered here, so it is the whole fixture catalogue.
    await expect(heading.getByText(`(${PACKAGE_COUNT})`)).toBeVisible()

    await expect(page.getByRole('link', { name: new RegExp(CPNS.title) })).toBeVisible()
  })

  test('sort tabs re-request the catalogue and render the new order', async ({ page }) => {
    const firstCardTitle = () => page.locator('a[href^="/paket/"] h3').first().innerText()

    // Default sort is "featured" (Pilihan). The expected orderings are fixed
    // in support/catalog.ts — the API ranks on fields it never serialises
    // (soldCount, publishedAt, featured), so the browser has nothing to sort
    // with and the order it shows must be the order it was served.
    expect(await firstCardTitle()).toBe(FIRST_BY_SORT.featured)

    await page.getByRole('button', { name: /Urutkan/ }).click()
    await page.getByRole('menuitemradio', { name: 'Terlaris' }).click()

    await expect(page.getByRole('button', { name: /Terlaris/ })).toBeVisible()

    // "Terlaris" (bestseller) orders purely by units sold, so the curated
    // package that leads the default view is displaced by the actual top
    // seller. Asserting on both the change and the specific title keeps the
    // test honest: a page that simply failed to re-render would pass the
    // first check alone.
    expect(FIRST_BY_SORT.bestseller).not.toBe(FIRST_BY_SORT.featured)
    await expect
      .poll(firstCardTitle, { message: 'first card after switching to Terlaris' })
      .toBe(FIRST_BY_SORT.bestseller)
  })

  test('clicking a package navigates to its detail page', async ({ page }) => {
    await page.getByRole('link', { name: new RegExp(CPNS.title) }).click()

    await expect(page).toHaveURL(`/paket/${CPNS.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(CPNS.title)
  })
})
