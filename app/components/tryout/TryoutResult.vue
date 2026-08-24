<script setup lang="ts">
import type {
  TryoutAnswerState,
  TryoutBlueprint,
  TryoutResult,
  TryoutTheme,
} from '#shared/types/tryout'

const props = withDefaults(
  defineProps<{
    result: TryoutResult
    theme: TryoutTheme
    packageTitle: string
    packageSlug: string
    /**
     * Blueprint + jawaban sesi yang barusan selesai, untuk "Lihat pembahasan".
     * `result` sendiri cuma agregat per subtes, tidak menyimpan satu pun soal
     * atau jawaban — jadi keduanya harus dioper terpisah dari state sesi.
     * Opsional: tanpa keduanya tombol Pembahasan tidak muncul sama sekali,
     * sehingga pemanggil yang belum bisa menyediakannya tetap valid.
     */
    blueprint?: TryoutBlueprint | null
    answers?: Record<string, TryoutAnswerState>
    /** Simulasi tutor/admin: sembunyikan tautan progres paket milik siswa. */
    simulate?: boolean
  }>(),
  { blueprint: null, answers: () => ({}), simulate: false },
)

const emit = defineEmits<{ retry: [] }>()

const percent = computed(() =>
  props.result.maxScore === 0 ? 0 : Math.round((props.result.score / props.result.maxScore) * 100),
)

const stats = computed(() => [
  { label: 'Skor akhir', value: `${props.result.score}` },
  { label: 'Ketepatan', value: `${percent.value}%` },
  { label: 'Subtes diselesaikan', value: `${props.result.sections.length}` },
  { label: 'Selesai pada', value: formatDate(props.result.finishedAt) },
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
}

/**
 * Nomor berjalan lintas subtes, sama seperti navigasi soal dalam mode flat —
 * "Soal 37" di lembar ini harus soal yang sama dengan "Soal 37" tadi.
 */
const reviewRows = computed<ReviewRow[]>(() => {
  const rows: ReviewRow[] = []
  let number = 0
  for (const section of props.blueprint?.sections ?? []) {
    section.questions.forEach((question, indexInSection) => {
      number += 1
      rows.push({
        number,
        sectionTitle: section.title,
        startsSection: indexInSection === 0,
        question,
      })
    })
  }
  return rows
})

const canReview = computed(() => reviewRows.value.length > 0)
const showReview = ref(false)
</script>

<template>
  <div class="container-page grid max-w-4xl gap-6 py-10 md:py-14">
    <div class="overflow-hidden rounded-lg bg-linear-to-br from-primary-dark to-primary text-white shadow-lift">
      <div class="p-6 md:p-8">
        <p class="text-[0.78rem] font-bold tracking-[0.12em] text-white/70 uppercase">
          {{ theme.system }} · Sesi selesai
        </p>
        <h1 class="mt-2 text-[1.5rem] leading-tight font-extrabold tracking-[-0.03em] md:text-[1.8rem]">
          {{ packageTitle }}
        </h1>
        <p class="mt-4 flex items-baseline gap-2">
          <span class="text-[2.6rem] leading-none font-extrabold tabular-nums">{{ result.score }}</span>
          <span class="text-[1.05rem] text-white/70">/ {{ result.maxScore }} poin · {{ percent }}%</span>
        </p>
      </div>
    </div>

    <DashboardStats :items="stats" />

    <DashboardPanel title="Hasil per subtes" description="Rincian skor dan ketepatan jawaban di setiap subtes.">
      <ul class="grid gap-4">
        <li v-for="section in result.sections" :key="section.title">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="font-semibold tracking-[-0.02em]">{{ section.title }}</span>
            <span class="text-[0.84rem] text-muted tabular-nums">
              {{ section.correct }} dari {{ section.total }} tepat · skor {{ section.score }}/{{ section.maxScore }}
            </span>
          </div>
          <span class="mt-2 block h-2 overflow-hidden rounded-pill bg-skeleton/60">
            <span
              class="block h-full rounded-pill bg-linear-to-r from-primary-light to-primary"
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
      <AccountNotice>
        Pembahasan ini hanya tersedia sekarang — tidak bisa dibuka lagi lewat Riwayat pengerjaan.
      </AccountNotice>

      <ul class="mt-4 grid gap-4">
        <li v-for="row in reviewRows" :key="row.question.id">
          <p
            v-if="row.startsSection && (blueprint?.sections.length ?? 0) > 1"
            class="mb-1.5 text-[0.78rem] font-bold tracking-widest text-faint uppercase"
          >
            {{ row.sectionTitle }}
          </p>
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
      Sesi ini adalah latihan singkat untuk mencoba ruang pengerjaan try out — jumlah soal dan
      durasinya belum sama dengan paket lengkap yang kamu beli. Riwayatnya tersimpan selama tab ini terbuka.
    </AccountNotice>

    <div class="flex flex-wrap gap-3">
      <AppButton
        v-if="canReview"
        size="lg"
        :aria-expanded="showReview"
        aria-controls="pembahasan"
        @click="showReview = !showReview"
      >
        {{ showReview ? 'Sembunyikan pembahasan' : 'Lihat pembahasan' }}
      </AppButton>
      <AppButton
        size="lg"
        :variant="canReview ? 'outline' : 'primary'"
        @click="emit('retry')"
      >
        Kerjakan lagi
      </AppButton>
      <AppButton
        v-if="!simulate"
        :to="`/akun/paket/${packageSlug}`"
        variant="light"
        size="lg"
        class="border border-hairline-strong shadow-none"
      >
        Lihat progres paket
      </AppButton>
    </div>
  </div>
</template>
