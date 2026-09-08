import type { VerificationItem } from '#shared/types/admin-moderation'

/**
 * Satu antrean verifikasi untuk dua jenis pembayaran.
 *
 * Sebelumnya ini dua halaman terpisah dengan dua badge notifikasi, padahal
 * pekerjaannya sama persis: buka daftar mutasi bank, cocokkan nominalnya,
 * putuskan. Dua tempat untuk satu kebiasaan berarti satu di antaranya rutin
 * terlupakan — dan yang terlupakan itu orang yang sudah membayar.
 *
 * Digabung di sini, bukan di server, karena keduanya memang dua sumber daya
 * yang berbeda dengan endpoint keputusan masing-masing. Menyatukannya di API
 * berarti membuat satu rute yang harus tahu cara melunasi pesanan sekaligus
 * mengaktifkan langganan; menyatukannya di sini hanya menyatukan tampilannya,
 * dan tiap keputusan tetap berjalan lewat jalurnya sendiri yang sudah teruji.
 *
 * Keduanya dimuat berbarengan, dan kegagalan satu sumber tidak mengosongkan
 * yang lain: antrean yang tampil separuh dengan peringatan lebih berguna
 * daripada layar error yang menyembunyikan pekerjaan yang sebenarnya bisa
 * dikerjakan.
 */
export function useAdminVerificationQueue() {
  const packages = useAdminPaymentProofs()
  const subscriptions = useAdminBimbelProofs()

  const items = computed<VerificationItem[]>(() => [
    ...packages.data.value.map(proof => ({ kind: 'package' as const, ...proof })),
    ...subscriptions.data.value.map(proof => ({ kind: 'subscription' as const, ...proof })),
  ])

  const pending = computed(() => packages.pending.value || subscriptions.pending.value)

  /** Digabung supaya satu sumber yang gagal tetap menyebut dirinya sendiri. */
  const error = computed(() =>
    [packages.error.value, subscriptions.error.value].filter(Boolean).join(' '),
  )

  async function refresh() {
    await Promise.all([packages.refresh(), subscriptions.refresh()])
  }

  return { items, pending, error, refresh }
}
