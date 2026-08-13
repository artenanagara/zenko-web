<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Masuk dengan Google' })
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-3 rounded-xs border border-line bg-surface px-6 py-3.5 font-semibold transition-[background,border-color] duration-200 ease-smooth hover:border-hairline-strong hover:bg-surface-alt"
  >
    <!-- Google's brand mark must keep its own colours, so no currentColor. -->
    <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.74 2.98-4.3 2.98-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.42 13.92a6 6 0 0 1 0-3.84V7.5H3.06a10 10 0 0 0 0 9l3.36-2.58Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2A10 10 0 0 0 3.06 7.5l3.36 2.58C7.2 7.73 9.4 5.98 12 5.98Z" />
    </svg>
    {{ label }}
  </button>
</template>
