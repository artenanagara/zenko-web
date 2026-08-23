import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for zenko-web.
 *
 * Nothing in this suite needs zenko-api running. Two servers are started for a
 * run, both owned by the suite:
 *
 *  - `tests/e2e/support/stub-api.mjs` on :8787 — a stand-in for zenko-api,
 *    serving the catalogue fixtures in `tests/e2e/support/catalog.ts`.
 *  - the Nuxt dev server on :3210, pointed at that stub via
 *    NUXT_PUBLIC_API_BASE.
 *
 * Both ports are deliberately not the defaults (:8080 / :3000), so a run is
 * hermetic even while a real zenko-api and a hand-started `npm run dev` are
 * up — hitting the real API is what a "runs without a backend" suite must not
 * quietly fall back to. NUXT_IGNORE_LOCK lets this second dev server coexist
 * with one the developer already has open.
 *
 * Two stubbing layers, and which one to reach for:
 *
 *  - The catalogue (`/packages`, `/packages/:slug`, `/testimonials`) is
 *    fetched with `useFetch`, so it is requested by the Nuxt *server* during
 *    SSR. Those requests never reach the browser and `page.route()` cannot
 *    see them — that is what the stub server is for.
 *  - Everything the browser fetches for itself — `/auth/me`, `/me/*`,
 *    `POST /orders` — is stubbed per-spec with `page.route()`, via the helpers
 *    in `tests/e2e/support/auth.ts`. A spec may also `page.route()` over the
 *    stub server to force one client-side response (an error, an empty list).
 *
 * `tests/e2e/support/fixtures.ts` applies the one route every spec needs
 * regardless — blocking outbound image and font hosts — by extending the base
 * `page` fixture.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  use: {
    baseURL: 'http://localhost:3210',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Neither server is reused between runs, including locally. Both carry
  // test-critical configuration — the fixtures the stub serves, and the env
  // that points Nuxt at it — and a leftover server from an earlier run silently
  // answers with the old one. That failure mode is expensive to recognise (it
  // looks like a broken assertion, not a stale process), and it is what let the
  // now-deleted NUXT_PUBLIC_USE_MOCK flag go unnoticed as inert. Paying ~40s of
  // Nuxt startup per run buys a run that means what it says.
  webServer: [
    {
      command: 'node ./tests/e2e/support/stub-api.mjs',
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --port 3210',
      url: 'http://localhost:3210',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NUXT_PUBLIC_API_BASE: 'http://127.0.0.1:8787/api/v1',
        // checkout.spec.ts asserts the "payment gateway not connected yet"
        // branch, which only exists while this is off. It is the nuxt.config
        // default, but a developer's .env may well turn it on locally — and
        // variables already set in the environment win over .env, so pinning
        // it here is what keeps the run independent of whose machine it is on.
        NUXT_PUBLIC_PAYMENT_ENABLED: 'false',
        // A developer's own `npm run dev` holds Nuxt's dev lock; without this
        // the suite could only run with that server stopped.
        NUXT_IGNORE_LOCK: '1',
      },
    },
  ],
})
