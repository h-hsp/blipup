import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export interface Profile {
  id: string
  username: string
  /** shown instead of the username when set; anyone can share one */
  display_name: string | null
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
  loadout: { perks: string[]; blips: string[] }
  bonus_xp: number
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

export const nameOf = (p: Pick<Profile, 'username' | 'display_name'> | null) => p?.display_name || p?.username || 'Blipper'

/** Username + password sign-up or log-in via the `account` edge function. Signing up as a guest keeps your progress. */
export async function account(action: 'signup' | 'login', username: string, password: string) {
  const { data, error } = await supabase.functions.invoke('account', { body: { action, username, password } })
  if (error) {
    // the function's own message ("That username is taken") is in the response body
    const body = await (error as { context?: Response }).context?.json().catch(() => null)
    throw new Error(body?.error ?? 'Could not reach BlipUp. Check your connection.')
  }
  const { error: e } = await supabase.auth.setSession(data.session)
  if (e) throw new Error(e.message)
}

/** RPC call that throws on error, so callers can just try/catch. */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}
