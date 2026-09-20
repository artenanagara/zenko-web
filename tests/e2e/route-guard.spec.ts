import { expect, test } from './support/fixtures'
import { buildUser, mockSignedIn, mockSignedOut } from './support/auth'

// app/middleware/auth.ts: signed-out visitors are bounced to /masuk with
// ?lanjut=<original path> so they land back where they were headed after
// signing in. `/` is a valid literal character inside a query value (RFC
// 3986), so the browser does not percent-encode it — asserting on the
// decoded path (not "%2Fakun") matches what the address bar actually shows.
test.describe('route guard (app/middleware/auth.ts)', () => {
  test('visiting /akun while signed out redirects to /masuk?lanjut=/akun', async ({ page }) => {
    await mockSignedOut(page)

    await page.goto('/akun')
    await page.waitForURL(/\/masuk/)

    const url = new URL(page.url())
    expect(url.pathname).toBe('/masuk')
    expect(url.searchParams.get('lanjut')).toBe('/akun')
  })

  test('visiting /dashboard/tutor while signed out redirects to /masuk', async ({ page }) => {
    await mockSignedOut(page)

    await page.goto('/dashboard/tutor')
    await page.waitForURL(/\/masuk/)

    const url = new URL(page.url())
    expect(url.pathname).toBe('/masuk')
    expect(url.searchParams.get('lanjut')).toBe('/dashboard/tutor')
  })

  test('a signed-in student visiting a tutor-only route is sent to their own home, not a dead end', async ({ page }) => {
    await mockSignedIn(page, buildUser({ role: 'student' }))

    await page.goto('/dashboard/tutor')

    // waitForURL, not expect().toHaveURL: on the public domain the guard sends
    // a wrong-role session to its own home — homePathFor('student') === '/akun',
    // see shared/types/user.ts — but in dev the redirect only fires once Vite
    // has compiled this route's chunk, which outlasts the 5s expect timeout.
    await page.waitForURL('/akun')
  })
})
