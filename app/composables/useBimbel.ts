import type {
  AdminBimbelPaymentProof,
  Bimbel,
  BimbelApplication,
  BimbelClass,
  BimbelMember,
  BimbelMembership,
  BimbelOrder,
  BimbelPaymentInstructions,
  BimbelPlan,
  BimbelPlanOption,
  BimbelProductResults,
  BimbelProofDecisionRequest,
  BimbelQuote,
  BimbelStudentCountBand,
  BimbelStudentPackage,
  InvitationAnswer,
  OwnershipTransfer,
} from '#shared/types/bimbel'

function bimbelPath(id: string, suffix = ''): string {
  return `/bimbel/${id}${suffix}`
}

async function bimbelRequest<T>(path: string, options: Parameters<typeof useApiFetch<T>>[1] = {}): Promise<T> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<T>(path, { baseURL: config.apiBase, credentials: 'include', ...options })
}

export function useBimbelMemberships() {
  const data = useState<BimbelMembership[]>('bimbel-memberships', () => [])
  const pending = useState('bimbel-memberships-pending', () => false)
  const error = useState('bimbel-memberships-error', () => '')
  /** Sudah pernah dicoba dimuat di sesi ini — dasar `ensure` di bawah. */
  const loaded = useState('bimbel-memberships-loaded', () => false)

  async function refresh() {
    pending.value = true
    error.value = ''
    try { data.value = await bimbelRequest<BimbelMembership[]>('/me/bimbels') }
    catch (cause) { error.value = tutorApiMessage(cause, 'Bimbel belum berhasil dimuat.') }
    finally {
      pending.value = false
      loaded.value = true
    }
  }

  /**
   * Muat sekali saja, kalau belum pernah.
   *
   * Untuk permukaan yang perlu tahu keanggotaan tetapi tidak boleh membayar
   * satu request di setiap halaman. Menu profil ada di header setiap halaman
   * dan memakai ini saat menunya dibuka, jadi akun yang tidak pernah membuka
   * menu itu tidak pernah menembakkan request-nya sama sekali.
   *
   * Kegagalan tidak dicoba ulang otomatis: `loaded` ditandai di `finally`,
   * karena permukaan yang memanggilnya hanya kehilangan satu entri menu kalau
   * gagal, dan mencoba lagi di tiap pembukaan menu akan mengulang request yang
   * sama pada akun yang memang tidak punya bimbel.
   */
  async function ensure() {
    if (loaded.value || pending.value) return
    await refresh()
  }

  return { data, pending, error, refresh, ensure }
}

function resource<T>(loader: () => Promise<T>, fallback: T, message: string) {
  const data = ref<T>(fallback)
  const pending = ref(true)
  const error = ref('')
  async function refresh() {
    pending.value = true
    error.value = ''
    try { data.value = await loader() }
    catch (cause) { error.value = tutorApiMessage(cause, message) }
    finally { pending.value = false }
  }
  return { data, pending, error, refresh }
}

export const useBimbelDetail = (id: string) => resource(
  () => bimbelRequest<Bimbel>(bimbelPath(id)), null as unknown as Bimbel, 'Profil bimbel belum berhasil dimuat.',
)
export const useBimbelMembers = (id: string) => resource(
  () => bimbelRequest<BimbelMember[]>(bimbelPath(id, '/members')), [], 'Daftar siswa belum berhasil dimuat.',
)
export const useBimbelClasses = (id: string) => resource(
  () => bimbelRequest<BimbelClass[]>(bimbelPath(id, '/classes')), [], 'Kelas belum berhasil dimuat.',
)
/**
 * Paket yang terbuka lewat keanggotaan bimbel. Daftar kosong untuk akun yang
 * tidak tergabung di bimbel mana pun — bukan 404 — jadi pemanggilnya cukup
 * membedakan "kosong" dari "gagal".
 */
