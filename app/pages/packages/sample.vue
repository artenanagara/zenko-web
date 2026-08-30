<script setup lang="ts">
/**
 * "Coba gratis 5 soal": lima soal asli paket ini di ruang pengerjaan yang
 * sama persis dengan sesi berbayar — header berjalan, navigasi soal, tombol
 * ragu-ragu. Sengaja publik tanpa login: ini etalase, bukan ujian.
 */
definePageMeta({
  path: '/paket/:slug()/coba',
  layout: 'tryout',
})

const route = useRoute()
const slug = route.params.slug as string

const detail = await usePackageDetail(slug)
const blueprintRef = await useSampleBlueprint(slug)
const blueprint = blueprintRef.value

// Kunci sesi dibedakan dari sesi asli (`slug` polos), supaya coba-coba di
// katalog tidak pernah me-resume atau menimpa pengerjaan sungguhan.
//
// Penilaian dititipkan ke API: soal contoh sengaja datang tanpa kunci jawaban,
// jadi skornya dihitung di server dan yang kembali hanya rekap angkanya.
const session = useTryoutSession(`${slug}--coba`, blueprint, {
  grade: answers => gradeSampleAnswers(slug, answers),
})

useHead({
  title: `Coba Gratis ${detail.value.title} | Zenko`,
  meta: [{ name: 'robots', content: 'noindex' }],
})

const totalQuestions = computed(() => blueprint.sections.reduce((sum, s) => sum + s.questions.length, 0))
const totalMinutes = computed(() => blueprint.sections.reduce((sum, s) => sum + s.durationMinutes, 0))

const discountPercent = computed(() => {
  const { price, priceOriginal } = detail.value
  if (priceOriginal <= price) return 0
  return Math.round(((priceOriginal - price) / priceOriginal) * 100)
})

const resultPercent = computed(() => {
  const result = session.result.value
  if (!result || result.maxScore === 0) return 0
  return Math.round((result.score / result.maxScore) * 100)
})

const showEndConfirm = ref(false)

/** Sheet nomor soal — hanya dipakai di HP; desktop punya rail sendiri. */
const navOpen = ref(false)

function requestEndSection() {
  navOpen.value = false
  showEndConfirm.value = true
}
</script>

