<script setup lang="ts">
import { helpArticles, helpCategories, type HelpArticle, type HelpCategoryIcon, type HelpRole } from '~/data/help-center'
import { SUPPORT_CONTACT, supportMailto } from '~/data/support-contact'

/**
 * Tab "Bantuan" di /akun/profil — pintu Pusat Bantuan untuk akun yang sudah
 * masuk. Menggantikan tautan "Pusat Bantuan" yang dulu tersebar di sidebar
 * akun, sidebar tutor/bimbel, dan dropdown profil: satu tempat, dan isinya
 * sudah disaring menurut peran akun, bukan beranda umum yang memulai dari
 * panduan mendaftar.
 *
 * Data artikel sudah ada di client (data/help-center), jadi pencarian dan
 * penyaringannya tanpa API — sama seperti halaman /pusat-bantuan.
 */
const { user } = useAuth()
const { data: memberships, ensure: ensureMemberships } = useBimbelMemberships()

onMounted(() => {
  void ensureMemberships()
})

/**
 * Peran bantuan yang relevan. Tutor tetap siswa (mereka juga beli paket);
 * pengelola bimbel adalah dimensi terpisah dari role global; admin melihat
 * semuanya karena ia yang menjawab pertanyaan orang lain.
 */
const relevantRoles = computed<HelpRole[]>(() => {
  const role = user.value?.role
  if (role === 'admin') return ['siswa', 'tutor', 'bimbel']
  const roles: HelpRole[] = ['siswa']
  if (role === 'tutor') roles.push('tutor')
  if (memberships.value.some(m => m.status === 'active' && m.role !== 'student')) roles.push('bimbel')
  return roles
})

const PREVIEW_COUNT = 3

const categories = computed(() =>
  helpCategories
    .map((category) => {
      const articles = helpArticles.filter(
        article => article.categorySlug === category.slug
          && article.roles.some(r => relevantRoles.value.includes(r)),
      )
      return { ...category, articles, preview: articles.slice(0, PREVIEW_COUNT) }
    })
    .filter(category => category.articles.length > 0),
)

const CATEGORY_ICON: Record<HelpCategoryIcon, string> = {
  user: 'user-circle',
  wallet: 'wallet',
  target: 'target',
  handshake: 'handshake',
  users: 'users-three',
  settings: 'wrench',
}

/* ------------------------------------------------------------- pencarian */

const query = ref('')

const results = computed<HelpArticle[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return helpArticles
    .filter(
      article =>
        article.title.toLowerCase().includes(q)
        || article.summary.toLowerCase().includes(q)
        || (article.keywords ?? []).some(keyword => keyword.toLowerCase().includes(q)),
    )
    .slice(0, 8)
})

const searching = computed(() => query.value.trim().length > 0)

function categoryTitleFor(article: HelpArticle) {
  return helpCategories.find(category => category.slug === article.categorySlug)?.title ?? ''
}

/* ----------------------------------------------------- tautan kebijakan */

const policyLinks = computed(() => {
  const links = [
    { label: 'FAQ', to: '/faq' },
    { label: 'Ketentuan Layanan', to: '/ketentuan-layanan' },
    { label: 'Kebijakan Refund', to: '/kebijakan-refund' },
    { label: 'Kebijakan Privasi', to: '/kebijakan-privasi' },
  ]
  if (relevantRoles.value.includes('tutor')) links.push({ label: 'Syarat & Ketentuan Tutor', to: '/syarat-tutor' })
  if (relevantRoles.value.includes('bimbel')) links.push({ label: 'Untuk Bimbel', to: '/untuk-bimbel' })
  return links
})

/** Subjek email terisi supaya pesan pertama langsung bisa dipilah oleh tim. */
const mailto = computed(() => supportMailto(`Bantuan akun ${user.value?.email ?? ''}`.trim()))
</script>

