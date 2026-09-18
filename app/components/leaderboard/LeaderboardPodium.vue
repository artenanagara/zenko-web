<script setup lang="ts">
import type { LeaderboardRow } from '#shared/types/leaderboard'

const props = withDefaults(defineProps<{
  entries: LeaderboardRow[]
  maxScore?: number
  compact?: boolean
}>(), {
  maxScore: 0,
  compact: false,
})

const displayEntries = computed(() => [2, 1, 3].map(rank => props.entries.find(entry => entry.rank === rank)).filter((entry): entry is LeaderboardRow => !!entry))
const mascotByRank: Record<number, string> = { 1: '/brand/mascot/jump.webp', 2: '/brand/mascot/thumb.webp', 3: '/brand/mascot/wave.webp' }
const confetti = Array.from({ length: 14 }, (_, index) => ({
  x: (index * 31) % 97,
  delay: (index % 7) * 110,
  color: ['var(--color-primary)', 'var(--color-star)', 'var(--color-success)', '#a26e52'][index % 4],
}))

function avatar(row: LeaderboardRow) {
  if (row.avatar) return row.avatar
  if (row.name === 'Peserta anonim') return 'PA'
  const words = row.name.trim().split(/\s+/).filter(Boolean)
  return words.length > 1
    ? `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`.toUpperCase()
    : (words[0]?.[0] ?? '?').toUpperCase()
}
</script>

