<script setup lang="ts">
import type { Article } from '#shared/types/article'
import type { Package } from '#shared/types/catalog'
import type { ExamType, SectionTemplate } from '#shared/types/tutor-product'
import type { LandingPath } from '~/composables/useCategoryLanding'
import type { ResolvedLanding } from '~/data/category-landing'

/**
 * Category landing page body, shared by /kategori/:slug and
 * /kategori/:slug/:subSlug. Built from the /jadi-tutor blueprint (aurora hero,
 * bento with decorative mocks, three steps, <details> FAQ), with the package
 * grid lifted right under the hero: this page's job is to get a visitor onto
 * a package page.
 *
 * Mock panels are aria-hidden decoration with invented names and numbers,
 * the same rule as /jadi-tutor. Everything a reader relies on — the format
 * table, counts, disclaimers — is real data from the API.
 */
const props = defineProps<{
  landing: ResolvedLanding
  subcategory?: { slug: string, label: string, count: number }
  paths: LandingPath[]
  examTypes: ExamType[]
  count: number
  packages: Package[]
  pending?: boolean
  error?: unknown
  articles: Article[]
  catalogLink: string
  sampleLink: string | null
  breadcrumbs: { label: string, to?: string }[]
}>()

const termTitle = computed(() => props.landing.term.charAt(0).toUpperCase() + props.landing.term.slice(1))

const badge = computed(() => props.count > 0
  ? `${props.count} paket ${props.landing.label} dari tutor & bimbel`
  : `Paket ${props.landing.label} sedang disiapkan tutor`)

/* ------------------------------------------------------------ format table */

function sectionSeconds(section: SectionTemplate) {
  return section.durationSeconds && section.durationSeconds > 0
    ? section.durationSeconds
    : section.durationMinutes * 60
}

function formatMinutes(seconds: number) {
  const minutes = seconds / 60
  return Number.isInteger(minutes) ? `${minutes} menit` : `${minutes.toFixed(1).replace('.', ',')} menit`
}

/** Sections beyond this fold into a <details>, so TKA SMA's mapel pilihan
 *  do not turn the page into one long table. */
const VISIBLE_SECTIONS = 6

const formats = computed(() => props.examTypes.map((type) => {
  const questions = type.sections.reduce((sum, section) => sum + section.questionTarget, 0)
  const seconds = type.simulasiTotalMinutes
    ? type.simulasiTotalMinutes * 60
    : type.sections.reduce((sum, section) => sum + sectionSeconds(section), 0)
  // A per-section scope means a package covers one chosen section, so a
  // total across all of them would describe no real package.
  const singleSection = type.simulationScope === 'section'
  return {
    slug: type.slug,
    label: type.label,
    description: type.description,
    disclaimer: type.scoreDisclaimer,
    timer: type.timerPolicy === 'sequential'
      ? 'Waktu per bagian, tidak bisa kembali ke bagian sebelumnya'
      : 'Satu waktu untuk seluruh ujian',
    totals: singleSection ? null : { questions, duration: formatMinutes(seconds) },
    hasPassingGrade: type.sections.some(section => section.passingGrade != null),
    sections: type.sections.map(section => ({
      title: section.title,
      questions: section.questionTarget,
      duration: formatMinutes(sectionSeconds(section)),
      passingGrade: section.passingGrade,
      weighted: section.scoringMode === 'weighted',
    })),
  }
}))

/* ------------------------------------------------------------ bento mocks */

// Real section names of this exam when there are any; generic otherwise.
const mockScoreRows = computed(() => {
  const sections = props.examTypes[0]?.sections.slice(0, 3) ?? []
  const widths = [78, 62, 86]
  const names = sections.length ? sections.map(section => section.title) : ['Bagian 1', 'Bagian 2', 'Bagian 3']
  return names.map((title, index) => ({ title, width: widths[index] ?? 70, passed: index !== 1 }))
})

const mockNavigator = Array.from({ length: 20 }, (_, index) => index < 9 ? 'done' : index === 9 ? 'current' : index === 12 ? 'flag' : 'todo')

const mockLeaders = [
  { rank: 1, name: 'Dinda P.', score: 412 },
  { rank: 2, name: 'Peserta anonim', score: 398 },
  { rank: 3, name: 'Rizky A.', score: 387 },
]

