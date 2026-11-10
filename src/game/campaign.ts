// [name, pushups, time limit in seconds?]. The pushup numbers must match `camp` in supabase/migrations/004_campaign.sql.
const RAW: [string, number, number?][] = [
  ['Warm-Up', 5],
  ['First Steps', 10],
  ['Quick Ten', 10, 45],
  ['Fifteen Up', 15],
  ['The Twenty', 20],
  ['Speed Round', 15, 45],
  ['Steady Twenty', 20],
  ['Quarter Century', 25],
  ['Beat the Clock', 20, 60],
  ['Dirty Thirty', 30],
  ['Thirty Dash', 30, 90],
  ['Push On', 35],
  ['Forty Club', 40],
  ['Rapid Fire', 35, 90],
  ['Half Century', 50],
  ['Turbo', 45, 120],
  ['Sixty Strong', 60],
  ['Seventy Grind', 70],
  ['Last Sprint', 60, 150],
  ['The Century', 100],
]

export interface Level { n: number; name: string; reps: number; secs?: number; boss: boolean }

/** Every 5th level is a boss: beating it pays +1 Double Bubble (server side). */
export const LEVELS: Level[] = RAW.map(([name, reps, secs], i) => ({ n: i + 1, name, reps, secs, boss: (i + 1) % 5 === 0 }))

export const levelText = (l: Level) => `${l.reps} pushups${l.secs ? ` in ${l.secs}s` : ''}`
