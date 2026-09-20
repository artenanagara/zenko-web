/**
 * Kabupaten/kota di satu provinsi, dilewatkan melalui origin Zenko sendiri
 * dengan alasan yang sama seperti daftar provinsi — lihat provinces.get.ts.
 */
export default defineCachedEventHandler(
  async (event) => {
    const code = getRouterParam(event, 'code') ?? ''
    // Hanya kode BPS: nilai ini disusun menjadi URL ke penyedia, jadi bentuknya
    // dibatasi di sini alih-alih dipercaya apa adanya.
    if (!/^\d{2}$/.test(code)) {
      throw createError({ statusCode: 400, statusMessage: 'Kode provinsi tidak valid.' })
    }
    return fetchRegions(`regencies/${code}.json`)
  },
  {
    maxAge: 60 * 60 * 24,
    name: 'regions',
    getKey: event => `regencies-${getRouterParam(event, 'code')}`,
  },
)
