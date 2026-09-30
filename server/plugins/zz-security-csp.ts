import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

const nonceKey = 'zenkoCspNonce'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = createNonce()
    event.context[nonceKey] = nonce
    addNonce(html.head, nonce)
    addNonce(html.bodyPrepend, nonce)
    addNonce(html.body, nonce)
    addNonce(html.bodyAppend, nonce)
  })

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const nonce = event.context[nonceKey] ?? createNonce()
    if (typeof response.body === 'string') {
      response.body = addNonceToHTML(response.body, nonce)
    }
    response.headers ??= {}
    response.headers['Content-Security-Policy'] = contentSecurityPolicy(nonce, devApiOrigins(event))
  })
})

/**
 * Origin zenko-api saat pengembangan lokal — daftar kosong di luar dev, jadi
 * header produksi tidak berubah sama sekali.
 *
 * Di produksi web dan API berbagi origin `https://zenkoedu.id`, yang sudah
 * disebut policy-nya. Di lokal API berjalan di origin sendiri
 * (`http://localhost:8080` bawaannya), dan `connect-src 'self'` menolaknya:
 * SETIAP panggilan ke API diblokir browser, mulai dari `/auth/me` — aplikasi
 * lokal tidak pernah bisa masuk. `img-src` kena hal yang sama untuk avatar,
 * sampul, dan gambar soal yang saat dev dilayani dari disk oleh API.
 *
 * Diturunkan dari `apiBase` runtime config, bukan port yang ditulis mati:
 * .env boleh menunjuk 127.0.0.1, localhost, atau port lain, dan kelonggaran
 * ini harus mengikuti apa pun yang benar-benar dipanggil aplikasi.
 *
 * Kedua ejaan loopback diizinkan sekaligus, dan itu bukan kemewahan: kedua
 * sisi menuliskan alamat yang sama dengan nama berbeda. Web memanggil apa pun
 * yang ada di `NUXT_PUBLIC_API_BASE` (mis. `http://127.0.0.1:8080`), sementara
 * URL gambar dicetak oleh API dari `API_PUBLIC_URL` yang bawaannya
 * `http://localhost:8080` — origin yang berbeda bagi CSP, walau server yang
 * sama. Tanpa ini setiap gambar soal diblokir di lokal, dan yang terlihat
 * tutor persis seperti gambarnya gagal terimpor.
 */
function devApiOrigins(event: H3Event): string[] {
  if (!import.meta.dev) return []
  try {
    const api = new URL(useRuntimeConfig(event).public.apiBase)
    const origins = new Set([api.origin])

    const twin = loopbackTwin(api.hostname)
    if (twin) {
      const alias = new URL(api.toString())
      alias.hostname = twin
      origins.add(alias.origin)
    }
    return [...origins]
  }
  catch {
    // apiBase relatif atau tidak valid: tidak ada origin terpisah untuk
    // dilonggarkan, dan 'self' sudah menutupinya.
    return []
  }
}

/** Ejaan lain dari host loopback yang sama, atau '' kalau bukan loopback. */
function loopbackTwin(hostname: string): string {
  switch (hostname) {
    case 'localhost': return '127.0.0.1'
    case '127.0.0.1': return 'localhost'
    default: return ''
  }
}

function createNonce() {
  return randomBytes(16).toString('base64url')
}

function addNonce(chunks: string[], nonce: string) {
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    if (chunk) chunks[index] = addNonceToHTML(chunk, nonce)
  }
}

function addNonceToHTML(html: string, nonce: string) {
  return html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`)
}

function contentSecurityPolicy(nonce: string, devApi: string[]) {
  // Sufiks kosong di produksi, jadi header di sana identik dengan sebelumnya.
  const dev = devApi.length ? ` ${devApi.join(' ')}` : ''

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // Google Analytics 4: gtag.js disisipkan plugin analytics.client.ts saat
    // runtime, jadi tidak ikut mendapat nonce dari render:html.
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' https: data: blob:${dev}`,
    `connect-src 'self' https://zenkoedu.id https://staging.zenkoedu.id https://marketing.zenkoedu.id https://marketing-staging.zenkoedu.id https://admin.zenkoedu.id https://admin-staging.zenkoedu.id https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com${dev}`,
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}
