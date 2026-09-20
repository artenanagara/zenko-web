/**
 * Data provinsi dan kabupaten/kota Indonesia, dibaca dari server Zenko sendiri.
 *
 * Sumbernya tetap wilayah.id, tetapi halaman tidak boleh memanggilnya langsung:
 * respons GET wilayah.id tidak mengirim `Access-Control-Allow-Origin` sama
 * sekali — preflight OPTIONS-nya mengirim, permintaan sebenarnya tidak — jadi
 * browser memblokir setiap panggilan dan daftarnya selalu kosong, tanpa jejak
 * selain satu galat CORS di konsol. Route server di server/api/regions
 * mengambilnya dari sisi server dan menyajikannya dari origin yang sama dengan
 * halamannya, di mana CORS tidak berlaku.
 *
 * Amplop respons penyedia sudah dibuka di route itu, jadi di sini yang datang
 * selalu berupa array.
 */
export interface IndonesiaRegion {
  code: string
  name: string
}

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
      provinces.value = await $fetch<IndonesiaRegion[]>('/api/regions/provinces')
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
      cities.value = await $fetch<IndonesiaRegion[]>(`/api/regions/regencies/${encodeURIComponent(provinceCode)}`)
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
