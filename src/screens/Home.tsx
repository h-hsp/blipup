import { useMemo } from 'react'
import { BLIPS, blipById } from '../game/blips'
import { DAILY_TARGET } from '../game/catch'
import { BlipArt, Button, Stars, Stat } from '../components/ui'
import { useStore } from '../lib/store'
import { localDate } from '../lib/supabase'

const HYPE = [
  'Your Blips are waiting. Probably napping, but waiting.',
  'One session a day keeps Icky away.',
  "Main character energy only. Let's go.",
  'Lock in. The Blipdex will not fill itself.',
  'Rumour says a GOAT was spotted near 30+ reps…',
  'Touch grass? Touch floor. With your nose. 20 times.',
]

export function Home({ onStart }: { onStart: () => void }) {
  const { profile, caught } = useStore()
  const today = localDate()
  const yesterday = localDate(new Date(Date.now() - 864e5))
  const streak = profile && (profile.last_session_date === today || profile.last_session_date === yesterday) ? profile.streak : 0
  const dailyDone = profile?.daily_claimed_date === today
  const featured = caught[0] ? blipById(caught[0].blip_id) : null
  const mystery = useMemo(() => BLIPS.find((b) => !caught.some((c) => c.blip_id === b.id)) ?? BLIPS[0], [caught])
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Morning' : hour < 18 ? 'Arvo' : 'Evening'
  const hype = HYPE[new Date().getDate() % HYPE.length]

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl font-extrabold">Blip<span className="text-lime">Up</span></span>
        <div className="flex gap-2">
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm font-bold ring-1 ring-white/10" aria-label={`${streak} day streak`}>🔥 {streak}</span>
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm font-bold ring-1 ring-white/10" aria-label={`${profile?.double_bubbles ?? 0} Double Bubbles`}>🫧 {profile?.double_bubbles ?? 0}</span>
        </div>
      </header>

      <div>
        <h1 className="font-display text-3xl font-extrabold">{greet}, {profile?.username ?? 'Blipper'}</h1>
        <p className="mt-1 text-white/60">{hype}</p>
      </div>

      <section className="relative flex items-center gap-4 overflow-hidden rounded-[32px] bg-gradient-to-br from-ink-3 to-ink-2 p-5 ring-1 ring-white/10">
        <BlipArt blip={featured ?? mystery} size={128} locked={!featured} />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/45">{featured ? 'Latest catch' : 'Spotted nearby'}</div>
          <div className="font-display text-2xl font-extrabold">{featured ? featured.name : '???'}</div>
          {featured ? <Stars n={featured.rarity} /> : <p className="text-sm text-white/55">Finish a session to find out who it is.</p>}
        </div>
      </section>

      <section className="flex items-center gap-4 rounded-[28px] bg-white/6 p-5 ring-1 ring-white/10">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun/20 text-2xl">{dailyDone ? '✅' : '🎯'}</div>
        <div className="flex-1">
          <div className="font-display text-lg font-extrabold">Daily challenge</div>
          <div className="text-sm text-white/60">{dailyDone ? 'Done! Come back tomorrow.' : `${DAILY_TARGET}+ pushups in one session`}</div>
        </div>
        <span className="rounded-full bg-sun px-3 py-1 text-xs font-extrabold text-ink">+1 🫧</span>
      </section>

      <Button className="w-full py-5 text-xl" onClick={onStart}>Start pushups ✨</Button>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total pushups" value={profile?.total_reps ?? 0} />
        <Stat label="Blips caught" value={`${caught.length}/${BLIPS.length}`} />
        <Stat label="Sessions" value={profile?.total_sessions ?? 0} />
        <Stat label="Best session" value={profile?.best_session ?? 0} />
      </div>
    </div>
  )
}
