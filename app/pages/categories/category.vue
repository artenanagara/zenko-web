<script setup lang="ts">
definePageMeta({
  // Moving between categories reuses this route record; keying by path
  // remounts the page so its setup (and data) runs for the new slug.
  key: route => route.path,
  path: '/kategori/:categorySlug()',
  // Old slugs ("tni-&-polri", "SKD") land on the one canonical URL, so links
  // and rankings built under the previous slug rule carry over.
  middleware: [(to) => {
    const slug = String(to.params.categorySlug)
    const canonical = slugifyCategory(slug)
    if (canonical && canonical !== slug) {
      return navigateTo({ path: `/kategori/${canonical}`, query: to.query, hash: to.hash }, { redirectCode: 301 })
    }
  }],
})

const route = useRoute()
const page = await useCategoryLanding(String(route.params.categorySlug))
const { articles } = page
</script>

<template>
  <CategoryLanding
    :landing="page.landing"
    :paths="page.paths"
    :exam-types="page.examTypes"
    :count="page.count"
    :packages="page.packages"
    :error="page.packagesFailed || undefined"
    :articles="articles"
    :catalog-link="page.catalogLink"
    :sample-link="page.sampleLink"
    :breadcrumbs="page.breadcrumbs"
  />
</template>
