<script setup lang="ts">
/**
 * App-level override kept API-compatible with the design-system component.
 * It lets the application consume the actions slot before the published
 * design-system package is upgraded everywhere.
 */
withDefaults(
  defineProps<{
    appearance?: 'information' | 'warning' | 'error' | 'success' | 'discovery'
    title?: string
  }>(),
  {
    appearance: 'information',
  },
)

const appearances = {
  information: { style: 'border-blue-200 bg-blue-50/50 text-slate-800', icon: 'info', iconColor: '#2F6FEB' },
  warning: { style: 'border-warning/30 bg-warning-soft/50 text-slate-800', icon: 'warning', iconColor: '#D8730E' },
  error: { style: 'border-danger/30 bg-danger-soft/50 text-slate-800', icon: 'x-circle', iconColor: '#C42132' },
  success: { style: 'border-emerald-200 bg-emerald-50/50 text-slate-800', icon: 'check-circle', iconColor: '#16A34A' },
  discovery: { style: 'border-purple-200 bg-purple-50/50 text-slate-800', icon: 'sparkle', iconColor: '#9333EA' },
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-3 rounded-md border p-4 transition-colors"
    :class="appearances[appearance].style"
  >
    <AppIcon
      :name="appearances[appearance].icon"
      :color="appearances[appearance].iconColor"
      :size="16"
      weight="bold"
      class="mt-0.5 shrink-0"
      aria-hidden="true"
    />

    <div class="min-w-0 flex-1 text-xs leading-relaxed text-muted">
      <h4 v-if="title" class="mb-1 font-bold text-ink">{{ title }}</h4>
      <div>
        <slot />
      </div>
    </div>

    <div v-if="$slots.actions" class="w-full shrink-0 pl-7 sm:w-auto sm:pl-0">
      <slot name="actions" />
    </div>
  </div>
</template>
