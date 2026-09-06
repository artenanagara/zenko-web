import type {
  AssignmentInput,
  AssignmentResults,
  Bimbel,
  BimbelApplication,
  BimbelAssignment,
  BimbelClass,
  BimbelMember,
  BimbelMembership,
  BimbelOrder,
  BimbelQuote,
  StudentAssignment,
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

  async function refresh() {
    pending.value = true
    error.value = ''
    try { data.value = await bimbelRequest<BimbelMembership[]>('/me/bimbels') }
    catch (cause) { error.value = tutorApiMessage(cause, 'Gagal memuat bimbel.') }
    finally { pending.value = false }
  }
  return { data, pending, error, refresh }
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
  () => bimbelRequest<Bimbel>(bimbelPath(id)), null as unknown as Bimbel, 'Gagal memuat profil bimbel.',
)
export const useBimbelMembers = (id: string) => resource(
  () => bimbelRequest<BimbelMember[]>(bimbelPath(id, '/members')), [], 'Gagal memuat daftar siswa.',
)
export const useBimbelClasses = (id: string) => resource(
  () => bimbelRequest<BimbelClass[]>(bimbelPath(id, '/classes')), [], 'Gagal memuat kelas.',
)
export const useBimbelAssignments = (id: string) => resource(
  () => bimbelRequest<BimbelAssignment[]>(bimbelPath(id, '/assignments')), [], 'Gagal memuat penugasan.',
)
export const useStudentAssignments = () => resource(
  () => bimbelRequest<StudentAssignment[]>('/me/assignments'), [], 'Gagal memuat tugas bimbel.',
)
export const useMyBimbelApplication = () => resource(
  () => bimbelRequest<BimbelApplication | null>('/bimbel-applications/me'), null, 'Gagal memuat pengajuan.',
)
export const useBimbelOrders = (id: string) => resource(
  () => bimbelRequest<BimbelOrder[]>(bimbelPath(id, '/billing/orders')), [], 'Gagal memuat tagihan.',
)

export const joinBimbel = (code: string) => bimbelRequest<{ bimbelId: string, bimbelName: string, status: string }>('/bimbel/join', { method: 'POST', body: { code } })
export const applyBimbel = (body: { bimbelName: string, whatsapp: string, city: string, studentCount: number, about: string }) => bimbelRequest<BimbelApplication>('/bimbel-applications', { method: 'POST', body })
export const updateBimbel = (id: string, body: Partial<Pick<Bimbel, 'name' | 'city' | 'description' | 'logoUrl'>>) => bimbelRequest<Bimbel>(bimbelPath(id), { method: 'PATCH', body })
export const rotateBimbelJoinCode = (id: string) => bimbelRequest<Bimbel>(bimbelPath(id, '/join-code/rotate'), { method: 'POST' })
export const inviteBimbelMember = (id: string, email: string, role: string) => bimbelRequest<BimbelMember>(bimbelPath(id, '/members'), { method: 'POST', body: { email, role } })
export const updateBimbelMember = (id: string, accountId: string, body: { role?: string, status?: string }) => bimbelRequest<BimbelMember>(bimbelPath(id, `/members/${accountId}`), { method: 'PATCH', body })
export const createBimbelClass = (id: string, name: string) => bimbelRequest<BimbelClass>(bimbelPath(id, '/classes'), { method: 'POST', body: { name } })
export const getBimbelClass = (id: string, classId: string) => bimbelRequest<BimbelClass>(bimbelPath(id, `/classes/${classId}`))
export const updateBimbelClassMembers = (id: string, classId: string, accountIds: string[]) => bimbelRequest<BimbelClass>(bimbelPath(id, `/classes/${classId}/members`), { method: 'PUT', body: { accountIds } })
export const deleteBimbelClass = (id: string, classId: string) => bimbelRequest<void>(bimbelPath(id, `/classes/${classId}`), { method: 'DELETE' })
export const createBimbelAssignment = (id: string, body: AssignmentInput) => bimbelRequest<BimbelAssignment>(bimbelPath(id, '/assignments'), { method: 'POST', body })
export const publishBimbelAssignment = (id: string, assignmentId: string) => bimbelRequest<BimbelAssignment>(bimbelPath(id, `/assignments/${assignmentId}/publish`), { method: 'POST' })
export const closeBimbelAssignment = (id: string, assignmentId: string) => bimbelRequest<BimbelAssignment>(bimbelPath(id, `/assignments/${assignmentId}/close`), { method: 'POST' })
export const deleteBimbelAssignment = (id: string, assignmentId: string) => bimbelRequest<void>(bimbelPath(id, `/assignments/${assignmentId}`), { method: 'DELETE' })
export const getBimbelAssignmentResults = (id: string, assignmentId: string) => bimbelRequest<AssignmentResults>(bimbelPath(id, `/assignments/${assignmentId}/results`))
export const getBimbelQuote = (id: string, seats?: number, months?: number) => bimbelRequest<BimbelQuote>(bimbelPath(id, '/billing/quote'), { query: seats ? { seats, months } : undefined })
export const createBimbelOrder = (id: string, seatQuota: number, months: number) => bimbelRequest<BimbelOrder>(bimbelPath(id, '/billing/orders'), { method: 'POST', body: { seatQuota, months } })
export const cancelBimbelOrder = (id: string, orderId: string) => bimbelRequest<void>(bimbelPath(id, `/billing/orders/${orderId}/cancel`), { method: 'POST' })
export const submitBimbelProductPublic = (id: string, productId: string) => bimbelRequest(bimbelPath(id, `/products/${productId}/submit-public`), { method: 'POST' })

export const useAdminBimbelApplications = (status = 'pending') => resource(
  () => bimbelRequest<BimbelApplication[]>('/admin/bimbel-applications', { query: { status } }), [], 'Gagal memuat pengajuan bimbel.',
)
export const decideBimbelApplication = (id: string, status: 'approved' | 'rejected', reason = '') => bimbelRequest<BimbelApplication>(`/admin/bimbel-applications/${id}/decision`, { method: 'POST', body: { status, reason } })
export const useAdminBimbelOrders = (status = 'pending') => resource(
  () => bimbelRequest<BimbelOrder[]>('/admin/bimbel-orders', { query: { status } }), [], 'Gagal memuat pembayaran bimbel.',
)
export const activateBimbelOrder = (id: string) => bimbelRequest<BimbelOrder>(`/admin/bimbel-orders/${id}/activate`, { method: 'POST' })
