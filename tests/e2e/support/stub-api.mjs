/**
 * A stand-in for zenko-api, started by playwright.config.ts alongside the Nuxt
 * dev server. Serves the fixtures in ./catalog.ts over HTTP so the suite never
 * needs the real backend running.
 *
 * Why an HTTP stub and not `page.route()`
 * ---------------------------------------
 * The catalogue is fetched with `useFetch` (see app/composables/useCatalog.ts),
 * which runs during SSR: the request is made by the Nuxt server process, from
 * Node, and never crosses the browser boundary. `page.route()` only intercepts
 * requests the *browser* makes, so it cannot see those at all — a page.route()
 * glob for the packages endpoint leaves /paket rendering "Paket belum berhasil
 * dimuat", because the render that produced the HTML already failed
 * server-side and useFetch does not re-run on hydration once SSR has filled
 * the payload.
 *
 * page.route() is still the right tool for everything the browser fetches
 * itself — `/auth/me`, `/me/*`, `POST /orders` — and support/auth.ts continues
 * to use it. Specs may also page.route() on top of this server to override a
 * single client-side response (an error case, say); this stub is only the
 * default that both SSR and the browser fall back to.
 *
 * Runs under plain `node` with no build step: Node's built-in type stripping
 * lets this .mjs import the .ts fixture module directly, and catalog.ts's only
 * TypeScript-specific imports are `import type`, which is erased.
 */

import { createServer } from 'node:http'

import {
  BESTSELLER_ORDER,
  CATEGORIES,
  FEATURED_ORDER,
  NEWEST_ORDER,
  PACKAGES,
  PACKAGE_DETAILS,
  TESTIMONIALS,
} from './catalog.ts'

const PORT = Number(process.env.STUB_API_PORT ?? 8787)
const PREFIX = '/api/v1'

/** Mirrors zenko-api's maxLimit. */
const MAX_LIMIT = 100

const ORDERS = {
  featured: FEATURED_ORDER,
  bestseller: BESTSELLER_ORDER,
  newest: NEWEST_ORDER,
}

/** `model.ParseSortKey`: anything unrecognised, including empty, means featured. */
function orderFor(sort) {
  return ORDERS[sort] ?? ORDERS.featured
}

/** `parseLimit`: absent/unparseable/<=0 means no limit; otherwise capped at 100. */
function parseLimit(raw) {
  const limit = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(limit) || limit <= 0) return 0
  return Math.min(limit, MAX_LIMIT)
}

/**
 * `GET /api/v1/packages`. Order of operations matches
 * service.ListPackages: filter by category, then by q, then sort, then
 * truncate to limit. Filtering preserves order, so taking the pre-sorted list
 * up front is equivalent and keeps the expected order a fixed fixture rather
 * than something this file recomputes.
 */
function listPackages(query) {
  const category = query.get('category')
  const term = (query.get('q') ?? '').toLowerCase()
  const limit = parseLimit(query.get('limit'))

  let items = orderFor(query.get('sort')).map((slug) => PACKAGES[slug])

  // The API matches `category` case-insensitively against the label
  // ("SKD/CPNS"), not the slug — useRelatedPackages relies on that.
  if (category) {
    const wanted = category.toLowerCase()
    items = items.filter((pkg) => pkg.category.toLowerCase() === wanted)
  }

  // `q` matches title OR author name, lowercase substring. Note this is
  // narrower than the browser-side filter in usePackageFilters, which also
  // matches the category — deliberately so: this reproduces the API.
  if (term) {
    items = items.filter(
      (pkg) =>
        pkg.title.toLowerCase().includes(term) || pkg.author.name.toLowerCase().includes(term),
    )
  }

  return limit > 0 ? items.slice(0, limit) : items
}

/** zenko-api renders every error as { error, requestId }. */
function apiError(message) {
  return { error: message, requestId: 'stub' }
}

function route(pathname, query) {
  if (!pathname.startsWith(PREFIX)) return null
  const path = pathname.slice(PREFIX.length)

  if (path === '/packages') return { status: 200, body: listPackages(query) }

  if (path.startsWith('/packages/')) {
    const slug = decodeURIComponent(path.slice('/packages/'.length))
    const detail = PACKAGE_DETAILS[slug]
    return detail
      ? { status: 200, body: detail }
      : { status: 404, body: apiError('paket tidak ditemukan') }
  }

  if (path === '/testimonials') return { status: 200, body: TESTIMONIALS }
  if (path === '/categories') return { status: 200, body: CATEGORIES }

  // Consumed only by the tutor dashboard, which no spec visits yet. An empty
  // array is a valid response for it (the endpoint is a plain list), so this
  // keeps an SSR call from failing without inventing exam templates the suite
  // would then be asserting against by accident.
  if (path === '/exam-types') return { status: 200, body: [] }

  return null
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  // The browser talks to this origin cross-site (Nuxt on :3210, this on
  // :8787), and session-scoped calls use credentials: 'include' — which
  // forbids a wildcard origin. Echo the caller's origin, same as zenko-api's
  // CORS middleware does. SSR requests arrive from Node with no Origin header.
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.writeHead(204).end()
    return
  }

  // Playwright's webServer probe hits this to decide the stub is up.
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' }).end('{"status":"ok"}')
    return
  }

  const matched = route(url.pathname, url.searchParams)

  // Anything not modelled here — /auth/*, /me/*, /orders — is answered 401, the
  // same as an anonymous browser hitting zenko-api. Specs needing a session
  // page.route() those endpoints themselves (support/auth.ts); an unstubbed one
  // therefore behaves as signed-out rather than hanging on a dead port.
  const { status, body } = matched ?? { status: 401, body: apiError('unauthorized') }

  res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`stub zenko-api listening on http://127.0.0.1:${PORT}${PREFIX}`)
})
