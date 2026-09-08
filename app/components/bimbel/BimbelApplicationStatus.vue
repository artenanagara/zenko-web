<script setup lang="ts">
import type { BimbelApplication } from '#shared/types/bimbel'

/**
 * Status pengajuan bimbel, dipakai bersama oleh /untuk-bimbel/daftar dan
 * /akun/bimbel supaya satu status hanya punya satu kalimat.
 *
 * Sebelumnya copy-nya digeneralisasi jadi "Kami akan memberi kabar setelah
 * peninjauan selesai" untuk semua status — termasuk `approved`, yang justru
 * berarti peninjauannya sudah selesai dan ruang bimbelnya sudah ada. Karena
 * response pengajuan membawa `bimbelId` saat disetujui, status itu juga perlu
 * menautkan ke ruang yang baru dibuat, bukan berhenti sebagai pengumuman.
 */
const props = defineProps<{ application: BimbelApplication }>()

const APPEARANCE = {
  pending: 'information',
  approved: 'success',
  rejected: 'error',
} as const

const TITLE = {
  pending: 'Pengajuan sedang ditinjau',
  approved: 'Pengajuan disetujui',
  rejected: 'Pengajuan perlu diperbaiki',
} as const

const appearance = computed(() => APPEARANCE[props.application.status])
const title = computed(() => TITLE[props.application.status])

/** Hanya pengajuan yang disetujui yang punya ruang bimbel untuk dituju. */
const workspacePath = computed(() =>
  props.application.status === 'approved' && props.application.bimbelId
    ? `/dashboard/bimbel/${props.application.bimbelId}`
    : null,
)
</script>

<template>
  <AppSectionMessage :appearance="appearance" :title="title">
    <template v-if="application.status === 'approved'">
      Ruang bimbel <b>{{ application.bimbelName }}</b> sudah aktif dengan masa uji
      coba 14 hari untuk 50 siswa.
    </template>
    <template v-else-if="application.status === 'pending'">
      Tim Zenko sedang memeriksa data <b>{{ application.bimbelName }}</b>. Kami
      mengabari lewat WhatsApp atau email setelah peninjauan selesai.
    </template>
    <template v-else>
      {{ application.rejectReason || 'Data yang kamu kirim belum cukup untuk kami tinjau. Lengkapi lalu ajukan ulang.' }}
    </template>

    <template v-if="workspacePath" #actions>
      <AppButton :to="workspacePath" size="sm">Buka ruang bimbel</AppButton>
    </template>
  </AppSectionMessage>
</template>
