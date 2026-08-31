<script setup lang="ts">
import type { TutorProductSummary } from '#shared/types/tutor-product'

/**
 * Langkah Isi untuk bundle: centang produk single milik sendiri yang berstatus
 * Tayang, lalu atur urutannya. Model = daftar productId terurut; wizard yang
 * menyimpannya lewat PATCH {items} saat pindah langkah.
 */
const props = defineProps<{
  eligible: TutorProductSummary[]
  pending: boolean
  error: string
}>()

const selected = defineModel<string[]>({ required: true })

const titleById = computed(() => {
  const map = new Map<string, string>()
  props.eligible.forEach(product => map.set(product.id, product.title))
  return map
})

const priceById = computed(() => {
  const map = new Map<string, number>()
  props.eligible.forEach(product => map.set(product.id, product.price))
  return map
})

function isSelected(id: string) {
  return selected.value.includes(id)
}

function toggle(id: string) {
  selected.value = isSelected(id)
    ? selected.value.filter(entry => entry !== id)
    : [...selected.value, id]
}

function move(index: number, delta: -1 | 1) {
  const target = index + delta
  if (target < 0 || target >= selected.value.length) return
  const next = [...selected.value]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved!)
  selected.value = next
}

const total = computed(() =>
  selected.value.reduce((sum, id) => sum + (priceById.value.get(id) ?? 0), 0),
)
</script>

<template>
  <DashboardPanel
    title="Isi bundling"
    description="Pilih minimal 2 produk try-out tunggal milikmu yang sudah tayang."
  >
    <p v-if="pending" class="py-6 text-center text-muted">Memuat produkmu...</p>
    <AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage>

    <AppEmptyState
      v-else-if="eligible.length === 0"
      title="Belum ada produk yang bisa dibundel"
      description="Bundling berisi produk try-out tunggal berstatus Tayang. Terbitkan minimal dua produk tunggal dulu, lalu kembali ke sini."
    />

    <div v-else class="grid gap-6">
      <!-- Urutan anggota terpilih -->
      <div v-if="selected.length">
        <h3 class="text-[0.9rem] font-semibold">Urutan dalam bundling</h3>
        <ol class="mt-2.5 grid gap-2">
          <li
            v-for="(id, index) in selected"
            :key="id"
            class="flex items-center gap-3 rounded-sm border border-hairline bg-surface px-3.5 py-2.5"
          >
            <span class="w-6 shrink-0 text-[0.82rem] font-bold text-faint tabular-nums">{{ index + 1 }}.</span>
            <span class="min-w-0 flex-1 truncate text-[0.9rem] font-semibold tracking-[-0.02em]">
              {{ titleById.get(id) ?? 'Produk tidak lagi memenuhi syarat' }}
            </span>
            <span class="shrink-0 text-[0.86rem] text-muted tabular-nums">
              {{ formatRupiah(priceById.get(id) ?? 0) }}
            </span>
            <span class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="rounded-xs p-1.5 text-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-35"
                :disabled="index === 0"
                :aria-label="`Naikkan urutan ${titleById.get(id) ?? ''}`"
                @click="move(index, -1)"
              >
                <IconChevron class="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                class="rounded-xs p-1.5 text-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-35"
                :disabled="index === selected.length - 1"
                :aria-label="`Turunkan urutan ${titleById.get(id) ?? ''}`"
                @click="move(index, 1)"
              >
                <IconChevron class="h-4 w-4" />
              </button>
            </span>
          </li>
        </ol>
        <p class="mt-2.5 text-[0.86rem] text-muted">
          Total harga satuan: <span class="font-semibold text-ink tabular-nums">{{ formatRupiah(total) }}</span>. Kamu disarankan memasang harga bundling lebih hemat dari total ini.
        </p>
      </div>

      <!-- Daftar produk yang memenuhi syarat -->
      <div>
        <h3 class="text-[0.9rem] font-semibold">Produk yang bisa dibundel</h3>
        <ul class="mt-2.5 grid gap-2">
          <li v-for="product in eligible" :key="product.id">
            <label
              class="flex cursor-pointer items-center gap-3 rounded-sm border px-3.5 py-2.5 transition-colors"
              :class="isSelected(product.id)
                ? 'border-primary/35 bg-primary-soft/40'
                : 'border-hairline bg-surface hover:border-primary/20'"
            >
              <input
                type="checkbox"
                class="h-4 w-4 shrink-0 rounded-[4px] accent-primary"
                :checked="isSelected(product.id)"
                @change="toggle(product.id)"
              >
              <span class="min-w-0 flex-1 truncate text-[0.9rem] font-semibold tracking-[-0.02em]">
                {{ product.title }}
              </span>
              <span class="shrink-0 text-[0.86rem] text-muted">
                {{ product.subcategory ? `${product.category} · ${product.subcategory}` : product.category }}
              </span>
              <span class="shrink-0 text-[0.86rem] text-muted tabular-nums">{{ formatRupiah(product.price) }}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </DashboardPanel>
</template>
