import type { Package } from '#shared/types/catalog'

/**
 * Dynamic sitemap entries for the catalogue: one per real package, fetched
 * live from zenko-api's public GET /packages so the sitemap never drifts
 * from what is actually purchasable.
 */
export default defineSitemapEventHandler(async () => {
  const { public: config } = useRuntimeConfig()

  const packages = await $fetch<Package[]>('/packages', {
    baseURL: config.apiBase,
  })

  return packages.map(pkg => ({ loc: `/paket/${pkg.slug}` }))
})