<template>
  <section class="leaderboard-stage" :class="{ 'leaderboard-stage--compact': compact }" aria-label="Podium leaderboard">
    <div class="leaderboard-confetti" aria-hidden="true">
      <i v-for="(piece, index) in confetti" :key="index" :style="{ '--confetti-x': `${piece.x}%`, '--confetti-delay': `${piece.delay}ms`, '--confetti-color': piece.color }" />
    </div>
    <div class="leaderboard-podium">
      <article v-for="row in displayEntries" :key="`${row.rank}-${row.name}`" class="leaderboard-spot" :class="`leaderboard-spot--${row.rank}`">
        <div class="leaderboard-mascot-wrap">
          <img :src="mascotByRank[row.rank]" :alt="`Maskot peringkat ${row.rank}`" class="leaderboard-mascot">
          <AppIcon v-if="row.rank === 1" name="crown" :size="30" weight="fill" class="leaderboard-crown" aria-hidden="true" />
          <span v-if="row.isMe" class="leaderboard-you">Kamu</span>
        </div>
        <div class="leaderboard-person">
          <strong>{{ row.name }}</strong>
          <span>{{ row.score }}<template v-if="maxScore"> / {{ maxScore }}</template></span>
        </div>
        <div class="leaderboard-block">
          <span class="leaderboard-medal"><AppIcon name="medal" :size="compact ? 20 : 24" weight="fill" aria-hidden="true" /></span>
          <b>{{ row.rank }}</b>
        </div>
        <span class="sr-only">Inisial avatar: {{ avatar(row) }}</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.leaderboard-stage {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, var(--color-primary-soft), var(--color-surface) 88%);
  padding: 1.5rem 1rem 0;
}
.leaderboard-podium { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1.12fr 1fr; align-items: end; gap: .625rem; max-width: 35rem; margin-inline: auto; }
.leaderboard-spot { min-width: 0; display: flex; flex-direction: column; align-items: center; }
.leaderboard-mascot-wrap { position: relative; display: flex; justify-content: center; }
.leaderboard-mascot { display: block; width: auto; height: 8rem; filter: drop-shadow(0 10px 12px rgba(30, 64, 160, .18)); }
.leaderboard-spot--1 .leaderboard-mascot { height: 9.75rem; animation: leaderboard-bounce 2.4s ease-in-out infinite; }
.leaderboard-crown { position: absolute; top: -1rem; left: 50%; color: var(--color-star); transform: translateX(-50%) rotate(-8deg); filter: drop-shadow(0 2px 2px rgba(138, 100, 16, .35)); }
.leaderboard-you { position: absolute; top: .25rem; right: -.35rem; border-radius: var(--radius-pill); background: var(--color-primary); padding: .2rem .5rem; color: white; font-size: .68rem; font-weight: 800; box-shadow: var(--shadow-brand); }
.leaderboard-person { width: 100%; min-width: 0; margin: .5rem 0; text-align: center; }
.leaderboard-person strong { display: block; overflow: hidden; font-size: .88rem; white-space: nowrap; text-overflow: ellipsis; }
.leaderboard-person span { color: var(--color-muted); font-size: .8rem; font-variant-numeric: tabular-nums; }
.leaderboard-block { position: relative; display: flex; width: 100%; flex-direction: column; align-items: center; gap: .35rem; border-radius: var(--radius-lg) var(--radius-lg) 0 0; padding-top: .75rem; color: var(--color-ink); }
.leaderboard-spot--1 .leaderboard-block { height: 7.4rem; background: color-mix(in srgb, var(--color-star) 16%, var(--color-surface)); }
.leaderboard-spot--2 .leaderboard-block { height: 5.5rem; background: color-mix(in srgb, #9ba7b8 18%, var(--color-surface)); }
.leaderboard-spot--3 .leaderboard-block { height: 4.1rem; background: color-mix(in srgb, #a26e52 20%, var(--color-surface)); }
.leaderboard-medal { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border-radius: 50%; color: white; background: radial-gradient(circle at 35% 30%, #f7d774, var(--color-star) 60%, #c3931d); box-shadow: inset 0 -3px 0 rgba(0, 0, 0, .14), 0 4px 10px rgba(0, 0, 0, .12); }
.leaderboard-spot--2 .leaderboard-medal { background: radial-gradient(circle at 35% 30%, #e3e8ef, #9ba7b8 60%, #7b879a); }
.leaderboard-spot--3 .leaderboard-medal { background: radial-gradient(circle at 35% 30%, #d4a78c, #a26e52 60%, #7f5139); }
.leaderboard-confetti { position: absolute; inset: 0; pointer-events: none; }
.leaderboard-confetti i { position: absolute; top: -1rem; left: var(--confetti-x); width: .4rem; height: .7rem; border-radius: 2px; background: var(--confetti-color); opacity: 0; animation: leaderboard-fall 2.6s ease-in forwards; animation-delay: var(--confetti-delay); }
.leaderboard-stage--compact { padding-top: 1rem; }
.leaderboard-stage--compact .leaderboard-mascot { height: 5.75rem; }
.leaderboard-stage--compact .leaderboard-spot--1 .leaderboard-mascot { height: 7rem; }
.leaderboard-stage--compact .leaderboard-spot--1 .leaderboard-block { height: 4.9rem; }
.leaderboard-stage--compact .leaderboard-spot--2 .leaderboard-block { height: 3.65rem; }
.leaderboard-stage--compact .leaderboard-spot--3 .leaderboard-block { height: 2.75rem; }
.leaderboard-stage--compact .leaderboard-medal { width: 2rem; height: 2rem; }
@keyframes leaderboard-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-.5rem); } }
@keyframes leaderboard-fall { 0% { opacity: 0; transform: translateY(0) rotate(0); } 10% { opacity: 1; } 100% { opacity: 0; transform: translateY(16rem) rotate(540deg); } }
@media (max-width: 640px) {
  .leaderboard-stage { padding-inline: .375rem; }
  .leaderboard-podium { gap: .375rem; }
  .leaderboard-mascot { height: 5.25rem; }
  .leaderboard-spot--1 .leaderboard-mascot { height: 6.25rem; }
  .leaderboard-spot--1 .leaderboard-block { height: 5.4rem; }
  .leaderboard-spot--2 .leaderboard-block { height: 4rem; }
  .leaderboard-spot--3 .leaderboard-block { height: 3rem; }
  .leaderboard-person strong { font-size: .78rem; }
  .leaderboard-person span { font-size: .72rem; }
}
@media (prefers-reduced-motion: reduce) {
  .leaderboard-spot--1 .leaderboard-mascot { animation: none; }
  .leaderboard-confetti { display: none; }
}
</style>
