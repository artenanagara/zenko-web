import { expect, gotoHydrated, test } from './support/fixtures'
import { buildUser, mockLoginFailure, mockLoginSuccess, mockSignedOut } from './support/auth'

test.describe('login (/masuk)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, '/masuk')
  })

  test('shows validation errors on empty submit, without calling the API', async ({ page }) => {
    let loginCalled = false
    await page.route('**/auth/login', async (route) => {
      loginCalled = true
      await route.fulfill({ status: 500, body: '{}' })
    })

    await page.getByRole('button', { name: 'Masuk', exact: true }).click()

    await expect(page.getByText('Email wajib diisi.')).toBeVisible()
    await expect(page.getByText('Kata sandi wajib diisi.')).toBeVisible()
    expect(loginCalled).toBe(false)
  })

  test('shows a validation error on a malformed email', async ({ page }) => {
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Kata sandi', { exact: true }).fill('somepassword')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()

    await expect(page.getByText('Format email belum benar.')).toBeVisible()
  })

  test('a successful login redirects away from /masuk', async ({ page }) => {
    await mockLoginSuccess(page, buildUser({ role: 'student' }))

    await page.getByLabel('Email').fill('siswa@example.com')
    await page.getByLabel('Kata sandi', { exact: true }).fill('password123')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()

    // Student's home is /akun (see homePathFor in shared/types/user.ts).
    await expect(page).toHaveURL('/akun')
  })

  test('a failed login (401) surfaces an error message and stays on /masuk', async ({ page }) => {
    await mockLoginFailure(page, 401, 'invalid credentials')

    await page.getByLabel('Email').fill('siswa@example.com')
    await page.getByLabel('Kata sandi', { exact: true }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()

    await expect(page.getByText('Email atau kata sandi tidak cocok.')).toBeVisible()
    await expect(page).toHaveURL('/masuk')
  })
})
