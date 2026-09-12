<script setup lang="ts">
import type { Author } from '#shared/types/catalog'

definePageMeta({ path: '/tutor/:username()' })

const route = useRoute()
const router = useRouter()
const username = String(route.params.username)
const tutor = await usePublicTutor(username)
const tutorReviews = usePublicTutorReviews(username)
const profile = computed(() => tutor.value.profile)
const displayName = computed(() => tutor.value.name || profile.value.displayName || 'Tutor Zenko')
const avatarUrl = computed(() => tutor.value.avatarUrl || profile.value.avatarUrl)
const canonicalUrl = computed(() => `https://zenkoedu.id/tutor/${tutor.value.username || username}`)

/**
 * `public_tutors.go` already sends live products only; the filter is a cheap
 * guard so a future API change can never leak a draft into a public grid.
 */
const products = computed(() => tutor.value.products.filter(item => item.status === 'live'))

/**
 * Every card in the Produk tab is by this tutor, so the author the catalogue's
 * PackageCard expects is assembled once here rather than per product.
 *
 * `username` is deliberately blank. PackageCard links the author name to
 * `/tutor/:username`, which on this page is the page you are already on —
 * twelve links back to themselves, and twelve extra tab stops that go nowhere.
 * PackageCard already renders a blank username as plain text (that is how
 * seeded packages behave), so this needs no change on its side.
 */
const cardAuthor = computed<Author>(() => ({
  name: displayName.value,
  avatarUrl: avatarUrl.value,
  username: '',
}))

/**
 * The links a visitor can actually follow, built from the fields that are
 * filled in — nothing here renders a dead icon for a URL the tutor never gave.
 */
const links = computed(() => [
  { key: profile.value.websiteUrl, label: 'Website', icon: 'globe' },
  { key: profile.value.portfolioUrl, label: 'Portofolio', icon: 'briefcase' },
  { key: profile.value.instagramUrl, label: 'Instagram', icon: 'instagram-logo' },
  { key: profile.value.tiktokUrl, label: 'TikTok', icon: 'tiktok-logo' },
  { key: profile.value.youtubeUrl, label: 'YouTube', icon: 'youtube-logo' },
  { key: profile.value.linkedinUrl, label: 'LinkedIn', icon: 'linkedin-logo' },
].filter(link => !!link.key).map(link => ({ label: link.label, href: link.key, icon: link.icon })))

/* ── Tabs ──────────────────────────────────────────────────────────────── */

const TAB_IDS = ['produk', 'tentang', 'ulasan'] as const
const DEFAULT_TAB = 'produk'

function normalizeTab(value: unknown): string {
  return TAB_IDS.includes(String(value) as typeof TAB_IDS[number]) ? String(value) : DEFAULT_TAB
}

// Read on setup, not onMounted, so a shared `?tab=ulasan` link renders the
// right panel server-side instead of flashing Produk first.
const activeTab = ref(normalizeTab(route.query.tab))

const tabs = computed(() => [
  { id: 'produk', label: 'Produk', count: products.value.length },
  { id: 'tentang', label: 'Tentang' },
  { id: 'ulasan', label: 'Ulasan', count: tutor.value.stats.ratingCount },
])

// Back/forward and in-page selection have to agree. `replace` keeps a tab
// switch out of the history stack — it isn't a navigation the back button
// should have to walk through one entry at a time.
watch(() => route.query.tab, value => (activeTab.value = normalizeTab(value)))
watch(activeTab, (tab) => {
  if (normalizeTab(route.query.tab) === tab) return
  const query = { ...route.query, tab: tab === DEFAULT_TAB ? undefined : tab }
  void router.replace({ query })
})

const tabStrip = ref<HTMLElement | null>(null)

/**
 * Reached from the hero CTA and the stat pills. Scrolling puts the panel in
 * view, otherwise clicking "Lihat paket" from a tall hero looks like nothing
 * happened. `scrollIntoView()` without an explicit behavior inherits the
 * global `scroll-behavior`, which is already switched off under
 * prefers-reduced-motion.
 */
function goToTab(tab: string) {
  activeTab.value = normalizeTab(tab)
  nextTick(() => tabStrip.value?.scrollIntoView({ block: 'start' }))
}

/* ── SEO ───────────────────────────────────────────────────────────────── */

const metaDescriptionValue = computed(() =>
  metaDescription(profile.value.bio || `Profil tutor ${displayName.value} di Zenko.`),
)

useSeoMeta({
  title: `${displayName.value} | Tutor Zenko`,
  description: metaDescriptionValue.value,
  ogTitle: `${displayName.value} | Tutor Zenko`,
  ogDescription: metaDescriptionValue.value,
  ogImage: avatarUrl.value || undefined,
  ogUrl: canonicalUrl.value,
})

// Person, not Organization: this page is one human's public profile. `sameAs`
// only carries links the tutor actually filled in.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: displayName.value,
  url: canonicalUrl.value,
  ...(avatarUrl.value ? { image: avatarUrl.value } : {}),
  ...(profile.value.bio ? { description: profile.value.bio } : {}),
  ...(profile.value.specializations.length ? { knowsAbout: profile.value.specializations } : {}),
  ...(links.value.length ? { sameAs: links.value.map(link => link.href) } : {}),
}

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(personJsonLd) }],
})
</script>

<template>
  <main>
    <TutorProfileHero
      :tutor="tutor"
      :display-name="displayName"
      :avatar-url="avatarUrl"
      @select-tab="goToTab"
    />

    <!-- Sticky under the header (64px, 80px from md) so the section switcher
         stays reachable down a long product grid. z-30 keeps it below the
         header (z-50) and the mobile nav overlay (z-40). -->
    <div
      ref="tabStrip"
      class="sticky top-16 z-30 scroll-mt-16 border-b border-line bg-surface/95 backdrop-blur-md md:top-20 md:scroll-mt-20"
    >
      <!-- Top padding only: the tabs' own bottom border has to land on this
           wrapper's border-b, so any bottom padding would float the active
           underline above the rule instead of on it. -->
      <div class="container-page pt-3">
        <TutorProfileTabs v-model="activeTab" :tabs="tabs" aria-label="Bagian profil tutor" />
      </div>
    </div>

    <!-- v-show, not v-if: the reviews fetch runs once on mount, and unmounting
         the panel would throw that result away on every tab round-trip. -->
    <div class="container-page py-8 md:py-12">
      <div
        v-show="activeTab === 'produk'"
        id="tutor-panel-produk"
        role="tabpanel"
        aria-labelledby="tutor-tab-produk"
        tabindex="0"
      >
        <TutorProfileProducts :items="products" :author="cardAuthor" :tutor-name="displayName" />
      </div>

      <div
        v-show="activeTab === 'tentang'"
        id="tutor-panel-tentang"
        role="tabpanel"
        aria-labelledby="tutor-tab-tentang"
        tabindex="0"
      >
        <TutorProfileAbout :profile="profile" :tutor-name="displayName" :links="links" />
      </div>

      <div
        v-show="activeTab === 'ulasan'"
        id="tutor-panel-ulasan"
        role="tabpanel"
        aria-labelledby="tutor-tab-ulasan"
        tabindex="0"
      >
        <TutorProfileReviews
          :reviews="tutorReviews.data.value"
          :pending="tutorReviews.pending.value"
          :failed="tutorReviews.error.value"
          :rating-average="tutor.stats.ratingAverage"
          :rating-count="tutor.stats.ratingCount"
          :tutor-name="displayName"
          :has-products="products.length > 0"
          @retry="tutorReviews.refresh()"
        />
      </div>
    </div>
  </main>
</template>
