<script setup lang="ts">
/**
 * Daily revenue, stacked per product — combines what used to be two
 * separate charts (a daily line + a per-product bar) into one: each day's
 * bar is split into colored segments so the trend and the per-product
 * contribution read together.
 *
 * Hand-rolled in SVG, no charting dependency — same approach as the rest
 * of the dashboard. Series colors come from var(--color-chart-N) via
 * inline `style`, not Tailwind utility classes, since the series count is
 * data-driven and Tailwind can't statically discover a dynamically-built
 * `fill-chart-N` class name.
 */

export interface StackedBarSeries {
  key: string
  label: string
  /** CSS color value, e.g. "var(--color-chart-1)" or "var(--color-faint)". */
  color: string
}

export interface StackedBarPoint {
  key: string
  label: string
  /** One entry per series, in the same order as `series`. */
  segments: { key: string, value: number }[]
}

const props = defineProps<{
  points: StackedBarPoint[]
  series: StackedBarSeries[]
  valueFormatter: (value: number) => string
  ariaLabel: string
}>()

const WIDTH = 600
const HEIGHT = 176
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PAD_X = 4

const plotWidth = WIDTH - PAD_X * 2
const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
const baseline = PAD_TOP + plotHeight

function pointTotal(point: StackedBarPoint): number {
  return point.segments.reduce((sum, segment) => sum + segment.value, 0)
}

const maxValue = computed(() => Math.max(1, ...props.points.map(pointTotal)))

function slotWidth(): number {
  return props.points.length === 0 ? plotWidth : plotWidth / props.points.length
}

function xCenter(index: number): number {
  return PAD_X + slotWidth() * (index + 0.5)
}

function barWidth(): number {
  return Math.min(14, slotWidth() * 0.7)
}

interface SegmentRect {
  key: string
  color: string
  y: number
  height: number
}

function segmentRects(point: StackedBarPoint): SegmentRect[] {
  let cumulative = 0
  return point.segments.map((segment) => {
    const height = (segment.value / maxValue.value) * plotHeight
    const y = baseline - cumulative - height
    cumulative += height
    const series = props.series.find(s => s.key === segment.key)
    return { key: segment.key, color: series?.color ?? 'var(--color-faint)', y, height }
  })
}

// At most ~6 x-axis labels, evenly spaced, so 30 daily bars never collide.
const tickIndexes = computed(() => {
  const count = props.points.length
  if (count <= 6) return props.points.map((_, index) => index)

  const step = Math.ceil((count - 1) / 5)
  const indexes: number[] = []
  for (let index = 0; index < count; index += step) indexes.push(index)
  if (indexes[indexes.length - 1] !== count - 1) indexes.push(count - 1)
  return indexes
})
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      preserveAspectRatio="none"
      class="h-44 w-full"
      aria-hidden="true"
    >
      <line :x1="PAD_X" :x2="WIDTH - PAD_X" :y1="baseline" :y2="baseline" class="stroke-hairline-strong" stroke-width="1" />

      <text :x="PAD_X" :y="PAD_TOP - 4" class="fill-faint text-[10px]">{{ valueFormatter(maxValue) }}</text>

      <g v-for="(point, index) in points" :key="point.key">
        <title>{{ point.label }}: {{ valueFormatter(pointTotal(point)) }}</title>
        <rect
          v-for="segment in segmentRects(point)"
          :key="segment.key"
          :x="xCenter(index) - barWidth() / 2"
          :y="segment.y"
          :width="barWidth()"
          :height="Math.max(segment.height, 0)"
          :style="{ fill: segment.color }"
        />
      </g>

      <text
        v-for="index in tickIndexes"
        :key="`tick-${points[index]?.key}`"
        :x="xCenter(index)"
        :y="HEIGHT - 10"
        text-anchor="middle"
        class="fill-faint text-[10px]"
      >
        {{ points[index]?.label }}
      </text>
    </svg>

    <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.78rem] text-muted">
      <li v-for="item in series" :key="item.key" class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-xs" :style="{ backgroundColor: item.color }" />
        {{ item.label }}
      </li>
    </ul>

    <table class="sr-only">
      <caption>{{ ariaLabel }}</caption>
      <thead>
        <tr>
          <th scope="col">Tanggal</th>
          <th v-for="item in series" :key="item.key" scope="col">{{ item.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="point in points" :key="point.key">
          <th scope="row">{{ point.label }}</th>
          <td v-for="segment in point.segments" :key="segment.key">{{ valueFormatter(segment.value) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
