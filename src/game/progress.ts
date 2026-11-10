import type { Rarity } from './catch.ts'
import { blipById } from './blips.ts'

type Stats = { total_reps: number; best_streak: number; streak: number; last_session_date: string | null }
type Caught = { blip_id: string; times_caught: number }[]

export const XP_PER_REP = 10
export const STREAK_DAY_XP = 100
export const CATCH_XP: Record<Rarity, number> = { 1: 50, 2: 100, 3: 250, 4: 500 }

// Derived from server-written stats (like achievements): can't be faked, no table to sync, and it never goes down.
export function totalXp(p: Pick<Stats, 'total_reps' | 'best_streak'>, caught: Caught) {
  const catches = caught.reduce((sum, c) => sum + CATCH_XP[blipById(c.blip_id)?.rarity ?? 1] * c.times_caught, 0)
  return p.total_reps * XP_PER_REP + p.best_streak * STREAK_DAY_XP + catches
}

/** Total XP needed to reach a level: L2 500, L3 1,500, L5 5,000, L10 22,500. */
export const xpForLevel = (level: number) => 250 * level * (level - 1)

export function levelInfo(xp: number) {
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 62.5)) / 2))
  while (xpForLevel(level + 1) <= xp) level++ // guard float rounding at exact boundaries
  while (level > 1 && xpForLevel(level) > xp) level--
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, into: xp - base, need: next - base, toNext: next - xp }
}

/** Ranks come from lifetime pushups only (levels mix in catches and streaks). `min` = total pushups needed. */
export const RANKS = [
  { name: 'Rookie', min: 0, icon: '🐣', color: '#c9c6e8' },
  { name: 'Bronze', min: 50, icon: '🥉', color: '#d08a4f' },
  { name: 'Silver', min: 150, icon: '🥈', color: '#c9d3e6' },
  { name: 'Gold', min: 350, icon: '🥇', color: '#ffc94d' },
  { name: 'Platinum', min: 700, icon: '💠', color: '#6fd3ff' },
  { name: 'Diamond', min: 1200, icon: '💎', color: '#8fe9ff' },
  { name: 'Master', min: 2000, icon: '🔮', color: '#b48cff' },
  { name: 'Grandmaster', min: 3500, icon: '👑', color: '#ff8a4d' },
  { name: 'Legend', min: 5000, icon: '🌟', color: '#ff6fb5' },
  { name: 'Mythic', min: 10000, icon: '🌌', color: '#c6ff4d' },
]

export function rankInfo(reps: number) {
  const i = RANKS.filter((r) => reps >= r.min).length - 1
  const rank = RANKS[i]
  const next = RANKS[i + 1] as (typeof RANKS)[number] | undefined
  return { i, rank, next, toNext: next ? next.min - reps : 0, pct: next ? (reps - rank.min) / (next.min - rank.min) : 1 }
}

/** The streak shown to the player: it only counts if the last session was today or yesterday (local days). */
export function liveStreak(p: Stats | null, today: string, yesterday: string) {
  const doneToday = p?.last_session_date === today
  const alive = doneToday || p?.last_session_date === yesterday
  return { streak: alive ? p!.streak : 0, doneToday }
}

/** Next streak day that pays a Double Bubble. Mirrors complete_session: day 3, then every multiple of 7. */
export const nextStreakReward = (streak: number) => (streak < 3 ? 3 : Math.floor(streak / 7) * 7 + 7)
