import type { PublicBimbelDetail } from '#shared/types/public-bimbel'

export async function usePublicBimbel(slug: string): Promise<Ref<PublicBimbelDetail>> {
  const { public: config } = useRuntimeConfig()
  const { data, error } = await useFetch<PublicBimbelDetail>(`/bimbels/${encodeURIComponent(slug)}`, {
    baseURL: config.apiBase,
  })
  if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Bimbel tidak ditemukan', fatal: true })
  }
  return data as Ref<PublicBimbelDetail>
}
