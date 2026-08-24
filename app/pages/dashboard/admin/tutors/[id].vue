<script setup lang="ts">
import type { AdminTutorDetail } from '#shared/types/admin-tutor'

/**
 * Profil tutor (admin) — identitas, profil publik yang tutor isi sendiri
 * (bio, pengalaman, spesialisasi, sosial media), dan setiap produk yang
 * pernah dia buat, apa pun statusnya. Baca saja: keputusan atas produk masih
 * lewat halaman Moderasi produk, bukan di sini.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const accountId = computed(() => String(route.params.id ?? ''))

const detail = ref<AdminTutorDetail | null>(null)
// Starts true so SSR and first client paint both show the skeleton — the
// fetch itself only runs after mount (HttpOnly session cookie).
const detailPending = ref(true)
const detailError = ref('')

useHead({
  title: () => detail.value ? `${detail.value.name} — Zenko` : 'Profil tutor — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

async function loadDetail() {
  detailPending.value = true
  detailError.value = ''
  try {
    detail.value = await fetchAdminTutor(accountId.value)
  }
  catch (cause) {
    detailError.value = tutorApiMessage(cause, 'Tutor tidak ditemukan atau gagal dimuat.')
  }
  finally {
    detailPending.value = false
  }
}

onMounted(loadDetail)

const breadcrumbs = computed(() => [
  { label: 'Tutor', to: '/dashboard/admin/tutors' },
  { label: detail.value?.name ?? 'Profil tutor', truncate: true },
])

const initial = computed(() => detail.value?.name.trim().charAt(0).toUpperCase() || '?')

/* --------------------------------------------------------------------------
 * Tab — Profil dan Produk tadinya ditumpuk jadi dua panel berurutan; tutor
 * dengan banyak produk membuat profilnya ikut tergulung jauh ke atas. Pola
 * yang sama dengan /akun/profil.
 * ------------------------------------------------------------------------ */

const TABS = [
  { id: 'profil', label: 'Profil' },
  { id: 'produk', label: 'Produk' },
]
const activeTab = ref('profil')

/** Tautan sosial media/portofolio yang terisi, dengan label dan ikon Phosphor-nya. */
const socialLinks = computed(() => {
  const profile = detail.value?.profile
  if (!profile) return []
  return [
    { label: 'Portofolio', url: profile.portfolioUrl, icon: 'link' },
    { label: 'Instagram', url: profile.instagramUrl, icon: 'instagram-logo' },
    { label: 'TikTok', url: profile.tiktokUrl, icon: 'tiktok-logo' },
    { label: 'LinkedIn', url: profile.linkedinUrl, icon: 'linkedin-logo' },
    { label: 'YouTube', url: profile.youtubeUrl, icon: 'youtube-logo' },
    { label: 'Website', url: profile.websiteUrl, icon: 'globe' },
  ].filter(link => link.url)
})

/* ---------------------------------------------------------------- produk -- */

