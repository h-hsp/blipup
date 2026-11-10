import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RARITY } from '../game/blips'
import { levelText, type Level } from '../game/campaign'
import { catchChance, catchPower, rarityOdds, DAILY_TARGET, LEGEND_MIN, MAX_REPS, MIN_REPS, type Rarity } from '../game/catch'
import { Button, Stars } from '../components/ui'
import { PushupCam } from '../components/PushupCam'
import { beep, buzz, pref, setPref } from '../lib/fx'
import { localDate, rpc, type Encounter } from '../lib/supabase'
import { Chips } from './Campaign'

const SHELL = 'mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]'
const PILL = 'press rounded-2xl bg-ink-3 px-4 py-2.5 text-sm font-bold shadow-[0_3px_0_var(--color-edge)] disabled:opacity-30'
const HINT = {
  tap: 'Phone on the floor under your face. Tap the screen with your nose or chest at the bottom of each pushup.',
  cam: 'Lean your phone against something on the floor, facing you, so it can see your shoulders and hands. It only counts full pushups.',
}
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** A free session (pick your own target) or, with `level`, one campaign level (fixed target, maybe timed). */
export function Session({ level, onExit, onEncounter }: { level?: Level; onExit: () => void; onEncounter: (e: Encounter, rewards: string[]) => void }) {
  const [target, setTarget] = useState(level?.reps ?? DAILY_TARGET)
  const [phase, setPhase] = useState<'setup' | 'reps'>('setup')
  const [cam, setCam] = useState(() => pref('cam', false))
  const [camErr, setCamErr] = useState('')
  const [reps, setReps] = useState(0)
  const [left, setLeft] = useState(level?.secs ?? 0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const lastTap = useRef(0)

  const done = reps >= target
  const failed = !!level?.secs && left === 0 && !done
  // The clock starts on the first pushup, so getting into position (or the camera loading) costs nothing.
  // shortcut: the time limit is only checked on the client, move it to the server if cheating ever matters
  const running = phase === 'reps' && !!level?.secs && reps > 0 && !done && left > 0
  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left])

  // One counted rep, from a tap or from the camera.
  const count = () => {
    if (failed || busy) return
    const n = reps + 1
    setReps(n)
    beep(400 + Math.min(n / target, 1) * 500)
    buzz(n === target ? [30, 50, 80] : 12)
  }

  const tap = () => {
    const now = performance.now()
    // shortcut: 300ms debounce stops a nose/chest bump double-counting; a real pushup takes > 0.5s
    if (now - lastTap.current < 300) return
    lastTap.current = now
    count()
  }

  async function finish() {
    setBusy(true)
    setErr('')
    try {
      const res = await rpc<{ encounter: Encounter; rewards: string[] }>('complete_session', { p_target: target, p_reps: reps, p_local_date: localDate(), p_level: level?.n ?? null })
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
      <div className={SHELL}>
        <header className="flex items-center justify-between">
          <button className="press grid h-11 w-11 place-items-center rounded-2xl bg-ink-3 text-xl shadow-[0_3px_0_var(--color-edge)]" onClick={onExit} aria-label="Back">←</button>
          <span className="font-display text-lg font-extrabold">{level ? `Level ${level.n}` : 'New session'}</span>
          <span className="w-11" />
        </header>

        <div className="mt-6 text-center">
          <div className="label">{level ? level.name : 'Pushup target'}</div>
          <div className="font-display text-[96px] font-extrabold leading-none tabular-nums">{target}</div>
          {level && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-white/65">
              <span>{levelText(level)}</span>
              <Chips level={level} />
            </div>
          )}
        </div>

        {!level && (
          <>
            <label className="mt-6 block">
              <span className="sr-only">Pushup target</span>
              <input type="range" className="slider w-full" min={MIN_REPS} max={MAX_REPS} step={5} value={target}
                style={{ ['--p' as string]: `${pct}%` }}
                onChange={(e) => { setTarget(+e.target.value); buzz(5) }} />
            </label>
            <div className="mt-2 flex justify-between text-xs text-white/40"><span>Chill · {MIN_REPS}</span><span>Beast · {MAX_REPS}</span></div>
          </>
        )}

        <section className="mt-6">
          <h2 className="label">Count with</h2>
          <div role="radiogroup" aria-label="How to count pushups" className="mt-2 grid grid-cols-2 gap-1.5 rounded-2xl bg-[#0d0b26] p-1.5 ring-1 ring-white/10">
            {([[false, '👆 Tap'], [true, '📷 Camera']] as const).map(([on, text]) => (
              <button key={text} role="radio" aria-checked={cam === on}
                onClick={() => { setCam(on); setPref('cam', on); buzz(5) }}
                className={`press rounded-xl py-2.5 font-extrabold ${cam === on ? 'bg-lime text-ink shadow-[0_3px_0_#7fb01a]' : 'text-white/60'}`}>{text}</button>
            ))}
          </div>
          <p className="mt-2 text-sm text-white/55">{cam ? HINT.cam : HINT.tap}</p>
        </section>

        <section className="card mt-6 p-5">
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
        <Button className="mt-8 w-full" onClick={() => setPhase('reps')}>Start · {level ? levelText(level) : `${target} pushups`}</Button>
      </div>
    )
  }

  const progress = Math.min(reps / target, 1)
  const R = 120
  const C = 2 * Math.PI * R
  return (
    <div className={SHELL}>
      <header className="flex items-center justify-between">
        <button className={PILL} onClick={() => (reps === 0 || confirm('Quit this session? Reps below your target do not count.')) && onExit()}>Quit</button>
        <div className="text-center">
          <div className="text-sm font-semibold text-white/60">{level ? `Level ${level.n} · ${level.name}` : `Target ${target}`}</div>
          {!!level?.secs && (
            <div role="timer" aria-label="Time left" className={`font-display text-2xl font-extrabold leading-tight tabular-nums ${left <= 10 ? 'text-pink' : 'text-sky'}`}>⏱ {clock(left)}</div>
          )}
        </div>
        <button className={PILL} disabled={reps === 0 || failed} onClick={() => setReps((r) => Math.max(0, r - 1))}>Undo</button>
      </header>

      {failed ? (
        <section className="card mt-6 grid flex-1 place-items-center p-6 text-center [--edge:#7a2350]">
          <div className="w-full">
            <div className="text-5xl" aria-hidden>⏰</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold">Time's up</h2>
            <p className="mt-1 text-white/65">You got {reps} of {target}. Catch your breath and go again.</p>
            <Button className="mt-6 w-full" onClick={() => { setReps(0); setLeft(level?.secs ?? 0) }}>Retry level</Button>
            <Button variant="ghost" className="mt-3 w-full" onClick={onExit}>Back to campaign</Button>
          </div>
        </section>
      ) : cam ? (
        <div className="mt-6 flex flex-1 flex-col">
          <PushupCam onRep={count} onError={(m) => { setCamErr(m); setCam(false) }}>
            <div className="absolute left-3 top-3 w-40 rounded-2xl bg-ink/85 p-3">
              <div className="flex items-baseline gap-1.5 font-display font-extrabold tabular-nums">
                <motion.span key={reps} initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.35, bounce: 0.4 }}
                  className="origin-left text-4xl leading-none">{reps}</motion.span>
                <span className="text-white/50">/ {target}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#0d0b26] ring-1 ring-white/10" role="progressbar" aria-label="Pushups done" aria-valuenow={reps} aria-valuemin={0} aria-valuemax={target}>
                <div className={`h-full rounded-full transition-[width] duration-300 ${done ? 'bg-pink' : 'bg-lime'}`} style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </PushupCam>
        </div>
      ) : (
        // The whole stage is one big tap target: phone on the floor, nose/chest taps it each rep.
        <button onPointerDown={tap} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), tap())}
          aria-label={`Count a rep. ${reps} of ${target}`} className="relative mt-6 grid min-h-[320px] flex-1 touch-none place-items-center">
          <svg viewBox="0 0 280 280" className="absolute h-[300px] w-[300px] -rotate-90" aria-hidden>
            <circle cx="140" cy="140" r={R} fill="none" stroke="#ffffff14" strokeWidth="14" />
            <circle cx="140" cy="140" r={R} fill="none" stroke={done ? '#ff6fb5' : '#c6ff4d'} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset 300ms var(--ease-out), stroke 300ms' }} />
          </svg>
          <div className="absolute h-[200px] w-[200px] rounded-full blur-2xl" style={{ background: done ? '#ff6fb5' : '#c6ff4d', opacity: 0.12 + progress * 0.35, transition: 'opacity 300ms' }} />
          <div className="relative text-center">
            <motion.div key={reps} initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.35, bounce: 0.4 }}
              className="font-display text-[110px] font-extrabold leading-none tabular-nums">{reps}</motion.div>
            <div className="mx-auto mt-1 max-w-[190px] text-sm font-semibold text-white/50">{done ? 'Target smashed! Keep going or finish.' : `${target - reps} to go`}</div>
          </div>
        </button>
      )}

      {camErr && !cam && <p role="alert" className="mt-4 text-center text-sm text-sun">{camErr} Switched to tap counting.</p>}
      {!failed && (
        <p className="mx-auto mt-4 max-w-xs text-center text-sm text-white/50">
          {cam ? HINT.cam : HINT.tap}{!!level?.secs && reps === 0 && ' The clock starts on your first pushup.'}
        </p>
      )}
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
