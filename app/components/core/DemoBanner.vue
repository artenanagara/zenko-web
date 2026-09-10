<script setup lang="ts">
/**
 * A standing reminder, on every page of demo.zenkoedu.id, that this is not the
 * real thing and that the data belongs to this browser alone.
 *
 * It is fixed to the bottom rather than the top: a top bar pushes every page's
 * layout down and quietly breaks the sticky headers the tryout room and the
 * dashboards rely on. It hides itself inside the exam room, where anything
 * floating over the paper is a distraction the student did not ask for.
 */
const { enabled } = useDemo()
const route = useRoute()

const hidden = computed(() => route.path.includes('/kerjakan'))
const dismissed = ref(false)
</script>

<template>
  <div
    v-if="enabled && !hidden && !dismissed"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-amber-300 bg-amber-50/95 backdrop-blur"
  >
    <div class="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-2.5">
      <AppIcon name="flask" :size="18" class="shrink-0 text-amber-700" />
      <p class="min-w-0 flex-1 text-xs leading-relaxed text-amber-900 sm:text-sm">
        <span class="font-semibold">Ini lingkungan demo.</span>
        Datanya hanya milik perangkat ini dan bisa direset kapan saja.
        <NuxtLink to="/demo" class="font-semibold underline underline-offset-2">
          Lihat akun demo
        </NuxtLink>
      </p>
      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-amber-800 transition hover:bg-amber-100"
        aria-label="Sembunyikan pemberitahuan demo"
        @click="dismissed = true"
      >
        <AppIcon name="x" :size="16" />
      </button>
    </div>
  </div>
</template>
