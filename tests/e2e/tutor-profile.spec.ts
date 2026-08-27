import { expect, gotoHydrated, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'
import {
  TUTOR,
  TUTOR_PRODUCT_COUNT,
  TUTOR_REVIEW_COUNT,
  TUTOR_SOLO,
  TUTOR_SOLO_PRODUCT_COUNT,
  TUTOR_TOP_RATED_INDEX,
} from './support/catalog'

const PROFILE = `/tutor/${TUTOR.username}`

/** Matches the page constants in the TutorProfile* components. */
const PRODUCTS_PAGE = 12
const REVIEWS_PAGE = 8

const productCards = (page: import('@playwright/test').Page) =>
  page.locator('#tutor-panel-produk [data-product-item]')
const reviewCards = (page: import('@playwright/test').Page) =>
  page.locator('#tutor-panel-ulasan [data-review-item]')

test.describe('tutor profile (/tutor/:username)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, PROFILE)
  })

  test('opens on Produk and exposes a real tablist', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Bagian profil tutor' })
    await expect(tablist.getByRole('tab', { name: /Produk/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(TUTOR.name)
  })

  test('arrow keys move between tabs and the URL follows', async ({ page }) => {
    await page.getByRole('tab', { name: /Produk/ }).focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.getByRole('tab', { name: 'Tentang' })).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(`${PROFILE}?tab=tentang`)

    await page.keyboard.press('End')
    await expect(page.getByRole('tab', { name: /Ulasan/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(`${PROFILE}?tab=ulasan`)
  })

  test('an unknown ?tab falls back to Produk instead of a blank panel', async ({ page }) => {
    await gotoHydrated(page, `${PROFILE}?tab=nonsense`)
    await expect(page.getByRole('tab', { name: /Produk/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('products page in, and the button names the remainder', async ({ page }) => {
    await expect(productCards(page)).toHaveCount(PRODUCTS_PAGE)

    const remainder = TUTOR_PRODUCT_COUNT - PRODUCTS_PAGE
    const more = page.getByRole('button', { name: `Muat ${remainder} paket lagi` })
    await more.click()

    await expect(productCards(page)).toHaveCount(TUTOR_PRODUCT_COUNT)
    // Exhausted, so the button removes itself...
    await expect(more).toHaveCount(0)
    // ...and focus must not fall back to <body>.
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? null)
    expect(focused).not.toBe('BODY')
  })

  test('reviews page in the same way', async ({ page }) => {
    await page.getByRole('tab', { name: /Ulasan/ }).click()
    await expect(reviewCards(page)).toHaveCount(REVIEWS_PAGE)

    const remainder = TUTOR_REVIEW_COUNT - REVIEWS_PAGE
    await page.getByRole('button', { name: `Muat ${remainder} ulasan lagi` }).click()
    await expect(reviewCards(page)).toHaveCount(TUTOR_REVIEW_COUNT)
  })

  test('a star bar filters the list, and says how much is showing', async ({ page }) => {
    await page.getByRole('tab', { name: /Ulasan/ }).click()

    const fiveStar = page.getByRole('button', { name: /^Saring \d+ ulasan 5 bintang$/ })
    await expect(fiveStar).toHaveAttribute('aria-pressed', 'false')
    await fiveStar.click()
    await expect(fiveStar).toHaveAttribute('aria-pressed', 'true')

    // Six 5★ reviews in the fixture: under one page, so all of them show.
    await expect(reviewCards(page)).toHaveCount(6)
    await expect(page.getByText('Menampilkan 6 dari 6 ulasan 5 bintang')).toBeVisible()
    // The bars themselves still come from the unfiltered array — filtering
    // server-side would have removed the control being used.
    await expect(page.getByRole('button', { name: /^Saring \d+ ulasan 4 bintang$/ })).toBeVisible()

    await page.getByRole('button', { name: 'Tampilkan semua ulasan' }).click()
    await expect(fiveStar).toHaveAttribute('aria-pressed', 'false')
    await expect(reviewCards(page)).toHaveCount(REVIEWS_PAGE)
  })

  test('a star with no reviews behind it is not a button', async ({ page }) => {
    await page.getByRole('tab', { name: /Ulasan/ }).click()
    // The fixture has no 2★ review, so that bar must not offer a filter that
    // could only ever produce an empty list.
    await expect(page.getByRole('button', { name: /ulasan 2 bintang/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /ulasan 5 bintang/ })).toHaveCount(1)
  })

  test('filtering resets paging rather than keeping the old offset', async ({ page }) => {
    await page.getByRole('tab', { name: /Ulasan/ }).click()
    await page.getByRole('button', { name: /ulasan 5 bintang/ }).click()
    await page.getByRole('button', { name: 'Tampilkan semua ulasan' }).click()

    // Back to a first page, not to whatever had been loaded before.
    await expect(reviewCards(page)).toHaveCount(REVIEWS_PAGE)
  })

  /* ---------------------------------------------------------------- produk
   * The Produk tab renders catalog/PackageCard, the same component the
   * catalogue uses, rather than a profile-only card that drifts from it.
   */

  test('product cards are the catalogue card, minus the self-link', async ({ page }) => {
    const first = productCards(page).first()
    // PackageCard's shape: the paket link lives inside the heading.
    await expect(first.locator('h3 a[href^="/paket/"]')).toHaveCount(1)
    // The tutor's name renders, but NOT as a link: on this page that link
    // would point at the page you are already on. The page feeds PackageCard
    // a blank username for exactly this reason, so guard against a future
    // change quietly restoring twelve self-links and twelve dead tab stops.
    await expect(first.getByText(TUTOR.name)).toBeVisible()
    await expect(first.getByRole('link', { name: TUTOR.name })).toHaveCount(0)
    await expect(page.locator(`#tutor-panel-produk a[href="/tutor/${TUTOR.username}"]`)).toHaveCount(0)
    await expect(page.locator('a a')).toHaveCount(0)
  })

  test('the category dropdown offers only this tutor\'s categories, with counts', async ({ page }) => {
    await page.getByRole('button', { name: /^Kategori/ }).click()

    const options = page.getByRole('menuitemradio')
    await expect(options).toHaveText([
      `Semua kategori (${TUTOR_PRODUCT_COUNT})`,
      'BUMN (5)',
      'SKD/CPNS (5)',
      'SNBT (5)',
    ])
    // A global category list would have offered these; the tutor has none.
    await expect(page.getByRole('menuitemradio', { name: /Kedinasan|Ujian Mandiri/ })).toHaveCount(0)
  })

  test('choosing a category filters the grid and the count line follows', async ({ page }) => {
    await page.getByRole('button', { name: /^Kategori/ }).click()
    await page.getByRole('menuitemradio', { name: 'SNBT (5)' }).click()

    await expect(productCards(page)).toHaveCount(5)
    await expect(page.getByText('Menampilkan 5 dari 5 paket kategori SNBT.')).toBeVisible()
    // Filtered below one page, so nothing is left to load.
    await expect(page.getByRole('button', { name: /Muat \d+ paket lagi/ })).toHaveCount(0)
  })

  test('sorting reorders the grid without touching the server', async ({ page }) => {
    const firstTitle = () => productCards(page).first().locator('h3').innerText()

    // Default is Terbaru, and the fixture's updatedAt descends with the index.
    expect(await firstTitle()).toBe('Paket latihan nomor 1')

    await page.getByRole('button', { name: /^Urutkan/ }).click()
    await page.getByRole('menuitemradio', { name: 'Harga tertinggi' }).click()
    expect(await firstTitle()).toBe(`Paket latihan nomor ${TUTOR_PRODUCT_COUNT}`)

    await page.getByRole('button', { name: /^Urutkan/ }).click()
    await page.getByRole('menuitemradio', { name: 'Rating tertinggi' }).click()
    expect(await firstTitle()).toBe(`Paket latihan nomor ${TUTOR_TOP_RATED_INDEX + 1}`)
  })

  test('changing sort resets paging instead of keeping the old offset', async ({ page }) => {
    await page.getByRole('button', { name: /Muat \d+ paket lagi/ }).click()
    await expect(productCards(page)).toHaveCount(TUTOR_PRODUCT_COUNT)

    await page.getByRole('button', { name: /^Urutkan/ }).click()
    await page.getByRole('menuitemradio', { name: 'Harga terendah' }).click()

    await expect(productCards(page)).toHaveCount(PRODUCTS_PAGE)
  })

  test('the sort dropdown is operable by keyboard', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Urutkan/ })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')

    // Opens onto the current choice, per the menu pattern.
    await expect(page.getByRole('menuitemradio', { name: 'Terbaru' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitemradio', { name: 'Harga terendah' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await expect(page.getByRole('menuitemradio')).toHaveCount(0)
  })
})

test.describe('tutor profile with a single category', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, `/tutor/${TUTOR_SOLO.username}`)
  })

  test('hides the category dropdown but keeps sort', async ({ page }) => {
    await expect(productCards(page)).toHaveCount(TUTOR_SOLO_PRODUCT_COUNT)
    // One option is not a choice.
    await expect(page.getByRole('button', { name: /^Kategori/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Urutkan/ })).toHaveCount(1)
  })

  test('an unverified tutor shows no verification badge', async ({ page }) => {
    await expect(page.getByText('Tutor terverifikasi')).toHaveCount(0)
  })
})
