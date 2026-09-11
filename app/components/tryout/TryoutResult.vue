<script setup lang="ts">
import type {
  TryoutAnswerState,
  TryoutBlueprint,
  TryoutResult,
  TryoutTheme,
} from '#shared/types/tryout'
import type { Attempt } from '#shared/types/account'
import type { ScoreScale } from '#shared/types/tutor-product'

const props = withDefaults(
  defineProps<{
    result: TryoutResult
    theme: TryoutTheme
    packageTitle: string
    packageSlug: string
    /**
     * Bagaimana skor sesi ini harus dibaca, dari blueprint jenis ujiannya.
     * Absen pada attempt lama dan produk tanpa jenis ujian — dibaca sebagai
     * poin mentah, perilaku yang sama seperti sebelum taksonomi 2026.
     */
    scoreScale?: ScoreScale
    /**
     * Kalimat yang wajib tampil bersama skor: paket yang strukturnya bukan
     * format resmi, atau yang skornya tidak dapat mereproduksi skor asli
     * (SNBT memakai IRT), tidak boleh menampilkan angka tanpa keterangan ini.
     */
    scoreDisclaimer?: string
    /**
     * Attempt yang baru disimpan zenko-api untuk sesi ini. Sejak rework
     * SKD/TKA server menghitung ulang skor dari snapshot review-nya sendiri —
     * saat `maxScore` attempt-nya > 0, ANGKA SERVER-lah yang ditampilkan
     * (skor per subtes, ambang batas, verdict LULUS/TIDAK LULUS), bukan
     * hitungan lokal browser. Null saat penyimpanan gagal/belum selesai atau
     * dalam mode simulasi — layar hasil lalu memakai hitungan lokal seperti
     * sebelumnya.
     */
    attempt?: Attempt | null
    /**
     * Blueprint + jawaban sesi yang barusan selesai, untuk "Lihat pembahasan".
     * `result` sendiri cuma agregat per subtes, tidak menyimpan satu pun soal
     * atau jawaban — jadi keduanya harus dioper terpisah dari state sesi.
     * Opsional: tanpa keduanya tombol Pembahasan tidak muncul sama sekali,
     * sehingga pemanggil yang belum bisa menyediakannya tetap valid.
     */
    blueprint?: TryoutBlueprint | null
    answers?: Record<string, TryoutAnswerState>
    /**
     * Id of the attempt zenko-api just stored for this sitting — set once
     * recordAttempt() resolves in the caller (see account/tryout.vue). Once
     * present, "Lihat pembahasan" is a real page instead of the inline panel
     * below: a persisted attempt is what makes it reopenable later from
     * Riwayat pengerjaan, so there is nothing left for the inline panel to
     * do. Null while the write is in flight or failed, and always null in
     * `simulate` mode, which never calls recordAttempt at all (see
     * TryoutSimulation.vue) — the inline panel is what simulate keeps using.
     */
    attemptId?: string | null
    /** Tujuan kembali setelah sesi; paket Bimbel tidak punya halaman detail pembelian. */
    returnTo?: string
    returnLabel?: string
    fromBimbel?: boolean
    /** Simulasi tutor/admin: sembunyikan tautan progres paket milik siswa. */
    simulate?: boolean
  }>(),
  {
    blueprint: null,
    answers: () => ({}),
    attempt: null,
    attemptId: null,
    simulate: false,
    returnTo: '',
    returnLabel: 'Kembali ke paket',
    fromBimbel: false,
  },
)

const emit = defineEmits<{ retry: [] }>()

/** True saat server menghitung ulang hasil (SKD/TKA) — angkanya yang dipakai. */
const serverScored = computed(() => (props.attempt?.maxScore ?? 0) > 0)

/** Satu baris hasil per subtes — bentuk gabungan hitungan lokal & server. */
interface ResultRow {
  title: string
  correct: number
  total: number
  score: number
  maxScore: number
  passingGrade?: number
  passed?: boolean
}

const rows = computed<ResultRow[]>(() =>
  serverScored.value ? props.attempt!.sections : props.result.sections,
)

const displayScore = computed(() => serverScored.value ? props.attempt!.score : props.result.score)
const displayMaxScore = computed(() => serverScored.value ? props.attempt!.maxScore : props.result.maxScore)

