import type { Article } from '#shared/types/article'

/**
 * Thin wrappers around zenko-api's public article endpoints.
 *
 * Both use `useFetch` so the data is fetched once on the server and handed to
 * the client in the payload — an article page is a page search engines and
 * social crawlers must be able to read without running JavaScript.
 */

/**
 * Every published, indexable article, newest first (the API orders them).
 *
 * The body is not included — see the `content` note on the Article type — so
 * fetching the whole list for an index page, a related-articles strip, or a
 * category filter stays cheap.
 */
export function usePublishedArticles() {
  const { public: config } = useRuntimeConfig()

  return useFetch<Article[]>('/articles', {
    baseURL: config.apiBase,
    // Shared across the pages that call this so the detail page's related
    // strip reuses the index page's payload instead of refetching it.
    key: 'public-articles',
    default: () => [],
  })
}

/**
 * One article, with its body.
 *
 * A missing slug must reach Nuxt's error page as a real 404 — both so the
 * reader sees the site's own "halaman nyasar" screen instead of a blank
 * render, and so crawlers get the status code rather than a soft 404.
 */
export async function useArticle(slug: MaybeRefOrGetter<string>) {
  const { public: config } = useRuntimeConfig()

  // The URL is a getter, so moving from one article to the next refetches
  // even though Nuxt keeps the same page component mounted.
  const { data, error } = await useFetch<Article>(
    () => `/articles/${encodeURIComponent(toValue(slug))}`,
    { baseURL: config.apiBase },
  )

  if (error.value || !data.value) {
    throw createError({
      statusCode: error.value?.statusCode ?? 404,
      statusMessage: 'Artikel tidak ditemukan',
      fatal: true,
    })
  }

  return data as Ref<Article>
}
