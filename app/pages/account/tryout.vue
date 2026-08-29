<script setup lang="ts">
definePageMeta({
  path: '/akun/paket/:slug()/kerjakan',
  layout: 'tryout',
  middleware: 'auth',
})

const route = useRoute()
const slug = route.params.slug as string

// The endpoint returns the real tutor-authored questions only after confirming
// this account owns the package. Keeping that check and the blueprint in one
// request avoids briefly throwing a mock-data 404 while live data is loading.
const {
  data: blueprint,
  pending: blueprintPending,
  error: blueprintError,
  refresh: blueprintRefresh,
} = useTryoutBlueprint(slug)

const session = useTryoutSession(slug, blueprint)
const isFlat = computed(() => blueprint.value?.mode === 'flat')

useHead({
  title: computed(() => (blueprint.value ? `Kerjakan ${blueprint.value.title} | Zenko` : 'Ruang Ujian | Zenko')),
  meta: [{ name: 'robots', content: 'noindex' }],
})

const totalQuestions = computed(() => blueprint.value?.sections.reduce((sum, s) => sum + s.questions.length, 0) ?? 0)
const totalMinutes = computed(() => blueprint.value?.sections.reduce((sum, s) => sum + s.durationMinutes, 0) ?? 0)

const nextSection = computed(() => blueprint.value?.sections[session.sectionIndex.value + 1] ?? null)

/**
 * Copy/print deterrents, live only while a sitting is actually running — the
 * intro, the section break, and the result screen have nothing to protect, and
 * leaving the guard on there would just make the page feel broken.
 * `obscured` covers the exam once this tab stops being the one in front of the
 * student. See useExamContentGuard for what this genuinely stops and what it
 * cannot (screenshots).
 */
const { obscured } = useExamContentGuard(computed(() => session.phase.value === 'running'))

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

// Persist the result once, when the sitting finishes. Live this POSTs to
// zenko-api; a failure is swallowed on purpose — the result screen already
// shows the locally computed score, and a lost network write must not blank it.
//
// recordedAttemptId is what makes "Lihat pembahasan" a real page instead of
// an inline toggle: TryoutResult only renders that button once this holds a
// real id, since a review page has nothing to load without one. It stays
// null on a failed write — a smaller loss (one sitting whose pembahasan
// cannot be reopened) than blanking the score already shown from the
// finished session, which recording best-effort is here to avoid.
let recorded = false
const recordedAttemptId = ref<string | null>(null)
watch(session.phase, async (phase) => {
  if (phase === 'finished' && session.result.value && !recorded) {
    recorded = true
    try {
      const attempt = await recordAttempt(slug, session.result.value, session.answers.value)
      recordedAttemptId.value = attempt?.id ?? null
    }
    catch {
      // Best-effort: the score is still shown from the finished session.
    }
  }
})

function retry() {
  recorded = false
  recordedAttemptId.value = null
  session.start()
}
</script>

