<script setup lang="ts">
import type { LeaderboardPeriod } from '~/composables/useLeaderboard'

defineProps<{
  me: { rank: number, score: number, participants?: number } | null
  period: LeaderboardPeriod
  allTimeHref?: string
  maxScore?: number
}>()
</script>

<template>
  <aside v-if="me" class="leaderboard-me" aria-label="Posisi kamu">
    <span class="leaderboard-me-rank">{{ me.rank }}</span>
    <span><strong>Posisi kamu</strong><small v-if="me.participants">dari {{ me.participants }} peserta</small></span>
    <span class="leaderboard-me-score"><strong>{{ me.score }}</strong><small v-if="maxScore">/ {{ maxScore }}</small></span>
  </aside>
  <aside v-else-if="period === 'week'" class="leaderboard-me leaderboard-me--off">
    <AppIcon name="clock" :size="22" aria-hidden="true" />
    <span>Kamu mengerjakan paket ini sebelum minggu ini</span>
    <NuxtLink :to="allTimeHref || '#'">Lihat sepanjang masa</NuxtLink>
  </aside>
</template>

<style scoped>
.leaderboard-me { position: sticky; bottom: .75rem; z-index: 2; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .75rem; margin: .75rem; border-radius: var(--radius-lg); background: var(--color-primary); padding: .75rem 1rem; color: white; box-shadow: var(--shadow-brand); }
.leaderboard-me-rank { min-width: 2.75rem; color: white; font-size: 1.15rem; font-weight: 800; text-align: center; }
.leaderboard-me strong { display: block; font-size: .9rem; }
.leaderboard-me small { display: block; color: rgba(255, 255, 255, .82); font-size: .78rem; }
.leaderboard-me-score { text-align: right; font-variant-numeric: tabular-nums; }
.leaderboard-me--off { position: static; grid-template-columns: auto minmax(0, 1fr) auto; border: 1px dashed var(--color-line); background: var(--color-surface-alt); color: var(--color-ink); box-shadow: none; font-size: .85rem; }
.leaderboard-me--off > .inline-block { color: var(--color-muted); }
.leaderboard-me--off a { color: var(--color-primary); font-weight: 700; text-decoration: none; white-space: nowrap; }
.leaderboard-me--off a:hover { text-decoration: underline; }
@media (max-width: 560px) { .leaderboard-me--off { grid-template-columns: auto minmax(0, 1fr); } .leaderboard-me--off a { grid-column: 2; } }
</style>
