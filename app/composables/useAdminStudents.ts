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

  const data = ref<User[]>([])
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<User[]>('/admin/students', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat daftar siswa.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}