<template>
  <div class="grid gap-6">
    <DashboardPanel title="Cari panduan" description="Ketik kendalamu — hasilnya muncul langsung sambil mengetik.">
      <div class="grid gap-4">
        <div class="relative">
          <AppIcon name="magnifying-glass" :size="18" class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            v-model="query"
            type="search"
            aria-label="Cari panduan"
            placeholder="Misalnya “koneksi terputus”, “invoice”, atau “tarik saldo”"
            class="h-11 w-full rounded-md border border-line bg-surface pr-4 pl-11 text-[0.92rem] text-ink transition-[box-shadow,border-color] duration-200 placeholder:text-muted focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none"
          >
        </div>

        <!-- Hasil menggantikan kategori di bawahnya, bukan melayang: di
             halaman akun tidak ada hero yang perlu dilewati dropdown. -->
        <ul v-if="searching && results.length" class="grid divide-y divide-hairline" aria-label="Hasil pencarian">
          <li v-for="result in results" :key="result.slug">
            <NuxtLink
              :to="`/pusat-bantuan/${result.slug}`"
              class="group flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
            >
              <span class="min-w-0">
                <span class="block truncate font-semibold">{{ result.title }}</span>
                <span class="mt-0.5 block text-[0.8rem] text-muted">{{ categoryTitleFor(result) }} · {{ result.readMinutes }} menit baca</span>
              </span>
              <AppIcon name="arrow-right" :size="16" class="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
        <p v-else-if="searching" class="text-[0.9rem] text-muted">
          Panduannya belum ketemu. Coba kata yang lebih umum seperti “bayar”, “ujian”, atau “saldo” — atau hubungi tim Zenko di bawah.
        </p>
      </div>
    </DashboardPanel>

    <DashboardPanel
      v-if="!searching"
      title="Panduan untuk kamu"
      description="Disaring sesuai peran akunmu. Buka Pusat Bantuan untuk melihat semuanya."
    >
      <template #action>
        <AppButton to="/pusat-bantuan" variant="outline" size="sm">
          Buka Pusat Bantuan
        </AppButton>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <section
          v-for="category in categories"
          :key="category.slug"
          class="rounded-md border border-hairline bg-surface-alt/60 p-4"
          :aria-labelledby="`help-cat-${category.slug}`"
        >
          <div class="flex items-start gap-3">
            <span aria-hidden="true" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary">
              <AppIcon :name="CATEGORY_ICON[category.icon]" :size="18" />
            </span>
            <div class="min-w-0">
              <h3 :id="`help-cat-${category.slug}`" class="text-[0.94rem] font-semibold leading-snug tracking-[-0.01em]">
                {{ category.title }}
              </h3>
              <p class="mt-1 text-[0.82rem] leading-relaxed text-muted">{{ category.description }}</p>
            </div>
          </div>

          <ul class="mt-3 grid gap-1.5">
            <li v-for="article in category.preview" :key="article.slug">
              <NuxtLink
                :to="`/pusat-bantuan/${article.slug}`"
                class="flex items-start gap-2 text-[0.88rem] font-medium text-ink transition-colors hover:text-primary"
              >
                <AppIcon name="file-text" :size="15" class="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <span>{{ article.title }}</span>
              </NuxtLink>
            </li>
          </ul>

          <NuxtLink
            v-if="category.articles.length > PREVIEW_COUNT"
            :to="`/pusat-bantuan#${category.slug}-heading`"
            class="mt-3 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-primary hover:underline"
          >
            Lihat semua ({{ category.articles.length }})
            <AppIcon name="arrow-right" :size="14" aria-hidden="true" />
          </NuxtLink>
        </section>
      </div>
    </DashboardPanel>

    <div class="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <DashboardPanel title="Hubungi tim Zenko" :description="`Jam layanan ${SUPPORT_CONTACT.hours}. Untuk urusan pembayaran, sertakan nomor invoice.`">
        <div class="grid gap-3 sm:grid-cols-2">
          <a
            :href="SUPPORT_CONTACT.whatsappUrl"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 rounded-md border border-hairline p-3.5 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <span aria-hidden="true" class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-ink">
              <AppIcon name="whatsapp-logo" :size="20" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold">WhatsApp</span>
              <span class="block truncate text-[0.82rem] text-muted">{{ SUPPORT_CONTACT.phoneDisplay }}</span>
            </span>
          </a>
          <a
            :href="mailto"
            class="flex items-center gap-3 rounded-md border border-hairline p-3.5 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <span aria-hidden="true" class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <AppIcon name="envelope-simple" :size="20" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold">Email</span>
              <span class="block truncate text-[0.82rem] text-muted">{{ SUPPORT_CONTACT.email }}</span>
            </span>
          </a>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Kebijakan & ketentuan">
        <ul class="grid divide-y divide-hairline">
          <li v-for="link in policyLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="group flex items-center justify-between gap-3 py-2.5 text-[0.9rem] font-medium transition-colors hover:text-primary"
            >
              {{ link.label }}
              <AppIcon name="arrow-up-right" :size="15" class="shrink-0 text-muted group-hover:text-primary" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </DashboardPanel>
    </div>
  </div>
</template>
