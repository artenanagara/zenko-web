/** Satu wilayah: kode BPS dan namanya. */
export interface Region {
  code: string
  name: string
}

interface RegionEnvelope {
  data: Region[]
}

const WILAYAH_API = 'https://wilayah.id/api'

/**
 * Mengambil satu berkas wilayah dari wilayah.id di sisi server.
 *
 * Amplopnya dibuka di sini, bukan di halaman: penyedia kadang mengirim array
 * telanjang dan kadang `{ data: [...] }`, dan itu detail penyedia yang tidak
 * perlu diketahui siapa pun di atas lapisan ini.
 *
 * Kegagalan diterjemahkan jadi 502, bukan diteruskan apa adanya. Kalau
 * wilayah.id sedang bermasalah, itu bukan salah permintaan pengunjung — dan
 * halamannya sudah punya pesan "Daftar provinsi belum bisa dimuat" beserta
 * tombol coba lagi untuk keadaan ini.
 */
export async function fetchRegions(path: string): Promise<Region[]> {
  try {
    const response = await $fetch<RegionEnvelope | Region[]>(`${WILAYAH_API}/${path}`, {
      timeout: 10_000,
    })
    const regions = Array.isArray(response) ? response : response.data
    return Array.isArray(regions) ? regions : []
  }
  catch (cause) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Data wilayah belum bisa dimuat.',
      cause,
    })
  }
}
