import { expect, gotoHydrated, test } from './support/fixtures'
import { mockRegisterFailure, mockSignedOut } from './support/auth'

test.describe('register (/daftar)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, '/daftar')
  })

  test('shows validation errors on empty submit, without calling the API', async ({ page }) => {
    let registerCalled = false
    await page.route('**/auth/register', async (route) => {
      registerCalled = true
      await route.fulfill({ status: 500, body: '{}' })
    })

    await page.getByRole('button', { name: 'Buat akun', exact: true }).click()

    await expect(page.getByText('Nama wajib diisi.')).toBeVisible()
    await expect(page.getByText('Email wajib diisi.')).toBeVisible()
    await expect(page.getByText('Kata sandi wajib diisi.')).toBeVisible()
    await expect(page.getByText('Kamu perlu menyetujui ketentuan untuk melanjutkan.')).toBeVisible()
    expect(registerCalled).toBe(false)
  })

  test('shows a validation error on a malformed email', async ({ page }) => {
    await page.getByLabel('Nama lengkap').fill('Budi Santoso')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Kata sandi', { exact: true }).fill('password123')
    await page.getByRole('button', { name: 'Buat akun', exact: true }).click()

    await expect(page.getByText('Format email belum benar.')).toBeVisible()
  })

  test('a mocked duplicate-email failure (409) surfaces an error and stays on /daftar', async ({ page }) => {
    await mockRegisterFailure(page, 409, 'email already registered')

    await page.getByLabel('Nama lengkap').fill('Budi Santoso')
    await page.getByLabel('Email').fill('sudah-terdaftar@example.com')
    await page.getByLabel('Kata sandi', { exact: true }).fill('password123')
    await page.getByLabel(/Saya setuju dengan/).check()
    await page.getByRole('button', { name: 'Buat akun', exact: true }).click()

    await expect(page.getByText('Email ini sudah terdaftar. Masuk atau gunakan lupa kata sandi.')).toBeVisible()
    await expect(page).toHaveURL('/daftar')
  })
})
