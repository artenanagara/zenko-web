<script setup lang="ts">
import type { PreviewScope } from '~/composables/useTryoutPreview'

/**
 * Simulasi satu subtes di ruang ujian sungguhan — dipakai tutor (langkah 4
 * wizard) dan admin (halaman tinjau produk) lewat dua rute tipis yang
 * cuma mengoper `scope` berbeda.
 *
 * Yang menjalankan sesinya adalah useTryoutSession — mesin state yang sama
 * persis dengan sesi siswa di /akun/paket/:slug/kerjakan, jadi timer,
 * navigasi, tanda ragu-ragu, dan penilaiannya identik. Yang berbeda cuma dua
 * hal, dan keduanya disengaja:
 *
 * 1. Sumber datanya endpoint pratinjau (satu subtes) alih-alih blueprint
 *    paket yang dimiliki siswa.
 * 2. Hasilnya tidak pernah dikirim ke mana pun. Sesi siswa memanggil
 *    recordAttempt() saat selesai; di sini tidak ada panggilan itu sama
 *    sekali — penilaiannya memang sudah client-side, jadi layar Hasil tetap
 *    utuh tanpa perlu endpoint attempt.
 *
 * `resume: false` memastikan progres tidak pernah ditulis ke sessionStorage
 * dan setiap kunjungan mulai dari layar intro yang bersih (lihat brief:
 * keluar di tengah jalan berarti membuang state, bukan menyimpannya).
 */
const props = defineProps<{
  scope: PreviewScope
  productId: string
  /** Query `?section=` — subtes yang mau dijalankan. */
  sectionId: string
  /** Ke mana tombol "Keluar" kembali (halaman produknya masing-masing). */
  backTo: string
  /** Label tombol kembali, mis. "Kembali ke produk". */
  backLabel: string
}>()

const {
  data: blueprint,
  pending,
  error,
  refresh,
} = useTryoutPreview(props.scope, props.productId, () => props.sectionId)

/**
 * Kunci sesi wajib unik terhadap slug paket siswa: slug itu memberi kunci
 * sessionStorage DAN setiap useState di dalam useTryoutSession, jadi memakai
 * slug asli akan membuat simulasi ini menimpa sesi sungguhan seseorang.
 */
const sessionKey = computed(() => `simulasi--${props.scope}--${props.productId}--${props.sectionId}`)
const session = useTryoutSession(sessionKey.value, blueprint, { resume: false })

const { confirm } = useConfirm()

useHead({
  title: computed(() =>
    blueprint.value ? `Simulasi — ${blueprint.value.title} — Zenko` : 'Simulasi — Zenko',
  ),
  meta: [{ name: 'robots', content: 'noindex' }],
})

const section = computed(() => blueprint.value?.sections[0] ?? null)
const totalQuestions = computed(() => section.value?.questions.length ?? 0)

const showEndConfirm = ref(false)

/** Sheet nomor soal — hanya dipakai di HP; desktop punya rail sendiri. */
const navOpen = ref(false)

function requestEndSection() {
  navOpen.value = false
  showEndConfirm.value = true
}

function confirmEndSection() {
  showEndConfirm.value = false
  session.endSection()
}

/**
 * Keluar di tengah soal membuang progres, jadi ditanya dulu. Di layar Hasil
 * tidak ada yang bisa hilang, jadi tombolnya langsung jalan.
 */
async function exitSimulation() {
  if (session.phase.value === 'running' || session.phase.value === 'section-break') {
    const ok = await confirm({
      title: 'Keluar dari simulasi?',
      description: 'Progres tidak disimpan.',
      confirmLabel: 'Ya, keluar',
    })
    if (!ok) return
  }
  session.reset()
  await navigateTo(props.backTo)
}
</script>

