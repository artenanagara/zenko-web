<script setup lang="ts">
import type { PublicTutorProfile } from '#shared/types/public-tutor'

/** One external profile link, built by the page from the fields that exist. */
interface TutorProfileLink { label: string, href: string, icon: string }

const props = defineProps<{
  profile: PublicTutorProfile
  tutorName: string
  links: TutorProfileLink[]
}>()

/** Nothing to show at all — bio, kredensial and links are all blank. */
const isBlank = computed(() =>
  !props.profile.bio
  && !props.profile.education
  && !props.profile.experience
  && !props.profile.specializations.length
  && !props.links.length,
)
</script>

<template>
  <section>
    <TutorProfileEmpty
      v-if="isBlank"
      icon="user"
      title="Tutor ini belum melengkapi profilnya"
      description="Tutor ini belum membagikan bio, pendidikan, atau pengalaman. Kamu tetap bisa melihat paket dan ulasannya di tab lain."
    />

    <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
      <article class="max-w-190">
        <h2 class="text-[1.25rem] font-bold tracking-[-0.03em]">Tentang {{ tutorName }}</h2>
        <p v-if="profile.bio" class="mt-3 whitespace-pre-line leading-[1.75] text-muted">{{ profile.bio }}</p>
        <p v-else class="mt-3 leading-[1.75] text-muted">Tutor ini belum menambahkan bio.</p>

        <div v-if="profile.education || profile.experience" class="mt-7 grid gap-6 border-t border-line pt-6">
          <div v-if="profile.education">
            <h3 class="flex items-center gap-2 font-bold tracking-[-0.02em]">
              <AppIcon name="graduation-cap" :size="18" class="text-primary" />
              Pendidikan
            </h3>
            <p class="mt-1.5 whitespace-pre-line leading-[1.7] text-muted">{{ profile.education }}</p>
          </div>
          <div v-if="profile.experience">
            <h3 class="flex items-center gap-2 font-bold tracking-[-0.02em]">
              <AppIcon name="briefcase" :size="18" class="text-primary" />
              Pengalaman
            </h3>
            <p class="mt-1.5 whitespace-pre-line leading-[1.7] text-muted">{{ profile.experience }}</p>
          </div>
        </div>
      </article>

      <aside class="grid content-start gap-6">
        <div v-if="profile.specializations.length">
          <h3 class="font-bold tracking-[-0.02em]">Bidang yang diajar</h3>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li
              v-for="item in profile.specializations"
              :key="item"
              class="rounded-pill bg-primary-soft px-3 py-1.5 text-[0.86rem] font-semibold text-primary"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div v-if="links.length" :class="profile.specializations.length ? 'border-t border-line pt-6' : ''">
          <h3 class="font-bold tracking-[-0.02em]">Tautan</h3>
          <ul class="mt-3 grid gap-1">
            <li v-for="link in links" :key="link.label">
              <!-- Labelled, not icon-only: this list is the readable copy of
                   the icon row in the hero. -->
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-11 items-center gap-2.5 text-[0.94rem] font-semibold text-primary transition-colors duration-200 ease-smooth hover:text-primary-dark hover:underline"
              >
                <AppIcon :name="link.icon" :size="18" />
                {{ link.label }}
                <AppIcon name="arrow-up-right" :size="14" weight="bold" aria-hidden="true" />
                <span class="sr-only">(buka di tab baru)</span>
              </a>
            </li>
          </ul>
        </div>

        <p v-if="profile.updatedAt > 0" class="text-[0.86rem] text-muted">
          Profil diperbarui {{ formatDate(profile.updatedAt) }}
        </p>
      </aside>
    </div>
  </section>
</template>
