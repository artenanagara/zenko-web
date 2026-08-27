import type { Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

/**
 * The catalogue fixtures in support/catalog.ts carry thumbnail and avatar URLs
 * on real hosts (images.unsplash.com, i.pravatar.cc), because that is what
 * zenko-api's own payloads carry, and nuxt.config.ts loads Google Fonts on
 * every page. None of it is reachable through the stub API — it is plain
 * <img>/<link> markup the browser resolves itself — so every test would
 * otherwise depend on outbound network it doesn't control. Block it here
 * instead, once, for every spec.
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

  // Every fresh browser context starts without a consent choice. Keep the
  // existing suite focused on its feature under test while still exercising
  // the real banner and its keyboard-accessible controls.
  const rejectOptional = page.getByRole('button', { name: 'Tolak opsional' })
  if (await rejectOptional.isVisible().catch(() => false)) {
    await rejectOptional.click()
  }
}
