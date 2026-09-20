<script setup lang="ts">
export interface PackageSectionNavItem {
  id: string
  label: string
  meta?: string
}

const props = withDefaults(defineProps<{
  sections: PackageSectionNavItem[]
  ready?: boolean
}>(), {
  ready: true,
})

const nav = useTemplateRef<HTMLElement>('nav')
const activeId = ref(props.sections[0]?.id ?? '')
const headerHeight = ref(64)
const navHeight = ref(56)
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let scrollFrame = 0
let hashScrollFrame = 0

function measureOffsets() {
  const header = document.querySelector<HTMLElement>('header.sticky')
  headerHeight.value = header?.getBoundingClientRect().height ?? 64
  navHeight.value = nav.value?.getBoundingClientRect().height ?? 56
  nav.value?.style.setProperty('--package-header-height', `${headerHeight.value}px`)
  nav.value?.style.setProperty('--package-nav-height', `${navHeight.value}px`)
}

function sectionsInDocument() {
  return props.sections
    .map(section => document.getElementById(section.id))
    .filter((section): section is HTMLElement => section !== null)
}

function syncActiveFromScroll() {
  // Give the heading a small visual lead over the sticky bar. Without this
  // allowance, sections whose h2 has a top margin can remain marked as the
  // previous section for one frame after a hash click.
  const threshold = headerHeight.value + navHeight.value + 48
  const passed = sectionsInDocument().filter(section => section.getBoundingClientRect().top <= threshold)
  const next = passed.at(-1)?.id ?? props.sections[0]?.id
  if (next) activeId.value = next
}

function scheduleScrollSync() {
  cancelAnimationFrame(scrollFrame)
  scrollFrame = requestAnimationFrame(syncActiveFromScroll)
}

function updateHash(id: string) {
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`)
}

function scrollToSection(id: string, event: MouseEvent) {
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  activeId.value = id
  updateHash(id)
  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

function revealActiveLabel() {
  const link = nav.value?.querySelector<HTMLElement>(`a[href="#${activeId.value}"]`)
  link?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
}

function scrollToHash() {
  if (!import.meta.client || !props.ready) return
  const id = window.location.hash.slice(1)
  if (!props.sections.some(section => section.id === id)) return
  const target = document.getElementById(id)
  if (!target) return
  activeId.value = id
  cancelAnimationFrame(hashScrollFrame)
  hashScrollFrame = requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
    revealActiveLabel()
  })
}

watch(activeId, revealActiveLabel)
watch(() => props.ready, scrollToHash)

onMounted(() => {
  measureOffsets()
  resizeObserver = new ResizeObserver(() => {
    measureOffsets()
    scheduleScrollSync()
  })
  const header = document.querySelector<HTMLElement>('header.sticky')
  if (header) resizeObserver.observe(header)
  if (nav.value) resizeObserver.observe(nav.value)

  observer = new IntersectionObserver(() => scheduleScrollSync(), {
    rootMargin: `-${headerHeight.value + navHeight.value}px 0px -55% 0px`,
    threshold: [0, 1],
  })
  sectionsInDocument().forEach(section => observer?.observe(section))
  window.addEventListener('scroll', scheduleScrollSync, { passive: true })
  window.addEventListener('hashchange', scrollToHash)
  scrollToHash()
  scheduleScrollSync()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', scheduleScrollSync)
  window.removeEventListener('hashchange', scrollToHash)
  cancelAnimationFrame(scrollFrame)
  cancelAnimationFrame(hashScrollFrame)
})
</script>

<template>
  <nav
    ref="nav"
    aria-label="Bagian halaman paket"
    class="package-section-nav sticky z-30 -mx-1 border-b border-line bg-surface/95 backdrop-blur-md"
  >
    <div class="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div class="flex min-w-max gap-6 px-1" role="presentation">
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
          class="inline-flex min-h-14 shrink-0 items-center gap-2 border-b-2 border-transparent text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink focus-visible:border-primary focus-visible:text-primary focus-visible:outline-none"
          :class="activeId === section.id ? 'border-primary text-primary' : ''"
          :aria-current="activeId === section.id ? 'true' : undefined"
          @click="scrollToSection(section.id, $event)"
        >
          <span>{{ section.label }}</span>
          <span v-if="section.meta" class="text-[0.78rem] font-medium text-faint">· {{ section.meta }}</span>
        </a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.package-section-nav {
  top: var(--package-header-height, 4rem);
}
</style>
