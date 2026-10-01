/**
 * The slug a category or subcategory label carries in a URL — both the
 * landing page (`/kategori/:slug`) and the catalogue filter (`?kategori=`).
 *
 * Must stay identical to `SlugifyFacet` in zenko-api
 * (internal/service/catalog_browse.go): lowercase ASCII letters and digits,
 * every other run of characters collapsed into one hyphen.
 * "SKD/CPNS" → "skd-cpns", "TNI & Polri" → "tni-polri".
 */
export function slugifyCategory(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
