import type { Page } from '@playwright/test'

/**
 * Matches shared/types/user.ts's `User` interface (the shape zenko-api's
 * GET /auth/me, POST /auth/login and the auth plugin all deal in).
 *
 * Auth is never served from app/mocks — NUXT_PUBLIC_USE_MOCK only swaps the
 * catalogue — so every spec that needs a signed-in session mocks these
 * endpoints directly at the network layer with page.route().
 */
export interface MockUser {
  id: string
  email: string
  name: string
  avatarUrl: string
  role: 'student' | 'tutor' | 'admin'
  verified: boolean
}

export function buildUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'usr_test_1',
    email: 'siswa@example.com',
    name: 'Siswa Contoh',
    avatarUrl: 'https://i.pravatar.cc/80?img=1',
    role: 'student',
    verified: true,
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
