import type { AdminStudentRow } from '#shared/types/admin-directory'
import type { User } from '#shared/types/user'

/**
 * Admin's student directory: every account holding the student role.
 *
 * Same client-only pattern as useAdminTutors — the session cookie is HttpOnly
 * on the API origin, so this resolves after hydration. Call `refresh()` from
 * onMounted; the API answers 403 for any non-admin.
 */

/** GET /admin/students — setiap akun berperan siswa, alfabetis. */
export function useAdminStudents() {
  const { public: config } = useRuntimeConfig()

  const data = ref<AdminStudentRow[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<AdminStudentRow[]>('/admin/students', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Daftar siswa belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/**
 * POST /admin/students/:accountId/promote-tutor — memberi peran tutor kepada
 * akun yang tidak pernah mengajukan.
 *
 * Antrean Pengajuan tutor tetap jalur biasanya: ada yang meminta, admin
 * memutuskan. Ini kasus sebaliknya, saat Zenko yang mendekati gurunya. API
 * menolak (409) bila akun itu justru punya pengajuan yang masih menunggu, agar
 * alasan seseorang menjadi tutor tercatat di satu tempat saja.
 *
 * Perannya langsung berlaku tanpa login ulang — guard peran membaca ulang dari
 * database setiap request.
 */
export async function promoteStudentToTutor(accountId: string): Promise<User> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<User>(`/admin/students/${accountId}/promote-tutor`, {
    baseURL: config.apiBase,
    credentials: 'include',
    method: 'POST',
  })
}
