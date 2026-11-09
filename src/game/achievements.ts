import type { Profile } from '../lib/supabase'
import { BLIPS } from './blips'

type Check = (p: Profile, caught: Set<string>) => boolean
const all = (r: number): Check => (_, c) => BLIPS.filter((b) => b.rarity === r).every((b) => c.has(b.id))

// Derived from server-written stats, so there is nothing extra to store or sync.
export const ACHIEVEMENTS: { id: string; icon: string; name: string; desc: string; done: Check }[] = [
  { id: 'first', icon: '🫧', name: 'First Catch', desc: 'Catch your first Blip', done: (_, c) => c.size >= 1 },
  { id: 'ten', icon: '🔟', name: 'Ten Deep', desc: 'Collect 10 different Blips', done: (_, c) => c.size >= 10 },
  { id: 'commons', icon: '🟢', name: 'Common Ground', desc: 'Collect every 1★ Blip', done: all(1) },
  { id: 'legend', icon: '👑', name: 'Legend Hunter', desc: 'Catch any 4★ Blip', done: (_, c) => BLIPS.some((b) => b.rarity === 4 && c.has(b.id)) },
  { id: 'all', icon: '🏆', name: "Gotta Blip 'Em All", desc: 'Collect all 30 Blips', done: (_, c) => c.size >= BLIPS.length },
  { id: 'fire', icon: '🔥', name: 'On Fire', desc: '3-day streak', done: (p) => p.best_streak >= 3 },
  { id: 'unstoppable', icon: '⚡', name: 'Unstoppable', desc: '7-day streak', done: (p) => p.best_streak >= 7 },
  { id: 'century', icon: '💯', name: 'Century', desc: '100 pushups in one session', done: (p) => p.best_session >= 100 },
  { id: '1k', icon: '💪', name: '1K Club', desc: '1,000 total pushups', done: (p) => p.total_reps >= 1000 },
]

export const REWARD_TEXT: Record<string, string> = {
  daily: 'Daily challenge done',
  streak_3: '3-day streak',
  milestone_100: '100 total pushups',
  milestone_500: '500 total pushups',
  milestone_1000: '1,000 total pushups',
  milestone_5000: '5,000 total pushups',
}
export const rewardText = (r: string) => REWARD_TEXT[r] ?? (r.startsWith('streak_') ? `${r.slice(7)}-day streak` : r)
