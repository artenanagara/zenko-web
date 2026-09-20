import type { ProductTransferOffer, TutorProductDetail } from '#shared/types/tutor-product'

/**
 * Penyerahan paket dari admin ke tutor penulisnya.
 *
 * Dipakai saat admin membantu tutor baru memasukkan soal yang sudah ditulis
 * tutor itu sendiri. Admin menyusun paket di akunnya sendiri, lalu
 * menawarkannya; kepemilikan baru berpindah ketika tutor menerimanya. Tidak
 * ada satu pun jalur di sini yang bertindak atas nama tutor.
 *
 * Pola client-only yang sama seperti useTutorProducts: cookie sesi HttpOnly di
 * origin API, jadi semua panggilan ini selesai setelah hydration.
 */

/**
 * GET /tutor/product-transfers — paket yang menunggu jawaban tutor ini.
 *
 * Server mengirim agregat penuh berikut soalnya: tutor perlu membacanya
 * sebelum menyatakan "ya, ini tulisan saya".
 */
export function useProductTransferOffers() {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorProductDetail[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TutorProductDetail[]>('/tutor/product-transfers', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Paket yang menunggu persetujuan belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  /** Menerima berarti mengambil kepemilikan: paket pindah ke rak tutor. */
  async function accept(productId: string): Promise<TutorProductDetail> {
    return await useApiFetch<TutorProductDetail>(
      `/tutor/product-transfers/${productId}/accept`,
      { baseURL: config.apiBase, credentials: 'include', method: 'POST' },
    )
  }

  /** Menolak hanya membatalkan tawaran; paket tetap jadi draft milik admin. */
  async function decline(productId: string): Promise<void> {
    await useApiFetch(
      `/tutor/product-transfers/${productId}/decline`,
      { baseURL: config.apiBase, credentials: 'include', method: 'POST' },
    )
  }

  return { data, pending, error, refresh, accept, decline }
}

/**
 * GET /admin/product-transfers — tawaran yang admin ini masih tunggu jawabannya.
 *
 * Dibaca terpisah dari daftar produk, bukan menumpang di barisnya: bentuk baris
 * produk juga melayani storefront publik tutor, dan email penerima tidak boleh
 * ikut ke sana.
 */
export function useOutgoingProductTransfers() {
  const { public: config } = useRuntimeConfig()

  const data = ref<ProductTransferOffer[]>([])
  const error = ref('')

  async function refresh() {
    error.value = ''
    try {
      data.value = await useApiFetch<ProductTransferOffer[]>('/admin/product-transfers', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Daftar paket yang ditawarkan belum berhasil dimuat.')
    }
  }

  /** Baris tabel produk mencari tawarannya di sini, per id paket. */
  const byProductId = computed(
    () => new Map(data.value.map(offer => [offer.productId, offer])),
  )

  return { data, byProductId, error, refresh }
}

/**
 * POST /admin/products/:id/transfer — menawarkan draft yang admin ketikkan
 * kepada tutor penulisnya.
 *
 * `toAccountId` diambil dari direktori tutor admin (GET /admin/tutors), bukan
 * email yang diketik: direktori itu sudah berisi tutor yang disetujui, dan id
 * yang dipilih dari sana tidak bisa nyasar ke alamat mirip.
 */
export async function offerProductTransfer(
  productId: string,
  toAccountId: string,
): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorProductDetail>(`/admin/products/${productId}/transfer`, {
    baseURL: config.apiBase,
    credentials: 'include',
    method: 'POST',
    body: { toAccountId },
  })
}

/** DELETE /admin/products/:id/transfer — menarik tawaran yang belum dijawab. */
export async function withdrawProductTransfer(productId: string): Promise<TutorProductDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<TutorProductDetail>(`/admin/products/${productId}/transfer`, {
    baseURL: config.apiBase,
    credentials: 'include',
    method: 'DELETE',
  })
}
