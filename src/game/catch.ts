// Catch maths. Mirrored in supabase/migrations (private.new_encounter / attempt_catch) – keep both in sync.
export type Rarity = 1 | 2 | 3 | 4

export const MIN_REPS = 5
export const MAX_REPS = 100
export const LEGEND_MIN = 30
export const DAILY_TARGET = 20

const BASE: Record<Rarity, number> = { 1: 0.7, 2: 0.5, 3: 0.3, 4: 0.15 }

/** 0.5x at 5 reps → 1.5x at 100 reps */
export const catchPower = (target: number) => 0.5 + (target - MIN_REPS) / (MAX_REPS - MIN_REPS)

export function catchChance(rarity: Rarity, target: number, boosted = false) {
  const c = Math.min(0.95, Math.max(0.05, BASE[rarity] * catchPower(target)))
  return boosted ? Math.min(0.95, c * 2) : c
}

/** Encounter odds in %. Below LEGEND_MIN the 4★ share moves to 3★. */
export const rarityOdds = (target: number): Record<Rarity, number> =>
  target >= LEGEND_MIN ? { 1: 60, 2: 27, 3: 10, 4: 3 } : { 1: 60, 2: 27, 3: 13, 4: 0 }
