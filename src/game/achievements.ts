import type { Profile } from '../lib/supabase'
import { BLIPS, blipById } from './blips.ts'
import { LEVELS } from './campaign.ts'
import { levelInfo, rankInfo, totalXp } from './progress.ts'

export type Sess = { target: number; reps: number; created_at: string }
export type AchCtx = { p: Profile; caught: { blip_id: string; times_caught: number }[]; sessions: Sess[] }
type Check = (x: AchCtx) => boolean
type Ach = { id: string; cat: string; icon: string; name: string; desc: string; done: Check }

// Collection
const owned = (x: AchCtx) => new Set(x.caught.map((c) => c.blip_id))
const allOf = (r: number): Check => (x) => { const s = owned(x); return BLIPS.filter((b) => b.rarity === r).every((b) => s.has(b.id)) }
const anyOf = (r: number): Check => (x) => x.caught.some((c) => blipById(c.blip_id)?.rarity === r)
const got = (id: string): Check => (x) => x.caught.some((c) => c.blip_id === id)
const catches = (x: AchCtx) => x.caught.reduce((n, c) => n + c.times_caught, 0)

// Sessions, read in the phone's own time zone (created_at is stored in UTC)
const when = (x: AchCtx) => x.sessions.map((s) => new Date(s.created_at))
const at = (test: (d: Date) => boolean): Check => (x) => when(x).some(test)
const hourIn = (from: number, to: number) => at((d) => d.getHours() >= from && d.getHours() < to)
const onDate = (month: number, day: number) => at((d) => d.getMonth() === month && d.getDate() === day)
const days = (x: AchCtx) => {
  const m = new Map<string, { n: number; reps: number }>()
  x.sessions.forEach((s, i) => {
    const d = when(x)[i]
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const v = m.get(k) ?? { n: 0, reps: 0 }
    m.set(k, { n: v.n + 1, reps: v.reps + s.reps })
  })
  return [...m.values()]
}
const slot = (h: number) => (h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 22 ? 2 : 3) // morning, afternoon, evening, night
const any = (test: (s: Sess) => boolean): Check => (x) => x.sessions.some(test)

const xpLevel = (x: AchCtx) => levelInfo(totalXp(x.p, x.caught)).level
const rankAt = (name: string): Check => (x) => rankInfo(x.p.total_reps).i >= rankIndex(name)
const rankIndex = (name: string) => ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend', 'Mythic'].indexOf(name)

