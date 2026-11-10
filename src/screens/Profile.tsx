import { useState } from 'react'
import { BLIPS, blipById } from '../game/blips'
import { ACHIEVEMENTS } from '../game/achievements'
import { LEVELS } from '../game/campaign'
import { levelInfo, liveStreak, totalXp } from '../game/progress'
import { BlipArt, Button, Stat } from '../components/ui'
import { useStore } from '../lib/store'
import { pref, setPref } from '../lib/fx'
import { localDate, rpc, supabase, type Encounter } from '../lib/supabase'

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
        <div className="rounded-3xl bg-ink-3 shadow-[inset_0_1.5px_0_#ffffff26,0_4px_0_var(--color-edge)]"><BlipArt blip={avatar} size={76} locked={!caught[0]} idle={false} burst={false} /></div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold">{profile?.username ?? 'Blipper'}</h1>
          <p className="text-sm text-white/55">{user?.is_anonymous ? 'Guest player' : user?.email}</p>
        </div>
        <button onClick={onSettings} aria-label="Settings" className="press grid h-11 w-11 place-items-center rounded-2xl bg-ink-3 text-xl shadow-[0_3px_0_var(--color-edge)]">⚙︎</button>
      </header>

      {user?.is_anonymous && <SaveProgress />}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total pushups" value={profile?.total_reps ?? 0} tone="text-lime" />
        <Stat label="Sessions" value={profile?.total_sessions ?? 0} tone="text-sky" />
        <Stat label="Blips collected" value={`${caught.length}/${BLIPS.length}`} tone="text-pink" />
        <Stat label="Double Bubbles" value={`🫧 ${profile?.double_bubbles ?? 0}`} />
        <Stat label="Level" value={`Lv ${level}`} tone="text-lime" />
        <Stat label="Total XP" value={xp.toLocaleString()} tone="text-sun" />
        <Stat label="Current streak" value={`🔥 ${streak}`} />
        <Stat label="Best streak" value={profile?.best_streak ?? 0} tone="text-sun" />
        <Stat label="Best session" value={profile?.best_session ?? 0} tone="text-sky" />
        <Stat label="Campaign" value={`${profile?.campaign_level ?? 0}/${LEVELS.length}`} tone="text-pink" />
      </div>

      <section>
        <h2 className="font-display text-xl font-extrabold">Achievements</h2>
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const done = !!profile && a.done(profile, caughtSet)
            return (
              <li key={a.id} className={`rounded-3xl p-3 text-center ${done ? 'card card-glow [--edge:#4d6b14] [--glow:#c6ff4d]' : 'border-2 border-dashed border-white/12 bg-white/3'}`}>
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
    <form onSubmit={save} className="card card-glow p-5 [--edge:#7a2a55] [--glow:#ff6fb5]">
      <div className="font-display text-lg font-extrabold">Save your progress</div>
      <p className="text-sm text-white/65">You're playing as a guest. Add an email so you never lose your Blips.</p>
      <div className="mt-3 flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email"
          className="field min-w-0 flex-1 px-4 py-3 text-base" />
        <button disabled={busy} className="press rounded-2xl bg-pink px-5 font-extrabold text-ink shadow-[0_3px_0_#c23d80]">Save</button>
      </div>
      {msg && <p className="mt-2 text-sm text-white/75" role="status">{msg}</p>}
    </form>
  )
}

export function Settings({ onBack, onEncounter }: { onBack: () => void; onEncounter: (e: Encounter) => void }) {
  const { user, profile, refresh } = useStore()
  const [name, setName] = useState(profile?.username ?? '')
  const [saved, setSaved] = useState('')
  const [, force] = useState(0)

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    // The server decides: a normal rename, or (owner code) owner mode without renaming.
    try {
      const r = await rpc<{ owner: boolean }>('set_username', { p_name: name })
      if (r.owner) setName(profile?.username ?? '')
      setSaved(r.owner ? '👑 Owner mode on. Every Blip unlocked.' : 'Saved ✓')
    } catch (err) {
      setSaved((err as Error).message)
    }
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
        <button className="press grid h-11 w-11 place-items-center rounded-2xl bg-ink-3 text-xl shadow-[0_3px_0_var(--color-edge)]" onClick={onBack} aria-label="Back">←</button>
        <h1 className="font-display text-3xl font-extrabold">Settings</h1>
      </header>

      <form onSubmit={saveName} className="card p-5">
        <label htmlFor="name" className="font-display text-lg font-extrabold">Username</label>
        <div className="mt-3 flex gap-2">
          <input id="name" value={name} maxLength={20} required onChange={(e) => { setName(e.target.value); setSaved('') }}
            className="field min-w-0 flex-1 px-4 py-3 text-base" />
          <button className="press rounded-2xl bg-lime px-5 font-extrabold text-ink shadow-[0_3px_0_#7fb01a]">Save</button>
        </div>
        {saved && <p className="mt-2 text-sm text-white/70" role="status">{saved}</p>}
      </form>

      <ul className="card divide-y divide-white/8">
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

      {profile?.is_owner && <OwnerPanel onEncounter={onEncounter} />}

      <Button variant="ghost" className="w-full" onClick={signOut}>Sign out</Button>
      <p className="text-center text-xs text-white/30">BlipUp v0.2 · Every rep sends a blip.</p>
    </div>
  )
}

/** Owner-only test tools. Every action is re-checked on the server (owner_action). */
function OwnerPanel({ onEncounter }: { onEncounter: (e: Encounter) => void }) {
  const { refresh } = useStore()
  const [msg, setMsg] = useState('')
  const [blip, setBlip] = useState(BLIPS[0].id)

  async function run(action: string, done: string) {
    if (action === 'reset' && !confirm('Reset all your Blips and stats? Owner mode stays on.')) return
    try {
      const r = await rpc<Encounter>('owner_action', { p_action: action, p_blip: action === 'spawn' ? blip : null })
      if (action === 'spawn') return onEncounter(r)
      setMsg(`${done} ✓`)
      refresh()
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  return (
    <section className="card card-glow p-5 [--edge:#7a5a1c] [--glow:#ffc94d]">
      <h2 className="font-display text-lg font-extrabold">👑 Owner mode</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([['unlock_all', 'Unlock all Blips'], ['bubbles', '+10 Double Bubbles'], ['reps', '+100 reps (XP)'], ['reset', 'Reset progress']] as const).map(([a, label]) => (
          <button key={a} onClick={() => run(a, label)} className="press rounded-2xl bg-ink-3 px-3 py-3 text-sm font-bold shadow-[0_3px_0_var(--color-edge)]">{label}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <label htmlFor="spawn" className="sr-only">Blip to spawn</label>
        <select id="spawn" value={blip} onChange={(e) => setBlip(e.target.value)} className="field min-w-0 flex-1 px-4 py-3 text-base">
          {BLIPS.map((b) => <option key={b.id} value={b.id}>{'★'.repeat(b.rarity)} {b.name}</option>)}
        </select>
        <button onClick={() => run('spawn', '')} className="press rounded-2xl bg-sun px-5 font-extrabold text-ink shadow-[0_3px_0_#b8862a]">Spawn</button>
      </div>
      {msg && <p role="status" className="mt-2 text-sm text-white/70">{msg}</p>}
    </section>
  )
}
