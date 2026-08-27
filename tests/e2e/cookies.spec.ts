import { expect, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'

test.describe('cookie consent', () => {
  test('stores a device preference when optional cookies are rejected', async ({ page }) => {
    await mockSignedOut(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const dialog = page.getByRole('dialog', { name: 'Kami menggunakan cookies' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Cookies wajib membantu Zenko menjaga login dan keamanan akun.')).toBeVisible()

    await dialog.getByRole('button', { name: 'Tolak opsional' }).click()
    await expect(dialog).toHaveCount(0)

    await expect
      .poll(async () => (await page.context().cookies()).find(cookie => cookie.name === 'zenko_cookie_consent')?.value)
      .toBe('rejected')

    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByRole('dialog', { name: 'Kami menggunakan cookies' })).toHaveCount(0)
  })
})