<template>
  <div>
    <!-- Pra-sesi: cukup satu layar — apa ini, berapa lama, satu tombol. -->
    <div v-if="session.phase.value === 'intro'" class="container-page grid max-w-2xl gap-6 py-10 md:py-14">
      <nav class="text-[0.85rem] text-muted">
        <NuxtLink :to="`/paket/${slug}`" class="inline-flex items-center gap-1 transition-colors hover:text-ink">
          <IconArrowLeft class="h-3.5 w-3.5" /> Kembali ke halaman paket
        </NuxtLink>
      </nav>

      <div>
        <span class="inline-block rounded-pill bg-primary-soft px-3.5 py-1.5 text-[0.78rem] font-bold tracking-[0.06em] text-primary uppercase">
          Coba gratis
        </span>
        <h1 class="mt-3 text-[1.6rem] leading-tight font-extrabold tracking-[-0.03em] md:text-[1.9rem]">
          {{ detail.title }}
        </h1>
        <p class="mt-2 text-muted">
          {{ totalQuestions }} soal contoh · {{ formatDuration(totalMinutes) }} · di ruang pengerjaan yang sama dengan sesi aslinya
        </p>
      </div>

      <div class="rounded-lg border border-hairline bg-surface p-5 shadow-xs md:p-6">
        <h2 class="font-bold tracking-[-0.02em]">Yang akan kamu cicipi</h2>
        <ul class="mt-4 grid gap-2.5">
          <li
            v-for="section in blueprint.sections"
            :key="section.id"
            class="flex items-center justify-between gap-3 rounded-sm bg-surface-sunken px-4 py-3"
          >
            <span class="font-semibold">{{ section.title }}</span>
            <span class="shrink-0 text-[0.84rem] text-muted tabular-nums">{{ section.questions.length }} soal</span>
          </li>
        </ul>
        <p class="mt-4 text-[0.86rem] text-muted">
          Soal diambil langsung dari paketnya. Waktu berjalan seperti ujian sungguhan,
          dan hasilnya langsung dinilai — tidak perlu login.
        </p>
      </div>

      <AppButton size="lg" class="justify-self-start" @click="session.start()">
        Mulai coba gratis
      </AppButton>
    </div>

    <!-- Sesi berjalan: komponen ruang ujian yang sama dengan sesi berbayar. -->
    <template v-else-if="session.phase.value === 'running' && session.currentQuestion.value">
      <TryoutHeader :package-title="`${detail.title} — coba gratis`" :remaining-seconds="session.remainingSeconds.value" />

      <main class="container-page grid gap-5 pt-18 pb-24 md:grid-cols-[minmax(0,1fr)_280px] md:pt-24">
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

        <!-- Rail nomor soal: desktop saja. Di HP tempatnya bottom sheet di
             bawah, bukan tumpukan di bawah kartu soal. -->
        <TryoutNavigator
          class="hidden md:block"
          :groups="session.navigatorGroups.value"
          :current-index="session.currentIndex.value"
          :answered-count="session.answeredCount.value"
          :doubtful-count="session.doubtfulCount.value"
          :total-questions="session.displayTotal.value"
          :status-of="session.statusOf"
          :label-of="session.labelOf"
          @jump="session.goTo"
        />
      </main>

      <TryoutControls
        :can-prev="!session.isFirstQuestion.value"
        :can-next="!session.isLastQuestion.value"
        :doubtful="session.answers.value[session.currentQuestion.value.id]?.doubtful ?? false"
        :is-last-section="true"
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
        :label-of="session.labelOf"
        :is-last-section="true"
        @jump="session.goTo"
        @end-section="requestEndSection"
      />

      <div v-if="showEndConfirm" class="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4">
        <div class="w-full max-w-sm rounded-lg bg-surface p-6 shadow-lift">
          <h2 class="font-bold tracking-[-0.02em]">Selesaikan sesi coba ini?</h2>
          <p class="mt-2 text-[0.9rem] text-muted">
            <span v-if="session.unansweredInSection.value > 0">
              Masih ada {{ session.unansweredInSection.value }} soal yang belum dijawab.
            </span>
            <span v-else>Semua soal sudah terjawab.</span>
            <span v-if="session.doubtfulCount.value > 0">
              {{ session.doubtfulCount.value }} soal masih ditandai ragu-ragu.
            </span>
            Jawabanmu langsung dinilai setelah ini.
          </p>
          <div class="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt"
              @click="showEndConfirm = false"
            >
              Batal
            </button>
            <AppButton size="sm" @click="showEndConfirm = false; session.endSection()">
              Ya, selesaikan
            </AppButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Sedang dinilai: hasilnya datang dari API, jadi ada jeda sekejap. -->
    <div v-else-if="session.phase.value === 'finished' && session.grading.value" class="container-page grid max-w-2xl gap-4 py-16 text-center md:py-24">
      <IconSpinner class="mx-auto h-7 w-7 animate-spin text-primary" />
      <p class="text-muted">Menilai jawabanmu…</p>
    </div>

    <!--
      Penilaian gagal: jawaban masih ada di memori sesi, jadi tawarkan ulang
      alih-alih menampilkan skor nol yang tidak benar.
    -->
    <div v-else-if="session.phase.value === 'finished' && session.gradeFailed.value" class="container-page grid max-w-md gap-4 py-16 md:py-24">
      <div class="rounded-lg border border-hairline bg-surface p-6 text-center shadow-xs">
        <h1 class="font-bold tracking-[-0.02em]">Nilai belum bisa dihitung</h1>
        <p class="mt-2 text-[0.9rem] text-muted">
          Koneksi ke server terputus saat menilai. Jawabanmu masih tersimpan di halaman ini —
          coba nilai ulang.
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-2.5">
          <AppButton size="sm" @click="session.retryGrade()">Nilai ulang</AppButton>
          <AppButton
            :to="`/paket/${slug}`"
            variant="light"
            size="sm"
            class="border border-hairline-strong shadow-none"
          >
            Kembali ke halaman paket
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Selesai: hasil singkat, lalu jalan yang jelas menuju paket lengkapnya. -->
    <div v-else-if="session.phase.value === 'finished' && session.result.value" class="container-page grid max-w-2xl gap-6 py-10 md:py-14">
      <nav class="text-[0.85rem] text-muted">
        <NuxtLink :to="`/paket/${slug}`" class="inline-flex items-center gap-1 transition-colors hover:text-ink">
          <IconArrowLeft class="h-3.5 w-3.5" /> Kembali ke halaman paket
        </NuxtLink>
      </nav>

      <div class="overflow-hidden rounded-lg bg-linear-to-br from-primary-dark to-primary text-white shadow-lift">
        <div class="p-6 md:p-8">
          <p class="text-[0.78rem] font-bold tracking-[0.12em] text-white/70 uppercase">
            Coba gratis selesai
          </p>
          <h1 class="mt-2 text-[1.4rem] leading-tight font-extrabold tracking-[-0.03em] md:text-[1.7rem]">
            {{ detail.title }}
          </h1>
          <p class="mt-4 flex items-baseline gap-2">
            <span class="text-[2.4rem] leading-none font-extrabold tabular-nums">{{ session.result.value.score }}</span>
            <span class="text-[1rem] text-white/70">/ {{ session.result.value.maxScore }} poin · {{ resultPercent }}%</span>
          </p>
        </div>
      </div>

      <div class="rounded-lg border border-hairline bg-surface p-5 shadow-xs md:p-6">
        <h2 class="font-bold tracking-[-0.02em]">Hasil per subtes</h2>
        <ul class="mt-4 grid gap-3">
          <li
            v-for="section in session.result.value.sections"
            :key="section.title"
            class="flex flex-wrap items-baseline justify-between gap-2 text-[0.92rem]"
          >
            <span class="font-semibold">{{ section.title }}</span>
            <span class="text-muted tabular-nums">{{ section.correct }} dari {{ section.total }} tepat</span>
          </li>
        </ul>
      </div>

      <!-- Upsell: angka paket lengkap versus lima soal yang baru dirasakan. -->
      <div class="rounded-lg border border-primary/20 bg-primary-soft/50 p-5 md:p-6">
        <h2 class="text-[1.05rem] font-bold tracking-[-0.02em]">Itu baru {{ totalQuestions }} dari {{ detail.questionCount }} soal</h2>
        <p class="mt-1.5 text-[0.9rem] text-muted">
          Paket lengkapnya berisi {{ detail.questionCount }} soal dengan durasi
          {{ formatDuration(detail.durationMinutes) }}, plus analisis skor per subtes
          dan bisa dikerjakan ulang kapan saja.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            class="text-[1.5rem] font-extrabold tracking-[-0.04em] tabular-nums"
            :class="detail.price > 0 ? '' : 'text-success-ink'"
          >{{ detail.price > 0 ? formatRupiah(detail.price) : 'Gratis' }}</span>
          <span v-if="discountPercent > 0" class="text-[0.9rem] text-muted line-through tabular-nums">
            {{ formatRupiah(detail.priceOriginal) }}
          </span>
          <span v-if="discountPercent > 0" class="rounded-pill bg-success-soft px-2.5 py-1 text-[0.76rem] font-bold text-success-ink">
            Hemat {{ discountPercent }}%
          </span>
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <AppButton :to="`/checkout/${slug}`" size="lg">Beli paket lengkap</AppButton>
          <AppButton
            variant="light"
            size="lg"
            class="border border-hairline-strong shadow-none"
            @click="session.start()"
          >
            Coba lagi
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
