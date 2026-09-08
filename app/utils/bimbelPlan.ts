import type { BimbelPlan } from '#shared/types/bimbel'

/**
 * Penamaan tingkat langganan di seluruh UI.
 *
 * Selalu ditulis lengkap — "Langganan Dasar", bukan "Dasar" apalagi "Paket
 * Dasar". Di Zenko "paket" sudah berarti produk tryout yang dijual, jadi
 * memakainya untuk tingkat langganan membuat pengelola bimbel tidak bisa
 * membedakan soal yang ia jual dari langganan yang ia bayar
 * (docs/konsep-bimbel-agency.md §1.2).
 */
const PLAN_NAMES: Record<BimbelPlan, string> = {
  dasar: 'Dasar',
  pro: 'Pro',
  institusi: 'Institusi',
}

/**
 * `name` adalah nama tingkat dari server saat tersedia; kalau tidak (mis. baris
 * riwayat tagihan yang hanya membawa `plan`), nama cadangannya dipakai supaya
 * tabel tetap menyebut tingkatnya alih-alih memperlihatkan slug.
 */
export function bimbelPlanLabel(plan: BimbelPlan, name?: string): string {
  return `Langganan ${name?.trim() || PLAN_NAMES[plan]}`
}

/**
 * Batas tingkat memakai `0` untuk "tak terbatas". Tidak boleh dicetak apa
 * adanya: "0 pengajar" adalah kebalikan persis dari artinya.
 *
 * Bentuk tak terbatasnya tetap menyebut apa yang tak dibatasi. Tingkat
 * Institusi tidak membatasi pengajar maupun bank soal, dan dua baris bertulisan
 * "Tak terbatas" berdampingan tidak memberi tahu pembacanya yang mana.
 */
export function bimbelLimitLabel(limit: number, noun: string): string {
  if (limit > 0) return `${limit} ${noun}`
  return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} tak terbatas`
}
