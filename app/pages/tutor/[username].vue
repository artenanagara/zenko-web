<script setup lang="ts">
definePageMeta({ path: '/tutor/:username()' })

const route = useRoute()
const username = String(route.params.username)
const tutor = await usePublicTutor(username)
const tutorReviews = usePublicTutorReviews(username)
const profile = computed(() => tutor.value.profile)
const displayName = computed(() => tutor.value.name || profile.value.displayName || 'Tutor Zenko')
const avatarUrl = computed(() => tutor.value.avatarUrl || profile.value.avatarUrl)
const canonicalUrl = computed(() => `https://zenkoedu.id/tutor/${tutor.value.username || username}`)

onMounted(() => tutorReviews.refresh())

useSeoMeta({
  title: `${displayName.value} | Tutor Zenko`,
  description: profile.value.bio || `Profil tutor ${displayName.value} di Zenko.`,
  ogTitle: `${displayName.value} | Tutor Zenko`,
  ogDescription: profile.value.bio || `Profil tutor ${displayName.value} di Zenko.`,
  ogImage: avatarUrl.value || undefined,
  ogUrl: canonicalUrl.value,
})
useHead({ link: [{ rel: 'canonical', href: canonicalUrl.value }] })
</script>

<template>
  <main>
    <section class="border-b border-line bg-surface-alt">
      <div class="container-page py-10 md:py-14">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="`Foto ${displayName}`" class="h-24 w-24 rounded-full object-cover ring-4 ring-surface">
          <span v-else class="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-3xl font-bold text-primary">{{ displayName.charAt(0).toUpperCase() }}</span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-[clamp(1.8rem,4vw,2.6rem)] tracking-[-0.04em]">{{ displayName }}</h1>
              <span v-if="tutor.verified" class="rounded-pill bg-success-soft px-2.5 py-1 text-[0.76rem] font-bold text-success-ink">Tutor terverifikasi</span>
            </div>
            <p v-if="profile.specializations.length" class="mt-2 text-muted">{{ profile.specializations.join(' · ') }}</p>
            <div class="mt-4 flex flex-wrap gap-5 text-[0.88rem] text-muted">
              <span><strong class="text-ink">{{ tutor.stats.activePackages }}</strong> paket aktif</span>
              <span><strong class="text-ink">{{ tutor.stats.ratingCount ? tutor.stats.ratingAverage.toFixed(1) : '—' }}</strong> rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <article class="grid content-start gap-7">
        <div>
          <h2 class="text-[1.25rem] font-bold">Tentang pengajar</h2>
          <p class="mt-3 whitespace-pre-line leading-[1.75] text-muted">{{ profile.bio || 'Tutor ini belum menambahkan bio.' }}</p>
        </div>
        <div v-if="profile.education || profile.experience" class="grid gap-4 border-t border-line pt-6">
          <div v-if="profile.education"><h3 class="font-semibold">Pendidikan</h3><p class="mt-1 text-muted">{{ profile.education }}</p></div>
          <div v-if="profile.experience"><h3 class="font-semibold">Pengalaman</h3><p class="mt-1 whitespace-pre-line text-muted">{{ profile.experience }}</p></div>
        </div>
        <div v-if="profile.websiteUrl || profile.instagramUrl || profile.tiktokUrl || profile.linkedinUrl || profile.youtubeUrl" class="flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-6 text-[0.88rem] font-semibold">
          <a v-if="profile.websiteUrl" :href="profile.websiteUrl" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Website</a>
          <a v-if="profile.instagramUrl" :href="profile.instagramUrl" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Instagram</a>
          <a v-if="profile.tiktokUrl" :href="profile.tiktokUrl" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">TikTok</a>
          <a v-if="profile.linkedinUrl" :href="profile.linkedinUrl" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">LinkedIn</a>
          <a v-if="profile.youtubeUrl" :href="profile.youtubeUrl" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">YouTube</a>
        </div>
      </article>

      <section>
        <div class="flex items-end justify-between gap-4"><div><h2 class="text-[1.25rem] font-bold">Paket try out</h2><p class="mt-1 text-[0.88rem] text-muted">Paket aktif yang dibuat {{ displayName }}.</p></div></div>
        <div v-if="tutor.products.length" class="mt-5 grid gap-5 sm:grid-cols-2">
          <NuxtLink v-for="item in tutor.products" :key="item.id" :to="`/paket/${item.slug}`" class="group rounded-lg border border-hairline bg-surface p-3 transition-shadow hover:shadow-lift">
            <img :src="item.thumbnailUrl" :alt="`Thumbnail ${item.title}`" class="aspect-16/10 w-full rounded-md bg-surface-alt object-cover">
            <p class="mt-3 clamp-2 font-bold leading-[1.35]">{{ item.title }}</p>
            <p class="mt-2 text-[0.82rem] text-muted">{{ item.category }} · {{ item.questionCount }} soal</p>
            <p class="mt-3 font-bold text-primary">{{ item.price > 0 ? formatRupiah(item.price) : 'Gratis' }}</p>
          </NuxtLink>
        </div>
        <div v-else class="mt-5 rounded-lg border border-dashed border-line px-5 py-10 text-center text-muted">Belum ada paket yang tayang.</div>
      </section>
    </section>

    <section class="border-t border-line bg-surface-alt py-10 md:py-14">
      <div class="container-page">
        <h2 class="text-[1.25rem] font-bold">Ulasan siswa</h2>
        <div v-if="tutorReviews.data.value.length" class="mt-5 grid max-w-180 gap-4">
          <article v-for="review in tutorReviews.data.value" :key="review.id" class="rounded-md border border-hairline bg-surface p-4">
            <div class="flex items-center justify-between gap-3"><span class="font-semibold">{{ review.isAnonymous ? 'Siswa anonim' : review.authorName }}</span><span class="text-star">{{ '★'.repeat(review.rating) }}</span></div>
            <p v-if="review.productTitle" class="mt-1 text-[0.8rem] text-muted">{{ review.productTitle }}</p>
            <p v-if="review.reviewText" class="mt-2 leading-[1.65] text-muted">{{ review.reviewText }}</p>
            <p v-if="review.tutorReplyText" class="mt-3 border-l-2 border-primary/30 pl-3 text-[0.86rem] text-muted"><span class="font-semibold text-ink">Balasan tutor:</span> {{ review.tutorReplyText }}</p>
          </article>
        </div>
        <p v-else class="mt-4 text-muted">Belum ada ulasan publik.</p>
      </div>
    </section>
  </main>
</template>
