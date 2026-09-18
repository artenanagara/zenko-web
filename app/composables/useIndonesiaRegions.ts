/**
 * Indonesian province and regency/city data from wilayah.id.
 *
 * The service publishes static JSON sourced from the cahyadsn/wilayah GitHub
 * repository. Keep the API response behind this composable so forms do not
 * depend on the provider's response envelope or URL layout.
 */
export interface IndonesiaRegion {
  code: string
  name: string
}

interface RegionResponse {
  data: IndonesiaRegion[]
}

const WILAYAH_API = 'https://wilayah.id/api'

export const useIndonesiaRegions = () => {
  const provinces = useState<IndonesiaRegion[]>('indonesia-provinces', () => [])
  const cities = ref<IndonesiaRegion[]>([])
  const isLoadingProvinces = ref(false)
  const isLoadingCities = ref(false)
  const error = ref('')

  const loadProvinces = async () => {
    if (provinces.value.length || isLoadingProvinces.value) return

    isLoadingProvinces.value = true
    error.value = ''
    try {
      const response = await $fetch<RegionResponse>(`${WILAYAH_API}/provinces.json`)
      provinces.value = response.data
    }
    catch {
      error.value = 'Daftar provinsi belum bisa dimuat. Coba lagi.'
    }
    finally {
      isLoadingProvinces.value = false
    }
  }

  const loadCities = async (provinceCode: string) => {
    cities.value = []
    if (!provinceCode) return

    isLoadingCities.value = true
    error.value = ''
    try {
      const response = await $fetch<RegionResponse>(`${WILAYAH_API}/regencies/${encodeURIComponent(provinceCode)}.json`)
      cities.value = response.data
    }
    catch {
      error.value = 'Daftar kota belum bisa dimuat. Coba pilih provinsi lagi.'
    }
    finally {
      isLoadingCities.value = false
    }
  }

  return {
    provinces,
    cities,
    isLoadingProvinces,
    isLoadingCities,
    error,
    loadProvinces,
    loadCities,
  }
}
