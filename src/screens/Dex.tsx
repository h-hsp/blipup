import { useState } from 'react'
import { BLIPS, RARITY, type Blip } from '../game/blips'
import type { Rarity } from '../game/catch'
import { BlipArt, Sheet, Stars } from '../components/ui'
import { useStore } from '../lib/store'

export function Dex() {
  const { caught } = useStore()
  const [filter, setFilter] = useState<0 | Rarity>(0)
  const [open, setOpen] = useState<Blip | null>(null)
  const times = new Map(caught.map((c) => [c.blip_id, c.times_caught]))
  const list = BLIPS.filter((b) => !filter || b.rarity === filter)
  const pct = Math.round((caught.length / BLIPS.length) * 100)

  return (
    <div>
      <header className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-extrabold">Blipdex</h1>
        <span className="font-display text-xl font-extrabold text-lime tabular-nums">{caught.length}/{BLIPS.length}</span>
      </header>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {([0, 1, 2, 3, 4] as const).map((r) => {
          const pool = BLIPS.filter((b) => !r || b.rarity === r)
          const have = pool.filter((b) => times.has(b.id)).length
          return (
            <button key={r} onClick={() => setFilter(r)} aria-pressed={filter === r}
              className={`press shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ${filter === r ? 'bg-white text-ink ring-white' : 'bg-white/6 ring-white/10'}`}>
              {r ? <><span style={{ color: filter === r ? undefined : RARITY[r].color }}>{'★'.repeat(r)}</span> {have}/{pool.length}</> : `All ${have}/${pool.length}`}
            </button>
          )
        })}
      </div>

      {caught.length === 0 && (
        <p className="mt-6 rounded-3xl bg-white/6 p-5 text-center text-white/60 ring-1 ring-white/10">
          Your Blipdex is empty… for now. Smash a session to meet your first Blip.
        </p>
      )}

      <ul className="mt-4 grid grid-cols-3 gap-3">
        {list.map((b) => {
          const n = times.get(b.id)
          return (
            <li key={b.id}>
              <button onClick={() => setOpen(b)} className="press relative flex w-full flex-col items-center rounded-3xl bg-white/6 px-1 pb-3 pt-2 ring-1 ring-white/8">
                {n && n > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/50 px-1.5 text-[10px] font-bold">×{n}</span>}
                <BlipArt blip={b} size={92} locked={!n} idle={false} />
                <span className="mt-1 max-w-full truncate px-1 text-sm font-bold">{n ? b.name : '???'}</span>
                <Stars n={b.rarity} className="text-xs" />
              </button>
            </li>
          )
        })}
      </ul>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (() => {
          const n = times.get(open.id)
          return (
            <div className="text-center">
              <div className="flex justify-center"><BlipArt blip={open} size={220} locked={!n} /></div>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{n ? open.name : '???'}</h2>
              <div className="mt-1"><Stars n={open.rarity} className="text-lg" /> <span className="text-sm text-white/55">{RARITY[open.rarity].label}</span></div>
              <span className="mt-3 inline-block rounded-full bg-white/8 px-3 py-1 text-sm font-semibold ring-1 ring-white/10">{n ? open.trait : `Rumoured to be: ${open.trait}`}</span>
              <p className="mx-auto mt-4 max-w-xs text-white/75">{n ? open.bio : 'Catch it to read its story.'}</p>
              {n && <p className="mt-4 text-sm text-white/45">Caught ×{n} · “{open.catchLine}”</p>}
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}
