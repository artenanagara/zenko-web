/**
 * The demo environment's own state: which logins it was seeded with, and the
 * ability to throw this browser's sandbox away.
 *
 * Everything here comes from zenko-api's /demo endpoint rather than from a
 * list kept in the frontend, so the page can never advertise an account the
 * seed did not create. The sandbox itself is entirely the API's doing — the
 * browser only carries a cookie naming it.
 */
export interface DemoAccount {
  email: string
  name: string
  role: string
  note: string
}

export interface DemoInfo {
  password: string
  accounts: DemoAccount[]
  bimbel: string
  joinCode: string
  sandboxId: string
}

export function useDemo() {
  const runtimeConfig = useRuntimeConfig()
  const enabled = computed(() => runtimeConfig.public.demoMode === true)

  const info = useState<DemoInfo | null>('demo-info', () => null)
  const pending = ref(false)
  const error = ref('')

  async function load() {
    if (!enabled.value || info.value) return
    pending.value = true
    error.value = ''
    try {
      info.value = await useApiFetch<DemoInfo>('/demo')
    }
    catch {
      error.value = 'Informasi akun demo belum bisa dimuat. Coba muat ulang halaman.'
    }
    finally {
      pending.value = false
    }
  }

  const resetting = ref(false)

  /**
   * Drops this browser's sandbox and reloads. A full page load rather than a
   * client-side navigation on purpose: the reset also clears the session
   * cookie, and every store already loaded in memory describes data that no
   * longer exists.
   */
  async function reset() {
    if (resetting.value) return
    resetting.value = true
    try {
      await useApiFetch('/demo/reset', { method: 'POST' })
      window.location.href = '/'
    }
    catch {
      error.value = 'Demo gagal diulang. Coba lagi sebentar lagi.'
      resetting.value = false
    }
  }

  return { enabled, info, pending, error, load, reset, resetting }
}
