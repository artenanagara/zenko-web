<script setup lang="ts">
import type { SelectOption } from '~/components/core/AppSelect.vue'
import type { AdminTutorRow } from '#shared/types/admin-directory'
import type { TutorProductSummary } from '#shared/types/tutor-product'

/**
 * "Serahkan ke tutor" — admin menyerahkan draft yang ia ketikkan kepada tutor
 * yang menulis soalnya.
 *
 * Tutor tujuan dipilih dari direktori tutor (GET /admin/tutors), bukan diketik
 * sebagai email: daftar itu sudah berisi tutor yang disetujui, dan memilih dari
 * sana membuat penyerahan tidak bisa nyasar ke alamat yang mirip.
 *
 * Modal ini hanya membuat *tawaran*. Paket tetap milik admin sampai tutornya
 * sendiri menerimanya dari dashboard mereka — tidak ada satu pun aksi di sini
 * yang berjalan atas nama tutor.
 */
const props = defineProps<{
  product: TutorProductSummary | null
  tutors: AdminTutorRow[]
  tutorsPending: boolean
  submitting: boolean
}>()

const emit = defineEmits<{ submit: [toAccountId: string] }>()

const open = defineModel<boolean>('open', { required: true })

const selectedTutorId = ref('')

/** Setiap dibuka untuk paket lain, pilihan sebelumnya tidak boleh ikut terbawa. */
watch(() => props.product?.id, () => {
  selectedTutorId.value = ''
})

const tutorOptions = computed<SelectOption[]>(() =>
  props.tutors.map(tutor => ({
    value: tutor.id,
    label: tutor.name || tutor.email,
    description: tutor.name ? tutor.email : undefined,
  })),
)

const canSubmit = computed(() => Boolean(selectedTutorId.value) && !props.submitting)
</script>

<template>
  <AppModal
    v-model="open"
    title="Serahkan paket ke tutor"
    description="Paket ini akan ditawarkan ke tutor yang kamu pilih. Kepemilikannya baru berpindah setelah tutor tersebut menerimanya dari dashboard mereka."
  >
    <div class="grid gap-5">
      <div v-if="product" class="rounded-2xl border border-line bg-surface-soft p-4">
        <p class="font-semibold tracking-[-0.02em] text-ink">{{ product.title }}</p>
        <p class="mt-1 text-[0.84rem] text-muted">
          {{ product.category || 'Umum' }} · {{ product.questionCount }} soal
        </p>
      </div>

      <AppSectionMessage v-if="!tutorsPending && tutors.length === 0" appearance="warning">
        Belum ada akun berperan tutor. Setujui pengajuan tutornya lebih dulu, lalu serahkan paket ini.
      </AppSectionMessage>

      <template v-else>
        <AppSelect
          v-model="selectedTutorId"
          label="Tutor penulis soal"
          :options="tutorOptions"
          :disabled="tutorsPending || submitting"
          :placeholder="tutorsPending ? 'Memuat daftar tutor…' : 'Pilih tutor'"
        />

        <!-- Dikatakan apa adanya: yang berpindah adalah atribusi penulis, dan
             itulah yang nanti dibaca oleh katalog dan pembagian hasil. -->
        <p class="text-[0.84rem] text-muted">
          Setelah diterima, paket tercatat atas nama tutor tersebut — termasuk di katalog dan
          pembagian hasil penjualan. Selama belum dijawab, kamu masih bisa menariknya kembali.
        </p>

        <div>
          <AppButton size="sm" :disabled="!canSubmit" @click="emit('submit', selectedTutorId)">
            {{ submitting ? 'Menawarkan...' : 'Tawarkan ke tutor' }}
          </AppButton>
        </div>
      </template>
    </div>
  </AppModal>
</template>
