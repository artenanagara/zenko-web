<script setup lang="ts">
/**
 * Surface for a table or list. `id` is the sidebar's anchor target.
 *
 * `title` is optional: on a page whose panel is its only content, the page
 * header already names the thing, and a panel heading restating it just
 * stacks two headers. Such a panel renders as a plain card — the header
 * appears only when there is a title or an action to put in it.
 */
defineProps<{
  title?: string
  description?: string
  id?: string
}>()
</script>

<template>
  <!-- scroll-mt clears the dashboard's sticky navbar, so jumping to an
       anchor (e.g. /dashboard/admin#pengajuan) never hides the heading.
       Card treatment (rounded-md/border-line/shadow-xs with one clean white
       surface) mirrors the design system's AppPanel so this reads as the
       same surface — AppPanel itself can't be reused directly here since
       it has no description line and no always-visible action slot.
       Deliberately NOT overflow-hidden on the section (unlike AppPanel):
       this card routinely hosts dropdowns/popovers (AppSelect,
       AppDropdownMenu, RteDropdown, …) that position themselves absolutely
       and extend past the card's own bounds — clipping the section would
       clip those too. The header keeps its own top radius so the card remains
       visually continuous without adding a tinted header block. -->
  <!-- min-w-0: panel ini hampir selalu jadi anak dari `grid gap-6` di halaman
       dashboard, dan grid item default-nya `min-width:auto` — lebar minimum
       intrinsik tabel di dalamnya ikut memaksa lebar track, sehingga seluruh
       kolom konten melar melewati viewport dan yang menggulung ke samping
       adalah halamannya, bukan tabelnya. Terlihat di iPad (768px), di mana
       rail sidebar sudah tampil tapi ruang sisanya sempit. -->
  <section :id="id" class="min-w-0 scroll-mt-20 rounded-md border border-line bg-surface shadow-xs">
    <header
      v-if="title || $slots.action"
      class="flex flex-wrap items-start justify-between gap-3 rounded-t-md border-b border-line px-5 py-4 md:px-6"
    >
      <div v-if="title">
        <h2 class="text-[1.05rem] font-bold tracking-[-0.03em] text-ink">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-[0.86rem] text-muted">{{ description }}</p>
      </div>
      <slot name="action" />
    </header>

    <div class="px-5 py-4 md:px-6 md:py-5">
      <slot />
    </div>
  </section>
</template>