const benefits = [
  {
    title: 'Rasanya seperti hari-H',
    description: 'Timer, navigasi soal, dan tanda ragu-ragu seperti ujian berbasis komputer, jadi hari-H terasa lebih akrab.',
  },
  {
    title: 'Tahu posisi skormu',
    description: 'Skor dipecah per bagian dan dibandingkan dengan ambang batasnya, jadi kamu tahu harus fokus ke mana.',
  },
  {
    title: 'Pembahasan yang bikin paham',
    description: 'Setiap soal punya kunci dan pembahasan. Salah hari ini, paham besok.',
  },
  {
    title: 'Papan peringkat mingguan',
    description: 'Lihat posisimu di antara peserta lain tiap minggu. Mau tampil sebagai peserta anonim juga boleh.',
  },
]

const steps = computed(() => [
  {
    title: 'Pilih paket',
    description: `Lihat paket ${props.landing.label} dari tutor dan bimbel. Ragu? Coba 5 soal gratisnya dulu.`,
  },
  {
    title: 'Kerjakan simulasi',
    description: 'Kerjakan kapan saja di HP atau laptop, dengan timer dan navigasi soal seperti ujian aslinya.',
  },
  {
    title: 'Pelajari dan ulangi',
    description: 'Baca pembahasan, catat bagian yang masih lemah, lalu coba lagi. Kemajuan kecil tetap kemajuan.',
  },
])

const { target: benefitRef, ready: benefitReady, isInView: benefitInView } = useInView(0.15)
const { target: flowRef, ready: flowReady, isInView: flowInView } = useInView(0.2)
void benefitRef
void flowRef

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}
</script>

