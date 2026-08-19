import { expect, gotoHydrated, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

// Not owned by the mock account fixture (app/mocks/account.ts) — using an
// already-owned slug here would render the "you already own this" branch
// instead of the checkout form, per usePackageOwnershipGuard.
const SLUG = 'paket-hemat-skd-kedinasan'

test.describe('checkout (/checkout/[slug])', () => {
  test('signed-in buyer sees "payment not connected" instead of an order being placed, with paymentEnabled off', async ({ page }) => {
    await mockSignedIn(page, buildUser())

    // No route registered for **/orders: if the app ever called it despite
    // paymentEnabled being off, the test would fail on an unhandled request
    // rather than silently passing.
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
    await page.route('**/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) }))

    await gotoHydrated(page, `/checkout/${SLUG}`)

    await expect(page.getByText('Masuk dulu supaya paket ini tercatat di akunmu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bayar sekarang' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Masuk untuk melanjutkan' })).toBeVisible()
  })
})
