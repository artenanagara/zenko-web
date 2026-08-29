/**
 * Organization JSON-LD, shared by index.vue and about.vue so the two pages
 * publish identical business identity data. Values mirror about.vue's
 * "Identitas penyelenggara" section — keep both in sync if that changes.
 */
export function useOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zenko',
    legalName: 'PT Zenko Edukasi Digital',
    url: 'https://zenkoedu.id',
    logo: 'https://zenkoedu.id/logo.png',
    email: 'halo@zenkoedu.id',
    telephone: '+6288227663468',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Klaten',
      addressRegion: 'Jawa Tengah',
      addressCountry: 'ID',
    },
  }
}
