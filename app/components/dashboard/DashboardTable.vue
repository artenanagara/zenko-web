<script setup lang="ts">
/**
 * Tabel dashboard yang berubah bentuk, bukan cuma menyusut.
 *
 * AppTable dari design system membungkus <table> dengan `overflow-x-auto`.
 * Di desktop itu benar; di HP hasilnya tabel tujuh kolom yang harus digeser
 * ke samping, dan kolom "Aksi" — satu-satunya kolom yang bisa diklik — selalu
 * berada paling kanan, di luar layar. Tutor yang ingin mengajukan paketnya
 * dari HP harus menebak bahwa ada sesuatu di sebelah kanan sana.
 *
 * Di bawah `md` komponen ini merender tiap baris sebagai kartu: kolom utama
 * jadi judulnya, sisanya jadi pasangan label-nilai, dan kolom aksi turun ke
 * kaki kartu selebar penuh. Di `md` ke atas ia kembali menjadi tabel yang
 * persis sama dengan AppTable, jadi tidak ada yang berubah untuk pemakai
 * desktop.
 *
 * API-nya sengaja identik dengan AppTable (`columns`, `data`, slot
 * `cell(key)`) supaya perpindahannya mekanis — yang baru hanya `primaryKey`,
 * `actionKey`, dan `hideOnMobile` pada kolom.
 *
 * Seleksi massal (`selectable` + `v-model:selected`) ikut di sini, bukan di
 * tiap halaman: kotak centangnya harus jatuh di tempat yang sama pada tabel
 * dan kartu — kolom pertama di desktop, pojok kiri atas kartu di HP — dan
 * "pilih semua" hanya mencakup baris yang sedang tampil (`data`), yaitu hasil
 * pencarian/filter, bukan seluruh dataset yang tersembunyi di baliknya.
 * Halaman menyimpan kunci-kunci yang dipilih dan memutuskan sendiri aksi apa
 * yang berlaku untuknya.
 */
export interface DashboardTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  /**
   * Tidak ikut tampil di kartu. Untuk kolom yang hanya berguna saat
   * dibandingkan antarbaris (mis. tanggal urut) dan cuma menambah keramaian
   * pada tampilan satu-kartu-satu-baris.
   */
  hideOnMobile?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: DashboardTableColumn[]
    data: Record<string, any>[]
    /** Kolom yang jadi judul kartu. Default: kolom pertama. */
    primaryKey?: string
    /** Kolom aksi, dipindah ke kaki kartu selebar penuh. */
    actionKey?: string
    /**
     * Sel lebih rapat (px-3, bukan px-5). Untuk tabel bersembilan kolom
     * atau lebih, padding bawaan saja sudah memakan sepertiga lebar konten
     * dan memaksa gulir ke samping pada layar laptop.
     */
    compact?: boolean
    /** Tampilkan kotak centang per baris dan "pilih semua" di kepala tabel. */
    selectable?: boolean
    /**
     * Kunci unik tiap baris yang disimpan di `selected`. Nama field (default
     * `id`) atau fungsi untuk baris yang kuncinya gabungan beberapa field.
     */
    rowKey?: string | ((row: Record<string, any>) => string)
  }>(),
  { primaryKey: undefined, actionKey: undefined, compact: false, selectable: false, rowKey: 'id' },
)

/** Kunci baris yang dipilih. Halaman yang memakainya memegang state-nya. */
const selected = defineModel<string[]>('selected', { default: () => [] })

function keyOf(row: Record<string, any>): string {
  return typeof props.rowKey === 'function' ? props.rowKey(row) : String(row[props.rowKey])
}

const selectedSet = computed(() => new Set(selected.value))
const visibleKeys = computed(() => props.data.map(keyOf))
const visibleSelectedCount = computed(() => visibleKeys.value.filter(key => selectedSet.value.has(key)).length)
const allVisibleSelected = computed(() => props.data.length > 0 && visibleSelectedCount.value === props.data.length)
const someVisibleSelected = computed(() => visibleSelectedCount.value > 0 && !allVisibleSelected.value)

function isSelected(row: Record<string, any>): boolean {
  return selectedSet.value.has(keyOf(row))
}

function toggleRow(row: Record<string, any>, checked: boolean) {
  const key = keyOf(row)
  if (checked) {
    if (!selectedSet.value.has(key)) selected.value = [...selected.value, key]
  }
  else {
    selected.value = selected.value.filter(item => item !== key)
  }
}

/**
 * "Pilih semua" bekerja pada baris yang tampil saja. Kalau semuanya sudah
 * terpilih ia melepas baris-baris itu — pilihan pada baris yang sedang
 * tersaring keluar tidak disentuh, supaya mengganti filter tidak diam-diam
 * membuang pilihan yang dibuat sebelumnya.
 */
function toggleAllVisible() {
  const visible = new Set(visibleKeys.value)
  if (allVisibleSelected.value) {
    selected.value = selected.value.filter(key => !visible.has(key))
  }
  else {
    const merged = new Set(selected.value)
    for (const key of visible) merged.add(key)
    selected.value = [...merged]
  }
}

/** Checkbox `indeterminate` hanya bisa diset lewat properti DOM, bukan atribut. */
const headerCheckbox = ref<HTMLInputElement | null>(null)
watchEffect(() => {
  if (headerCheckbox.value) headerCheckbox.value.indeterminate = someVisibleSelected.value
})

