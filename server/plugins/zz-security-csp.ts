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
    response.headers['Content-Security-Policy'] = contentSecurityPolicy(nonce, devApiOrigin(event))
  })
})

/**
 * Origin zenko-api saat pengembangan lokal — string kosong di luar dev, jadi
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
 */
function devApiOrigin(event: H3Event): string {
  if (!import.meta.dev) return ''
  try {
    return new URL(useRuntimeConfig(event).public.apiBase).origin
  }
  catch {
    // apiBase relatif atau tidak valid: tidak ada origin terpisah untuk
    // dilonggarkan, dan 'self' sudah menutupinya.
    return ''
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

function contentSecurityPolicy(nonce: string, devApi: string) {
  // Sufiks kosong di produksi, jadi header di sana identik dengan sebelumnya.
  const dev = devApi ? ` ${devApi}` : ''

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' https: data: blob:${dev}`,
    `connect-src 'self' https://zenkoedu.id${dev}`,
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}
