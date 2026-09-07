<script setup lang="ts">
import type { AssignmentPhase } from '#shared/types/bimbel'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Penugasan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const base = `/dashboard/bimbel/${bimbelId}`

const assignments = useBimbelAssignments(bimbelId)
const productsResource = useTutorProducts({ bimbelId })
const toast = useToast()
const { confirm } = useConfirm()

const busyId = ref('')

/** Paket yang benar-benar bisa ditugaskan: privat, tayang, dan bukan bundling. */
const readyProducts = computed(() =>
  productsResource.data.value.filter(item =>
    item.visibility === 'bimbel' && item.status === 'live' && item.type === 'single',
  ),
)

const PHASE_LABEL: Record<AssignmentPhase, string> = {
  draft: 'Draft',
  scheduled: 'Terjadwal',
  ongoing: 'Berlangsung',
  closed: 'Selesai',
}

const PHASE_TONE: Record<AssignmentPhase, 'success' | 'warning' | 'neutral'> = {
  draft: 'warning',
  scheduled: 'neutral',
  ongoing: 'success',
  closed: 'neutral',
}

function load() {
  return Promise.all([assignments.refresh(), productsResource.refresh()])
}
onMounted(load)

async function act(id: string, action: 'publish' | 'close' | 'delete') {
  if (action === 'close' && !await confirm({
    title: 'Tutup penugasan sekarang?',
    description: 'Siswa tidak bisa memulai percobaan baru.',
    confirmLabel: 'Tutup tugas',
  })) return

  busyId.value = id
  try {
    if (action === 'publish') await publishBimbelAssignment(bimbelId, id)
    if (action === 'close') await closeBimbelAssignment(bimbelId, id)
    if (action === 'delete') await deleteBimbelAssignment(bimbelId, id)
    await assignments.refresh()
    toast.success(
      action === 'publish' ? 'Penugasan dipublikasikan.' : action === 'close' ? 'Penugasan ditutup.' : 'Draft dihapus.',
    )
  }
  catch (cause) {
    toast.error('Tindakan gagal.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Penugasan"
      description="Tentukan paket, siswa yang menerima, waktu pengerjaan, dan jumlah percobaan."
    >
      <template #actions>
        <AppButton
          v-if="readyProducts.length"
          :to="`${base}/assignments/baru`"
          size="sm"
        >
          Buat penugasan
        </AppButton>
      </template>
    </AppPageHeader>

    <AppSectionMessage
      v-if="readyProducts.length === 0 && !productsResource.pending.value && !productsResource.error.value"
      appearance="information"
      title="Belum ada paket siap tugas"
    >
      Selesaikan lalu tayangkan satu paket privat dari Bank soal terlebih dahulu.
    </AppSectionMessage>

    <DashboardPanel title="Daftar penugasan">
      <DashboardSkeleton v-if="assignments.pending.value" :count="5" label="Memuat penugasan…" />

      <div v-else-if="assignments.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ assignments.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <div v-else-if="assignments.data.value.length" class="grid gap-3">
        <article
          v-for="item in assignments.data.value"
          :key="item.id"
          class="flex flex-col gap-4 rounded-md border border-hairline p-4 lg:flex-row lg:items-center"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-semibold">{{ item.title }}</h2>
              <DashboardBadge :tone="PHASE_TONE[item.phase]">{{ PHASE_LABEL[item.phase] }}</DashboardBadge>
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ formatDateTime(item.opensAt) }} – {{ formatDateTime(item.closesAt) }} · {{ item.maxAttempts }}× percobaan
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton
              v-if="item.status === 'draft'"
              size="sm"
              :disabled="busyId === item.id"
              @click="act(item.id, 'publish')"
            >
              {{ busyId === item.id ? 'Memproses…' : 'Publikasikan' }}
            </AppButton>
            <AppButton
              v-if="item.status === 'draft'"
              size="sm"
              variant="ghost"
              :disabled="busyId === item.id"
              @click="act(item.id, 'delete')"
            >
              Hapus
            </AppButton>
            <!-- Hasil kelompok jadi route sendiri: dari HP, panel yang dulu
                 muncul di dasar halaman terlihat seperti tidak terjadi apa-apa. -->
            <AppButton
              v-if="item.status === 'scheduled' || item.status === 'closed'"
              :to="`${base}/assignments/${item.id}/hasil`"
              size="sm"
              variant="secondary"
            >
              Lihat hasil
            </AppButton>
            <AppButton
              v-if="item.status === 'scheduled'"
              size="sm"
              variant="ghost"
              :disabled="busyId === item.id"
              @click="act(item.id, 'close')"
            >
              {{ busyId === item.id ? 'Memproses…' : 'Tutup' }}
            </AppButton>
          </div>
        </article>
      </div>

      <!-- Jalan keluarnya berbeda tergantung apa yang benar-benar kurang:
           paketnya belum ada, atau paket sudah siap tapi belum pernah ditugaskan. -->
      <AppEmptyState
        v-else-if="readyProducts.length"
        title="Belum ada penugasan"
        description="Pilih paket privat yang sudah siap, lalu tentukan siapa yang dapat mengerjakannya."
        action-label="Buat penugasan"
        @action="navigateTo(`${base}/assignments/baru`)"
      />

      <AppEmptyState
        v-else
        title="Belum ada penugasan"
        description="Penugasan membutuhkan paket privat yang sudah tayang. Siapkan satu paket di Bank soal lebih dulu."
        action-label="Buka bank soal"
        @action="navigateTo(`${base}/products`)"
      />
    </DashboardPanel>
  </div>
</template>