/**
 * Verdict LULUS/TIDAK LULUS — hanya dari server, dan hanya saat berlaku
 * (simulasi SKD penuh). undefined berarti tidak ada verdict untuk ditampilkan
 * (TKA, mini tryout, hasil lokal).
 */
const verdict = computed<boolean | undefined>(() =>
  serverScored.value ? props.attempt!.passed : undefined,
)

/** Ada subtes dengan ambang batas → baris skor vs ambang + badge Memenuhi. */
const hasPassingGrades = computed(() => rows.value.some(row => row.passingGrade != null))

/**
 * Varian TKA: skor mapel dinormalisasi 0–100 tanpa ambang dan tanpa verdict —
 * skornya ditampilkan besar, rinciannya benar/salah.
 *
 * Diskriminatornya adalah field yang menamai dirinya sendiri. Versi lama
 * membaca `theme.seal === 'TKA'` — mengganti branding paket ikut mengganti
 * cara skornya dibaca — dan versi sebelumnya lagi menebak dari angka
 * (`maxScore === 100 && satu subtes`), yang salah mengenali SKD mini custom
 * 20 soal (20×5 = 100) sebagai TKA. Tetap digerbangi serverScored: tanpa
 * angka server, hasil lokalnya poin mentah, bukan skala 0–100.
 */
const isNormalizedScale = computed(() => serverScored.value && props.scoreScale === 'normalized_100')

const percent = computed(() =>
  displayMaxScore.value === 0 ? 0 : Math.round((displayScore.value / displayMaxScore.value) * 100),
)

const correctTotals = computed(() => ({
  correct: rows.value.reduce((sum, row) => sum + row.correct, 0),
  total: rows.value.reduce((sum, row) => sum + row.total, 0),
}))

const stats = computed(() => [
  { label: 'Skor akhir', value: `${displayScore.value}` },
  isNormalizedScale.value
    ? { label: 'Jawaban benar', value: `${correctTotals.value.correct}/${correctTotals.value.total}` }
    : { label: 'Ketepatan', value: `${percent.value}%` },
  { label: 'Subtes diselesaikan', value: `${rows.value.length}` },
])

/* --------------------------------------------------------------------------
 * Pembahasan — dibuka di tempat, bukan lewat rute atau modal baru, supaya
 * "Kerjakan lagi" dan "Lihat progres paket" tetap terjangkau sambil membaca.
 * ------------------------------------------------------------------------ */

interface ReviewRow {
  number: number
  sectionTitle: string
  /** Hanya baris pertama tiap subtes yang mencetak judulnya, bukan tiap soal. */
  startsSection: boolean
  question: TryoutBlueprint['sections'][number]['questions'][number]
  /** Wacana soal ini, dirender SEKALI di baris pertama grupnya saja. */
  passage: { id: string, title?: string, content: string } | null
  startsPassage: boolean
}

/**
 * Nomor berjalan lintas subtes, sama seperti navigasi soal dalam mode flat —
 * "Soal 37" di lembar ini harus soal yang sama dengan "Soal 37" tadi.
 */
const reviewRows = computed<ReviewRow[]>(() => {
  const rows: ReviewRow[] = []
  let number = 0
  for (const section of props.blueprint?.sections ?? []) {
    let lastPassageId = ''
    section.questions.forEach((question, indexInSection) => {
      number += 1
      const passage = question.passageId
        ? section.passages?.find(candidate => candidate.id === question.passageId) ?? null
        : null
      rows.push({
        number,
        sectionTitle: section.title,
        startsSection: indexInSection === 0,
        question,
        passage,
        startsPassage: !!passage && passage.id !== lastPassageId,
      })
      lastPassageId = passage?.id ?? ''
    })
  }
  return rows
})

/**
 * Two ways "Lihat pembahasan" can be reachable, mutually exclusive:
 *
 * - A real, persisted sitting (attemptId set): the button is a link to the
 *   dedicated review page, reopenable later from Riwayat pengerjaan.
 * - `simulate` (tutor/admin preview, or a real sitting whose write failed):
 *   there is no attempt to link to, so the button falls back to the inline
 *   panel below, built straight from the blueprint+answers already in memory.
 */
