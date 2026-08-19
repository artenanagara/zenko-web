import type { Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

/**
 * Package/testimonial fixtures in app/mocks point at real hosts
 * (images.unsplash.com, i.pravatar.cc) for thumbnails and avatars, and
 * nuxt.config.ts loads Google Fonts on every page. None of that is
 * mockable through NUXT_PUBLIC_USE_MOCK — it's plain <img>/<link> markup —
 * so every test would otherwise depend on outbound network it doesn't
 * control. Block it here instead, once, for every spec.
 */
async function blockExternalAssets(page: Page): Promise<void> {
  await page.route(/^https:\/\/(images\.unsplash\.com|i\.pravatar\.cc)\//, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }))
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort())
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await blockExternalAssets(page)
    await use(page)
  },
})

export { expect }

/**
 * Nuxt's client hydration finishes after the `load` event Playwright's
 * default `page.goto` waits for — a plain `.click()` right after `goto()`
 * can land on markup whose Vue event listeners (`@submit.prevent`, dropdown
 * toggles, …) haven't attached yet, and falls through to the browser's
 * native, un-prevented behaviour instead (observed: a real GET form
 * submission to `/daftar?` instead of client-side validation). Waiting for
 * the network to go quiet is a reasonable proxy for "hydration is done" in
 * this dev-mode app, where there is no other hydration-complete signal to
 * hook into.
 */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'networkidle' })
}
