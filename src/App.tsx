import { useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { StoreProvider, useStore } from './lib/store'
import type { Encounter as Enc } from './lib/supabase'
import type { Level } from './game/campaign'
import { levelInfo, liveStreak, totalXp } from './game/progress'
import { localDate } from './lib/supabase'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Campaign } from './screens/Campaign'
import { Session } from './screens/Session'
import { Encounter } from './screens/Encounter'
import { Dex } from './screens/Dex'
import { Profile, Settings } from './screens/Profile'
import { Perks } from './screens/Perks'
import { Social } from './screens/Social'

type Tab = 'home' | 'campaign' | 'dex' | 'perks' | 'social' | 'me' | 'settings'
type View = { name: Tab } | { name: 'session'; level?: Level } | { name: 'encounter'; enc: Enc; rewards: string[] }

export default function App() {
  return (
    <StoreProvider>
      <div className="sky" aria-hidden><i /><i /><i /></div>
      <MotionConfig reducedMotion="user"><Shell /></MotionConfig>
    </StoreProvider>
  )
}

function Shell() {
  const { user, refresh } = useStore()
  const [view, setView] = useState<View>({ name: 'home' })

  if (user === undefined) return <div className="grid min-h-dvh place-items-center font-display text-3xl font-extrabold">Blip<span className="text-lime">Up</span></div>
  if (!user) return <Onboarding />

  if (view.name === 'session') {
    const back: Tab = view.level ? 'campaign' : 'home'
    return <Session level={view.level} onExit={() => setView({ name: back })}
      onEncounter={(enc, rewards) => { refresh(); setView({ name: 'encounter', enc, rewards }) }} />
  }
  if (view.name === 'encounter') {
    return <Encounter key={view.enc.id} initial={view.enc} rewards={view.rewards} onDone={() => { refresh(); setView({ name: 'home' }) }} />
  }

  const tab = view.name
  return (
    <div className={`mx-auto min-h-dvh max-w-md px-5 pb-32 ${tab === 'settings' ? 'pt-[max(1.25rem,env(safe-area-inset-top))]' : ''}`}>
      {tab !== 'settings' && <TopBar bubbles={tab === 'home'} />}
      {tab === 'home' && <Home onStart={() => setView({ name: 'session' })} />}
      {tab === 'campaign' && <Campaign onStart={(level) => setView({ name: 'session', level })} />}
      {tab === 'dex' && <Dex />}
      {tab === 'perks' && <Perks />}
      {tab === 'social' && <Social />}
      {tab === 'me' && <Profile onSettings={() => setView({ name: 'settings' })} />}
      {tab === 'settings' && <Settings onBack={() => setView({ name: 'me' })} onEncounter={(enc) => setView({ name: 'encounter', enc, rewards: [] })} />}

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="card flex rounded-[26px] p-1.5 [--edge:#0a0820]">
          {([['home', 'Home', HomeIcon], ['campaign', 'Campaign', FlagIcon], ['dex', 'Blipdex', DexIcon], ['perks', 'Perks', PerksIcon], ['social', 'Social', SocialIcon], ['me', 'Me', MeIcon]] as const).map(([id, label, Icon]) => {
            const active = tab === id || (id === 'me' && tab === 'settings')
            return (
              <button key={id} onClick={() => setView({ name: id })} aria-current={active ? 'page' : undefined}
                className={`press relative flex-1 rounded-[20px] py-2 text-[11px] font-extrabold transition-colors duration-200 ${active ? 'text-ink' : 'text-white/60'}`}>
                {active && <motion.span layoutId="tab" className="absolute inset-0 rounded-[20px] bg-lime shadow-[inset_0_1.5px_0_#ffffff80,0_3px_0_#7fb01a]" transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }} />}
                <span className="relative flex flex-col items-center gap-0.5"><Icon />{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

/** Always on the main tabs: logo left; bubbles (Home only), streak and level top right. Sticks while scrolling. */
function TopBar({ bubbles }: { bubbles: boolean }) {
  const { profile, caught } = useStore()
  const { streak } = liveStreak(profile, localDate(), localDate(new Date(Date.now() - 864e5)))
  const { level } = levelInfo(profile ? totalXp(profile, caught) : 0)
  const chip = 'rounded-xl px-3 py-1.5 font-display text-sm font-extrabold tabular-nums'
  return (
    <header className="sticky top-0 z-20 -mx-5 mb-5 flex items-center justify-between bg-ink/75 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur-md">
      <span className="font-display text-2xl font-extrabold">Blip<span className="text-lime">Up</span></span>
      <div className="flex gap-2">
        {bubbles && <span className={`${chip} bg-ink-3 shadow-[0_3px_0_var(--color-edge)]`} aria-label={`${profile?.double_bubbles ?? 0} Double Bubbles`}>🫧 {profile?.double_bubbles ?? 0}</span>}
        <span className={`${chip} ${streak ? 'bg-sun text-ink shadow-[0_3px_0_#b8862a]' : 'bg-ink-3 text-white/60 shadow-[0_3px_0_var(--color-edge)]'}`} aria-label={`${streak} day streak`}>🔥 {streak}</span>
        <span className={`${chip} bg-lime text-ink shadow-[0_3px_0_#7fb01a]`} aria-label={`Level ${level}`}>Lv {level}</span>
      </div>
    </header>
  )
}

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const HomeIcon = () => <svg {...svg}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
const FlagIcon = () => <svg {...svg}><path d="M5 21V4" /><path d="M5 4h13l-3 4.5 3 4.5H5" /></svg>
const DexIcon = () => <svg {...svg}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
const PerksIcon = () => <svg {...svg}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
const SocialIcon = () => <svg {...svg}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.5 2.4 3.5 5.5" /></svg>
const MeIcon =() => <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
