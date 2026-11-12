import { useState } from 'react'
import { BLIPS, blipById } from '../game/blips'
import { ACHIEVEMENTS } from '../game/achievements'
import { LEVELS } from '../game/campaign'
import { levelInfo, liveStreak, rankInfo, RANKS, totalXp } from '../game/progress'
import { BlipArt, Button, Stat } from '../components/ui'
import { ProgressSheet, type ProgressKind } from '../components/ProgressSheet'
import { useStore } from '../lib/store'
import { pref, setPref } from '../lib/fx'
import { account, localDate, nameOf, rpc, supabase, type Encounter } from '../lib/supabase'

export function Profile({ onSettings }: { onSettings: () => void }) {
  const { user, profile, caught, sessions } = useStore()
  const unlocked = new Set(profile ? ACHIEVEMENTS.filter((a) => a.done({ p: profile, caught, sessions })).map((a) => a.id) : [])
  const avatar = blipById(caught[0]?.blip_id ?? 'blub')
  const { streak } = liveStreak(profile, localDate(), localDate(new Date(Date.now() - 864e5)))
  const xp = profile ? totalXp(profile, caught) : 0
  const { level } = levelInfo(xp)
  const [info, setInfo] = useState<ProgressKind | null>(null)

  return (
    <div className="space-y-6">
      <ProgressSheet kind={info} onClose={() => setInfo(null)} />
      <header className="flex items-center gap-4">
        <div className="rounded-3xl bg-ink-3 shadow-[inset_0_1.5px_0_#ffffff26,0_4px_0_var(--color-edge)]"><BlipArt blip={avatar} size={76} locked={!caught[0]} idle={false} burst={false} /></div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-3xl font-extrabold">{nameOf(profile)}</h1>
          <p className="truncate text-sm text-white/55">@{profile?.username ?? '…'}{user?.is_anonymous && ' · guest'}</p>
        </div>
        <button onClick={onSettings} aria-label="Settings" className="press grid h-11 w-11 place-items-center rounded-2xl bg-ink-3 text-xl shadow-[0_3px_0_var(--color-edge)]">⚙︎</button>
      </header>

      <RankCard reps={profile?.total_reps ?? 0} onAll={() => setInfo('rank')} />

      {user?.is_anonymous && <SaveProgress />}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total pushups" value={profile?.total_reps ?? 0} tone="text-lime" onClick={() => setInfo('rank')} />
        <Stat label="Sessions" value={profile?.total_sessions ?? 0} tone="text-sky" />
        <Stat label="Blips collected" value={`${caught.length}/${BLIPS.length}`} tone="text-pink" />
        <Stat label="Double Bubbles" value={`🫧 ${profile?.double_bubbles ?? 0}`} onClick={() => setInfo('bubbles')} />
        <Stat label="Level" value={`Lv ${level}`} tone="text-lime" onClick={() => setInfo('level')} />
        <Stat label="Total XP" value={xp.toLocaleString()} tone="text-sun" onClick={() => setInfo('level')} />
        <Stat label="Current streak" value={`🔥 ${streak}`} onClick={() => setInfo('streak')} />
        <Stat label="Best streak" value={profile?.best_streak ?? 0} tone="text-sun" onClick={() => setInfo('streak')} />
        <Stat label="Best session" value={profile?.best_session ?? 0} tone="text-sky" />
        <Stat label="Campaign" value={`${profile?.campaign_level ?? 0}/${LEVELS.length}`} tone="text-pink" />
      </div>

      <section>
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-extrabold">Achievements</h2>
          <span className="font-display text-lg font-extrabold text-lime tabular-nums">{unlocked.size}/{ACHIEVEMENTS.length}</span>
        </header>
        {[...new Set(ACHIEVEMENTS.map((a) => a.cat))].map((cat) => {
          const list = ACHIEVEMENTS.filter((a) => a.cat === cat)
          return (
            <div key={cat} className="mt-5">
              <h3 className="label flex justify-between">{cat}<span className="tabular-nums">{list.filter((a) => unlocked.has(a.id)).length}/{list.length}</span></h3>
              <ul className="mt-2 grid grid-cols-3 gap-3">
                {list.map((a) => {
                  const done = unlocked.has(a.id)
                  return (
                    <li key={a.id} className={`rounded-3xl p-3 text-center ${done ? 'card card-glow [--edge:#4d6b14] [--glow:#c6ff4d]' : 'border-2 border-dashed border-white/12 bg-white/3'}`}>
                      <div className={`text-3xl ${done ? '' : 'opacity-30 grayscale'}`} aria-hidden>{a.icon}</div>
                      <div className="mt-1 text-xs font-bold">{a.name}</div>
                      <div className="text-[10px] leading-tight text-white/45">{done ? 'Unlocked' : a.desc}</div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function RankCard({ reps, onAll }: { reps: number; onAll: () => void }) {
  const { i, rank, next, toNext, pct } = rankInfo(reps)
  const [sel, setSel] = useState<number | null>(null)
  const pick = sel === null ? null : RANKS[sel]
  return (
    <section aria-label={`Rank: ${rank.name}`} className="card card-glow p-5" style={{ ['--glow' as string]: rank.color }}>
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink-3 text-4xl shadow-[inset_0_1.5px_0_#ffffff26,0_3px_0_var(--color-edge)]" aria-hidden>{rank.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="label">Pushup rank</div>
          <div className="font-display text-3xl font-extrabold leading-tight" style={{ color: rank.color }}>{rank.name}</div>
          <div className="text-sm text-white/55">{reps.toLocaleString()} pushups total</div>
        </div>
        <button onClick={onAll} className="press shrink-0 self-start rounded-xl bg-ink-3 px-3 py-1.5 text-xs font-extrabold text-white/80 shadow-[0_3px_0_var(--color-edge)]">All ranks ›</button>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0d0b26] ring-1 ring-white/10" role="progressbar" aria-label={next ? `Progress to ${next.name}` : 'Top rank'}
        aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct * 100}%`, background: rank.color }} />
      </div>
      <div className="mt-1.5 text-xs text-white/45">{next ? `${toNext.toLocaleString()} pushups to ${next.icon} ${next.name}` : 'Top rank. Absolute unit.'}</div>
      <ol className="mt-4 flex justify-between" aria-label="All ranks: tap one to see what it needs">
        {RANKS.map((r, k) => (
          <li key={r.name}>
            <button onClick={() => setSel(sel === k ? null : k)} aria-pressed={sel === k} aria-label={`${r.name}, ${r.min} pushups${k <= i ? ', reached' : ''}`}
              className={`press grid h-7 w-7 place-items-center rounded-lg text-base ${k === i ? 'bg-white/15 ring-2 ring-white/60' : ''} ${sel === k ? 'ring-2' : ''} ${k > i && sel !== k ? 'opacity-30 grayscale' : ''}`}
              style={sel === k ? { ['--tw-ring-color' as string]: r.color } : undefined}>{r.icon}</button>
          </li>
        ))}
      </ol>
      {pick && (
        <div role="status" className="mt-3 flex items-center gap-3 rounded-2xl bg-ink/60 px-3 py-2.5 ring-1 ring-white/10">
          <span className="text-2xl" aria-hidden>{pick.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="font-display font-extrabold" style={{ color: pick.color }}>{pick.name}</div>
            <div className="text-xs text-white/60">{pick.min.toLocaleString()} total pushups</div>
          </div>
          <span className={`text-xs font-extrabold ${reps >= pick.min ? 'text-lime' : 'text-white/60'}`}>{reps >= pick.min ? 'Reached ✓' : `${(pick.min - reps).toLocaleString()} to go`}</span>
        </div>
      )}
    </section>
  )
}

/** Guests lock in their Blips with a username + password (or, optionally, an email link). */
function SaveProgress() {
  const { refresh } = useStore()
  const [withEmail, setWithEmail] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    if (withEmail) {
      const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: location.origin })
      setMsg(error ? error.message : 'Check your inbox and tap the link to lock in your account.')
    } else {
      try {
        await account('signup', username, password)
        await refresh()
      } catch (err) {
        setMsg((err as Error).message)
      }
    }
    setBusy(false)
  }
  const field = 'field w-full px-4 py-3 text-base'
  return (
    <form onSubmit={save} className="card card-glow space-y-2 p-5 [--edge:#7a2a55] [--glow:#ff6fb5]">
      <div className="font-display text-lg font-extrabold">Save your progress</div>
      <p className="text-sm text-white/65">You're playing as a guest. Pick a username and password so you never lose your Blips.</p>
      {withEmail ? (
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" aria-label="Email" className={field} />
      ) : (
        <>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" aria-label="Username"
            autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} className={field} />
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" aria-label="Password"
            autoComplete="new-password" className={field} />
        </>
      )}
      <button disabled={busy} className="press w-full rounded-2xl bg-pink py-3 font-extrabold text-ink shadow-[0_3px_0_#c23d80]">{busy ? 'Saving…' : 'Save'}</button>
      <button type="button" className="w-full py-1 text-sm text-white/60" onClick={() => { setWithEmail(!withEmail); setMsg('') }}>
        {withEmail ? 'Use a username and password' : 'Use an email instead'}
      </button>
      {msg && <p className="text-sm text-white/75" role="status">{msg}</p>}
    </form>
  )
}

/** One-line text setting with a Save button. */
function SettingField({ id, label, hint, initial, type = 'text', save }: {
  id: string; label: string; hint: string; initial: string; type?: string
  /** returns the message to show, and optionally what the box should hold afterwards */
  save: (v: string) => Promise<string | [string, string]>
}) {
  const [value, setValue] = useState(initial)
  const [msg, setMsg] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const r = await save(value)
      if (Array.isArray(r)) { setMsg(r[0]); setValue(r[1]) } else setMsg(r)
    } catch (err) { setMsg((err as Error).message) }
  }
  return (
    <form onSubmit={submit} className="card p-5">
      <label htmlFor={id} className="font-display text-lg font-extrabold">{label}</label>
      <p className="text-sm text-white/50">{hint}</p>
      <div className="mt-3 flex gap-2">
        <input id={id} type={type} value={value} maxLength={type === 'password' ? 72 : 20} autoCapitalize="none" spellCheck={false}
          autoComplete={type === 'password' ? 'new-password' : 'off'} onChange={(e) => { setValue(e.target.value); setMsg('') }}
          className="field min-w-0 flex-1 px-4 py-3 text-base" />
        <button className="press rounded-2xl bg-lime px-5 font-extrabold text-ink shadow-[0_3px_0_#7fb01a]">Save</button>
      </div>
      {msg && <p className="mt-2 text-sm text-white/70" role="status">{msg}</p>}
    </form>
  )
}

export function Settings({ onBack, onEncounter }: { onBack: () => void; onEncounter: (e: Encounter) => void }) {
  const { user, profile, refresh } = useStore()
  const [, force] = useState(0)

  async function saveDisplayName(v: string) {
    await rpc('set_display_name', { p_name: v })
    await refresh()
    return 'Saved ✓'
  }
  async function saveUsername(v: string) {
    // The server decides: a rename (unique), or (owner code) owner mode without renaming.
    const r = await rpc<{ owner: boolean }>('set_username', { p_name: v })
    await refresh()
    // never leave the owner code sitting in the box
    return r.owner ? ['👑 Owner mode on. Every Blip unlocked.', profile?.username ?? ''] as [string, string] : 'Saved ✓'
  }
  async function savePassword(v: string) {
    if (v.length < 8) throw new Error('Passwords need 8 or more characters')
    const { error } = await supabase.auth.updateUser({ password: v })
    if (error) throw new Error(error.message)
    return ['Password saved ✓ Log in with your username and this password.', ''] as [string, string]
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

      {profile && <>
        <SettingField id="display" label="Display name" hint="What everyone sees. Change it whenever; anyone can use the same one. Leave empty to show your username."
          initial={profile.display_name ?? ''} save={saveDisplayName} />
        <SettingField id="username" label="Username" hint="Only you can have it. You log in with it and friends add you by it."
          initial={profile.username} save={saveUsername} />
      </>}
      {user && !user.is_anonymous && (
        <SettingField id="password" type="password" label="Password" hint="Set or change the password you log in with."
          initial="" save={savePassword} />
      )}

      <ul className="card divide-y divide-white/8">
        {[
          { key: 'sound', label: 'Sound effects', hint: 'Blips, boops, bubble pops and spoken rep counts', def: true },
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
      <p className="text-center text-xs text-white/30">BlipUp v0.4 · Every rep sends a blip.</p>
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
