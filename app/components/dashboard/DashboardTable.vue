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
  }>(),
  { primaryKey: undefined, actionKey: undefined, compact: false },
)

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
      class="rounded-xl border border-line bg-surface p-4 shadow-xs"
    >
      <div v-if="primary" class="text-[0.92rem]">
        <slot :name="`cell(${primary.key})`" :item="row" :value="row[primary.key]">
          <span class="font-semibold text-ink">{{ row[primary.key] }}</span>
        </slot>
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
    <table class="w-full text-left text-xs">
      <thead class="border-b border-line bg-surface-sunken font-bold tracking-wider text-ink uppercase">
        <tr>
          <th v-for="col in columns" :key="col.key" :class="[cellPadding, alignClass(col)]">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line text-slate-700">
        <tr v-for="(row, idx) in data" :key="idx" class="transition-colors hover:bg-surface-alt/70">
          <td v-for="col in columns" :key="col.key" :class="[cellPadding, alignClass(col)]">
            <slot :name="`cell(${col.key})`" :item="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