<template>
  <div>
    <!-- Memuat: endpoint sedang memeriksa kepemilikan sekaligus mengambil soal. -->
    <div v-if="blueprintPending" class="container-page grid min-h-screen place-items-center py-10">
      <div class="grid w-full max-w-3xl gap-6" aria-busy="true">
        <p class="sr-only" role="status">Memuat paket…</p>
        <div class="h-8 w-48 animate-pulse rounded-sm bg-surface-sunken" aria-hidden="true" />
        <div class="h-40 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
        <div class="h-32 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
      </div>
    </div>

    <div v-else-if="blueprintError" class="container-page grid min-h-screen place-items-center py-10">
      <div class="w-full max-w-md">
        <AccountError @retry="blueprintRefresh">
          Soal try out belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
        </AccountError>
      </div>
    </div>

    <template v-else-if="blueprint">
    <!-- Pra-ujian: tata tertib dan komposisi subtes, sebelum timer berjalan. -->
    <div v-if="session.phase.value === 'intro'" class="container-page grid max-w-3xl gap-6 py-10 md:py-14">
      <nav class="text-[0.85rem] text-muted">
        <NuxtLink :to="`/akun/paket/${slug}`" class="inline-flex items-center gap-1 transition-colors hover:text-ink">
          <IconArrowLeft class="h-3.5 w-3.5" /> Kembali ke paket
        </NuxtLink>
      </nav>

      <div>
        <p class="text-[0.78rem] font-bold tracking-[0.12em] text-primary uppercase">{{ blueprint.theme.system }}</p>
        <h1 class="mt-2 text-[1.6rem] leading-tight font-extrabold tracking-[-0.03em] md:text-[2rem]">
          {{ blueprint.title }}
        </h1>
        <p class="mt-2 text-muted">
          {{ totalQuestions }} soal · {{ formatDuration(totalMinutes) }} ·
          {{ isFlat ? 'satu sesi, semua soal terbuka sejak awal' : `${blueprint.sections.length} subtes berurutan` }}
        </p>
      </div>

      <div class="rounded-lg border border-hairline bg-surface p-5 shadow-xs md:p-6">
        <h2 class="font-bold tracking-[-0.02em]">Komposisi soal</h2>
        <ul class="mt-4 grid gap-3">
          <li
            v-for="(section, index) in blueprint.sections"
            :key="section.id"
            class="flex items-center justify-between gap-3 rounded-sm bg-surface-sunken px-4 py-3"
          >
            <span class="flex items-center gap-3">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-[0.78rem] font-bold text-primary">
                {{ index + 1 }}
              </span>
              <span>
                <span class="block font-semibold">{{ section.title }}</span>
                <span class="block text-[0.8rem] text-muted">{{ section.code }} · {{ section.questions.length }} soal</span>
              </span>
            </span>
            <span v-if="!isFlat" class="text-[0.86rem] font-semibold text-muted tabular-nums">
              {{ section.durationMinutes }} menit
            </span>
          </li>
        </ul>
      </div>

      <div class="rounded-lg border border-hairline-strong bg-surface-alt p-5 text-[0.88rem] text-muted md:p-6">
        <h2 class="font-bold text-ink">Aturan pengerjaan</h2>
        <ul v-if="isFlat" class="mt-3 grid list-disc gap-2 pl-4">
          <li>Semua butir soal dari seluruh subtes langsung terbuka sejak awal. Kamu bebas memilih urutan pengerjaan seperti pada simulasi CAT BKN.</li>
          <li>Hanya ada satu batas waktu keseluruhan untuk seluruh subtes. Saat waktu habis, sistem otomatis mengakhiri ujian dan menghitung nilai.</li>
          <li>Gunakan tombol "Ragu-ragu" untuk menandai soal yang ingin kamu periksa kembali sebelum waktu berakhir.</li>
          <li>Nomor soal yang sudah dijawab akan menampilkan pilihan jawabanmu pada panel navigasi.</li>
        </ul>
        <ul v-else class="mt-3 grid list-disc gap-2 pl-4">
          <li>Setiap subtes memiliki alokasi waktu tersendiri yang berjalan otomatis begitu subtes dimulai.</li>
          <li>Setelah berpindah ke subtes berikutnya, subtes sebelumnya terkunci dan tidak bisa dibuka kembali, sesuai dengan ketentuan ujian resmi.</li>
          <li>Waktu yang habis akan memindahkanmu ke subtes berikutnya secara otomatis.</li>
          <li>Gunakan tombol "Ragu-ragu" untuk menandai soal yang ingin kamu tinjau ulang.</li>
        </ul>
      </div>

      <AppButton size="lg" class="justify-self-start" @click="session.start()">Mulai Ujian</AppButton>
    </div>

    <!-- Sesi berjalan. -->
    <template v-else-if="session.phase.value === 'running' && session.currentSection.value && session.currentQuestion.value">
      <TryoutHeader :package-title="blueprint.title" :remaining-seconds="session.remainingSeconds.value" />

      <!-- md:h-screen pins the row to the viewport instead of letting the
           taller column (often the navigator, in flat mode with every
           section's numbers open at once) stretch the shorter one and grow
           the whole page — each column scrolls inside itself instead.
           min-h-0 is what lets a grid child shrink below its content size at
           all; without it overflow-y-auto has no effect. -->
      <!-- exam-protected is what the exam-locked CSS in main.css targets: no
           text selection, no callout, on the questions and the answer options
           (the student's own input stays selectable). -->
      <main
        class="exam-protected container-page grid gap-5 pt-18 pb-24 md:h-screen md:grid-cols-[minmax(0,1fr)_280px] md:pt-24"
        :class="obscured && 'blur-lg'"
      >
        <div class="min-h-0 md:overflow-y-auto md:pr-1">
          <TryoutQuestion
            :question="session.currentQuestion.value"
            :index="session.displayIndex.value"
            :total="session.displayTotal.value"
            :selected="session.answers.value[session.currentQuestion.value.id]?.selected ?? null"
            :value="session.answers.value[session.currentQuestion.value.id]?.value"
            :doubtful="session.answers.value[session.currentQuestion.value.id]?.doubtful ?? false"
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

      <!-- Tab berpindah / window kehilangan fokus: tutup tampilan soal. Waktu
           sengaja tetap berjalan di baliknya — itu perilaku jujur untuk sebuah
           ujian, dan menghentikannya justru membuat "pindah tab" jadi tombol
           jeda gratis. -->
      <div
        v-if="obscured"
        class="fixed inset-0 z-[60] grid place-items-center bg-surface/95 p-6 text-center backdrop-blur-md"
      >
        <div class="max-w-sm">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-muted">
            <IconEye off class="h-6 w-6" />
          </span>
          <h2 class="mt-4 font-bold tracking-[-0.02em]">Tampilan soal disembunyikan</h2>
          <p class="mt-2 text-[0.9rem] text-muted">
            Kembali ke tab ini untuk melanjutkan pengerjaan. Waktu ujian tetap berjalan.
          </p>
        </div>
      </div>

      <!-- Panel nomor soal versi HP. Tidak dirender sama sekali di md+. -->
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

      <!-- Konfirmasi mengakhiri subtes/ujian, supaya sekali klik tidak langsung mengunci. -->
      <div v-if="showEndConfirm" class="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4">
        <div class="w-full max-w-sm rounded-lg bg-surface p-6 shadow-lift">
          <h2 class="font-bold tracking-[-0.02em]">
            {{ session.isLastSection.value ? 'Selesaikan ujian sekarang?' : 'Akhiri subtes ini sekarang?' }}
          </h2>
          <p class="mt-2 text-[0.9rem] text-muted">
            <span v-if="session.unansweredInSection.value > 0">
              Masih ada {{ session.unansweredInSection.value }} soal yang belum dijawab.
            </span>
            <span v-else>Semua soal sudah terjawab.</span>
            <span v-if="session.doubtfulCount.value > 0">
              {{ session.doubtfulCount.value }} soal masih ditandai ragu-ragu.
            </span>
            {{ session.isLastSection.value ? 'Setelah ini kamu tidak bisa mengubah jawaban lagi.' : 'Kamu tidak bisa kembali ke subtes ini setelah lanjut.' }}
          </p>
          <div class="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt"
              @click="showEndConfirm = false"
            >
              Batal
            </button>
            <AppButton size="sm" @click="confirmEndSection">
              {{ session.isLastSection.value ? 'Ya, selesaikan' : 'Ya, lanjutkan' }}
            </AppButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Jeda antar-subtes (hanya untuk mode berurutan, mis. SNBT/TKA). -->
    <div v-else-if="session.phase.value === 'section-break'" class="container-page grid min-h-screen max-w-lg place-items-center py-10 text-center">
      <div>
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
          <IconCheck class="h-7 w-7" />
        </span>
        <h1 class="mt-5 text-[1.4rem] font-extrabold tracking-[-0.03em]">
          {{ session.currentSection.value?.title }} selesai
        </h1>
        <p class="mt-2 text-muted">
          {{ session.answeredCount.value }} dari {{ session.currentSection.value?.questions.length }} soal terjawab,
          {{ session.doubtfulCount.value }} ditandai ragu-ragu.
        </p>

        <div v-if="nextSection" class="mt-6 rounded-lg border border-hairline bg-surface p-5 shadow-xs">
          <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">Subtes berikutnya</p>
          <p class="mt-1.5 font-bold tracking-[-0.02em]">{{ nextSection.code }} · {{ nextSection.title }}</p>
          <p class="mt-1 text-[0.86rem] text-muted">{{ nextSection.questions.length }} soal · {{ nextSection.durationMinutes }} menit</p>
        </div>

        <AppButton size="lg" class="mt-6" @click="session.startNextSection()">
          Lanjut ke subtes berikutnya
        </AppButton>
      </div>
    </div>

    <!-- Selesai. -->
    <TryoutResult
      v-else-if="session.phase.value === 'finished' && session.result.value"
      :result="session.result.value"
      :theme="blueprint.theme"
      :package-title="blueprint.title"
      :package-slug="slug"
      :blueprint="blueprint"
      :answers="session.answers.value"
      :attempt-id="recordedAttemptId"
      @retry="retry"
    />
    </template>
  </div>
</template>
