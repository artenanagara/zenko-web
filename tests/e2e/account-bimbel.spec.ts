import { expect, test } from './support/fixtures'
import { mockSignedIn } from './support/auth'

const membership = {
  bimbelId: 'bmb-antik',
  bimbelName: 'Antik Bimbel Klaten',
  bimbelSlug: 'antik-bimbel-klaten',
  role: 'student',
  status: 'active',
  bimbelStatus: 'active',
  joinedAt: 1,
}

const bimbelPackage = {
  bimbelId: 'bmb-antik',
  bimbelName: 'Antik Bimbel Klaten',
  productId: 'prd-twk',
  packageSlug: 'antik-twk',
  title: 'Antik Bimbel Try Out SKD CPNS — TWK Part 1',
  category: 'SKD',
  attemptsUsed: 0,
  bestScore: -1,
}

async function mockBimbelPage(page: Parameters<typeof mockSignedIn>[0]) {
  await mockSignedIn(page)
  await page.route('**/me/bimbels', route => route.fulfill({ json: [membership] }))
  await page.route('**/me/bimbel-packages', route => route.fulfill({ json: [bimbelPackage] }))
  await page.route('**/me/bimbel-invitations', route => route.fulfill({ json: [] }))
  await page.route('**/bimbel-applications/me', route => route.fulfill({ json: null }))
}

test.describe('Bimbel saya', () => {
  test('anggota aktif melihat info bimbel dan paket dalam card tanpa ajakan bergabung', async ({ page }) => {
    await mockBimbelPage(page)
    await page.goto('/akun/bimbel', { waitUntil: 'networkidle' })

    await expect(page.getByRole('button', { name: 'Gabung bimbel' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Bimbel terhubung' })).toBeVisible()
    await expect(page.getByText('Keanggotaan aktif')).toBeVisible()

    const card = page.getByRole('link', { name: `Kerjakan paket ${bimbelPackage.title} dari ${membership.bimbelName}` })
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('href', '/akun/paket/antik-twk/kerjakan?dari=bimbel')
    await expect(card.getByText('Kerjakan sekarang')).toBeVisible()
  })

  test('card membuka ruang ujian dan tombol kembali tetap menuju Bimbel saya', async ({ page }) => {
    await mockBimbelPage(page)
    await page.route('**/me/packages/antik-twk/tryout', route => route.fulfill({
      json: {
        slug: 'antik-twk',
        title: bimbelPackage.title,
        theme: { system: 'CAT BKN', agency: 'BKN', seal: 'SKD' },
        mode: 'flat',
        totalDurationMinutes: 30,
        sections: [{
          id: 'sec-twk',
          code: 'TWK',
          title: 'Tes Wawasan Kebangsaan',
          durationMinutes: 30,
          questions: [{
            id: 'q-1',
            kind: 'objective',
            text: 'Contoh soal',
            options: [
              { label: 'A', text: 'Jawaban A' },
              { label: 'B', text: 'Jawaban B' },
            ],
          }],
        }],
      },
    }))

    await page.goto('/akun/bimbel', { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: `Kerjakan paket ${bimbelPackage.title} dari ${membership.bimbelName}` }).click()

    await expect(page).toHaveURL('/akun/paket/antik-twk/kerjakan?dari=bimbel')
    await expect(page.getByRole('heading', { name: bimbelPackage.title })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kembali ke Bimbel saya' })).toHaveAttribute('href', '/akun/bimbel')
  })
})
