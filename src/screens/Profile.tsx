import { useState } from 'react'
import { BLIPS, blipById } from '../game/blips'
import { ACHIEVEMENTS } from '../game/achievements'
import { levelInfo, liveStreak, totalXp } from '../game/progress'
import { BlipArt, Button, Stat } from '../components/ui'
import { useStore } from '../lib/store'
import { pref, setPref } from '../lib/fx'
import { localDate, supabase } from '../lib/supabase'

export function Profile({ onSettings }: { onSettings: () => void }) {
  const { user, profile, caught } = useStore()
  const caughtSet = new Set(caught.map((c) => c.blip_id))
  const avatar = blipById(caught[0]?.blip_id ?? 'blub')
  const { streak } = liveStreak(profile, localDate(), localDate(new Date(Date.now() - 864e5)))
  const xp = profile ? totalXp(profile, caught) : 0
  const { level } = levelInfo(xp)

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="rounded-full bg-white/6 ring-1 ring-white/10"><BlipArt blip={avatar} size={76} locked={!caught[0]} idle={false} burst={false} /></div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold">{profile?.username ?? 'Blipper'}</h1>
          <p className="text-sm text-white/55">{user?.is_anonymous ? 'Guest player' : user?.email}</p>
        </div>
        <button onClick={onSettings} aria-label="Settings" className="press grid h-11 w-11 place-items-center rounded-full bg-white/8 text-xl ring-1 ring-white/10">⚙︎</button>
      </header>

      {user?.is_anonymous && <SaveProgress />}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total pushups" value={profile?.total_reps ?? 0} />
        <Stat label="Sessions" value={profile?.total_sessions ?? 0} />
        <Stat label="Blips collected" value={`${caught.length}/${BLIPS.length}`} />
        <Stat label="Double Bubbles" value={`🫧 ${profile?.double_bubbles ?? 0}`} />
        <Stat label="Level" value={`Lv ${level}`} />
        <Stat label="Total XP" value={xp.toLocaleString()} />
        <Stat label="Current streak" value={`🔥 ${streak}`} />
        <Stat label="Best streak" value={profile?.best_streak ?? 0} />
        <Stat label="Best session" value={profile?.best_session ?? 0} />
      </div>

      <section>
        <h2 className="font-display text-xl font-extrabold">Achievements</h2>
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const done = !!profile && a.done(profile, caughtSet)
            return (
              <li key={a.id} className={`rounded-3xl p-3 text-center ring-1 ${done ? 'bg-lime/12 ring-lime/40' : 'bg-white/4 ring-white/8'}`}>
                <div className={`text-3xl ${done ? '' : 'opacity-30 grayscale'}`} aria-hidden>{a.icon}</div>
                <div className="mt-1 text-xs font-bold">{a.name}</div>
                <div className="text-[10px] leading-tight text-white/45">{done ? 'Unlocked' : a.desc}</div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function SaveProgress() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: location.origin })
    setMsg(error ? error.message : 'Check your inbox and tap the link to lock in your account.')
    setBusy(false)
  }
  return (
    <form onSubmit={save} className="rounded-[28px] bg-pink/12 p-5 ring-1 ring-pink/35">
      <div className="font-display text-lg font-extrabold">Save your progress</div>
      <p className="text-sm text-white/65">You're playing as a guest. Add an email so you never lose your Blips.</p>
      <div className="mt-3 flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email"
          className="min-w-0 flex-1 rounded-full bg-black/30 px-4 py-3 text-base outline-none ring-1 ring-white/15 focus:ring-pink" />
        <button disabled={busy} className="press rounded-full bg-pink px-5 font-bold text-ink">Save</button>
      </div>
      {msg && <p className="mt-2 text-sm text-white/75" role="status">{msg}</p>}
    </form>
  )
}

export function Settings({ onBack }: { onBack: () => void }) {
  const { user, profile, refresh } = useStore()
  const [name, setName] = useState(profile?.username ?? '')
  const [saved, setSaved] = useState('')
  const [, force] = useState(0)

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ username: name.trim() }).eq('id', user.id)
    setSaved(error ? error.message : 'Saved ✓')
    refresh()
  }

  function toggle(key: string, on: boolean) {
    setPref(key, on)
    if (key === 'reminders' && on && 'Notification' in window) Notification.requestPermission()
    force((n) => n + 1)
  }

  async function signOut() {
    if (user?.is_anonymous && !confirm("You're a guest — signing out loses your Blips forever. Save your progress first?\n\nPress OK to sign out anyway.")) return
    await supabase.auth.signOut()
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button className="press grid h-11 w-11 place-items-center rounded-full bg-white/8 text-xl" onClick={onBack} aria-label="Back">←</button>
        <h1 className="font-display text-3xl font-extrabold">Settings</h1>
      </header>

      <form onSubmit={saveName} className="rounded-[28px] bg-white/6 p-5 ring-1 ring-white/10">
        <label htmlFor="name" className="font-display text-lg font-extrabold">Username</label>
        <div className="mt-3 flex gap-2">
          <input id="name" value={name} maxLength={20} required onChange={(e) => { setName(e.target.value); setSaved('') }}
            className="min-w-0 flex-1 rounded-full bg-black/30 px-4 py-3 text-base outline-none ring-1 ring-white/15 focus:ring-lime" />
          <button className="press rounded-full bg-lime px-5 font-bold text-ink">Save</button>
        </div>
        {saved && <p className="mt-2 text-sm text-white/70" role="status">{saved}</p>}
      </form>

      <ul className="divide-y divide-white/8 rounded-[28px] bg-white/6 ring-1 ring-white/10">
        {[
          { key: 'sound', label: 'Sound effects', hint: 'Blips, boops and bubble pops', def: true },
          { key: 'haptics', label: 'Haptics', hint: 'Buzz on every rep (Android)', def: true },
          { key: 'reminders', label: 'Daily reminder', hint: "We'll nudge you once reminders launch", def: false },
        ].map((t) => {
          const on = pref(t.key, t.def)
          return (
            <li key={t.key} className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="font-bold">{t.label}</div>
                <div className="text-sm text-white/50">{t.hint}</div>
              </div>
              <button role="switch" aria-checked={on} aria-label={t.label} onClick={() => toggle(t.key, !on)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-lime' : 'bg-white/15'}`}>
                <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: on ? 'translateX(24px)' : 'none', transitionTimingFunction: 'var(--ease-out)' }} />
              </button>
            </li>
          )
        })}
      </ul>

      <Button variant="ghost" className="w-full" onClick={signOut}>Sign out</Button>
      <p className="text-center text-xs text-white/30">BlipUp v0.1 · Every rep sends a blip.</p>
    </div>
  )
}
