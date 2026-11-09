import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from './supabase'

interface Store {
  /** undefined while loading the saved session */
  user: User | null | undefined
  profile: Profile | null
  /** blip_id → times caught, newest first */
  caught: { blip_id: string; times_caught: number }[]
  refresh: () => Promise<void>
}

const Ctx = createContext<Store>(null!)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [caught, setCaught] = useState<Store['caught']>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = user?.id
  const refresh = useCallback(async () => {
    if (!userId) return setProfile(null), setCaught([])
    const [p, b] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_blips').select('blip_id, times_caught').order('first_caught_at', { ascending: false }),
    ])
    if (p.data) setProfile(p.data)
    if (b.data) setCaught(b.data)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  return <Ctx.Provider value={{ user, profile, caught, refresh }}>{children}</Ctx.Provider>
}
