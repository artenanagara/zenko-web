import type { Page } from '@playwright/test'

import { expect, gotoHydrated, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

const SLUG = 'to-bimbel-nusantara-01'
const LOGO = 'https://images.unsplash.com/bimbel-nusantara-logo.png'

/**
 * Blueprint milik paket yang dimiliki akun — bentuk yang sama dengan balasan
 * GET /me/packages/:slug/tryout, tanpa kunci jawaban persis seperti aslinya.
 */
function blueprint(brand?: { name: string, logoUrl?: string }) {
  return {
    slug: SLUG,
    title: 'Tryout Bimbel Nusantara 01',
    theme: { system: 'CAT BKN', agency: 'Badan Kepegawaian Negara', seal: '' },
    mode: 'flat',
    brand,
    totalDurationMinutes: 10,
    sections: [{
      id: 'twk',
      code: 'TWK',
      title: 'Tes Wawasan Kebangsaan',
      durationMinutes: 10,
      scoringMode: 'flat',
      questions: [{
        id: 'q1',
        kind: 'objective',
        text: '<p>Ibu kota Indonesia?</p>',
        points: 5,
        options: [{ label: 'A', text: 'Bandung' }, { label: 'B', text: 'Jakarta' }],
      }],
    }],
  }
}

/** Masuk ke ruang ujian sampai timer berjalan — di situlah header dipasang. */
async function enterExamRoom(page: Page, brand?: { name: string, logoUrl?: string }) {
  await mockSignedIn(page, buildUser())
  await page.route(`**/me/packages/${SLUG}/tryout`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blueprint(brand)) }))
  await page.route(`**/me/packages/${SLUG}/tryout/start`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sittingId: 'sit-1', deadlineAt: Math.floor(Date.now() / 1000) + 600 }) }))

  await gotoHydrated(page, `/akun/paket/${SLUG}/kerjakan`)
  await page.getByRole('button', { name: 'Mulai ujian' }).click()
  await expect(page.getByRole('timer')).toBeVisible()
}

/**
 * Identitas di header ruang ujian. Bagi siswa sebuah bimbel, ruang ini adalah
 * ruang ujian lembaganya — logo lembaganya yang tampil, dengan Zenko turun
 * jadi baris atribusi kecil di bawahnya.
 */
test.describe('exam room branding (/akun/paket/:slug/kerjakan)', () => {
  test('a bimbel package wears the bimbel logo and credits Zenko', async ({ page }) => {
    await enterExamRoom(page, { name: 'Bimbel Nusantara', logoUrl: LOGO })

    const header = page.getByRole('banner')
    await expect(header.getByAltText('Bimbel Nusantara')).toHaveAttribute('src', LOGO)
    await expect(header.getByText('Powered by Zenko')).toBeVisible()
    // Lockup Zenko menyingkir supaya tidak ada dua logo di satu header.
    await expect(header.locator('img[src*="zenko-lockup"]')).toHaveCount(0)
  })

  test('a bimbel that never uploaded a logo keeps the Zenko lockup', async ({ page }) => {
    await enterExamRoom(page, { name: 'Bimbel Tanpa Logo' })

    const header = page.getByRole('banner')
    await expect(header.locator('img[src*="zenko-lockup"]')).toHaveCount(1)
    await expect(header.getByText('Powered by Zenko')).toHaveCount(0)
  })

  test('a marketplace package is still a Zenko room', async ({ page }) => {
    await enterExamRoom(page)

    const header = page.getByRole('banner')
    await expect(header.locator('img[src*="zenko-lockup"]')).toHaveCount(1)
    await expect(header.getByText('Powered by Zenko')).toHaveCount(0)
  })
})
