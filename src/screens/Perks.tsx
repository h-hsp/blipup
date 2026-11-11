import { useState } from 'react'
import { BLIPS, RARITY, blipById } from '../game/blips'
import { ABILITIES, abilityOf, loadoutTotals, MAX_BLIPS, MAX_PERKS, PERKS, perkMissing, type Kind } from '../game/perks'
import { BlipArt, Stars } from '../components/ui'
import { useStore } from '../lib/store'
import { buzz } from '../lib/fx'
import { rpc } from '../lib/supabase'

const KINDS: Kind[] = ['xp', 'catch', 'saver', 'finder']
const SLOT = 'grid place-items-center rounded-2xl border-2 border-dashed border-white/15 bg-white/3 text-white/35'
const amount = (k: Kind, n: number) => `${k === 'xp' || k === 'catch' ? '+' : ''}${n}%`

/** Loadout: 2 perks (from finished collections) + 3 caught Blips. The server applies the effects. */
export function Perks() {
  const { profile, caught, refresh } = useStore()
  const saved = profile?.loadout ?? { perks: [], blips: [] }
  const [draft, setDraft] = useState<{ perks: string[]; blips: string[] } | null>(null)
  const lo = draft ?? saved
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState<Kind | null>(null)
  const owned = new Set(caught.map((c) => c.blip_id))
  const totals = loadoutTotals(lo.perks, lo.blips)

  async function save(next: { perks: string[]; blips: string[] }) {
    setDraft(next) // show it straight away; the server has the final say
    setErr('')
    buzz(8)
    try {
      await rpc('set_loadout', { p_perks: next.perks, p_blips: next.blips })
      await refresh()
    } catch (e) {
      setErr((e as Error).message)
    }
    setDraft(null)
  }
  const toggle = (key: 'perks' | 'blips', id: string, max: number) => {
    const list = lo[key]
    if (list.includes(id)) return save({ ...lo, [key]: list.filter((x) => x !== id) })
    if (list.length >= max) return setErr('Loadout full: tap one in your loadout to take it off first.')
    save({ ...lo, [key]: [...list, id] })
  }

  const blips = BLIPS.filter((b) => owned.has(b.id) && (!filter || abilityOf(b).kind === filter))
    .sort((a, b) => b.rarity - a.rarity || abilityOf(b).n - abilityOf(a).n)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Perks</h1>
        <p className="mt-1 text-sm text-white/55">Build your loadout: {MAX_PERKS} perks and {MAX_BLIPS} Blips. Finish a Blipdex collection to unlock its perk.</p>
      </header>

      <section className="card card-glow p-5 [--glow:#c6ff4d]" aria-label="Your loadout">
        <div className="label">Loadout</div>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Total effects">
          {KINDS.map((k) => (
            <li key={k} className={`rounded-xl px-2.5 py-1 text-xs font-extrabold ${totals[k] ? 'bg-lime text-ink shadow-[0_2px_0_#7fb01a]' : 'bg-ink-3 text-white/40'}`}>
              {ABILITIES[k].icon} {amount(k, totals[k])} {ABILITIES[k].name}
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {Array.from({ length: MAX_PERKS }, (_, i) => {
            const p = PERKS.find((x) => x.id === lo.perks[i])
            return p ? (
              <button key={i} onClick={() => toggle('perks', p.id, MAX_PERKS)} aria-label={`Take off perk ${p.name}`}
                className="press flex items-center gap-2 rounded-2xl bg-ink-3 p-2.5 text-left shadow-[0_3px_0_var(--color-edge)]">
                <span className="text-2xl" aria-hidden>{p.icon}</span>
                <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{p.name}</span><span className="block truncate text-[11px] text-white/55">{amount(p.kind, p.n)} {ABILITIES[p.kind].name}</span></span>
              </button>
            ) : <div key={i} className={`${SLOT} h-[60px] text-xs font-bold`}>Perk slot</div>
          })}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_BLIPS }, (_, i) => {
            const id = lo.blips[i]
            const b = id ? blipById(id) : null
            if (!b) return <div key={i} className={`${SLOT} h-[124px] text-xs font-bold`}>Blip slot</div>
            const a = abilityOf(b)
            return (
              <button key={i} onClick={() => toggle('blips', b.id, MAX_BLIPS)} aria-label={`Take off ${b.name}`}
                className="press flex h-[124px] flex-col items-center rounded-2xl bg-ink-3 px-1 pt-1 shadow-[0_3px_0_var(--color-edge)]">
                <BlipArt blip={b} size={64} idle={false} burst={false} />
                <span className="max-w-full truncate text-xs font-extrabold">{b.name}</span>
                <span className="text-[10px] font-bold text-lime">{ABILITIES[a.kind].icon} {amount(a.kind, a.n)}</span>
              </button>
            )
          })}
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-pink">{err}</p>}
      </section>

      <section>
        <h2 className="font-display text-xl font-extrabold">Perks</h2>
        <ul className="mt-3 space-y-2.5">
          {PERKS.map((p) => {
            const missing = perkMissing(p, owned).length
            const on = lo.perks.includes(p.id)
            return (
              <li key={p.id}>
                <button disabled={missing > 0} onClick={() => toggle('perks', p.id, MAX_PERKS)} aria-pressed={on}
                  className={`press flex w-full items-center gap-3 rounded-3xl p-3.5 text-left disabled:cursor-not-allowed ${missing ? 'border-2 border-dashed border-white/12 bg-white/3' : on ? 'card card-glow [--glow:#c6ff4d]' : 'card'}`}>
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink-3 text-2xl ${missing ? 'opacity-40 grayscale' : ''}`} aria-hidden>{p.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-extrabold">{p.name}</span>
                    <span className="block text-sm text-white/60">{ABILITIES[p.kind].text(p.n)}</span>
                    <span className="block text-xs text-white/40">{missing ? `Catch every ${p.need === 'all' ? 'Blip' : `${p.need} Blip`} · ${missing} to go` : `Unlocked: ${p.need === 'all' ? 'every Blip caught' : `${p.need} complete`}`}</span>
                  </span>
                  <span className={`shrink-0 text-xs font-extrabold ${on ? 'text-lime' : 'text-white/45'}`}>{missing ? '🔒' : on ? 'Equipped' : 'Equip'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl font-extrabold">Your Blips</h2>
        <p className="mt-1 text-sm text-white/55">Every Blip has an ability. Rarer Blips are stronger.</p>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {[null, ...KINDS].map((k) => (
            <button key={k ?? 'all'} onClick={() => setFilter(k)} aria-pressed={filter === k}
              className={`press mb-1 shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold ${filter === k ? 'bg-white text-ink shadow-[0_3px_0_#9a98b8]' : 'bg-ink-3 shadow-[0_3px_0_var(--color-edge)]'}`}>
              {k ? `${ABILITIES[k].icon} ${ABILITIES[k].name}` : 'All'}
            </button>
          ))}
        </div>
        {blips.length === 0 ? (
          <p className="card mt-3 p-5 text-center text-white/60">{caught.length ? 'No caught Blips with this ability yet.' : 'Catch your first Blip to equip it here.'}</p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {blips.map((b) => {
              const a = abilityOf(b)
              const on = lo.blips.includes(b.id)
              return (
                <li key={b.id}>
                  <button onClick={() => toggle('blips', b.id, MAX_BLIPS)} aria-pressed={on} aria-label={`${b.name}: ${ABILITIES[a.kind].text(a.n)}${on ? ', equipped' : ''}`}
                    className={`press relative flex w-full flex-col items-center rounded-3xl px-1 pb-2.5 pt-2 ${on ? 'card card-glow [--glow:#c6ff4d]' : 'card'}`}
                    style={on ? undefined : { ['--edge' as string]: `color-mix(in srgb, ${RARITY[b.rarity].color} 40%, #100d2e)` }}>
                    {on && <span className="absolute right-2 top-2 z-10 rounded-lg bg-lime px-1.5 text-[10px] font-extrabold text-ink">ON</span>}
                    <BlipArt blip={b} size={80} idle={false} burst={false} />
                    <span className="mt-1 max-w-full truncate px-1 text-sm font-bold">{b.name}</span>
                    <Stars n={b.rarity} className="text-xs" />
                    <span className="mt-1 rounded-lg bg-ink-3 px-1.5 py-0.5 text-[10px] font-extrabold">{ABILITIES[a.kind].icon} {amount(a.kind, a.n)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
