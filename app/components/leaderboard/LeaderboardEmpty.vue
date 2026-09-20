<script setup lang="ts">
withDefaults(defineProps<{ title?: string, description?: string }>(), {
  title: 'Podiumnya masih kosong',
  description: 'Jadilah tiga peserta pertama yang masuk leaderboard paket ini.',
})
</script>

<template>
  <section class="leaderboard-empty" role="status">
    <img src="/brand/mascot/think.webp" alt="Maskot Zenko sedang berpikir" class="leaderboard-empty-mascot">
    <div>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </section>
</template>

<style scoped>
.leaderboard-empty { display: flex; align-items: center; justify-content: center; gap: 1.5rem; border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); background: var(--color-surface-alt); padding: 1.75rem 1.25rem; }
.leaderboard-empty-mascot { display: block; height: 9rem; width: auto; }
.leaderboard-empty h3 { margin: 0 0 .35rem; font-size: 1.05rem; font-weight: 800; }
.leaderboard-empty p { max-width: 22rem; margin: 0; color: var(--color-muted); font-size: .88rem; }
@media (max-width: 520px) { .leaderboard-empty { flex-direction: column; text-align: center; } .leaderboard-empty-mascot { height: 7.5rem; } }
</style>
