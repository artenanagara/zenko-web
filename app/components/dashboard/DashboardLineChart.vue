<script setup lang="ts">
/**
 * Tren satu deret nilai per hari, sebagai garis.
 *
 * Menggantikan chart batang bertumpuk per produk. Dua alasan: batangnya
 * ditumpuk per produk, jadi tiap produk baru menambah satu warna dan satu
 * baris legenda sampai legendanya lebih tinggi dari chart-nya sendiri —
 * padahal pertanyaan yang dijawab panel ini cuma "pendapatanku naik atau
 * turun?", bukan "produk mana yang menyumbang berapa di tanggal berapa"
 * (itu pekerjaan tabel Penjualan). Dan chart lamanya digambar dengan
 * `preserveAspectRatio="none"` pada tinggi tetap `h-44`, jadi viewBox 600×176
 * diregangkan ke lebar panel — angka dan tanggalnya ikut memipih.
 *
 * Di sini viewBox dibiarkan menjaga rasionya (tanpa `preserveAspectRatio`),
 * jadi lebar berapa pun menghasilkan gambar yang sebangun: teksnya tetap
 * berbentuk normal.
 *
 * Hand-rolled in SVG, no charting dependency — same approach as the rest of
 * the dashboard.
 */

export interface LinePoint {
  key: string
  label: string
  value: number
}

const props = defineProps<{
  points: LinePoint[]
  /** Dipakai tooltip dan tabel sr-only — bentuk penuh, mis. "Rp1.250.000". */
  valueFormatter: (value: number) => string
  /** Bentuk pendek untuk label sumbu; default mengikuti valueFormatter. */
  axisFormatter?: (value: number) => string
  ariaLabel: string
}>()

const WIDTH = 720
const HEIGHT = 260
const PAD_TOP = 18
const PAD_BOTTOM = 34
/** Ruang kiri menampung label sumbu Y yang sejajar garis bantunya. */
const PAD_LEFT = 68
/** Cukup lebar untuk setengah label tanggal terakhir, yang rata-tengah di titik terakhir. */
const PAD_RIGHT = 34

const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
const baseline = PAD_TOP + plotHeight

const axisLabel = computed(() => props.axisFormatter ?? props.valueFormatter)

/**
 * Batas atas dibulatkan ke angka "bulat" terdekat (1/2/5 × 10ⁿ) supaya ketiga
 * garis bantunya jatuh di nilai yang enak dibaca, bukan di 1/2 dan 1/1 dari
 * penjualan tertinggi yang kebetulan terjadi.
 */
const maxValue = computed(() => {
  const peak = Math.max(0, ...props.points.map(point => point.value))
  if (peak <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(peak))
  const normalized = peak / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
})

/** Tiga garis bantu: 0, tengah, puncak. */
const gridLines = computed(() =>
  [0, 0.5, 1].map(ratio => ({
    ratio,
    value: maxValue.value * ratio,
    y: baseline - plotHeight * ratio,
  })),
)

function xAt(index: number): number {
  const count = props.points.length
  // Satu titik tidak punya jarak untuk dibagi — taruh di tengah plot.
  if (count <= 1) return PAD_LEFT + plotWidth / 2
  return PAD_LEFT + (plotWidth / (count - 1)) * index
}

function yAt(value: number): number {
  return baseline - (value / maxValue.value) * plotHeight
}

const linePath = computed(() =>
  props.points.map((point, index) => `${index === 0 ? 'M' : 'L'}${xAt(index)} ${yAt(point.value)}`).join(' '),
)

/** Area di bawah garis — garis yang sama, ditutup ke baseline. */
const areaPath = computed(() => {
  if (props.points.length === 0) return ''
  const last = props.points.length - 1
  return `${linePath.value} L${xAt(last)} ${baseline} L${xAt(0)} ${baseline} Z`
})

/**
 * Titik yang diberi penanda bulat: hanya hari yang benar-benar ada
 * penjualannya. Deret 30 hari yang kebanyakan nol akan penuh titik di
 * baseline kalau semuanya digambar.
 */