export const useMyBimbelPackages = () => resource(
  () => bimbelRequest<BimbelStudentPackage[]>('/me/bimbel-packages'), [], 'Paket bimbel belum berhasil dimuat.',
)
export const useMyBimbelApplication = () => resource(
  () => bimbelRequest<BimbelApplication | null>('/bimbel-applications/me'), null, 'Pengajuan belum berhasil dimuat.',
)
/**
 * Undangan yang menunggu jawaban akun ini — bukan permintaan bergabung yang
 * menunggu jawaban bimbel. Endpoint-nya tidak pernah 404: akun tanpa undangan
 * mendapat daftar kosong, karena ini yang dipakai untuk memberi badge pada
 * menu profil.
 */
export const useBimbelInvitations = () => resource(
  () => bimbelRequest<BimbelMembership[]>('/me/bimbel-invitations'), [], 'Undangan bimbel belum berhasil dimuat.',
)
export const useBimbelOrders = (id: string) => resource(
  () => bimbelRequest<BimbelOrder[]>(bimbelPath(id, '/billing/orders')), [], 'Tagihan belum berhasil dimuat.',
)
/** Tingkat langganan yang bisa dibeli. Katalog tingkat milik server, bukan konstanta klien. */
export const useBimbelPlans = (id: string) => resource(
  () => bimbelRequest<BimbelPlanOption[]>(bimbelPath(id, '/billing/plans')), [], 'Tingkat langganan belum berhasil dimuat.',
)

export const joinBimbel = (code: string) => bimbelRequest<{ bimbelId: string, bimbelName: string, status: string }>('/bimbel/join', { method: 'POST', body: { code } })
export const acceptBimbelInvitation = (bimbelId: string) => bimbelRequest<InvitationAnswer>(`/me/bimbel-invitations/${bimbelId}/accept`, { method: 'POST' })
export const declineBimbelInvitation = (bimbelId: string) => bimbelRequest<InvitationAnswer>(`/me/bimbel-invitations/${bimbelId}/decline`, { method: 'POST' })
/** Keluar dari bimbel. Owner ditolak server — ia harus transfer kepemilikan dulu. */
export const leaveBimbel = (id: string) => bimbelRequest<void>(bimbelPath(id, '/members/me'), { method: 'DELETE' })
export const transferBimbelOwnership = (id: string, accountId: string) => bimbelRequest<OwnershipTransfer>(bimbelPath(id, '/transfer-ownership'), { method: 'POST', body: { accountId } })
export const applyBimbel = (body: {
  bimbelName: string
  studentCountBand: BimbelStudentCountBand
  city?: string
  termsAccepted: true
}) => bimbelRequest<BimbelApplication>('/bimbel-applications', { method: 'POST', body })
export const updateBimbel = (id: string, body: Partial<Pick<Bimbel, 'name' | 'city' | 'description' | 'logoUrl'>>) => bimbelRequest<Bimbel>(bimbelPath(id), { method: 'PATCH', body })
export const rotateBimbelJoinCode = (id: string) => bimbelRequest<Bimbel>(bimbelPath(id, '/join-code/rotate'), { method: 'POST' })
export const inviteBimbelMember = (id: string, email: string, role: string) => bimbelRequest<BimbelMember>(bimbelPath(id, '/members'), { method: 'POST', body: { email, role } })
export const updateBimbelMember = (id: string, accountId: string, body: { role?: string, status?: string }) => bimbelRequest<BimbelMember>(bimbelPath(id, `/members/${accountId}`), { method: 'PATCH', body })
export const createBimbelClass = (id: string, name: string) => bimbelRequest<BimbelClass>(bimbelPath(id, '/classes'), { method: 'POST', body: { name } })
export const getBimbelClass = (id: string, classId: string) => bimbelRequest<BimbelClass>(bimbelPath(id, `/classes/${classId}`))
export const updateBimbelClassMembers = (id: string, classId: string, accountIds: string[]) => bimbelRequest<BimbelClass>(bimbelPath(id, `/classes/${classId}/members`), { method: 'PUT', body: { accountIds } })
export const deleteBimbelClass = (id: string, classId: string) => bimbelRequest<void>(bimbelPath(id, `/classes/${classId}`), { method: 'DELETE' })
export const getBimbelProductResults = (id: string, productId: string) => bimbelRequest<BimbelProductResults>(bimbelPath(id, `/products/${productId}/results`))
/**
 * Harga satu pilihan tingkat + kuota + term.
 *
 * `plan` dan `seats` opsional: tanpa keduanya server menjawab dengan tingkat
 * bimbel saat ini beserta seluruh aturan bentuk isian, dan itulah yang dipakai
 * halaman langganan untuk muat pertama.
 *
 * Kuota di bawah kursi termasuk tingkatnya DINAIKKAN server, bukan ditolak —
 * jadi nilai kontrol kursi dikirim apa adanya dan `seatQuota` pada jawaban yang
 * jadi kebenarannya. Jangan menormalkan sendiri di klien.
 */