const PRODUCT_COLUMNS = [
  { key: 'title', label: 'Produk' },
  { key: 'type', label: 'Tipe' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

function typeLabel(type: 'single' | 'bundle'): string {
  return PRODUCT_TYPE_LABEL[type]
}
function statusLabel(status: AdminTutorDetail['products'][number]['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}
function statusTone(status: AdminTutorDetail['products'][number]['status']) {
  return PRODUCT_STATUS_TONE[status]
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Loading: skeletons that hold the page shape (header zone + panel). -->
    <template v-if="detailPending">
      <DashboardSkeleton variant="stats" :count="2" :columns="2" label="Memuat profil tutor..." />
      <div class="rounded-md border border-line bg-surface px-5 py-4 shadow-xs md:px-6 md:py-5">
        <DashboardSkeleton :count="4" />
      </div>
    </template>

    <!-- 404 / load failure: message + way back, no panels. -->
    <template v-else-if="detailError || !detail">
      <AppPageHeader title="Profil tutor">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>
      <div class="flex flex-wrap items-center gap-3">
        <AppInlineMessage type="error">{{ detailError || 'Tutor tidak ditemukan.' }}</AppInlineMessage>
        <NuxtLink
          to="/dashboard/admin/tutors"
          class="text-[0.86rem] font-semibold text-primary hover:underline"
        >
          Kembali ke Tutor
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <AppPageHeader :title="detail.name" :description="detail.email">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>

      <AppTabs v-model="activeTab" :tabs="TABS" aria-label="Bagian profil tutor" />

      <div v-show="activeTab === 'profil'" id="panel-profil" role="tabpanel" aria-labelledby="tab-profil">
        <DashboardPanel title="Profil">
          <div class="flex flex-col gap-4 rounded-md border border-hairline bg-linear-to-br from-surface-alt to-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
            <span class="relative inline-flex shrink-0 self-start rounded-full bg-linear-to-br from-primary-light to-primary p-0.5 shadow-lift sm:self-center">
              <img
                v-if="detail.avatarUrl"
                :src="detail.avatarUrl"
                alt=""
                referrerpolicy="no-referrer"
                class="h-16 w-16 rounded-full border-2 border-white object-cover"
              >
              <span
                v-else
                aria-hidden="true"
                class="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-surface-alt text-[1.3rem] font-bold text-muted"
              >{{ initial }}</span>
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-[1.2rem] font-bold tracking-[-0.03em]">{{ detail.name }}</p>
                <DashboardBadge tone="brand">Tutor</DashboardBadge>
              </div>
              <p class="mt-0.5 truncate text-[0.9rem] text-muted">{{ detail.email }}</p>
              <div class="mt-3">
                <DashboardBadge :tone="detail.verified ? 'success' : 'warning'">
                  {{ detail.verified ? 'Email terverifikasi' : 'Email belum terverifikasi' }}
                </DashboardBadge>
              </div>
            </div>
          </div>

          <div class="mt-5 grid gap-5">
            <div v-if="detail.profile.bio">
              <p class="text-[0.8rem] font-semibold text-muted">Bio</p>
              <p class="mt-1 max-w-prose text-sm leading-[1.7] whitespace-pre-line">{{ detail.profile.bio }}</p>
            </div>

            <div v-if="detail.profile.experience">
              <p class="text-[0.8rem] font-semibold text-muted">Pengalaman mengajar</p>
              <p class="mt-1 max-w-prose text-sm leading-[1.7] whitespace-pre-line">{{ detail.profile.experience }}</p>
            </div>

            <div v-if="detail.profile.specializations.length > 0">
              <p class="text-[0.8rem] font-semibold text-muted">Spesialisasi</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="tag in detail.profile.specializations"
                  :key="tag"
                  class="inline-flex items-center rounded-pill bg-primary-soft px-3 py-1 text-[0.82rem] font-semibold text-primary"
                >{{ tag }}</span>
              </div>
            </div>

            <div v-if="detail.profile.education">
              <p class="text-[0.8rem] font-semibold text-muted">Pendidikan</p>
              <p class="mt-1 text-sm">{{ detail.profile.education }}</p>
            </div>

            <div v-if="socialLinks.length > 0">
              <p class="text-[0.8rem] font-semibold text-muted">Tautan</p>
              <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                <a
                  v-for="link in socialLinks"
                  :key="link.label"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="inline-flex items-center gap-1.5 text-[0.86rem] font-semibold text-primary hover:underline"
                >
                  <AppIcon :name="link.icon" :size="15" />
                  {{ link.label }}
                </a>
              </div>
            </div>

            <p
              v-if="!detail.profile.bio && !detail.profile.experience && detail.profile.specializations.length === 0 && !detail.profile.education && socialLinks.length === 0"
              class="text-sm text-muted"
            >
              Tutor ini belum mengisi profil publiknya.
            </p>
          </div>
        </DashboardPanel>
      </div>

      <div v-show="activeTab === 'produk'" id="panel-produk" role="tabpanel" aria-labelledby="tab-produk">
        <DashboardPanel
          title="Produk"
          :description="`${detail.products.length} produk dibuat, apa pun statusnya.`"
        >
          <p v-if="detail.products.length === 0" class="py-6 text-center text-muted">
            Tutor ini belum membuat produk.
          </p>
          <AppTable v-else :columns="PRODUCT_COLUMNS" :data="detail.products">
            <template #cell(title)="{ value }">
              <span class="block font-semibold tracking-[-0.02em] text-ink">{{ value }}</span>
            </template>
            <template #cell(type)="{ value }">{{ typeLabel(value) }}</template>
            <template #cell(price)="{ value }">
              <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
              <span v-else class="font-semibold text-success-ink">Gratis</span>
            </template>
            <template #cell(status)="{ value }">
              <DashboardBadge :tone="statusTone(value)">{{ statusLabel(value) }}</DashboardBadge>
            </template>
            <template #cell(aksi)="{ item }">
              <NuxtLink
                :to="`/dashboard/admin/products/${item.id}`"
                class="text-[0.86rem] font-semibold text-primary hover:underline"
              >
                Lihat
              </NuxtLink>
            </template>
          </AppTable>
        </DashboardPanel>
      </div>
    </template>
  </div>
</template>
