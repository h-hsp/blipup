import { useState } from 'react'
import { BLIPS, RARITY, SETS, type Blip } from '../game/blips'
import type { Rarity } from '../game/catch'
import { BlipArt, Sheet, Stars } from '../components/ui'
import { useStore } from '../lib/store'

export function Dex() {
  const { caught } = useStore()
  const [filter, setFilter] = useState<0 | Rarity>(0)
  const [open, setOpen] = useState<Blip | null>(null)
  const times = new Map(caught.map((c) => [c.blip_id, c.times_caught]))
  const pct = Math.round((caught.length / BLIPS.length) * 100)

  return (
    <div>
      <header className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-extrabold">Blipdex</h1>
        <span className="font-display text-xl font-extrabold text-lime tabular-nums">{caught.length}/{BLIPS.length}</span>
      </header>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#0d0b26] ring-1 ring-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-lime to-sky transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {([0, 1, 2, 3, 4] as const).map((r) => {
          const pool = BLIPS.filter((b) => !r || b.rarity === r)
          const have = pool.filter((b) => times.has(b.id)).length
          return (
            <button key={r} onClick={() => setFilter(r)} aria-pressed={filter === r}
              className={`press mb-1 shrink-0 rounded-xl px-3.5 py-2 text-sm font-extrabold ${filter === r ? 'bg-white text-ink shadow-[0_3px_0_#9a98b8]' : 'bg-ink-3 shadow-[0_3px_0_var(--color-edge)]'}`}>
              {r ? <><span style={{ color: filter === r ? undefined : RARITY[r].color }}>{'★'.repeat(r)}</span> {have}/{pool.length}</> : `All ${have}/${pool.length}`}
            </button>
          )
        })}
      </div>

      {caught.length === 0 && (
        <p className="card mt-6 p-5 text-center text-white/60">
          Your Blipdex is empty… for now. Smash a session to meet your first Blip.
        </p>
      )}

      {SETS.map((set) => {
        const list = set.blips.filter((b) => !filter || b.rarity === filter)
        if (!list.length) return null
        return (
          <section key={set.name} className="mt-6" aria-label={set.name}>
            <h2 className="flex items-baseline justify-between">
              <span className="font-display text-xl font-extrabold">{set.name}</span>
              <span className="text-sm font-bold tabular-nums text-white/50">{set.blips.filter((b) => times.has(b.id)).length}/{set.blips.length}</span>
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-3">
              {list.map((b) => {
                const n = times.get(b.id)
                return (
                  <li key={b.id}>
                    <button onClick={() => setOpen(b)}
                      className={`press relative flex w-full flex-col items-center rounded-3xl px-1 pb-3 pt-2 ${n ? 'card card-glow' : 'border-2 border-dashed border-white/12 bg-white/3'}`}
                      style={n ? { ['--glow' as string]: b.color, ['--edge' as string]: `color-mix(in srgb, ${RARITY[b.rarity].color} 40%, #100d2e)` } : undefined}>
                      {n && n > 1 && <span className="absolute right-2 top-2 z-10 rounded-lg bg-ink px-1.5 text-[10px] font-extrabold">×{n}</span>}
                      <BlipArt blip={b} size={92} locked={!n} idle={false} burst={false} />
                      <span className="mt-1 max-w-full truncate px-1 text-sm font-bold">{n ? b.name : '???'}</span>
                      <Stars n={b.rarity} className="text-xs" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (() => {
          const n = times.get(open.id)
          return (
            <div className="relative text-center">
              {n && <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-64 opacity-50" style={{ background: `radial-gradient(60% 60% at 50% 40%, ${open.color}, transparent 70%)` }} />}
              <div className="relative flex justify-center"><BlipArt blip={open} size={220} locked={!n} burst={!n} /></div>
              <h2 className="relative mt-2 font-display text-3xl font-extrabold">{n ? open.name : '???'}</h2>
              <div className="mt-2"><span className="inline-block rounded-xl px-3 py-1 text-sm font-extrabold text-ink" style={{ background: RARITY[open.rarity].color }}>{'★'.repeat(open.rarity)} {RARITY[open.rarity].label}</span></div>
              <span className="mt-3 inline-block rounded-xl bg-ink-3 px-3 py-1 text-sm font-semibold">{n ? open.trait : `Rumoured to be: ${open.trait}`}</span>
              <p className="mx-auto mt-4 max-w-xs text-white/75">{n ? open.bio : 'Catch it to read its story.'}</p>
              {n && <p className="mt-4 text-sm text-white/45">Caught ×{n} · “{open.catchLine}”</p>}
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}
