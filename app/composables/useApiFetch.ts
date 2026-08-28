import type { FetchOptions } from 'ofetch'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

let csrfToken: string | null = null
let csrfRequest: Promise<string> | null = null

/**
 * API fetcher that attaches the in-memory CSRF token to every mutating call.
 * The API stores the matching value in a readable cookie; keeping the token
 * here avoids exposing the session cookie while still satisfying double-submit
 * protection for same-origin and local cross-origin development requests.
 */
export async function useApiFetch<T>(
  request: string,
  options: FetchOptions<'json'> = {},
): Promise<T> {
  const runtimeConfig = useRuntimeConfig()
  const baseURL = String(options.baseURL ?? runtimeConfig.public.apiBase)
  const method = String(options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (UNSAFE_METHODS.has(method) && import.meta.client) {
    headers.set('X-CSRF-Token', await getCSRFToken(baseURL))
  }

  const fetchOptions = {
    ...options,
    baseURL,
    credentials: options.credentials ?? 'include',
    headers,
  }

  // Nuxt's generated $fetch type narrows method names for route-aware calls,
  // while ofetch exposes RequestInit's broader string method type. Keep the
  // conversion at this boundary instead of weakening the public helper API.
  return $fetch<T>(request, fetchOptions as Parameters<typeof $fetch>[1])
}

async function getCSRFToken(baseURL: string): Promise<string> {
  if (csrfToken) return csrfToken
  if (!csrfRequest) {
    csrfRequest = $fetch<{ csrfToken: string }>('/auth/csrf', {
      baseURL,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then((response) => {
      if (!response.csrfToken) throw new Error('CSRF token kosong')
      csrfToken = response.csrfToken
      return response.csrfToken
    }).finally(() => {
      csrfRequest = null
    })
  }
  return csrfRequest
}
