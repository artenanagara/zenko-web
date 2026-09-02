/**
 * safeInternalPath returns `raw` only when it is a safe same-origin
 * destination — a plain rooted path that keeps the browser inside this app.
 *
 * It exists so a `?lanjut=` value (see middleware/auth.ts, which stashes the
 * page a signed-out visitor tried to reach) can be used as a post-login
 * redirect without becoming an open redirect: anything that could point at
 * another origin — an absolute URL, a protocol-relative `//host`, or the
 * backslash spellings browsers normalise to it — or that is not a string at
 * all returns null, and the caller falls back to a known-safe path.
 *
 * Any code that turns user-controlled input into a navigation target MUST
 * route it through here; that is the invariant this helper enforces.
 */
export function safeInternalPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  // Must be a rooted path.
  if (!value.startsWith('/')) return null
  // Protocol-relative (`//host`) and the backslash spellings browsers
  // normalise to it leave the origin.
  if (value.startsWith('//') || value.startsWith('/\\')) return null
  // A real path is a single decoded token. Any whitespace or control
  // character (code point <= 0x20, or DEL 0x7f) is a sign of an attempt to
  // smuggle a scheme past the checks above, so reject it.
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x20 || code === 0x7f) return null
  }
  return value
}
