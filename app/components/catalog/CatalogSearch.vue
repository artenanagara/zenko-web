<script setup lang="ts">
/**
 * Search field in the catalogue toolbar. Filtering is live, so there is no
 * submit button — the form element exists only so a mobile keyboard shows
 * "search" and Enter dismisses it.
 */
const model = defineModel<string>({ required: true })

const input = useTemplateRef('input')

function clear() {
  model.value = ''
  input.value?.focus()
}
</script>

<template>
  <form
    class="flex min-h-11 items-center gap-2.5 rounded-xs border border-hairline-strong bg-surface pr-1.5 pl-3.5 shadow-xs transition-[border-color,box-shadow] duration-200 ease-smooth focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(47,111,235,0.1),var(--shadow-xs)]"
    role="search"
    @submit.prevent
  >
    <IconSearch class="h-4.5 w-4.5 shrink-0 stroke-placeholder stroke-[1.8]" />

    <label class="sr-only" for="search-input">Cari paket try out</label>
    <!-- id is what the header's search button focuses; keep it unique per page. -->
    <input
      id="search-input"
      ref="input"
      v-model="model"
      type="search"
      name="q"
      autocomplete="off"
      placeholder="Cari paket atau tutor..."
      class="w-full min-w-0 flex-1 border-0 bg-transparent py-2 text-[0.95rem] placeholder:text-placeholder focus:outline-none [&::-webkit-search-cancel-button]:hidden"
    >

    <button
      v-if="model"
      type="button"
      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xs text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink"
      aria-label="Hapus pencarian"
      @click="clear"
    >
      <IconClose class="h-4 w-4" />
    </button>
  </form>
</template>