<template>
  <main>
    <!-- 1. Hero -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-8 pb-14 md:rounded-xl md:px-10 md:pt-10 md:pb-18"
      >
        <AppBreadcrumbs class="relative z-1 mb-8 justify-center" :items="breadcrumbs" />

        <div class="relative z-1 mx-auto max-w-190 text-center">
          <span
            class="mb-5 inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-2 pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]"
          >
            <span class="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
            {{ badge }}
          </span>
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter text-balance">
            {{ landing.h1 }}
            <span class="text-accent mt-1 block">{{ landing.accent }}</span>
          </h1>
          <p class="mx-auto mt-4 max-w-160 text-[1.02rem] text-muted">
            {{ landing.intro }}
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AppButton href="#paket-kategori" size="lg">
              Lihat paket {{ landing.label }}
              <IconArrowRight class="h-4 w-4" />
            </AppButton>
            <AppButton v-if="sampleLink" :to="sampleLink" size="lg" variant="light">
              Coba 5 soal gratis
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Pilih jalurmu -->
    <section v-if="paths.length" class="container-page pt-10" aria-labelledby="jalur-heading">
      <h2 id="jalur-heading" class="mb-4 text-center text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
        {{ subcategory ? 'Jalur lainnya' : 'Pilih jalurmu' }}
      </h2>
      <ul class="flex flex-wrap justify-center gap-2.5">
        <li v-for="path in paths" :key="path.slug">
          <NuxtLink
            :to="path.to"
            class="inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-[0.9rem] font-semibold transition-[background,border-color,color] duration-200 ease-smooth"
            :class="subcategory?.slug === path.slug
              ? 'border-primary bg-primary text-white'
              : 'border-hairline bg-surface hover:border-primary/35 hover:text-primary'"
            :aria-current="subcategory?.slug === path.slug ? 'page' : undefined"
          >
            {{ path.label }}
            <span
              v-if="path.count"
              class="rounded-pill px-2 py-0.5 text-[0.72rem]"
              :class="subcategory?.slug === path.slug ? 'bg-white/20' : 'bg-surface-sunken text-muted'"
            >{{ path.count }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 3. Paket pilihan -->
    <section id="paket-kategori" class="container-page scroll-mt-24 py-14 md:py-18" aria-labelledby="paket-heading">
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="mb-2 text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">Paket pilihan</p>
          <h2 id="paket-heading" class="text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.15] tracking-tighter">
            Paket {{ landing.term }} <span class="text-accent">untuk mulai hari ini</span>
          </h2>
        </div>
        <AppButton v-if="count > packages.length" :to="catalogLink" variant="outline">
          Lihat semua {{ count }} paket
          <IconArrowRight class="h-4 w-4" />
        </AppButton>
      </div>

      <PackageGrid :items="packages" :pending="pending" :error="error">
        <template #empty>
          <div class="rounded-3xl bg-surface-alt px-6 py-12 text-center">
            <p class="mx-auto max-w-120 text-[1.05rem] font-semibold">
              Paket {{ landing.label }} sedang disiapkan para tutor.
            </p>
            <p class="mx-auto mt-2 max-w-120 text-muted">
              Sambil menunggu, lihat dulu paket lain di katalog. Siapa tahu ada yang cocok untuk pemanasan.
            </p>
            <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <AppButton to="/paket">Jelajahi katalog</AppButton>
              <AppButton to="/kategori" variant="light">Lihat kategori lain</AppButton>
            </div>
          </div>
        </template>
      </PackageGrid>
    </section>

    <!-- 4. Kenapa latihan di Zenko -->
    <section
      ref="benefitRef"
      class="py-14 md:py-18"
      :class="[benefitReady && 'anim-ready', benefitInView && 'is-inview']"
      aria-labelledby="manfaat-heading"
    >
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Kenapa latihan di Zenko
          </p>
          <h2 id="manfaat-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Latihan yang <span class="text-accent">menemanimu sampai paham</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Bukan cuma kumpulan soal. Kamu tahu posisimu, tahu salahnya di mana, dan tahu harus belajar apa berikutnya.
          </p>
        </div>

        <div class="mx-auto grid max-w-300 grid-cols-1 gap-5 rounded-4xl bg-surface-alt p-4 md:grid-cols-2 md:p-6">
          <article
            v-for="(benefit, index) in benefits"
            :key="benefit.title"
            :style="{ '--cycle': `${5 + index}s` }"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <div class="relative mb-7 flex min-h-56 items-center justify-center overflow-hidden rounded-[20px] bg-surface-sunken px-6 py-8" aria-hidden="true">
              <!-- 1. Timer + navigator -->
              <div v-if="index === 0" class="w-full max-w-72 rotate-1 rounded-2xl bg-surface p-4 shadow-float">
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-[0.68rem] font-bold tracking-widest text-faint uppercase">Soal 10 / 20</span>
                  <span class="anim-item rounded-pill bg-primary-soft px-2.5 py-1 text-[0.72rem] font-bold text-primary" style="--delay: 120ms">
                    ⏱ 24:36
                  </span>
                </div>
                <div class="grid grid-cols-10 gap-1.5">
                  <span
                    v-for="(state, cell) in mockNavigator"
                    :key="cell"
                    class="anim-item block aspect-square rounded-[4px]"
                    :class="{
                      'bg-primary': state === 'done',
                      'bg-white ring-2 ring-primary': state === 'current',
                      'bg-warning': state === 'flag',
                      'bg-skeleton': state === 'todo',
                    }"
                    :style="{ '--delay': `${200 + cell * 40}ms` }"
                  />
                </div>
              </div>

              <!-- 2. Score per section vs threshold -->
              <div v-else-if="index === 1" class="w-full max-w-72 -rotate-1 rounded-2xl bg-surface p-4 shadow-float">
                <p class="mb-3 text-[0.68rem] font-bold tracking-widest text-faint uppercase">Skor per bagian</p>
                <div class="grid gap-3">
                  <span v-for="(row, rowIndex) in mockScoreRows" :key="row.title" class="grid gap-1.5">
                    <span class="flex items-center justify-between gap-2">
                      <span class="truncate text-[0.72rem] font-semibold tracking-[-0.02em]">{{ row.title }}</span>
                      <span
                        class="anim-item shrink-0 text-[0.66rem] font-bold"
                        :class="row.passed ? 'text-success-ink' : 'text-warning-ink'"
                        :style="{ '--delay': `${700 + rowIndex * 150}ms` }"
                      >{{ row.passed ? 'Lolos' : 'Kejar lagi' }}</span>
                    </span>
                    <span class="relative block h-2 overflow-hidden rounded-pill bg-skeleton/60">
                      <span
                        class="anim-bar block h-full rounded-pill bg-linear-to-r from-primary-light to-primary"
                        :style="{ width: `${row.width}%`, '--delay': `${260 + rowIndex * 150}ms` }"
                      />
                      <span class="absolute top-0 left-[70%] h-full w-0.5 bg-ink/40" />
                    </span>
                  </span>
                </div>
              </div>

              <!-- 3. Explanation -->
              <div v-else-if="index === 2" class="w-full max-w-72 rotate-1 rounded-2xl bg-surface p-4 shadow-float">
                <p class="text-[0.76rem] font-bold tracking-[-0.02em]">Berapa hasil dari 15% × 240?</p>
                <ul class="mt-3 grid gap-2">
                  <li
                    v-for="(option, optionIndex) in ['A. 24', 'B. 36', 'C. 42']"
                    :key="option"
                    class="anim-item flex items-center justify-between rounded-[9px] border px-3 py-2 text-[0.72rem]"
                    :class="optionIndex === 1 ? 'border-success-ink/30 bg-success-soft font-bold text-success-ink' : 'border-hairline'"
                    :style="{ '--delay': `${160 + optionIndex * 140}ms` }"
                  >
                    {{ option }}
                    <IconCheck v-if="optionIndex === 1" class="anim-draw h-3.5 w-3.5" style="--delay: 700ms" />
                  </li>
                </ul>
                <p class="anim-item mt-3 rounded-[9px] bg-primary-soft px-3 py-2 text-[0.68rem] leading-normal text-primary" style="--delay: 900ms">
                  Pembahasan: 10% dari 240 = 24, 5% = 12. Jadi 15% = 24 + 12 = 36.
                </p>
              </div>

              <!-- 4. Weekly leaderboard -->
              <div v-else class="w-full max-w-72 -rotate-1 rounded-2xl bg-surface p-4 shadow-float">
                <p class="mb-3 flex items-center gap-2 text-[0.68rem] font-bold tracking-widest text-faint uppercase">
                  <IconTrophy class="h-3.5 w-3.5 text-primary" /> Peringkat minggu ini
                </p>
                <ul class="grid gap-2">
                  <li
                    v-for="(leader, leaderIndex) in mockLeaders"
                    :key="leader.rank"
                    class="anim-slide flex items-center gap-3 rounded-[9px] px-2 py-1.5"
                    :class="leaderIndex === 0 && 'bg-primary-soft'"
                    :style="{ '--delay': `${200 + leaderIndex * 160}ms` }"
                  >
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-primary-light to-primary text-[0.68rem] font-bold text-white">
                      {{ leader.rank }}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-[0.74rem] font-semibold">{{ leader.name }}</span>
                    <span class="text-[0.72rem] font-bold text-primary">{{ leader.score }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <h3 class="mb-2.5 text-center text-[1.3rem] font-bold tracking-[-0.03em]">{{ benefit.title }}</h3>
            <p class="text-center leading-[1.62] text-muted">{{ benefit.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- 5. Kenali format + tentang ujian -->
    <section
      v-if="formats.length || landing.about.length"
      class="border-t border-hairline py-14 md:py-18"
      aria-labelledby="format-heading"
    >
      <div class="container-page">
        <div class="mx-auto mb-10 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Kenali ujiannya
          </p>
          <h2 id="format-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Seperti apa <span class="text-accent">{{ landing.label }}</span>?
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Kenal formatnya dulu, supaya latihanmu lebih terarah.
          </p>
        </div>

        <div class="mx-auto grid max-w-300 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div v-if="landing.about.length" class="grid min-w-0 content-start gap-4 text-[1.02rem] leading-[1.75] text-muted">
            <p v-for="paragraph in landing.about" :key="paragraph">{{ paragraph }}</p>
          </div>

          <div class="grid min-w-0 content-start gap-5" :class="!landing.about.length && 'lg:col-span-2'">
            <article
              v-for="format in formats"
              :key="format.slug"
              class="min-w-0 rounded-3xl border border-hairline bg-surface p-5 shadow-xs md:p-6"
            >
              <h3 class="text-[1.15rem] font-bold tracking-[-0.03em]">{{ format.label }}</h3>
              <p class="mt-1.5 text-[0.92rem] leading-[1.65] text-muted">{{ format.description }}</p>

              <dl class="mt-4 flex flex-wrap gap-2 text-[0.8rem]">
                <div v-if="format.totals" class="rounded-pill bg-primary-soft px-3 py-1.5 font-semibold text-primary">
                  <dt class="sr-only">Total</dt>
                  <dd>{{ format.totals.questions }} soal · {{ format.totals.duration }}</dd>
                </div>
                <div class="rounded-pill bg-surface-sunken px-3 py-1.5 font-semibold text-muted">
                  <dt class="sr-only">Timer</dt>
                  <dd>{{ format.timer }}</dd>
                </div>
              </dl>

              <div class="mt-4 overflow-x-auto">
                <table class="w-full min-w-110 text-left text-[0.86rem]">
                  <caption class="sr-only">Susunan bagian {{ format.label }}</caption>
                  <thead>
                    <tr class="border-b border-line text-[0.74rem] tracking-wide text-faint uppercase">
                      <th scope="col" class="py-2 pr-3 font-bold">Bagian</th>
                      <th scope="col" class="py-2 pr-3 font-bold">Soal</th>
                      <th scope="col" class="py-2 pr-3 font-bold">Durasi</th>
                      <th v-if="format.hasPassingGrade" scope="col" class="py-2 font-bold">Ambang batas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="section in format.sections.slice(0, VISIBLE_SECTIONS)"
                      :key="section.title"
                      class="border-b border-hairline last:border-0"
                    >
                      <th scope="row" class="py-2.5 pr-3 font-semibold">
                        {{ section.title }}
                        <span v-if="section.weighted" class="ml-1 text-[0.72rem] font-normal text-muted">(bobot per pilihan)</span>
                      </th>
                      <td class="py-2.5 pr-3">{{ section.questions }}</td>
                      <td class="py-2.5 pr-3">{{ section.duration }}</td>
                      <td v-if="format.hasPassingGrade" class="py-2.5">{{ section.passingGrade ?? '–' }}</td>
                    </tr>
                  </tbody>
                </table>
                <details v-if="format.sections.length > VISIBLE_SECTIONS" class="mt-2">
                  <summary class="cursor-pointer py-2 text-[0.86rem] font-semibold text-primary">
                    Lihat {{ format.sections.length - VISIBLE_SECTIONS }} bagian lainnya
                  </summary>
                  <table class="w-full min-w-110 text-left text-[0.86rem]">
                    <tbody>
                      <tr
                        v-for="section in format.sections.slice(VISIBLE_SECTIONS)"
                        :key="section.title"
                        class="border-b border-hairline last:border-0"
                      >
                        <th scope="row" class="py-2.5 pr-3 font-semibold">{{ section.title }}</th>
                        <td class="py-2.5 pr-3">{{ section.questions }}</td>
                        <td class="py-2.5 pr-3">{{ section.duration }}</td>
                        <td v-if="format.hasPassingGrade" class="py-2.5">{{ section.passingGrade ?? '–' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
              </div>

              <p v-if="format.disclaimer" class="mt-4 rounded-xl bg-surface-sunken px-4 py-3 text-[0.82rem] leading-[1.6] text-muted">
                {{ format.disclaimer }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Tiga langkah -->
    <section
      ref="flowRef"
      class="py-14 md:py-18"
      :class="[flowReady && 'anim-ready', flowInView && 'is-inview']"
      aria-labelledby="langkah-heading"
    >
      <div class="container-page">
        <div class="mx-auto mb-12 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Cara mulai
          </p>
          <h2 id="langkah-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Tiga langkah, <span class="text-accent">tanpa ribet</span>
          </h2>
        </div>

        <ol class="mx-auto flex max-w-300 flex-col gap-4 rounded-4xl bg-surface-alt p-4 md:flex-row md:p-6">
          <li
            v-for="(step, index) in steps"
            :key="step.title"
            class="flex flex-1 flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs md:min-h-60"
          >
            <span
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[13px] bg-linear-to-b from-primary-light to-primary font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
              aria-hidden="true"
            >{{ index + 1 }}</span>
            <h3 class="mt-8 mb-2 text-[1.2rem] font-bold tracking-[-0.03em] md:mt-auto md:pt-8">{{ step.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ step.description }}</p>
          </li>
        </ol>

        <div class="mt-8 flex justify-center">
          <AppButton href="#paket-kategori" size="lg">
            Pilih paket {{ landing.label }}
          </AppButton>
        </div>
      </div>
    </section>

    <!-- 7. FAQ -->
    <section class="border-t border-hairline py-14 md:py-18" aria-labelledby="faq-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Pertanyaan umum
          </p>
          <h2 id="faq-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Seputar <span class="text-accent">{{ landing.term }}</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 gap-3 rounded-4xl bg-surface-alt p-4 md:p-6">
          <details
            v-for="faq in landing.faqs"
            :key="faq.question"
            name="faq"
            class="group rounded-xl border border-hairline bg-surface px-5 py-4 shadow-xs transition-[box-shadow,border-color] duration-300 ease-smooth hover:shadow-lift open:shadow-lift md:px-6 md:py-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden"
            >
              <h3 class="text-[1rem]">{{ faq.question }}</h3>
              <span class="relative h-4 w-4 shrink-0" aria-hidden="true">
                <span class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-pill bg-primary" />
                <span
                  class="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-pill bg-primary transition-[opacity,rotate] duration-300 ease-smooth group-open:rotate-90 group-open:opacity-0"
                />
              </span>
            </summary>
            <p class="mt-3 leading-[1.7] text-muted">{{ faq.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- 8. Artikel terkait -->
    <section v-if="articles.length" class="border-t border-hairline py-14 md:py-18" aria-labelledby="artikel-heading">
      <div class="container-page">
        <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="mb-2 text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">Bacaan pendukung</p>
            <h2 id="artikel-heading" class="text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.15] tracking-tighter">
              Tips dan panduan <span class="text-accent">{{ landing.label }}</span>
            </h2>
          </div>
          <NuxtLink to="/artikel" class="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            Semua artikel <IconArrowRight class="h-4 w-4" />
          </NuxtLink>
        </div>
        <ul class="grid gap-5 md:grid-cols-3">
          <li v-for="article in articles" :key="article.id">
            <NuxtLink
              :to="`/artikel/${article.slug}`"
              class="group flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
            >
              <img
                v-if="article.coverUrl"
                :src="article.coverUrl"
                :alt="article.coverAlt || article.title"
                loading="lazy"
                width="640"
                height="360"
                class="aspect-video w-full object-cover"
              >
              <div class="flex flex-1 flex-col p-5">
                <p class="text-[0.74rem] font-bold tracking-wide text-primary uppercase">{{ article.categoryName }}</p>
                <h3 class="mt-2 text-[1.05rem] leading-snug font-bold tracking-[-0.02em] group-hover:text-primary">{{ article.title }}</h3>
                <p class="mt-auto pt-4 text-[0.8rem] text-muted">
                  {{ formatDate(article.publishedAt) }} · {{ article.readingMinutes }} menit baca
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- 9. Penutup + jembatan tutor -->
    <section class="container-page pt-6" aria-labelledby="penutup-heading">
      <div class="dot-grid hero-aurora relative overflow-hidden rounded-[26px] px-6 py-12 text-center md:rounded-xl md:px-10 md:py-16">
        <div class="relative z-1 mx-auto max-w-160">
          <h2 id="penutup-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Siap mulai {{ landing.term }}?
            <span class="text-accent mt-1 block">Pelan-pelan juga nggak apa-apa.</span>
          </h2>
          <p class="mx-auto mt-4 max-w-130 text-[1.02rem] text-muted">
            Satu paket, satu kali latihan, satu pembahasan. Dari situ kamu sudah tahu langkah berikutnya.
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AppButton :to="catalogLink" size="lg">
              {{ termTitle }} sekarang
              <IconArrowRight class="h-4 w-4" />
            </AppButton>
            <AppButton v-if="sampleLink" :to="sampleLink" size="lg" variant="light">
              Coba gratis dulu
            </AppButton>
          </div>
          <p class="mt-8 text-[0.9rem] text-muted">
            {{ landing.tutorPitch }}
            <NuxtLink to="/jadi-tutor" class="ml-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              Jadi tutor Zenko <IconArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