export type BimbelQuoteRequest =
  | { kind: 'subscription', plan?: BimbelPlan, months?: number }
  | { kind: 'seat_addon', additionalSeats: number }

export type BimbelOrderRequest =
  | { kind: 'subscription', plan: BimbelPlan, months: number }
  | { kind: 'seat_addon', additionalSeats: number }

export const getBimbelQuote = (id: string, request: BimbelQuoteRequest) =>
  bimbelRequest<BimbelQuote>(bimbelPath(id, '/billing/quote'), {
    query: request,
  })
export const createBimbelOrder = (id: string, body: BimbelOrderRequest) =>
  bimbelRequest<BimbelOrder>(bimbelPath(id, '/billing/orders'), { method: 'POST', body })
/** Instruksi bayar satu tagihan: merchant, nominal, tenggat, dan bukti terakhir. */
export const getBimbelPaymentInstructions = (id: string, orderId: string) =>
  bimbelRequest<BimbelPaymentInstructions>(bimbelPath(id, `/billing/orders/${orderId}/payment`))

/**
 * Konfirmasi "sudah transfer" untuk satu tagihan bimbel.
 *
 * Bentuknya sama persis dengan jalur manual siswa
 * (`POST /me/purchases/:invoice/payment-proof`): multipart, lampiran opsional,
 * nama pengirim dan nominal sebagai keterangan — bukan bukti — dan jawaban
 * berupa tagihan yang sudah diperbarui.
 */
export function confirmBimbelOrderPayment(
  id: string,
  orderId: string,
  payload: { file?: File | null, senderName: string, paidAmount: number, note?: string },
) {
  const body = new FormData()
  if (payload.file) body.append('proof', payload.file)
  body.append('senderName', payload.senderName)
  body.append('paidAmount', String(payload.paidAmount))
  body.append('transferredAt', String(Math.floor(Date.now() / 1000)))
  if (payload.note) body.append('note', payload.note)

  return bimbelRequest<BimbelOrder>(bimbelPath(id, `/billing/orders/${orderId}/payment-proof`), { method: 'POST', body })
}
export const cancelBimbelOrder = (id: string, orderId: string) => bimbelRequest<void>(bimbelPath(id, `/billing/orders/${orderId}/cancel`), { method: 'POST' })
export const submitBimbelProductPublic = (id: string, productId: string) => bimbelRequest(bimbelPath(id, `/products/${productId}/submit-public`), { method: 'POST' })

/**
 * Direktori bimbel untuk admin — seluruh organisasi, terbaru dulu.
 *
 * Menggantikan antrean persetujuan, yang hilang bersama persetujuannya:
 * mendaftarkan bimbel sekarang langsung membuat ruangnya. Pertanyaan yang
 * tersisa bukan lagi "boleh ada atau tidak", melainkan siapa yang mendaftar,
 * di tingkat apa, dan langganannya masih hidup atau tidak.
 */
