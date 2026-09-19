<script setup lang="ts">
import type { LeaderboardRow } from '#shared/types/leaderboard'

defineProps<{
  rows: LeaderboardRow[]
  maxScore?: number
}>()

function avatar(row: LeaderboardRow) {
  if (row.avatar) return row.avatar
  if (row.name === 'Peserta anonim') return ''
  const words = row.name.trim().split(/\s+/).filter(Boolean)
  return words.length > 1
    ? `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`.toUpperCase()
    : (words[0]?.[0] ?? '?').toUpperCase()
}
</script>

<template>
  <ol v-if="rows.length" class="leaderboard-list" aria-label="Daftar peringkat">
    <li v-for="(row, index) in rows" :key="`${row.rank}-${row.name}-${index}`" class="leaderboard-list-row" :class="{ 'leaderboard-list-row--me': row.isMe }">
      <span class="leaderboard-list-rank">{{ row.rank }}</span>
      <span v-if="row.name !== 'Peserta anonim'" class="leaderboard-avatar" aria-hidden="true">{{ avatar(row) }}</span>
      <span v-else class="leaderboard-avatar leaderboard-avatar--anonymous" aria-label="Peserta anonim"><AppIcon name="user" :size="18" aria-hidden="true" /></span>
      <span class="leaderboard-list-name">
        <strong>{{ row.name }}</strong>
        <small v-if="index > 0 && rows[index - 1]?.rank === row.rank" class="leaderboard-tie">Skor sama</small>
        <small v-if="row.isMe" class="leaderboard-list-you">Kamu</small>
      </span>
      <span class="leaderboard-list-score"><strong>{{ row.score }}</strong><small v-if="maxScore">/ {{ maxScore }}</small></span>
    </li>
  </ol>
  <p v-else class="py-8 text-center text-sm text-muted">Belum ada peserta di posisi ini.</p>
</template>

<style scoped>
.leaderboard-list { margin: 0; padding: .5rem 0 0; list-style: none; }
.leaderboard-list-row { display: grid; grid-template-columns: 2.5rem 2.25rem minmax(0, 1fr) auto; align-items: center; gap: .75rem; border-bottom: 1px solid var(--color-hairline); padding: .7rem 0; }
.leaderboard-list-row:last-child { border-bottom: 0; }
.leaderboard-list-row--me { margin-inline: -.5rem; border-radius: var(--radius-sm); background: var(--color-primary-soft); padding-inline: .5rem; }
.leaderboard-list-rank { color: var(--color-muted); font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; }
.leaderboard-avatar { display: grid; width: 2.25rem; height: 2.25rem; place-items: center; border-radius: 50%; background: var(--color-primary); color: white; font-size: .78rem; font-weight: 700; }
.leaderboard-avatar--anonymous { border: 1px dashed var(--color-line); background: var(--color-surface-sunken); color: var(--color-faint); }
.leaderboard-list-name { min-width: 0; }
.leaderboard-list-name strong { display: block; overflow: hidden; font-size: .9rem; white-space: nowrap; text-overflow: ellipsis; }
.leaderboard-tie, .leaderboard-list-you { display: inline-block; margin-top: .15rem; border-radius: var(--radius-xs); background: var(--color-surface-sunken); padding: .1rem .35rem; color: var(--color-muted); font-size: .68rem; font-weight: 700; }
.leaderboard-list-you { margin-left: .25rem; background: var(--color-primary); color: white; }
.leaderboard-list-score { text-align: right; font-variant-numeric: tabular-nums; }
.leaderboard-list-score strong { font-weight: 800; }
.leaderboard-list-score small { display: block; color: var(--color-faint); font-size: .72rem; }
@media (max-width: 480px) { .leaderboard-list-row { grid-template-columns: 1.75rem 2rem minmax(0, 1fr) auto; gap: .5rem; } .leaderboard-avatar { width: 2rem; height: 2rem; } }
</style>
