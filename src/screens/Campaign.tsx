import { useEffect, useRef } from 'react'
import { LEVELS, levelText, type Level } from '../game/campaign'
import { Button } from '../components/ui'
import { useStore } from '../lib/store'

export function Campaign({ onStart }: { onStart: (level: Level) => void }) {
  const { profile } = useStore()
  const done = Math.min(profile?.campaign_level ?? 0, LEVELS.length)
  const pct = Math.round((done / LEVELS.length) * 100)
  const now = useRef<HTMLLIElement>(null)
  // Open on the level you are up to, not the top of the list.
  useEffect(() => { now.current?.scrollIntoView({ block: 'center' }) }, [done])

  return (
    <div>
      <header className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-extrabold">Campaign</h1>
        <span className="font-display text-xl font-extrabold text-lime tabular-nums">{done}/{LEVELS.length}</span>
      </header>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#0d0b26] ring-1 ring-white/10" role="progressbar" aria-label="Campaign progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-lime to-sky transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm text-white/55">Clear the levels in order. Each one has its own pushup target, and every 5th is a boss worth a Double Bubble.</p>

      {done === LEVELS.length && (
        <section className="card card-glow mt-5 p-5 text-center [--edge:#7a5a1c] [--glow:#ffc94d]">
          <div className="text-4xl" aria-hidden>🏆</div>
          <h2 className="font-display text-2xl font-extrabold">Campaign complete</h2>
          <p className="text-sm text-white/65">All {LEVELS.length} levels cleared. Certified pushup menace.</p>
        </section>
      )}

      <ol className="relative mt-5 space-y-3">
        <span aria-hidden className="absolute bottom-6 left-[20px] top-6 w-1 rounded-full bg-white/8" />
        {LEVELS.map((l) => {
          const cleared = l.n <= done
          const current = l.n === done + 1
          return (
            <li key={l.n} ref={current ? now : undefined} aria-current={current ? 'step' : undefined} className="relative flex items-start gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold ${
                cleared ? 'bg-lime text-ink shadow-[0_3px_0_#7fb01a]'
                  : current ? 'bg-white text-ink shadow-[0_3px_0_#9a98b8]'
                    : 'border-2 border-dashed border-white/15 bg-ink text-white/40'}`}>
                {cleared ? '✓' : l.n}
              </span>

              {current ? (
                <section className="card card-glow min-w-0 flex-1 p-5 [--edge:#4d6b14] [--glow:#c6ff4d]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="label">Level {l.n}</span>
                    <Chips level={l} />
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-extrabold">{l.name}</h2>
                  <p className="text-white/65">{levelText(l)}{l.boss && ' · boss level'}</p>
                  <Button className="mt-4 w-full" onClick={() => onStart(l)}>Start level {l.n}</Button>
                </section>
              ) : (
                <div className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl px-4 py-2 ${cleared ? 'bg-ink-3/70' : 'border-2 border-dashed border-white/12 bg-white/3'}`}>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate font-bold ${cleared ? '' : 'text-white/55'}`}>{l.name}</div>
                    <div className="text-xs text-white/45">{levelText(l)}</div>
                  </div>
                  {cleared ? <span className="text-xs font-extrabold text-lime">Cleared</span> : <><Chips level={l} dim /><span aria-label="Locked">🔒</span></>}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function Chips({ level, dim = false }: { level: Level; dim?: boolean }) {
  return (
    <>
      {level.secs && <span className={`rounded-lg bg-sky px-2 py-0.5 text-[11px] font-extrabold text-ink ${dim ? 'opacity-50' : 'shadow-[0_2px_0_#3a8fb8]'}`}>⏱ {level.secs}s</span>}
      {level.boss && <span className={`rounded-lg bg-sun px-2 py-0.5 text-[11px] font-extrabold text-ink ${dim ? 'opacity-50' : 'shadow-[0_2px_0_#b8862a]'}`}>👑 +1 🫧</span>}
    </>
  )
}