export const useAdminBimbels = () => resource(
  () => bimbelRequest<Bimbel[]>('/admin/bimbels'), [], 'Daftar bimbel belum berhasil dimuat.',
)
export const useAdminBimbelApplications = (status = 'pending') => resource(
  () => bimbelRequest<BimbelApplication[]>('/admin/bimbel-applications', { query: { status } }), [], 'Pengajuan bimbel belum berhasil dimuat.',
)
export const decideBimbelApplication = (id: string, status: 'approved' | 'rejected', reason = '') => bimbelRequest<BimbelApplication>(`/admin/bimbel-applications/${id}/decision`, { method: 'POST', body: { status, reason } })
/**
 * Buku tagihan langganan bimbel — seluruh status, bukan satu.
 *
 * Dulu defaultnya `pending`, dan itu diam-diam membuat halamannya jadi daftar
 * tagihan yang menunggu *pembayarnya* sambil terlihat seperti antrean yang
 * menunggu Zenko. Yang paling sering ditanyakan justru hilang: tagihan
 * `verifying` — "bukti saya sudah masuk belum?" — lenyap dari daftar tepat saat
 * buktinya datang. Antrean yang benar-benar menunggu admin ada di
 * `/dashboard/admin/payments`, disusun dari bukti transfer, bukan dari sini.
 *
 * Dimuat sekali lalu disaring di klien, seperti meja verifikasi: jumlah
 * tagihannya kecil dan berpindah filter tidak boleh berarti menunggu jaringan.
 */
export const useAdminBimbelOrders = () => resource(
  () => bimbelRequest<BimbelOrder[]>('/admin/bimbel-orders', { query: { status: 'all' } }), [], 'Tagihan bimbel belum berhasil dimuat.',
)
/**
 * Aktivasi manual: mengakui pembayaran yang tidak pernah dilihat sistem.
 *
 * `reason` wajib dan ditolak server kalau kosong — endpoint ini memberi kursi
 * dan periode berbayar tanpa satu pun bukti tersimpan, jadi catatannya adalah
 * satu-satunya jejak yang tersisa. Jalur biasanya bukan ini, melainkan antrean
 * bukti transfer di Verifikasi pembayaran.
 */
export const activateBimbelOrder = (id: string, reason: string) => bimbelRequest<BimbelOrder>(`/admin/bimbel-orders/${id}/activate`, { method: 'POST', body: { reason } })
/** Menagih pemilik bimbel lewat email. Hanya untuk tagihan yang masih `pending`. */
export const remindBimbelOrder = (id: string) => bimbelRequest<BimbelOrder>(`/admin/bimbel-orders/${id}/reminder`, { method: 'POST' })

/**
 * Antrean verifikasi bukti transfer langganan bimbel.
 *
 * `all` mengambil seluruh riwayat; tanpanya server memfilter satu status.
 * Halaman admin memuat semuanya sekali lalu menyaring di klien, seperti meja
 * verifikasi pembayaran siswa — antreannya kecil dan pindah filter tidak boleh
 * berarti menunggu jaringan.
 */
export const useAdminBimbelProofs = (status = 'all') => resource(
  () => bimbelRequest<AdminBimbelPaymentProof[]>('/admin/bimbel-payment-proofs', { query: { status } }),
  [],
  'Bukti pembayaran bimbel belum berhasil dimuat.',
)
/**
 * Sengaja `void`, bukan bukti yang diperbarui: server menjawab dengan hal yang
 * berbeda per aksi — langganan baru saat approve, tagihan yang dibuka kembali
 * saat reject, dan hanya `{ invoice }` kalau tagihannya sudah tidak lagi
 * `verifying` saat keputusan mendarat. Satu tipe tidak bisa menjanjikan
 * ketiganya dengan jujur, jadi pemanggilnya memuat ulang antreannya alih-alih
 * membaca jawaban ini.
 */
export const decideBimbelProof = (id: string, body: BimbelProofDecisionRequest): Promise<void> =>
  bimbelRequest(`/admin/bimbel-payment-proofs/${id}/decision`, { method: 'POST', body })
