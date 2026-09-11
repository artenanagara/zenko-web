import type { AdminTutorDetail } from '#shared/types/admin-tutor'
import type { User } from '#shared/types/user'

/**
 * Admin's tutor directory: every account holding the tutor role, and one
 * tutor's profile plus everything they have published.
 *
 * Same client-only pattern as useAdminModeration — the session cookie is
 * HttpOnly on the API origin, so these resolve after hydration. Call
 * `refresh()` from onMounted; the API answers 403 for any non-admin.
 */

/** GET /admin/tutors — setiap akun berperan tutor, alfabetis. */
export function useAdminTutors() {
  const { public: config } = useRuntimeConfig()

  const data = ref<User[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<User[]>('/admin/tutors', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Daftar tutor belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** GET /admin/tutors/:accountId — identitas, profil, dan produk tutor. */
export async function fetchAdminTutor(accountId: string): Promise<AdminTutorDetail> {
  const { public: config } = useRuntimeConfig()

  return await useApiFetch<AdminTutorDetail>(`/admin/tutors/${accountId}`, {
    baseURL: config.apiBase,
    credentials: 'include',
  })
}