// Everything is derived from server-written stats and session rows, so there is nothing extra to store or sync.
export const ACHIEVEMENTS: Ach[] = [
  // Total pushups
  { id: 'reps100', cat: 'Pushups', icon: '💯', name: 'Triple Digits', desc: '100 total pushups', done: (x) => x.p.total_reps >= 100 },
  { id: 'reps500', cat: 'Pushups', icon: '🖐️', name: 'Five Hundo', desc: '500 total pushups', done: (x) => x.p.total_reps >= 500 },
  { id: '1k', cat: 'Pushups', icon: '💪', name: '1K Club', desc: '1,000 total pushups', done: (x) => x.p.total_reps >= 1000 },
  { id: 'reps2500', cat: 'Pushups', icon: '🏋️', name: 'Grinder', desc: '2,500 total pushups', done: (x) => x.p.total_reps >= 2500 },
  { id: 'reps5k', cat: 'Pushups', icon: '🦍', name: '5K Beast', desc: '5,000 total pushups', done: (x) => x.p.total_reps >= 5000 },
  { id: 'reps10k', cat: 'Pushups', icon: '🗿', name: '10K Legend', desc: '10,000 total pushups', done: (x) => x.p.total_reps >= 10000 },

  // One session
  { id: 'best10', cat: 'One session', icon: '🔟', name: 'Double Digits', desc: '10 pushups in one session', done: (x) => x.p.best_session >= 10 },
  { id: 'best25', cat: 'One session', icon: '🪙', name: 'Twenty-Five Alive', desc: '25 in one session', done: (x) => x.p.best_session >= 25 },
  { id: 'best50', cat: 'One session', icon: '🥵', name: 'Half Ton', desc: '50 in one session', done: (x) => x.p.best_session >= 50 },
  { id: 'best75', cat: 'One session', icon: '😤', name: 'Seventy-Five Strong', desc: '75 in one session', done: (x) => x.p.best_session >= 75 },
  { id: 'century', cat: 'One session', icon: '🎯', name: 'Century', desc: '100 pushups in one session', done: (x) => x.p.best_session >= 100 },
  { id: 'best150', cat: 'One session', icon: '🚀', name: 'Beyond', desc: '150 in one session', done: (x) => x.p.best_session >= 150 },
  { id: 'best200', cat: 'One session', icon: '🧱', name: 'Absolute Unit', desc: '200 in one session', done: (x) => x.p.best_session >= 200 },
  { id: 'chill', cat: 'One session', icon: '🧃', name: 'Just Vibing', desc: 'Finish a 5-pushup session', done: any((s) => s.target === 5) },
  { id: 'max', cat: 'One session', icon: '🎚️', name: 'Max Settings', desc: 'Pick the 100 target and finish it', done: any((s) => s.target === 100) },
  { id: 'over', cat: 'One session', icon: '📈', name: 'Overachiever', desc: 'Do double your target (10+)', done: any((s) => s.target >= 10 && s.reps >= s.target * 2) },
  { id: 'bonus', cat: 'One session', icon: '➕', name: 'Bonus Round', desc: '20+ pushups past your target', done: any((s) => s.reps >= s.target + 20) },

  // Sessions
  { id: 'sess1', cat: 'Sessions', icon: '🌱', name: 'Day One', desc: 'Finish your first session', done: (x) => x.p.total_sessions >= 1 },
  { id: 'sess10', cat: 'Sessions', icon: '📅', name: 'Regular', desc: '10 sessions', done: (x) => x.p.total_sessions >= 10 },
  { id: 'sess25', cat: 'Sessions', icon: '🧭', name: 'Committed', desc: '25 sessions', done: (x) => x.p.total_sessions >= 25 },
  { id: 'sess50', cat: 'Sessions', icon: '🛡️', name: 'Dedicated', desc: '50 sessions', done: (x) => x.p.total_sessions >= 50 },
  { id: 'sess100', cat: 'Sessions', icon: '🏛️', name: 'Centurion', desc: '100 sessions', done: (x) => x.p.total_sessions >= 100 },
  { id: 'sess365', cat: 'Sessions', icon: '🗓️', name: 'Year of Reps', desc: '365 sessions', done: (x) => x.p.total_sessions >= 365 },

  // Streaks
  { id: 'fire', cat: 'Streaks', icon: '🔥', name: 'On Fire', desc: '3-day streak', done: (x) => x.p.best_streak >= 3 },
  { id: 'unstoppable', cat: 'Streaks', icon: '⚡', name: 'Unstoppable', desc: '7-day streak', done: (x) => x.p.best_streak >= 7 },
  { id: 'streak14', cat: 'Streaks', icon: '☄️', name: 'Two Weeks Strong', desc: '14-day streak', done: (x) => x.p.best_streak >= 14 },
  { id: 'streak30', cat: 'Streaks', icon: '🌋', name: 'Monthly Menace', desc: '30-day streak', done: (x) => x.p.best_streak >= 30 },
  { id: 'streak100', cat: 'Streaks', icon: '🌞', name: 'Hundred Days', desc: '100-day streak', done: (x) => x.p.best_streak >= 100 },
  { id: 'streak365', cat: 'Streaks', icon: '🪐', name: 'Full Orbit', desc: '365-day streak', done: (x) => x.p.best_streak >= 365 },

  // Time of day
  { id: 'early', cat: 'Time of day', icon: '🐓', name: 'Early Bird', desc: 'A session between 4 and 7 am', done: hourIn(4, 7) },
  { id: 'morning', cat: 'Time of day', icon: '☕', name: 'Morning Person', desc: '5 sessions before 9 am', done: (x) => when(x).filter((d) => d.getHours() < 9 && d.getHours() >= 4).length >= 5 },
  { id: 'lunch', cat: 'Time of day', icon: '🥪', name: 'Lunch Break', desc: 'A session between 12 and 1 pm', done: hourIn(12, 13) },
  { id: 'school', cat: 'Time of day', icon: '🎒', name: 'After School', desc: 'A session between 3 and 5 pm', done: hourIn(15, 17) },
  { id: 'golden', cat: 'Time of day', icon: '🌇', name: 'Golden Hour', desc: 'A session between 6 and 7 pm', done: hourIn(18, 19) },
  { id: 'owl', cat: 'Time of day', icon: '🦉', name: 'Night Owl', desc: 'A session after 10 pm', done: hourIn(22, 24) },
  { id: 'midnight', cat: 'Time of day', icon: '🌙', name: 'Midnight Grind', desc: 'A session between midnight and 4 am', done: hourIn(0, 4) },
  { id: 'clock', cat: 'Time of day', icon: '🕰️', name: 'Around the Clock', desc: 'Sessions in the morning, arvo, evening and night', done: (x) => new Set(when(x).map((d) => slot(d.getHours()))).size === 4 },

  // Days and dates
  { id: 'monday', cat: 'Days', icon: '😩', name: 'Monday Motivation', desc: 'A session on a Monday', done: at((d) => d.getDay() === 1) },
  { id: 'friday', cat: 'Days', icon: '🎉', name: 'Friday Feeling', desc: 'A session on a Friday', done: at((d) => d.getDay() === 5) },
  { id: 'weekend', cat: 'Days', icon: '🏖️', name: 'Weekend Warrior', desc: 'Sessions on a Saturday and a Sunday', done: (x) => at((d) => d.getDay() === 6)(x) && at((d) => d.getDay() === 0)(x) },
  { id: 'week', cat: 'Days', icon: '🌈', name: 'Full Week', desc: 'A session on every day of the week', done: (x) => new Set(when(x).map((d) => d.getDay())).size === 7 },
  { id: 'double', cat: 'Days', icon: '✌️', name: 'Double Up', desc: '2 sessions in one day', done: (x) => days(x).some((d) => d.n >= 2) },
  { id: 'triple', cat: 'Days', icon: '🔱', name: 'Triple Threat', desc: '3 sessions in one day', done: (x) => days(x).some((d) => d.n >= 3) },
  { id: 'dayhundred', cat: 'Days', icon: '📆', name: 'Hundred Day', desc: '100 pushups in one day', done: (x) => days(x).some((d) => d.reps >= 100) },
  { id: 'comeback', cat: 'Days', icon: '🧟', name: 'Comeback Kid', desc: 'Come back after a week off', done: (x) => when(x).some((d, i, a) => i > 0 && d.getTime() - a[i - 1].getTime() >= 7 * 864e5) },
  { id: 'newyear', cat: 'Days', icon: '🎆', name: 'New Year, New Reps', desc: 'A session on 1 January', done: onDate(0, 1) },
  { id: 'spooky', cat: 'Days', icon: '🎃', name: 'Spooky Sets', desc: 'A session on Halloween', done: onDate(9, 31) },
  { id: 'xmas', cat: 'Days', icon: '🎄', name: 'Festive Flex', desc: 'A session on Christmas Day', done: onDate(11, 25) },

  // Campaign
  { id: 'camp1', cat: 'Campaign', icon: '🚩', name: 'Recruit', desc: 'Clear campaign level 1', done: (x) => x.p.campaign_level >= 1 },
  { id: 'camp5', cat: 'Campaign', icon: '⚔️', name: 'Boss Slayer', desc: 'Beat the first boss (level 5)', done: (x) => x.p.campaign_level >= 5 },
  { id: 'camp10', cat: 'Campaign', icon: '🗡️', name: 'Double Boss', desc: 'Clear level 10', done: (x) => x.p.campaign_level >= 10 },
  { id: 'camp25', cat: 'Campaign', icon: '🏔️', name: 'Halfway Up', desc: 'Clear level 25', done: (x) => x.p.campaign_level >= 25 },
  { id: 'camp40', cat: 'Campaign', icon: '🧗', name: 'Final Stretch', desc: 'Clear level 40', done: (x) => x.p.campaign_level >= 40 },
  { id: 'campall', cat: 'Campaign', icon: '🏆', name: 'Campaign Complete', desc: `Clear all ${LEVELS.length} levels`, done: (x) => x.p.campaign_level >= LEVELS.length },

  // Level and rank
  { id: 'lv5', cat: 'Level & rank', icon: '⭐', name: 'Level 5', desc: 'Reach level 5', done: (x) => xpLevel(x) >= 5 },
  { id: 'lv10', cat: 'Level & rank', icon: '🌟', name: 'Level 10', desc: 'Reach level 10', done: (x) => xpLevel(x) >= 10 },
  { id: 'lv20', cat: 'Level & rank', icon: '✨', name: 'Level 20', desc: 'Reach level 20', done: (x) => xpLevel(x) >= 20 },
  { id: 'rankgold', cat: 'Level & rank', icon: '🥇', name: 'Going Gold', desc: 'Reach Gold rank', done: rankAt('Gold') },
  { id: 'rankdiamond', cat: 'Level & rank', icon: '💎', name: 'Shine Bright', desc: 'Reach Diamond rank', done: rankAt('Diamond') },
  { id: 'ranklegend', cat: 'Level & rank', icon: '👑', name: 'Living Legend', desc: 'Reach Legend rank', done: rankAt('Legend') },
  { id: 'rankmythic', cat: 'Level & rank', icon: '🌌', name: 'Mythic', desc: 'Reach Mythic rank', done: rankAt('Mythic') },

  // Collection
  { id: 'first', cat: 'Collection', icon: '🫧', name: 'First Catch', desc: 'Catch your first Blip', done: (x) => x.caught.length >= 1 },
  { id: 'five', cat: 'Collection', icon: '🖐️', name: 'Starter Pack', desc: 'Collect 5 different Blips', done: (x) => x.caught.length >= 5 },
  { id: 'ten', cat: 'Collection', icon: '🔟', name: 'Ten Deep', desc: 'Collect 10 different Blips', done: (x) => x.caught.length >= 10 },
  { id: 'dex25', cat: 'Collection', icon: '📒', name: 'Quarter Dex', desc: 'Collect 25 different Blips', done: (x) => x.caught.length >= 25 },
  { id: 'dexhalf', cat: 'Collection', icon: '📗', name: 'Halfway Dex', desc: `Collect ${Math.ceil(BLIPS.length / 2)} different Blips`, done: (x) => x.caught.length >= Math.ceil(BLIPS.length / 2) },
  { id: 'dex50', cat: 'Collection', icon: '📚', name: 'Fifty Friends', desc: 'Collect 50 different Blips', done: (x) => x.caught.length >= 50 },
  { id: 'all', cat: 'Collection', icon: '🏅', name: "Gotta Blip 'Em All", desc: `Collect all ${BLIPS.length} Blips`, done: (x) => x.caught.length >= BLIPS.length },
  { id: 'commons', cat: 'Collection', icon: '🟢', name: 'Common Ground', desc: 'Collect every 1★ Blip', done: allOf(1) },
  { id: 'uncommons', cat: 'Collection', icon: '🔵', name: 'Uncommon Taste', desc: 'Collect every 2★ Blip', done: allOf(2) },
  { id: 'epics', cat: 'Collection', icon: '🟣', name: 'Epic Collector', desc: 'Collect every 3★ Blip', done: allOf(3) },
  { id: 'legends', cat: 'Collection', icon: '🟡', name: 'Hall of Legends', desc: 'Collect every 4★ Blip', done: allOf(4) },
  { id: 'epic', cat: 'Collection', icon: '💜', name: 'Epic Find', desc: 'Catch any 3★ Blip', done: anyOf(3) },
  { id: 'legend', cat: 'Collection', icon: '👑', name: 'Legend Hunter', desc: 'Catch any 4★ Blip', done: anyOf(4) },
  { id: 'goat', cat: 'Collection', icon: '🐐', name: 'Certified GOAT', desc: 'Catch GOAT', done: got('goat') },
  { id: 'finalboss', cat: 'Collection', icon: '🌀', name: 'Final Boss Down', desc: 'Catch Final Boss', done: got('finalboss') },
  { id: 'glitch', cat: 'Collection', icon: '👾', name: 'Glitch in the Matrix', desc: 'Catch Glitch', done: got('glitch') },

  // Catching
  { id: 'catch25', cat: 'Catching', icon: '🎣', name: 'Bubble Pro', desc: '25 catches in total', done: (x) => catches(x) >= 25 },
  { id: 'catch100', cat: 'Catching', icon: '🤖', name: 'Catch Machine', desc: '100 catches in total', done: (x) => catches(x) >= 100 },
  { id: 'besties', cat: 'Catching', icon: '🤝', name: 'Besties', desc: 'Catch the same Blip 5 times', done: (x) => x.caught.some((c) => c.times_caught >= 5) },
  { id: 'obsessed', cat: 'Catching', icon: '😵‍💫', name: 'Obsessed', desc: 'Catch the same Blip 10 times', done: (x) => x.caught.some((c) => c.times_caught >= 10) },

  // Double Bubbles
  { id: 'hoard10', cat: 'Bubbles', icon: '🫧', name: 'Bubble Hoarder', desc: 'Hold 10 Double Bubbles at once', done: (x) => x.p.double_bubbles >= 10 },
  { id: 'hoard25', cat: 'Bubbles', icon: '🛁', name: 'Bubble Bath', desc: 'Hold 25 Double Bubbles at once', done: (x) => x.p.double_bubbles >= 25 },
]

export const REWARD_TEXT: Record<string, string> = {
  daily: 'Daily challenge done',
  streak_3: '3-day streak',
  milestone_100: '100 total pushups',
  milestone_500: '500 total pushups',
  milestone_1000: '1,000 total pushups',
  milestone_5000: '5,000 total pushups',
  finder: 'Bubble Finder found a Double Bubble',
}
export const rewardText = (r: string) =>
  REWARD_TEXT[r] ?? (r.startsWith('streak_') ? `${r.slice(7)}-day streak` : r.startsWith('campaign_') ? `Campaign boss ${r.slice(9)} beaten` : r)
