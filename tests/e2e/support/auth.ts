import type { Page } from '@playwright/test'

/**
 * Matches shared/types/user.ts's `User` interface (the shape zenko-api's
 * GET /auth/me, POST /auth/login and the auth plugin all deal in).
 *
 * Session state is fetched by the browser, never during SSR — the session
 * cookie isn't readable on the Nuxt server — so page.route() sees every one of
 * these calls and each spec declares the session it wants. The catalogue is
 * the opposite case and is served by the stub API instead; see the header of
 * playwright.config.ts.
 */
export interface MockUser {
  id: string
  email: string
  name: string
  avatarUrl: string
  role: 'student' | 'tutor' | 'admin'
  verified: boolean
  canManageShareSchedule: boolean
}

export function buildUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'usr_test_1',
    email: 'siswa@example.com',
    name: 'Siswa Contoh',
    avatarUrl: 'https://i.pravatar.cc/80?img=1',
    role: 'student',
    verified: true,
    canManageShareSchedule: false,
    ...overrides,
  }
}

/**
 * Signed-out is the default answer zenko-api gives an anonymous browser: a
 * 401 on GET /auth/me. useAuth().refresh() treats that as the normal
 * signed-out state, not a failure worth surfacing.
 */
export async function mockSignedOut(page: Page): Promise<void> {
  await page.route('**/auth/me', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) }))
}

/** GET /auth/me answers with `user` — the session the auth plugin resolves at boot. */
export async function mockSignedIn(page: Page, user: MockUser = buildUser()): Promise<void> {
  await page.route('**/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }))
}

export async function mockLoginSuccess(page: Page, user: MockUser = buildUser()): Promise<void> {
  await page.route('**/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }))
}

export async function mockLoginFailure(page: Page, status = 401, error = 'invalid credentials'): Promise<void> {
  await page.route('**/auth/login', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error }) }))
}

export async function mockRegisterFailure(page: Page, status = 409, error = 'email already registered'): Promise<void> {
  await page.route('**/auth/register', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error }) }))
}

/**
 * GET /me/packages/:slug — 404 is zenko-api's answer for a package the session
 * does not own, and what usePackageOwnershipGuard turns into `owned = false`.
 *
 * Worth stating explicitly rather than leaving to the stub API's catch-all:
 * on /checkout/:slug and /paket/:slug this single call decides between the
 * checkout form and the "you already own this" branch, so which answer the
 * test assumes should be visible in the test.
 */
export async function mockPackageNotOwned(page: Page, slug: string): Promise<void> {
  await page.route(`**/me/packages/${slug}`, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'paket tidak ada di akunmu' }),
    }))
}