const markers = computed(() =>
  props.points
    .map((point, index) => ({ ...point, index }))
    .filter(point => point.value > 0),
)

/** Puncak deret — satu-satunya titik yang diberi label angka. */
const peakMarker = computed(() => {
  if (markers.value.length === 0) return null
  return markers.value.reduce((best, point) => (point.value > best.value ? point : best))
})

// Paling banyak ~6 label tanggal, berjarak rata, supaya 30 hari tidak bertumpuk.
const tickIndexes = computed(() => {
  const count = props.points.length
  if (count <= 6) return props.points.map((_, index) => index)

  const step = Math.ceil((count - 1) / 5)
  const indexes: number[] = []
  for (let index = 0; index < count; index += step) indexes.push(index)
  if (indexes[indexes.length - 1] !== count - 1) indexes.push(count - 1)
  return indexes
})

/** Lebar pita tak terlihat pembawa tooltip `<title>` tiap titik. */
const hitWidth = computed(() => (props.points.length <= 1 ? plotWidth : plotWidth / (props.points.length - 1)))
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="h-auto w-full" aria-hidden="true">
      <!-- Garis bantu + label sumbu Y. -->
      <g v-for="line in gridLines" :key="line.ratio">
        <line
          :x1="PAD_LEFT"
          :x2="WIDTH - PAD_RIGHT"
          :y1="line.y"
          :y2="line.y"
          :class="line.ratio === 0 ? 'stroke-hairline-strong' : 'stroke-hairline'"
          stroke-width="1"
        />
        <text
          :x="PAD_LEFT - 10"
          :y="line.y + 4"
          text-anchor="end"
          class="fill-faint text-[11px] tabular-nums"
        >
          {{ axisLabel(line.value) }}
        </text>
      </g>

      <path v-if="areaPath" :d="areaPath" fill="var(--color-primary)" opacity="0.08" />
      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        stroke="var(--color-primary)"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <circle
        v-for="marker in markers"
        :key="marker.key"
        :cx="xAt(marker.index)"
        :cy="yAt(marker.value)"
        r="4"
        fill="var(--color-surface)"
        stroke="var(--color-primary)"
        stroke-width="2.5"
      />

      <!-- Angka puncak, supaya skalanya terbaca tanpa menghitung dari sumbu.
           Bentuk penuh, bukan bentuk pendek sumbu: pembulatan sumbu boleh
           menyebut Rp1,25jt sebagai "Rp1,3jt", dan angka yang ditempelkan
           persis di titiknya tidak boleh meleset. -->
      <text
        v-if="peakMarker"
        :x="xAt(peakMarker.index)"
        :y="yAt(peakMarker.value) - 12"
        text-anchor="middle"
        class="fill-ink text-[11px] font-bold tabular-nums"
      >
        {{ valueFormatter(peakMarker.value) }}
      </text>

      <!-- Tooltip per hari: pita transparan selebar satu langkah. -->
      <rect
        v-for="(point, index) in points"
        :key="`hit-${point.key}`"
        :x="xAt(index) - hitWidth / 2"
        :y="PAD_TOP"
        :width="hitWidth"
        :height="plotHeight"
        fill="transparent"
      >
        <title>{{ point.label }}: {{ valueFormatter(point.value) }}</title>
      </rect>

      <text
        v-for="index in tickIndexes"
        :key="`tick-${points[index]?.key}`"
        :x="xAt(index)"
        :y="HEIGHT - 12"
        text-anchor="middle"
        class="fill-faint text-[11px]"
      >
        {{ points[index]?.label }}
      </text>
    </svg>

    <table class="sr-only">
      <caption>{{ ariaLabel }}</caption>
      <thead>
        <tr>
          <th scope="col">Tanggal</th>
          <th scope="col">Pendapatan</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="point in points" :key="point.key">
          <th scope="row">{{ point.label }}</th>
          <td>{{ valueFormatter(point.value) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
