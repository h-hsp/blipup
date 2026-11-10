import { useState } from 'react'
import { StoreProvider, useStore } from './lib/store'
import type { Encounter as Enc } from './lib/supabase'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Session } from './screens/Session'
import { Encounter } from './screens/Encounter'
import { Dex } from './screens/Dex'
import { Profile, Settings } from './screens/Profile'

type Tab = 'home' | 'dex' | 'me' | 'settings'
type View = { name: Tab } | { name: 'session' } | { name: 'encounter'; enc: Enc; rewards: string[] }

export default function App() {
  return <StoreProvider><div className="sky" aria-hidden><i /><i /><i /></div><Shell /></StoreProvider>
}

function Shell() {
  const { user, refresh } = useStore()
  const [view, setView] = useState<View>({ name: 'home' })

  if (user === undefined) return <div className="grid min-h-dvh place-items-center font-display text-3xl font-extrabold">Blip<span className="text-lime">Up</span></div>
  if (!user) return <Onboarding />

  if (view.name === 'session') {
    return <Session onExit={() => setView({ name: 'home' })} onEncounter={(enc, rewards) => { refresh(); setView({ name: 'encounter', enc, rewards }) }} />
  }
  if (view.name === 'encounter') {
    return <Encounter key={view.enc.id} initial={view.enc} rewards={view.rewards} onDone={() => { refresh(); setView({ name: 'home' }) }} />
  }

  const tab = view.name
  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {tab === 'home' && <Home onStart={() => setView({ name: 'session' })} />}
      {tab === 'dex' && <Dex />}
      {tab === 'me' && <Profile onSettings={() => setView({ name: 'settings' })} />}
      {tab === 'settings' && <Settings onBack={() => setView({ name: 'me' })} onEncounter={(enc) => setView({ name: 'encounter', enc, rewards: [] })} />}

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex rounded-full bg-ink-2/90 p-1.5 ring-1 ring-white/10 backdrop-blur-xl">
          {([['home', 'Home', HomeIcon], ['dex', 'Blipdex', DexIcon], ['me', 'Me', MeIcon]] as const).map(([id, label, Icon]) => {
            const active = tab === id || (id === 'me' && tab === 'settings')
            return (
              <button key={id} onClick={() => setView({ name: id })} aria-current={active ? 'page' : undefined}
                className={`press flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-bold transition-colors duration-200 ${active ? 'bg-white/10 text-lime' : 'text-white/55'}`}>
                <Icon />{label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const HomeIcon = () => <svg {...svg}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
const DexIcon = () => <svg {...svg}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
const MeIcon = () => <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
