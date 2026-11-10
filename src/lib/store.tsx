import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from './supabase'

interface Store {
  /** undefined while loading the saved session */
  user: User | null | undefined
  profile: Profile | null
  /** blip_id → times caught, newest first */
  caught: { blip_id: string; times_caught: number }[]
  /** every finished session (for time-of-day achievements), oldest first */
  sessions: { target: number; reps: number; created_at: string }[]
  refresh: () => Promise<void>
}

const Ctx = createContext<Store>(null!)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [caught, setCaught] = useState<Store['caught']>([])
  const [sessions, setSessions] = useState<Store['sessions']>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = user?.id
  const refresh = useCallback(async () => {
    if (!userId) return setProfile(null), setCaught([]), setSessions([])
    const [p, b, s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_blips').select('blip_id, times_caught').order('first_caught_at', { ascending: false }),
      // shortcut: loads every session row (Supabase caps a select at 1,000), move the time checks into an RPC if players pass that
      supabase.from('sessions').select('target, reps, created_at').gt('reps', 0).order('created_at').limit(1000),
    ])
    if (p.data) setProfile(p.data)
    if (b.data) setCaught(b.data)
    if (s.data) setSessions(s.data)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  return <Ctx.Provider value={{ user, profile, caught, sessions, refresh }}>{children}</Ctx.Provider>
}