function rowLabel(row: Record<string, any>): string {
  const value = primary.value ? row[primary.value.key] : undefined
  return typeof value === 'string' && value ? `Pilih ${value}` : 'Pilih baris ini'
}

/** Kelas kotak centang, disamakan dengan AppCheckbox milik design system. */
const checkboxClass = 'h-4.5 w-4.5 shrink-0 cursor-pointer rounded-[4px] border border-line bg-surface text-primary accent-primary transition-colors focus:ring-2 focus:ring-primary-soft focus:outline-none checked:border-primary checked:bg-primary disabled:cursor-not-allowed'

const cellPadding = computed(() => (props.compact ? 'px-3 py-3' : 'px-5 py-3.5'))

const primary = computed(() => props.columns.find(c => c.key === props.primaryKey) ?? props.columns[0])

const detailColumns = computed(() =>
  props.columns.filter(c => c.key !== primary.value?.key && c.key !== props.actionKey && !c.hideOnMobile),
)

const actionColumn = computed(() =>
  props.actionKey ? props.columns.find(c => c.key === props.actionKey) ?? null : null,
)

function alignClass(col: DashboardTableColumn) {
  return col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
}
</script>

<template>
  <!-- Kartu: HP saja. -->
  <div class="grid gap-3 md:hidden">
    <article
      v-for="(row, idx) in data"
      :key="idx"
      class="rounded-xl border bg-surface p-4 shadow-xs transition-colors"
      :class="selectable && isSelected(row) ? 'border-primary/60 bg-primary-soft/20' : 'border-line'"
    >
      <div class="flex items-start gap-3">
        <input
          v-if="selectable"
          type="checkbox"
          :class="[checkboxClass, 'mt-0.5']"
          :checked="isSelected(row)"
          :aria-label="rowLabel(row)"
          @change="toggleRow(row, ($event.target as HTMLInputElement).checked)"
        >
        <div v-if="primary" class="min-w-0 flex-1 text-[0.92rem]">
          <slot :name="`cell(${primary.key})`" :item="row" :value="row[primary.key]">
            <span class="font-semibold text-ink">{{ row[primary.key] }}</span>
          </slot>
        </div>
      </div>

      <dl v-if="detailColumns.length" class="mt-3 grid gap-1.5 text-xs">
        <div v-for="col in detailColumns" :key="col.key" class="flex items-start justify-between gap-4">
          <dt class="shrink-0 font-bold tracking-wider text-faint uppercase">{{ col.label }}</dt>
          <dd class="min-w-0 text-right text-slate-700">
            <slot :name="`cell(${col.key})`" :item="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </dd>
        </div>
      </dl>

      <!-- Aksi turun ke kaki kartu: di HP inilah satu-satunya bagian yang
           bisa disentuh, jadi ia tidak boleh jadi kolom paling kanan. -->
      <div v-if="actionColumn" class="mt-3.5 border-t border-line pt-3 text-[0.86rem]">
        <slot :name="`cell(${actionColumn.key})`" :item="row" :value="row[actionColumn.key]">
          {{ row[actionColumn.key] }}
        </slot>
      </div>
    </article>
  </div>

  <!-- Tabel: md ke atas, sama persis dengan AppTable. -->
  <div class="hidden overflow-x-auto rounded-xl border border-line bg-surface shadow-xs md:block">
    <table class="min-w-max w-full text-left text-xs">
      <thead class="border-b border-line bg-surface-sunken font-bold tracking-wider text-ink uppercase">
        <tr>
          <!-- Lebar tetap: kolom centang tidak boleh ikut melar mengikuti
               kolom lain, dan padding kirinya menyamai sel di sebelahnya. -->
          <th v-if="selectable" class="w-10 py-3 pl-4 pr-1 align-middle">
            <input
              ref="headerCheckbox"
              type="checkbox"
              :class="checkboxClass"
              :checked="allVisibleSelected"
              :disabled="data.length === 0"
              aria-label="Pilih semua baris yang tampil"
              @change="toggleAllVisible"
            >
          </th>
          <th v-for="col in columns" :key="col.key" :class="[cellPadding, alignClass(col), col.key === actionColumn?.key ? 'sticky right-0 z-20 border-l border-line bg-surface-sunken shadow-[-8px_0_12px_-12px_rgba(15,23,42,.35)]' : '']">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line text-slate-700">
        <tr
          v-for="(row, idx) in data"
          :key="idx"
          class="transition-colors hover:bg-surface-alt/70"
          :class="selectable && isSelected(row) ? 'bg-primary-soft/20' : ''"
        >
          <td v-if="selectable" class="w-10 py-3 pl-4 pr-1 align-middle">
            <input
              type="checkbox"
              :class="checkboxClass"
              :checked="isSelected(row)"
              :aria-label="rowLabel(row)"
              @change="toggleRow(row, ($event.target as HTMLInputElement).checked)"
            >
          </td>
          <td v-for="col in columns" :key="col.key" :class="[cellPadding, alignClass(col), col.key === actionColumn?.key ? 'sticky right-0 z-10 border-l border-line bg-surface shadow-[-8px_0_12px_-12px_rgba(15,23,42,.25)]' : '']">
            <slot :name="`cell(${col.key})`" :item="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
