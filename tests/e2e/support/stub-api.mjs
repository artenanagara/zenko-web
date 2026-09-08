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
  SAMPLE_BLUEPRINTS,
  scoreSample,
  TESTIMONIALS,
  TUTOR_REVIEWS_BY_USERNAME,
  TUTORS,
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

function route(pathname, query, method, body) {
  if (!pathname.startsWith(PREFIX)) return null
  const path = pathname.slice(PREFIX.length)

  // The one /auth/* route this stub answers, and the exception is deliberate.
  // Everything else under /auth is session state, which differs per spec and so
  // belongs to whichever spec is asserting it (support/auth.ts). A CSRF token
  // is not session state: useApiFetch fetches one before *every* write and
  // throws if it comes back empty, so leaving it to the 401 fallback made each
  // spec responsible for a preflight it never mentions — and any spec that
  // forgot it failed on the assertion after the write, pointing at the wrong
  // thing entirely. The real API hands a token to anyone who asks, so one
  // constant answer here matches production and no spec can forget it.
  if (path === '/auth/csrf') return { status: 200, body: { csrfToken: 'stub-csrf-token' } }

  if (path === '/packages') return { status: 200, body: listPackages(query) }

  // Both halves of "coba gratis", and the split between them is the point: the
  // blueprint goes out without an answer key, and the grader — the only thing
  // that sees one — hands back counts. Matched before the detail route, which
  // would otherwise swallow these paths as an unknown slug.
  const sampleMatch = /^\/packages\/([^/]+)\/sample$/.exec(path)
  if (sampleMatch) {
    const blueprint = SAMPLE_BLUEPRINTS[decodeURIComponent(sampleMatch[1])]
    return blueprint
      ? { status: 200, body: blueprint }
      : { status: 404, body: apiError('contoh soal belum tersedia') }
  }

  const scoreMatch = /^\/packages\/([^/]+)\/sample\/score$/.exec(path)
  if (scoreMatch) {
    if (method !== 'POST') return { status: 405, body: apiError('metode tidak didukung') }
    const scored = scoreSample(decodeURIComponent(scoreMatch[1]), body?.answers ?? {})
    return scored
      ? { status: 200, body: scored }
      : { status: 404, body: apiError('contoh soal belum tersedia') }
  }

  if (path.startsWith('/packages/')) {
    const slug = decodeURIComponent(path.slice('/packages/'.length))
    const detail = PACKAGE_DETAILS[slug]
    return detail
      ? { status: 200, body: detail }
      : { status: 404, body: apiError('paket tidak ditemukan') }
  }

  // Public tutor profile. The reviews path is matched first for the same
  // reason as /packages/:slug/sample — the detail route below would otherwise
  // read "budi-santoso/reviews" as one unknown username.
  const tutorReviewsMatch = /^\/tutors\/([^/]+)\/reviews$/.exec(path)
  if (tutorReviewsMatch) {
    const reviews = TUTOR_REVIEWS_BY_USERNAME[decodeURIComponent(tutorReviewsMatch[1])]
    return { status: 200, body: reviews ?? [] }
  }

  if (path.startsWith('/tutors/')) {
    const tutor = TUTORS[decodeURIComponent(path.slice('/tutors/'.length))]
    return tutor
      ? { status: 200, body: tutor }
      : { status: 404, body: apiError('tutor tidak ditemukan') }
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

/** Collects a JSON request body; a malformed or absent one reads as {}. */
function readJson(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      }
      catch {
        resolve({})
      }
    })
  })
}

const server = createServer(async (req, res) => {
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

  const payload = req.method === 'POST' ? await readJson(req) : null
  const matched = route(url.pathname, url.searchParams, req.method, payload)

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
