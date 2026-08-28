import type { Ref } from 'vue'
import type { TryoutBlueprint } from '#shared/types/tryout'

/**
 * Simulasi: satu subtes produk, dijalankan di ruang ujian yang sama persis
 * dengan yang dipakai siswa — tapi dari sumber data lain dan tanpa pernah
 * menyimpan hasilnya.
 *
 * zenko-api punya dua endpoint pratinjau, keduanya GET dan read-only, dan
 * keduanya mengembalikan `TryoutBlueprint` yang di-shape oleh kode Go yang
 * sama dengan blueprint siswa — cuma `sections`-nya berisi tepat satu subtes:
 *
 * - GET /tutor/products/:id/preview?section=… — 404 kalau pemanggilnya bukan
 *   penulis produk itu.
 * - GET /admin/products/:id/preview?section=… — admin saja, berlaku untuk
 *   produk siapa pun.
 *
 * Client-only, seperti seluruh resource ber-cookie lain di app ini (lihat
 * useAccountResource): cookie sesinya HttpOnly milik origin API, jadi SSR
 * selalu dijawab 401 lalu bertabrakan sendiri saat hidrasi.
 */
export type PreviewScope = 'tutor' | 'admin'

export interface TryoutPreviewResource {
  data: Ref<TryoutBlueprint | null>
  pending: Ref<boolean>
  /** Sudah diterjemahkan ke kalimat Indonesia; kosong berarti tidak ada galat. */
  error: Ref<string>
  refresh: () => Promise<void>
}

/**
 * Pesan per status, karena tiap kegagalan di sini punya jalan keluar yang
 * berbeda: 422 berarti subtesnya memang belum layak dijalankan (kurang soal),
 * bukan gangguan jaringan yang bisa diulang.
 */
function previewErrorMessage(cause: unknown): string {
  switch (apiErrorStatus(cause)) {
    case 400:
      return 'Simulasi hanya tersedia untuk produk try-out tunggal dengan subtes yang dipilih.'
    case 403:
      return 'Kamu tidak punya akses ke simulasi produk ini.'
    case 404:
      return 'Produk atau subtes ini tidak ditemukan.'
    case 422:
      return 'Subtes ini belum lengkap — penuhi dulu target soalnya sebelum bisa disimulasikan.'
    default:
      return tutorApiMessage(cause, 'Gagal memuat simulasi. Coba lagi sebentar lagi.')
  }
}

export function useTryoutPreview(
  scope: PreviewScope,
  productId: string,
  sectionId: () => string,
): TryoutPreviewResource {
  const { public: config } = useRuntimeConfig()

  const data = ref<TryoutBlueprint | null>(null)
  // Starts true so SSR and the first client paint both render the skeleton
  // rather than an "empty" state that the fetch immediately contradicts.
  const pending = ref(true)
  const error = ref('')

  async function refresh() {
    const section = sectionId()
    if (!productId || !section) {
      pending.value = false
      error.value = 'Subtes yang mau disimulasikan belum ditentukan.'
      return
    }

    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TryoutBlueprint>(`/${scope}/products/${productId}/preview`, {
        baseURL: config.apiBase,
        credentials: 'include',
        query: { section },
      })
    }
    catch (cause) {
      data.value = null
      error.value = previewErrorMessage(cause)
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  return { data, pending, error, refresh }
}
