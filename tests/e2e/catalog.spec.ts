import { expect, gotoHydrated, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'
import { FIRST_BY_SORT, PACKAGES, PACKAGE_COUNT } from './support/catalog'

const CPNS = PACKAGES['cpns-2026-intensif']!
const CARD = `article:has(a[href="/paket/${CPNS.slug}"])`

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
    // The paket link now sits inside the <h3>, not around it (PackageCard
    // uses a stretched link so the tutor name can be its own anchor without
    // nesting) — so the heading is the outer element here.
    const firstCardTitle = () => page.locator('h3:has(a[href^="/paket/"])').first().innerText()

    // Default sort is "featured" (Pilihan). The expected orderings are fixed
    // in support/catalog.ts — the API ranks on fields it never serialises
    // (soldCount, publishedAt, featured), so the browser has nothing to sort
    // with and the order it shows must be the order it was served.
    expect(await firstCardTitle()).toBe(FIRST_BY_SORT.featured)

    await page.getByRole('button', { name: /Urutkan/ }).click()
    await page.getByRole('menuitemradio', { name: 'Banyak dikerjakan' }).click()

    await expect(page.getByRole('button', { name: /Banyak dikerjakan/ })).toBeVisible()

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

  /**
   * PackageCard carries two links now — the paket and its tutor — so it can no
   * longer be one anchor wrapped around everything. It uses a stretched link
   * instead: the paket anchor wraps only the title and its ::after covers the
   * card. These guard the two ways that goes wrong: an <a> nested in an <a>
   * (invalid, and browsers close the outer one early), and an overlay that
   * stops short so most of the card is no longer clickable.
   */
  test('cards carry no nested anchors', async ({ page }) => {
    await expect(page.locator('a a')).toHaveCount(0)
    // The card root itself must not be an anchor any more.
    await expect(page.locator(`a:has(${CARD})`)).toHaveCount(0)
  })

  test('the whole card still targets the paket, not just the title', async ({ page }) => {
    // The topmost element at each point is what a click would land on. Probing
    // beats clicking here: Playwright refuses a click it can see is
    // intercepted, which is exactly what a working overlay does.
    const hits = await page.locator(CARD).first().evaluate((card) => {
      const box = card.getBoundingClientRect()
      // Bottom of the card is skipped: the fixed cookie banner sits over it.
      return [0.1, 0.3, 0.5, 0.7, 0.85].map((fraction) => {
        const el = document.elementFromPoint(box.x + box.width / 2, box.y + box.height * fraction)
        return el?.closest('a')?.getAttribute('href') ?? null
      })
    })

    expect(hits).toEqual(Array<string>(5).fill(`/paket/${CPNS.slug}`))
  })

  test('the tutor name links to their profile, and only when they have one', async ({ page }) => {
    const linked = page.locator(CARD).first()
    await expect(linked.getByRole('link', { name: CPNS.author.name })).toHaveAttribute(
      'href',
      `/tutor/${CPNS.author.username}`,
    )

    // A seeded paket has no tutor account behind it, so the name stays text —
    // a link to /tutor/ would 404.
    const seeded = PACKAGES['prediksi-bumn-2026']!
    expect(seeded.author.username).toBe('')
    const seededCard = page.locator(`article:has(a[href="/paket/${seeded.slug}"])`).first()
    await expect(seededCard.getByText(seeded.author.name)).toBeVisible()
    await expect(seededCard.getByRole('link', { name: seeded.author.name })).toHaveCount(0)
  })
})
