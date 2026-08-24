<script setup lang="ts">
import type { TryoutResult, TryoutTheme } from '#shared/types/tryout'

const props = defineProps<{
  result: TryoutResult
  theme: TryoutTheme
  packageTitle: string
  packageSlug: string
}>()

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

    <AccountNotice>
      Sesi ini adalah latihan singkat untuk mencoba ruang pengerjaan try out. Jumlah soal dan durasinya berbeda dengan paket lengkap aslinya.
    </AccountNotice>

    <div class="flex flex-wrap gap-3">
      <AppButton size="lg" @click="emit('retry')">Kerjakan lagi</AppButton>
      <AppButton
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
