import { expect, gotoHydrated, test } from './support/fixtures'
import { buildUser, mockPackageNotOwned, mockSignedIn, mockSignedOut } from './support/auth'
import { PACKAGE_DETAILS } from './support/catalog'

// Any slug with a detail fixture works here; what matters is that the account
// does NOT own it — an owned package renders the "you already own this" branch
// instead of the checkout form, per usePackageOwnershipGuard. Ownership is a
// separate call, stubbed explicitly per test below.
const SLUG = PACKAGE_DETAILS['paket-hemat-skd-kedinasan']!.slug

test.describe('checkout (/checkout/[slug])', () => {
  test('signed-in buyer sees "payment not connected" instead of an order being placed, with paymentEnabled off', async ({ page }) => {
    await mockSignedIn(page, buildUser())
    await mockPackageNotOwned(page, SLUG)

    // Registered only to catch a call that should never happen: with
    // paymentEnabled off the page must not reach POST /orders at all, and a
    // 500 here would surface as a visible error state rather than a silent
    // pass.
    let orderCalled = false
    await page.route('**/orders', async (route) => {
      orderCalled = true
      await route.fulfill({ status: 500, body: '{}' })
    })

    await gotoHydrated(page, `/checkout/${SLUG}`)

    await expect(page.getByRole('heading', { name: 'Selesaikan pembelian' })).toBeVisible()

    await page.getByRole('button', { name: 'Bayar sekarang' }).click()

    await expect(page.getByText('Pembayaran belum aktif')).toBeVisible()
    await expect(
      page.getByText('Payment gateway belum terhubung, jadi pesanan ini'),
    ).toBeVisible()
    await expect(page.getByText('tidak dibuat')).toBeVisible()

    expect(orderCalled).toBe(false)
  })

  test('signed-out visitor is prompted to sign in instead of seeing a pay button', async ({ page }) => {
    // No ownership stub needed: usePackageOwnershipGuard never fires for a
    // guest, since nobody signed out can own anything.
    await mockSignedOut(page)

    await gotoHydrated(page, `/checkout/${SLUG}`)

    await expect(page.getByText('Masuk dulu supaya paket ini tercatat di akunmu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bayar sekarang' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Masuk untuk melanjutkan' })).toBeVisible()
  })
})