const canReview = computed(() => !!props.attemptId || (props.simulate && reviewRows.value.length > 0))
const showReview = ref(false)

function openReview() {
  if (props.attemptId) {
    void navigateTo({
      path: `/akun/paket/${props.packageSlug}/kerjakan/pembahasan/${props.attemptId}`,
      query: props.fromBimbel ? { dari: 'bimbel' } : undefined,
    })
    return
  }
  showReview.value = !showReview.value
}
</script>

<template>
  <div class="container-page grid max-w-4xl gap-6 py-10 md:py-14">
    <nav v-if="!simulate" class="text-[0.85rem] text-muted">
      <NuxtLink :to="returnTo || `/akun/paket/${packageSlug}`" class="inline-flex items-center gap-1 transition-colors hover:text-ink">
        <IconArrowLeft class="h-3.5 w-3.5" /> {{ returnLabel }}
      </NuxtLink>
    </nav>

    <div class="overflow-hidden rounded-lg bg-linear-to-br from-primary-dark to-primary text-white shadow-lift">
      <div class="p-6 md:p-8">
        <p class="text-[0.78rem] font-bold tracking-[0.12em] text-white/70 uppercase">
          {{ theme.system }} · Sesi selesai
        </p>
        <h1 class="mt-2 text-[1.5rem] leading-tight font-extrabold tracking-[-0.03em] md:text-[1.8rem]">
          {{ packageTitle }}
        </h1>
        <!-- Skala 0–100: skor tampil besar, tanpa verdict; selain itu skor/poin. -->
        <p class="mt-4 flex items-baseline gap-2">
          <span class="leading-none font-extrabold tabular-nums" :class="isNormalizedScale ? 'text-[3.4rem]' : 'text-[2.6rem]'">{{ displayScore }}</span>
          <span class="text-[1.05rem] text-white/70">
            {{ isNormalizedScale ? '/ 100' : `/ ${displayMaxScore} poin · ${percent}%` }}
          </span>
        </p>
        <p v-if="isNormalizedScale" class="mt-1.5 text-[0.9rem] text-white/80">
          {{ correctTotals.correct }} benar · {{ correctTotals.total - correctTotals.correct }} salah/kosong
          dari {{ correctTotals.total }} soal
        </p>

        <!-- Verdict simulasi SKD — dihitung server dari ambang resmi tiap subtes. -->
        <p
          v-if="verdict !== undefined"
          class="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[1.05rem] font-extrabold tracking-[-0.01em]"
          :class="verdict ? 'bg-white/15 text-white' : 'bg-black/25 text-white'"
        >
          <AppIcon :name="verdict ? 'seal-check' : 'x-circle'" :size="20" />
          {{ verdict ? 'LULUS' : 'TIDAK LULUS' }}
          <span class="text-[0.82rem] font-semibold text-white/75">
            {{ verdict ? 'Semua subtes memenuhi ambang batas' : 'Ada subtes di bawah ambang batas' }}
          </span>
        </p>
      </div>

      <!-- Keterangan skor dari blueprint-nya: paket yang strukturnya bukan
           format resmi, atau yang skornya tidak dapat mereproduksi skor asli,
           tidak boleh menampilkan angkanya tanpa kalimat ini. Di dalam kartu
           skor, bukan di bawahnya — supaya terbaca bersama angkanya. -->
      <p
        v-if="scoreDisclaimer"
        class="flex items-start gap-2.5 border-t border-white/15 bg-black/15 px-6 py-4 text-[0.84rem] leading-[1.6] text-white/85 md:px-8"
      >
        <AppIcon name="info" :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{{ scoreDisclaimer }}</span>
      </p>
    </div>

    <DashboardStats :items="stats" />

    <DashboardPanel
      title="Hasil per subtes"
      :description="hasPassingGrades
        ? 'Skor tiap subtes dibandingkan ambang batas resminya.'
        : 'Rincian skor dan ketepatan jawaban di setiap subtes.'"
    >
      <ul class="grid gap-4">
        <li v-for="section in rows" :key="section.title">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="flex flex-wrap items-center gap-2 font-semibold tracking-[-0.02em]">
              {{ section.title }}
              <span
                v-if="section.passed !== undefined"
                class="inline-flex items-center rounded-pill px-2 py-0.5 text-[0.72rem] font-bold"
                :class="section.passed ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink'"
              >
                {{ section.passed ? 'Memenuhi' : 'Tidak Memenuhi' }}
              </span>
            </span>
            <span class="text-[0.84rem] text-muted tabular-nums">
              {{ section.correct }} dari {{ section.total }} tepat · skor {{ section.score }}/{{ section.maxScore }}<template v-if="section.passingGrade != null"> · ambang {{ section.passingGrade }}</template>
            </span>
          </div>
          <span class="mt-2 block h-2 overflow-hidden rounded-pill bg-skeleton/60">
            <span
              class="block h-full rounded-pill"
              :class="section.passed === false ? 'bg-linear-to-r from-danger/70 to-danger' : 'bg-linear-to-r from-primary-light to-primary'"
              :style="{ width: `${section.maxScore === 0 ? 0 : Math.round((section.score / section.maxScore) * 100)}%` }"
            />
          </span>
        </li>
      </ul>
    </DashboardPanel>

    <DashboardPanel
      v-if="canReview && showReview"
      id="pembahasan"
      title="Pembahasan"
      description="Semua soal sesi ini, lengkap dengan kunci jawaban dan penjelasan tutornya."
    >
      <ul class="mt-4 grid gap-4">
        <li v-for="row in reviewRows" :key="row.question.id">
          <p
            v-if="row.startsSection && (blueprint?.sections.length ?? 0) > 1"
            class="mb-1.5 text-[0.78rem] font-bold tracking-widest text-faint uppercase"
          >
            {{ row.sectionTitle }}
          </p>
          <!-- Wacana dicetak sekali per grup, lalu soal-soal anggotanya di bawahnya. -->
          <div v-if="row.startsPassage && row.passage" class="mb-3 rounded-sm border border-hairline bg-surface-alt px-4 py-3.5">
            <h3 class="text-[0.88rem] font-bold text-ink">{{ row.passage.title || 'Wacana' }}</h3>
            <div class="prose-question mt-2 text-[0.94rem] leading-[1.65]" v-html="row.passage.content" />
          </div>
          <TryoutReviewQuestion
            :question="row.question"
            :number="row.number"
            :answer="answers[row.question.id]"
          />
        </li>
      </ul>
    </DashboardPanel>

    <!-- Simulasi punya spanduknya sendiri ("hasil tidak disimpan"), yang
         mengatakan hal yang berbeda dari catatan sesi-siswa ini. -->
    <AccountNotice v-if="!simulate">
      Sesi ini adalah latihan singkat untuk mencoba ruang pengerjaan tryout — jumlah soal dan
      durasinya belum sama dengan paket lengkap yang kamu beli. Riwayatnya tersimpan selama tab ini terbuka.
    </AccountNotice>

    <div class="flex flex-wrap gap-3">
      <AppButton
        v-if="canReview"
        size="lg"
        :aria-expanded="attemptId ? undefined : showReview"
        :aria-controls="attemptId ? undefined : 'pembahasan'"
        @click="openReview"
      >
        {{ !attemptId && showReview ? 'Sembunyikan pembahasan' : 'Lihat pembahasan' }}
      </AppButton>
      <AppButton
        size="lg"
        :variant="canReview ? 'outline' : 'primary'"
        @click="emit('retry')"
      >
        Kerjakan lagi
      </AppButton>
      <!-- `selesai=1` is what tells the package page this visit is the one
           straight after a sitting, which is when it offers the review modal.
           Carrying it in the link rather than inferring it from "has attempts"
           keeps the prompt to the moment the student actually just finished,
           instead of every later visit to the page. -->
      <AppButton
        v-if="!simulate"
        :to="fromBimbel ? '/akun/bimbel' : `/akun/paket/${packageSlug}?selesai=1`"
        variant="light"
        size="lg"
        class="border border-hairline-strong shadow-none"
      >
        {{ fromBimbel ? 'Kembali ke Bimbel saya' : 'Lihat progres paket' }}
      </AppButton>
    </div>
  </div>
</template>
