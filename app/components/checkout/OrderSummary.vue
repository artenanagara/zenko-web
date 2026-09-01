<script setup lang="ts">
import type { PackageDetail } from '#shared/types/catalog'

const props = defineProps<{ item: PackageDetail }>()

/**
 * Prices come straight from the catalogue and are shown, not trusted: the
 * server recomputes the amount from the slug when the order is created. A
 * number rendered here is for the buyer's eyes only.
 */
const discount = computed(() => Math.max(0, props.item.priceOriginal - props.item.price))
</script>

<template>
  <div class="rounded-lg border border-hairline bg-surface p-6 shadow-float">
    <h2 class="font-bold tracking-[-0.02em]">Ringkasan pesanan</h2>

    <div class="mt-5 flex gap-4">
      <AppThumbnail
        :src="item.thumbnailUrl"
        :alt="`Thumbnail paket ${item.title}`"
        class="aspect-16/10 w-24 shrink-0 rounded-sm bg-[#edf3ff] object-cover"
      />
      <div class="min-w-0">
        <p class="clamp-2 leading-[1.35] font-bold tracking-[-0.02em]">{{ item.title }}</p>
        <p class="mt-1.5 text-[0.86rem] text-muted">{{ item.author.name }}</p>
        <p class="mt-0.5 text-[0.78rem] font-bold tracking-[0.1em] text-faint uppercase">
          {{ item.category }}
        </p>
      </div>
    </div>

    <dl class="mt-6 grid gap-3 border-t border-line pt-6 text-[0.94rem]">
      <div class="flex items-center justify-between gap-4">
        <dt class="text-muted">Harga paket</dt>
        <dd>{{ formatRupiah(item.priceOriginal) }}</dd>
      </div>
      <div v-if="discount > 0" class="flex items-center justify-between gap-4">
        <dt class="text-muted">Diskon</dt>
        <dd class="font-semibold text-success-ink">−{{ formatRupiah(discount) }}</dd>
      </div>
    </dl>

    <div class="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
      <span class="font-semibold">Total</span>
      <span v-if="item.price > 0" class="text-[1.6rem] font-extrabold tracking-[-0.04em]">
        {{ formatRupiah(item.price) }}
      </span>
      <DashboardBadge v-else tone="success">Gratis</DashboardBadge>
    </div>

    <div class="mt-6">
      <slot name="action" />
    </div>

    <p class="mt-5 flex items-start gap-2.5 border-t border-line pt-5 text-[0.85rem] text-muted">
      <IconSeal class="mt-px h-5 w-5 shrink-0" />
      Pembayaran diproses lewat penyedia pembayaran berlisensi. Zenko tidak
      menyimpan data kartu kamu.
    </p>
  </div>
</template>