<template>
  <div>
    <div v-if="pending" class="container-page grid min-h-screen place-items-center py-10">
      <div class="grid w-full max-w-3xl gap-6" aria-busy="true">
        <p class="sr-only" role="status">Memuat simulasi…</p>
        <div class="h-8 w-48 animate-pulse rounded-sm bg-surface-sunken" aria-hidden="true" />
        <div class="h-40 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
        <div class="h-32 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
      </div>
    </div>

    <div v-else-if="error || !blueprint || !section" class="container-page grid min-h-screen place-items-center py-10">
      <div class="grid w-full max-w-md gap-4">
        <AppSectionMessage appearance="warning" title="Simulasi tidak bisa dijalankan">
          {{ error || 'Subtes ini tidak bisa dimuat.' }}
        </AppSectionMessage>
        <div class="flex flex-wrap gap-3">
          <AppButton variant="outline" size="sm" @click="refresh">Coba lagi</AppButton>
          <AppButton :to="backTo" variant="light" size="sm" class="border border-hairline-strong shadow-none">
            {{ backLabel }}
          </AppButton>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Intro: aturan mainnya sama dengan sesi siswa, ditambah penegasan
           bahwa ini simulasi dan hasilnya tidak ke mana-mana. -->
      <div v-if="session.phase.value === 'intro'" class="container-page grid max-w-3xl gap-6 py-10 md:py-14">
        <nav class="text-[0.85rem] text-muted">
          <NuxtLink :to="backTo" class="inline-flex items-center gap-1 transition-colors hover:text-ink">
            <IconArrowLeft class="h-3.5 w-3.5" /> {{ backLabel }}
          </NuxtLink>
        </nav>

        <div>
          <div class="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="warning">Mode Simulasi</DashboardBadge>
            <p class="text-[0.78rem] font-bold tracking-[0.12em] text-primary uppercase">
              {{ blueprint.theme.system }}
            </p>
          </div>
          <h1 class="mt-2 text-[1.6rem] leading-tight font-extrabold tracking-[-0.03em] md:text-[2rem]">
            {{ blueprint.title }}
          </h1>
          <p class="mt-2 text-muted">
            {{ section.code }} · {{ section.title }} · {{ totalQuestions }} soal ·
            {{ formatDuration(section.durationMinutes) }}
          </p>
        </div>

        <AccountNotice>
          Mode simulasi — hasil tidak disimpan dan tidak memengaruhi status produk.
        </AccountNotice>

        <div class="rounded-lg border border-hairline-strong bg-surface-alt p-5 text-[0.88rem] text-muted md:p-6">
          <h2 class="font-bold text-ink">Yang akan kamu rasakan</h2>
          <ul class="mt-3 grid list-disc gap-2 pl-4">
            <li>Tampilan, timer, dan navigasi soalnya sama persis dengan yang dipakai siswa.</li>
            <li>Waktu berjalan begitu kamu menekan Mulai; kalau habis, sesi langsung dinilai.</li>
            <li>Skor dihitung di perangkatmu saja — tidak ada riwayat pengerjaan yang tercatat.</li>
            <li>Keluar di tengah jalan membuang progresnya; tidak ada sesi yang bisa dilanjutkan.</li>
          </ul>
        </div>

        <div class="flex flex-wrap gap-3">
          <AppButton size="lg" @click="session.start()">Mulai simulasi</AppButton>
          <AppButton :to="backTo" variant="outline" size="lg">{{ backLabel }}</AppButton>
        </div>
      </div>

      <!-- Sesi berjalan — kerangka yang sama dengan /akun/paket/:slug/kerjakan. -->
      <template v-else-if="session.phase.value === 'running' && session.currentQuestion.value">
        <TryoutHeader
          :package-title="blueprint.title"
          :remaining-seconds="session.remainingSeconds.value"
          simulate
        >
          <template #action>
            <button
              type="button"
              class="rounded-xs border border-amber-300 bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              @click="exitSimulation"
            >
              Keluar
            </button>
          </template>
        </TryoutHeader>

        <main class="container-page grid gap-5 pt-18 pb-24 md:h-screen md:grid-cols-[minmax(0,1fr)_280px] md:pt-24">
          <div class="min-h-0 md:overflow-y-auto md:pr-1">
            <!-- Spanduk praktik, menempel tepat di bawah header dan sebelum
                 area soal, supaya UI ujian ini tidak pernah tertukar dengan
                 pengerjaan sungguhan. -->
            <AccountNotice class="mb-4">
              Mode simulasi — hasil tidak disimpan dan tidak memengaruhi status produk.
            </AccountNotice>

            <TryoutQuestion
              :question="session.currentQuestion.value"
              :index="session.displayIndex.value"
              :total="session.displayTotal.value"
              :selected="session.answers.value[session.currentQuestion.value.id]?.selected ?? null"
              :value="session.answers.value[session.currentQuestion.value.id]?.value"
              :doubtful="session.answers.value[session.currentQuestion.value.id]?.doubtful ?? false"
              :passage="session.currentPassage.value"
              @select="session.selectAnswer"
              @answer="session.setAnswerValue"
            />
          </div>

          <!-- Rail nomor soal: desktop saja. Di HP tempatnya bottom
               sheet di bawah, bukan tumpukan di bawah kartu soal. -->
          <div class="hidden min-h-0 md:block md:overflow-y-auto md:pr-1">
            <TryoutNavigator
              :groups="session.navigatorGroups.value"
              :current-index="session.currentIndex.value"
              :answered-count="session.answeredCount.value"
              :doubtful-count="session.doubtfulCount.value"
              :total-questions="session.displayTotal.value"
              :status-of="session.statusOf"
              @jump="session.goTo"
            />
          </div>
        </main>

        <TryoutControls
          :can-prev="!session.isFirstQuestion.value"
          :can-next="!session.isLastQuestion.value"
          :doubtful="session.answers.value[session.currentQuestion.value.id]?.doubtful ?? false"
          :is-last-section="session.isLastSection.value"
          :answered-count="session.answeredCount.value"
          :total-questions="session.displayTotal.value"
          @prev="session.prev()"
          @next="session.next()"
          @toggle-doubt="session.toggleDoubt()"
          @end-section="requestEndSection"
          @open-navigator="navOpen = true"
        />

        <TryoutNavigatorSheet
          v-model:open="navOpen"
          :groups="session.navigatorGroups.value"
          :current-index="session.currentIndex.value"
          :answered-count="session.answeredCount.value"
          :doubtful-count="session.doubtfulCount.value"
          :total-questions="session.displayTotal.value"
          :status-of="session.statusOf"
          :is-last-section="session.isLastSection.value"
          @jump="session.goTo"
          @end-section="requestEndSection"
        />

        <div v-if="showEndConfirm" class="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4">
          <div class="w-full max-w-sm rounded-lg bg-surface p-6 shadow-lift">
            <h2 class="font-bold tracking-[-0.02em]">Selesaikan simulasi sekarang?</h2>
            <p class="mt-2 text-[0.9rem] text-muted">
              <span v-if="session.unansweredInSection.value > 0">
                Masih ada {{ session.unansweredInSection.value }} soal yang belum dijawab.
              </span>
              <span v-else>Semua soal sudah terjawab.</span>
              <span v-if="session.doubtfulCount.value > 0">
                {{ session.doubtfulCount.value }} soal masih ditandai ragu-ragu.
              </span>
              Setelah ini kamu langsung melihat skornya.
            </p>
            <div class="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt"
                @click="showEndConfirm = false"
              >
                Batal
              </button>
              <AppButton size="sm" @click="confirmEndSection">Ya, selesaikan</AppButton>
            </div>
          </div>
        </div>
      </template>

      <!-- Selesai: skor lokal + pembahasan, tanpa satu pun POST ke endpoint attempt. -->
      <div v-else-if="session.phase.value === 'finished' && session.result.value" class="grid">
        <TryoutResult
          :result="session.result.value"
          :theme="blueprint.theme"
          :package-title="blueprint.title"
          :package-slug="blueprint.slug"
          :blueprint="blueprint"
          :answers="session.answers.value"
          simulate
          @retry="session.start()"
        />

        <div class="container-page grid max-w-4xl gap-4 pb-12">
          <AccountNotice>
            Mode simulasi — hasil tidak disimpan dan tidak memengaruhi status produk.
          </AccountNotice>
          <AppButton :to="backTo" variant="outline" size="lg" class="justify-self-start">
            {{ backLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
