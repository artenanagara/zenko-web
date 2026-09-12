import type {
  TutorShareCancelInput,
  TutorShareMutationInput,
  TutorSharePreview,
  TutorShareView,
  TutorTermsAcceptanceInput,
} from '#shared/types/tutor-share'

function versionHeader(version: number): string {
  return `"${version}"`
}

function mutationHeaders(version: number, stepUpToken: string, idempotencyKey: string): Headers {
  const headers = new Headers()
  headers.set('If-Match', versionHeader(version))
  headers.set('Idempotency-Key', idempotencyKey)
  headers.set('X-Share-Schedule-Step-Up', stepUpToken)
  return headers
}

export async function stepUpTutorShareSchedule(password: string): Promise<{ stepUpToken: string, expiresIn: number }> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<{ stepUpToken: string, expiresIn: number }>('/admin/share-schedule/step-up', {
    baseURL: config.apiBase,
    method: 'POST',
    body: { password },
    credentials: 'include',
  })
}

/** Read-only owner view for one tutor. */
export function useAdminTutorShareSchedule(accountId: MaybeRefOrGetter<string>) {
  const { public: config } = useRuntimeConfig()
  const data = ref<TutorShareView | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TutorShareView>(`/admin/tutors/${toValue(accountId)}/share-schedule`, {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Jadwal bagi hasil belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

export async function previewTutorShareSchedule(
  accountId: string,
  input: TutorShareMutationInput,
): Promise<TutorSharePreview> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<TutorSharePreview>(`/admin/tutors/${accountId}/share-schedule/preview`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: input,
    credentials: 'include',
  })
}

export async function createTutorShareSchedule(
  accountId: string,
  version: number,
  stepUpToken: string,
  idempotencyKey: string,
  input: TutorShareMutationInput,
): Promise<TutorShareView> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<TutorShareView>(`/admin/tutors/${accountId}/share-schedule`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: input,
    headers: mutationHeaders(version, stepUpToken, idempotencyKey),
    credentials: 'include',
  })
}

export async function cancelTutorShareSchedule(
  accountId: string,
  changeId: string,
  version: number,
  stepUpToken: string,
  idempotencyKey: string,
  input: TutorShareCancelInput,
): Promise<TutorShareView> {
  const { public: config } = useRuntimeConfig()
  return await useApiFetch<TutorShareView>(`/admin/tutors/${accountId}/share-schedule/${changeId}/cancel`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: input,
    headers: mutationHeaders(version, stepUpToken, idempotencyKey),
    credentials: 'include',
  })
}

/** The signed-in tutor can only read their own rate. */
export function useTutorShareRate() {
  const { public: config } = useRuntimeConfig()
  const data = ref<TutorShareView | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await useApiFetch<TutorShareView>('/tutor/share-rate', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Informasi bagi hasil belum berhasil dimuat.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

export async function acceptTutorTerms(input: TutorTermsAcceptanceInput): Promise<void> {
  const { public: config } = useRuntimeConfig()
  await useApiFetch('/tutor/terms/acceptance', {
    baseURL: config.apiBase,
    method: 'POST',
    body: input,
    credentials: 'include',
  })
}

export function tutorShareErrorCode(cause: unknown): string {
  return (cause as { data?: { code?: string }, response?: { _data?: { code?: string } } })?.data?.code
    ?? (cause as { response?: { _data?: { code?: string } } })?.response?._data?.code
    ?? ''
}
