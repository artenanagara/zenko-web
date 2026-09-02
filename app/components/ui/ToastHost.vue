<script setup lang="ts">
/**
 * The one place toasts are rendered. Mounted once in app.vue, next to
 * ConfirmDialog, and driven entirely by useToast() — no page mounts its own.
 *
 * Teleported to <body> so a toast raised from inside AppModal escapes the
 * dialog's stacking context, and sits at z-60 so it lands above the modal's
 * own z-50 backdrop rather than behind it.
 *
 * Anchored top-right: the wizard and the tryout screens both pin a footer to
 * the bottom of the viewport, and a bottom-anchored toast landed on top of
 * the very buttons whose outcome it was reporting.
 */
const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <!-- pointer-events-none on the rail, auto on each toast: the strip spans
         the corner of the viewport, and without this it would swallow clicks
         meant for the page underneath it. -->
    <div
      class="pointer-events-none fixed inset-x-4 top-4 z-60 flex flex-col items-end gap-2 sm:inset-x-auto sm:top-6 sm:right-6"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0 sm:translate-x-3 sm:translate-y-0"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition duration-150 ease-in absolute"
        leave-from-class="opacity-100"
        leave-to-class="-translate-y-1 opacity-0"
        move-class="transition duration-200 ease-smooth"
      >
        <div v-for="toast in toasts" :key="toast.id" class="pointer-events-auto w-full sm:w-auto">
          <AppFlag
            :appearance="toast.appearance"
            :title="toast.title"
            :description="toast.description"
            @dismiss="dismiss(toast.id)"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
