/** Upload marketing media through the role-protected marketing API boundary. */
export async function uploadMarketingImage(file: File): Promise<string> {
  const { public: config } = useRuntimeConfig()
  const body = new FormData()
  body.append('image', file)
  const result = await useApiFetch<{ url: string }>('/marketing/uploads', {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
  return result.url
}
