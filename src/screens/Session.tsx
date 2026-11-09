import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RARITY } from '../game/blips'
import { catchChance, catchPower, rarityOdds, DAILY_TARGET, LEGEND_MIN, MAX_REPS, MIN_REPS, type Rarity } from '../game/catch'
import { Button, Stars } from '../components/ui'
import { beep, buzz } from '../lib/fx'
import { localDate, rpc, type Encounter } from '../lib/supabase'

export function Session({ onExit, onEncounter }: { onExit: () => void; onEncounter: (e: Encounter, rewards: string[]) => void }) {
  const [target, setTarget] = useState(DAILY_TARGET)
  const [phase, setPhase] = useState<'setup' | 'reps'>('setup')
  const [reps, setReps] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const lastTap = useRef(0)

  const tap = () => {
    const now = performance.now()
    // shortcut: 300ms debounce stops a nose/chest bump double-counting; a real pushup takes > 0.5s
    if (now - lastTap.current < 300) return
    lastTap.current = now
    const n = reps + 1
    setReps(n)
    beep(400 + Math.min(n / target, 1) * 500)
    buzz(n === target ? [30, 50, 80] : 12)
  }

  async function finish() {
    setBusy(true)
    setErr('')
    try {
      const res = await rpc<{ encounter: Encounter; rewards: string[] }>('complete_session', { p_target: target, p_reps: reps, p_local_date: localDate() })
      onEncounter(res.encounter, res.rewards)
    } catch (e) {
      setErr((e as Error).message)
      setBusy(false)
    }
  }

  if (phase === 'setup') {
    const odds = rarityOdds(target)
    const pct = ((target - MIN_REPS) / (MAX_REPS - MIN_REPS)) * 100
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <button className="press grid h-11 w-11 place-items-center rounded-full bg-white/8 text-xl" onClick={onExit} aria-label="Back">←</button>
          <span className="font-display text-lg font-extrabold">New session</span>
          <span className="w-11" />
        </header>

        <div className="mt-8 text-center">
          <div className="text-sm font-semibold uppercase tracking-widest text-white/50">Pushup target</div>
          <div className="font-display text-[96px] font-extrabold leading-none tabular-nums">{target}</div>
        </div>

        <label className="mt-6 block">
          <span className="sr-only">Pushup target</span>
          <input type="range" className="slider w-full" min={MIN_REPS} max={MAX_REPS} step={5} value={target}
            style={{ ['--p' as string]: `${pct}%` }}
            onChange={(e) => { setTarget(+e.target.value); buzz(5) }} />
        </label>
        <div className="mt-2 flex justify-between text-xs text-white/40"><span>Chill · {MIN_REPS}</span><span>Beast · {MAX_REPS}</span></div>

        <section className="mt-8 rounded-[28px] bg-white/6 p-5 ring-1 ring-white/10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-extrabold">Catch power</h2>
            <motion.span key={target} initial={{ scale: 1.25, color: '#c6ff4d' }} animate={{ scale: 1, color: '#ffffff' }} transition={{ duration: 0.25 }}
              className="font-display text-2xl font-extrabold tabular-nums">×{catchPower(target).toFixed(2)}</motion.span>
          </div>
          <p className="mt-1 text-sm text-white/55">More reps = a louder blip = easier catches.</p>
          <ul className="mt-4 space-y-2.5">
            {([1, 2, 3, 4] as Rarity[]).map((r) => {
              const locked = r === 4 && target < LEGEND_MIN
              return (
                <li key={r} className="flex items-center gap-3 text-sm">
                  <Stars n={r} className="w-14 text-base" />
                  <span className="w-20 text-white/70">{RARITY[r].label}</span>
                  {locked ? (
                    <span className="ml-auto text-white/40">🔒 Unlocks at {LEGEND_MIN}</span>
                  ) : (
                    <>
                      <span className="ml-auto whitespace-nowrap text-white/40">{odds[r]}% appear</span>
                      <span className="w-[5.5rem] whitespace-nowrap text-right font-bold tabular-nums" style={{ color: RARITY[r].color }}>{Math.round(catchChance(r, target) * 100)}% catch</span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <div className="flex-1" />
        <Button className="mt-8 w-full" onClick={() => setPhase('reps')}>Start · {target} pushups</Button>
      </div>
    )
  }

  const done = reps >= target
  const progress = Math.min(reps / target, 1)
  const R = 120
  const C = 2 * Math.PI * R
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <button className="press rounded-full bg-white/8 px-4 py-2.5 text-sm font-semibold" onClick={() => (reps === 0 || confirm('Quit this session? Reps below your target do not count.')) && onExit()}>Quit</button>
        <span className="text-sm font-semibold text-white/60">Target {target}</span>
        <button className="press rounded-full bg-white/8 px-4 py-2.5 text-sm font-semibold disabled:opacity-30" disabled={reps === 0} onClick={() => setReps((r) => Math.max(0, r - 1))}>Undo</button>
      </header>

      {/* The whole stage is one big tap target: phone on the floor, nose/chest taps it each rep. */}
      <button onPointerDown={tap} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), tap())}
        aria-label={`Count a rep. ${reps} of ${target}`} className="relative mt-6 grid flex-1 touch-none place-items-center">
        <svg viewBox="0 0 280 280" className="absolute h-[300px] w-[300px] -rotate-90" aria-hidden>
          <circle cx="140" cy="140" r={R} fill="none" stroke="#ffffff14" strokeWidth="14" />
          <circle cx="140" cy="140" r={R} fill="none" stroke={done ? '#ff6fb5' : '#c6ff4d'} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset 300ms var(--ease-out), stroke 300ms' }} />
        </svg>
        <div className="absolute h-[200px] w-[200px] rounded-full blur-2xl" style={{ background: done ? '#ff6fb5' : '#c6ff4d', opacity: 0.12 + progress * 0.35, transition: 'opacity 300ms' }} />
        <div className="relative text-center">
          <motion.div key={reps} initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.35, bounce: 0.4 }}
            className="font-display text-[110px] font-extrabold leading-none tabular-nums">{reps}</motion.div>
          <div className="mt-1 text-sm font-semibold text-white/50">{done ? 'Target smashed! Keep going or finish.' : `${target - reps} to go`}</div>
        </div>
      </button>

      <p className="mx-auto mt-4 max-w-xs text-center text-sm text-white/50">
        Phone on the floor under your face. Tap the screen with your nose or chest at the bottom of each pushup.
      </p>
      {err && <p className="mt-3 text-center text-sm text-pink">{err}</p>}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            <Button variant="pink" className="mt-5 w-full" disabled={busy} onClick={finish}>{busy ? 'Sending blip…' : 'Find a Blip ✨'}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
