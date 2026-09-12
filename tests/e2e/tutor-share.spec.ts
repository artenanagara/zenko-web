import { expect, gotoHydrated, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

const NOW = 1_789_156_800

test.describe('custom tutor revenue share', () => {
  test('shows the tutor rate and the immutable percentage per sale on phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockSignedIn(page, buildUser({ role: 'tutor', name: 'Tutor Contoh' }))

    await page.route('**/api/v1/tutor/share-rate', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        serverTime: NOW,
        scheduleVersion: 2,
        effectivePercent: 85,
        effectiveSince: NOW - 86_400,
        nextChange: { startsAt: NOW + 30 * 86_400, effectivePercent: 70 },
        notificationStatus: 'email_sent',
        schedule: [],
        changeHistory: [{
          id: 'change_1',
          percent: 85,
          startsAt: NOW - 86_400,
          endsAt: NOW + 30 * 86_400,
          noteForTutor: 'Insentif peluncuran paket baru.',
          createdAt: NOW - 172_800,
          baseVersion: 1,
          resultingVersion: 2,
        }],
        notifications: [],
        termsVersion: '2026-09-12',
        termsAccepted: true,
      }),
    }))
    await page.route('**/api/v1/tutor/sales**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: { count: 1, gross: 100_000, share: 85_000 },
        sales: [{
          orderId: 'order_1',
          invoice: 'ZNK-001',
          paidAt: Math.floor(Date.now() / 1000),
          productId: 'product_1',
          productTitle: 'Paket SKD',
          productType: 'single',
          buyerName: 'Ra*** P.',
          price: 100_000,
          share: 85_000,
          sharePercent: 85,
          shareStatus: 'available',
        }],
      }),
    }))
    await page.route('**/api/v1/tutor/products', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    }))

    await gotoHydrated(page, '/dashboard/tutor/sales')

    await expect(page.getByRole('heading', { name: 'Bagi hasilmu' })).toBeVisible()
    await expect(page.getByText('Insentif peluncuran paket baru.')).toBeVisible()
    const saleCard = page.getByRole('article')
    await expect(saleCard.getByText('%', { exact: true })).toBeVisible()
    await expect(saleCard.getByText('85%', { exact: true })).toBeVisible()
  })

  test('keeps the owner-only tab undiscoverable for ordinary admins', async ({ page }) => {
    await mockSignedIn(page, buildUser({ role: 'admin', canManageShareSchedule: false }))
    await page.route('**/api/v1/admin/tutors/tutor_1', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'tutor_1', email: 'tutor@example.com', name: 'Tutor Contoh', avatarUrl: '',
        role: 'tutor', verified: true, createdAt: NOW, canManageShareSchedule: false,
        profile: {
          accountId: 'tutor_1', displayName: 'Tutor Contoh', avatarUrl: '', username: 'tutor-contoh',
          usernameChangedAt: 0, bio: '', experience: '', specializations: [], education: '',
          portfolioUrl: '', instagramUrl: '', tiktokUrl: '', linkedinUrl: '', youtubeUrl: '', websiteUrl: '', updatedAt: 0,
        },
        products: [],
      }),
    }))

    await gotoHydrated(page, '/dashboard/admin/tutors/tutor_1')

    await expect(page.getByRole('tab', { name: 'Bagi hasil' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Atur tarif' })).toHaveCount(0)
  })

  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 800 }]) {
    test(`keeps the rate editor inside the ${viewport.name} viewport and offers presets only`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await mockSignedIn(page, buildUser({ role: 'admin', canManageShareSchedule: true }))
      await page.route('**/api/v1/admin/tutors/tutor_1', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'tutor_1', email: 'tutor@example.com', name: 'Tutor Contoh', avatarUrl: '',
          role: 'tutor', verified: true, createdAt: NOW,
          profile: {
            accountId: 'tutor_1', displayName: 'Tutor Contoh', avatarUrl: '', username: 'tutor-contoh',
            usernameChangedAt: 0, bio: '', experience: '', specializations: [], education: '',
            portfolioUrl: '', instagramUrl: '', tiktokUrl: '', linkedinUrl: '', youtubeUrl: '', websiteUrl: '', updatedAt: 0,
          },
          products: [],
        }),
      }))
      await page.route('**/api/v1/admin/tutors/tutor_1/share-schedule', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          serverTime: NOW, scheduleVersion: 0, effectivePercent: 70, nextChange: null,
          notificationStatus: 'none', schedule: [], changeHistory: [], notifications: [],
          termsVersion: '2026-09-12', termsAccepted: false,
        }),
      }))

      await gotoHydrated(page, '/dashboard/admin/tutors/tutor_1')
      await page.getByRole('tab', { name: 'Bagi hasil' }).click()
      // Terms acceptance no longer gates the editor.
      await page.getByRole('button', { name: 'Atur tarif' }).click()

      const dialog = page.getByRole('dialog', { name: 'Atur tarif bagi hasil' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: /^(75|80|85|90)%$/ })).toHaveCount(4)
      await expect(dialog.getByRole('button', { name: 'Standar 70%' })).toBeVisible()
      await expect(dialog.getByLabel('Persentase lain')).toHaveCount(0)
      await expect(dialog.getByRole('button', { name: 'Tinjau perubahan' })).toBeInViewport()

      const box = await dialog.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    })
  }
})
