import type { AdminAuthor, AdminProductSummary } from '#shared/types/admin-moderation'

/**
 * Page-local state for the Moderasi produk pair of routes
 * (/dashboard/admin/products and /dashboard/admin/products/[id]).
 *
 * Lives apart from useAdminModeration.ts on purpose: nothing here is shared
 * with the other admin queues. The useState pieces exist because the detail
 * page hands its success banner (and the author fallback travels the other
 * way) across a navigation — component state cannot survive that hop.
 */

/** Banner shown at the top of the queue page after a decision (design spec §3.5). */
export interface AdminProductsNotice {
  /** success → AppAlert banner; warning → 409 AppInlineMessage (§3.4). */
  type: 'success' | 'warning'
  text: string
}

/**
 * Set by whichever page made the decision, rendered and cleared by the queue
 * page (it clears on its own unmount so the message never leaks onto a later
 * visit — "navigation clears it").
 */
export function useAdminProductsNotice() {
  return useState<AdminProductsNotice | null>('admin-products-notice', () => null)
}

/**
 * Author per product id, remembered from the list rows. GET /admin/products/:id
 * only promises the author on list rows, so the detail page falls back to what
 * the queue saw (the old admin.vue's `detail.author ??= product.author`).
 */
export function useAdminProductAuthors() {
  return useState<Record<string, AdminAuthor>>('admin-product-authors', () => ({}))
}

/**
 * GET /admin/products?status=all — the Semua tab. The shared
 * useAdminProductQueue is pinned to the review queue; this widens to every
 * status. Same client-only contract (HttpOnly cookie — call refresh() from
 * onMounted or a tab switch).
 */
export function useAdminProductsAll() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminProductSummary[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<AdminProductSummary[]>('/admin/products', {
        baseURL: config.apiBase,
        credentials: 'include',
        query: { status: 'all' },
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat daftar produk.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** 409 dari POST decision: produk keburu diputuskan admin lain (design spec §3.4). */
export function isAdminProductConflict(cause: unknown): boolean {
  const status = (cause as { statusCode?: number })?.statusCode
  return status === 409
}

/** Canonical 409 copy — design spec §6. */
export const ADMIN_PRODUCT_CONFLICT_TEXT
  = 'Item ini baru saja diputuskan (mungkin oleh admin lain). Daftar dimuat ulang.'
