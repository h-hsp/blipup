import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export interface Profile {
  id: string
  username: string
  double_bubbles: number
  total_reps: number
  total_sessions: number
  streak: number
  best_streak: number
  best_session: number
  last_session_date: string | null
  daily_claimed_date: string | null
  is_owner: boolean
  campaign_level: number
}

export interface Encounter {
  id: string
  blip_id: string
  chance: number
  attempts_left: number
  boosted: boolean
  status: 'active' | 'caught' | 'escaped'
}

/** Local calendar day as YYYY-MM-DD (streaks follow the player's own midnight). */
export const localDate = (d = new Date()) => d.toLocaleDateString('en-CA')

/** RPC call that throws on error, so callers can just try/catch. */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}
