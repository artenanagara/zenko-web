import { expect, test } from './support/fixtures'
import { buildUser, mockSignedIn } from './support/auth'

const membership = {
  bimbelId: 'bmb-1',
  bimbelName: 'Antik Bimbel Klaten',
  bimbelSlug: 'antik-bimbel-klaten',
  role: 'owner',
  status: 'active',
  bimbelStatus: 'active',
  joinedAt: 1,
}

const products = [
  {
    id: 'prd-live',
    type: 'single',
    title: 'Try Out SKD CPNS — TWK Part 1',
    slug: 'try-out-skd-twk',
    family: 'asn',
    category: 'SKD',
    subcategory: 'CPNS',
    thumbnailUrl: '',
    price: 0,
    priceOriginal: 0,
    status: 'live',
    visibility: 'bimbel',
    questionCount: 30,
    questionTarget: 30,
    updatedAt: 2,
  },
  {
    id: 'prd-draft',
    type: 'single',
    title: 'Latihan TIU',
    slug: 'latihan-tiu',
    family: 'asn',
    category: 'SKD',
    subcategory: 'CPNS',
    thumbnailUrl: '',
    price: 0,
    priceOriginal: 0,
    status: 'draft',
    visibility: 'bimbel',
    questionCount: 20,
    questionTarget: 35,
    updatedAt: 1,
  },
]

test('halaman Paket bimbel memakai tabel dan kontrol yang sama dengan inventori tutor', async ({ page }) => {
  await mockSignedIn(page, buildUser({ role: 'tutor' }))
  await page.route('**/me/bimbels', route => route.fulfill({ json: [membership] }))
  // Scope ke API; pola tanpa `/api/v1` juga menangkap navigasi halaman Nuxt
  // `/dashboard/bimbel/bmb-1/products` dan mengganti HTML-nya dengan JSON.
  await page.route('**/api/v1/bimbel/bmb-1/products', route => route.fulfill({ json: products }))

  await page.goto('/dashboard/bimbel/bmb-1/products', { waitUntil: 'networkidle' })

  await expect(page.getByRole('heading', { level: 1, name: 'Paket' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Paket', exact: true })).toBeVisible()
  await expect(page.getByLabel('Cari paket')).toBeVisible()

  const table = page.getByRole('table')
  await expect(table).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Paket' })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Marketplace' })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Kategori' })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Soal' })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  await expect(table.getByText('Try Out SKD CPNS — TWK Part 1')).toBeVisible()
  await expect(table.getByText('30/30 soal')).toBeVisible()

  await page.getByLabel('Cari paket').fill('TIU')
  await expect(table.getByText('Latihan TIU')).toBeVisible()
  await expect(table.getByText('Try Out SKD CPNS — TWK Part 1')).toHaveCount(0)
})
