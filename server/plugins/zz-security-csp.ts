import { randomBytes } from 'node:crypto'

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
    response.headers['Content-Security-Policy'] = contentSecurityPolicy(nonce)
  })
})

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

function contentSecurityPolicy(nonce: string) {
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
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https://zenkoedu.id",
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}
