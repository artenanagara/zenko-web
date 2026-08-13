<script setup lang="ts">
import type { FacetOption } from '~/composables/usePackageFilters'

/**
 * One collapsible block of the filter sidebar.
 *
 * The model's shape picks the control: an array means several rows can be on at
 * once (checkboxes), a string means exactly one is (radios). Nothing else about
 * the group changes, so both live in one component.
 */
const model = defineModel<string[] | string>({ required: true })

defineProps<{
  title: string
  options: FacetOption[]
  /** Groups the radios; ignored for checkboxes. */
  name: string
}>()

const open = ref(true)
const listId = useId()

const multiple = computed(() => Array.isArray(model.value))

function isSelected(value: string): boolean {
  return Array.isArray(model.value) ? model.value.includes(value) : model.value === value
}

function toggle(value: string) {
  if (!Array.isArray(model.value)) {
    model.value = value
    return
  }

  model.value = model.value.includes(value)
    ? model.value.filter((item) => item !== value)
    : [...model.value, value]
}

/**
 * An empty checkbox row leads nowhere, so it is taken out of reach — but a
 * selected one stays clickable, otherwise you could not undo it. Radios are
 * never disabled: losing the selected row would leave the group with none.
 */
function isDisabled(option: FacetOption): boolean {
  return multiple.value && option.count === 0 && !isSelected(option.value)
}
</script>

<template>
  <fieldset class="border-t border-hairline py-4">
    <legend class="sr-only">{{ title }}</legend>

    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 py-1 text-left"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open = !open"
    >
      <span class="text-[0.72rem] font-bold tracking-[0.14em] text-faint uppercase">
        {{ title }}
      </span>
      <IconChevron
        class="h-4 w-4 shrink-0 text-faint transition-transform duration-200 ease-smooth"
        :class="open ? '' : '-rotate-90'"
      />
    </button>

    <div v-show="open" :id="listId" class="mt-2 grid">
      <label
        v-for="option in options"
        :key="option.value"
        class="-mx-2 flex items-center gap-2.5 rounded-xs px-2 py-1.5 transition-colors duration-200"
        :class="
          isDisabled(option)
            ? 'cursor-not-allowed opacity-45'
            : 'cursor-pointer hover:bg-surface-alt'
        "
      >
        <input
          :type="multiple ? 'checkbox' : 'radio'"
          :name="name"
          :value="option.value"
          :checked="isSelected(option.value)"
          :disabled="isDisabled(option)"
          class="h-4 w-4 shrink-0 accent-primary"
          @change="toggle(option.value)"
        >
        <span
          class="min-w-0 flex-1 truncate text-[0.92rem]"
          :class="isSelected(option.value) ? 'font-semibold text-ink' : 'text-muted'"
        >{{ option.label }}</span>
        <span class="shrink-0 text-[0.8rem] tabular-nums text-faint">{{ option.count }}</span>
      </label>
    </div>
  </fieldset>
</template>
