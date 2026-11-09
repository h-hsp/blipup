import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { blipById, RARITY } from '../game/blips'
import { rewardText } from '../game/achievements'
import { BlipArt, Button } from '../components/ui'
import { useStore } from '../lib/store'
import { beep, buzz } from '../lib/fx'
import { rpc, type Encounter as Enc } from '../lib/supabase'

type Phase = 'reveal' | 'ready' | 'throwing' | 'caught' | 'missed' | 'out' | 'escaping' | 'gone'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const OUT = [0.23, 1, 0.32, 1] as const

export function Encounter({ initial, rewards, onDone }: { initial: Enc; rewards: string[]; onDone: () => void }) {
  const { profile, caught, refresh } = useStore()
  const reduce = useReducedMotion()
  const [enc, setEnc] = useState(initial)
  const [phase, setPhase] = useState<Phase>('reveal')
  const [throws, setThrows] = useState(0)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState(rewards.length > 0)
  const blip = blipById(enc.blip_id)
  const color = RARITY[blip.rarity].color
  const chance = enc.boosted ? Math.min(0.95, enc.chance * 2) : enc.chance
  // "New!" is decided when the Blip appears, not after the catch refreshes the collection.
  const isNew = useMemo(() => !caught.some((c) => c.blip_id === enc.blip_id), [enc.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const timesCaught = caught.find((c) => c.blip_id === enc.blip_id)?.times_caught ?? 0

  useEffect(() => {
    if (phase !== 'reveal') return
    blip.rarity >= 3 ? buzz([20, 60, 20, 60, 40]) : buzz(20)
    const stars = Array.from({ length: blip.rarity }, (_, i) => setTimeout(() => beep(520 + i * 160, 0.12), 1500 + i * 180))
    const t = setTimeout(() => setPhase('ready'), reduce ? 300 : 1700 + blip.rarity * 180 + 300)
    return () => { clearTimeout(t); stars.forEach(clearTimeout) }
  }, [phase, enc.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function throwBubble() {
    setPhase('throwing')
    setThrows((n) => n + 1)
    setErr('')
    beep(300, 0.2)
    try {
      const [res] = await Promise.all([rpc<{ caught: boolean; attempts_left: number }>('attempt_catch', { p_encounter: enc.id }), wait(reduce ? 400 : 2100)])
      setEnc((e) => ({ ...e, attempts_left: res.attempts_left }))
      if (res.caught) {
        setPhase('caught')
        buzz([20, 40, 90])
        beep(660, 0.12); setTimeout(() => beep(990, 0.25), 120)
        refresh()
      } else {
        setPhase('missed')
        buzz(80)
        beep(200, 0.25)
        await wait(1300)
        setPhase(res.attempts_left > 0 ? 'ready' : 'out')
      }
    } catch (e) {
      setErr((e as Error).message)
      setPhase('ready')
    }
  }

  async function boost() {
    setErr('')
    try {
      setEnc(await rpc<Enc>('use_double_bubble', { p_encounter: enc.id }))
      buzz([15, 30, 15])
      refresh()
      setPhase('ready')
    } catch (e) { setErr((e as Error).message) }
  }

  async function escape() {
    setPhase('escaping')
    setErr('')
    try {
      const [next] = await Promise.all([rpc<Enc | null>('let_escape', { p_encounter: enc.id }), wait(reduce ? 300 : 1700)])
      if (next) { setEnc(next); setPhase('reveal') } else setPhase('gone')
    } catch (e) { setErr((e as Error).message); setPhase('out') }
  }

  const blipMotion = {
    reveal: { scale: 1, x: 0, rotate: 0, opacity: 1 },
    ready: { scale: 1, x: 0, rotate: 0, opacity: 1 },
    throwing: { scale: 0.42, x: 0, rotate: 0, opacity: 1, transition: { delay: 0.3, duration: 0.25, ease: OUT } },
    caught: { scale: [0.42, 1.12, 1], rotate: 0, opacity: 1, transition: { delay: 0.45, type: 'spring' as const, duration: 0.6, bounce: 0.45 } },
    missed: { scale: 1, x: [0, -14, 14, -9, 9, 0], opacity: 1, transition: { duration: 0.5 } },
    out: { scale: 1, x: 0, opacity: 1 },
    escaping: { x: 420, rotate: 28, scale: 0.9, opacity: 0, transition: { delay: 0.6, duration: 0.7, ease: [0.77, 0, 0.175, 1] as const } },
    gone: { opacity: 0 },
  }[phase]

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0, transition: { duration: 0.2 } }} transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
            className="absolute inset-x-5 top-[max(1rem,env(safe-area-inset-top))] z-30 rounded-3xl bg-sun px-5 py-3 text-ink shadow-xl" role="status">
            <div className="font-display text-lg font-extrabold">+{rewards.length} Double Bubble{rewards.length > 1 ? 's' : ''} 🫧</div>
            <div className="text-sm font-medium">{rewards.map(rewardText).join(' · ')}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage */}
      <div className="relative mt-10 grid h-[340px] place-items-center">
        <div className="absolute h-[300px] w-[300px] rounded-full blur-3xl" style={{ background: color, opacity: phase === 'caught' ? 0.45 : 0.22, transition: 'opacity 400ms' }} />
        {blip.rarity === 4 && <div className="burst absolute h-[360px] w-[360px] opacity-40" style={{ background: `conic-gradient(from 0deg, ${color}, transparent 20%, ${color} 40%, transparent 60%, ${color} 80%, transparent)` }} />}

        {/* Energy orb pops, then the Blip fades in from silhouette */}
        <motion.div key={`orb-${enc.id}`} className="absolute h-28 w-28 rounded-full bg-lime shadow-[0_0_60px_20px_#c6ff4d88]"
          initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: [0.6, 1, 0.9, 1.7], opacity: [1, 1, 1, 0] }} transition={{ duration: reduce ? 0.01 : 1, times: [0, 0.4, 0.7, 1] }} />
        <motion.div key={enc.id} className="relative"
          initial={{ opacity: 0, scale: 0.8, filter: 'brightness(0)' }}
          animate={{ opacity: 1, scale: [0.8, 1.06, 1], filter: ['brightness(0)', 'brightness(0)', 'brightness(1)'] }}
          transition={{ delay: reduce ? 0 : 0.8, duration: reduce ? 0.2 : 1, times: [0, 0.45, 1] }}>
          <motion.div animate={blipMotion}>
            <BlipArt blip={blip} size={260} idle={phase === 'ready' || phase === 'out' || phase === 'caught'} burst={false} />
          </motion.div>
        </motion.div>

        {/* Catch bubble */}
        {(phase === 'throwing' || phase === 'caught' || phase === 'missed') && (
          <motion.div key={`bubble-${throws}`} aria-hidden
            className="absolute h-36 w-36 rounded-full"
            style={{ background: 'radial-gradient(circle at 30% 28%, #ffffffcc 0 8%, #ffffff22 22%, #6fd3ff33 60%, #ff6fb555 100%)', boxShadow: 'inset 0 0 0 3px #ffffffaa, 0 0 40px #6fd3ff66' }}
            initial={{ y: 320, scale: 0.4, opacity: 0, rotate: 0 }}
            animate={
              phase === 'throwing'
                ? { y: 0, scale: 1, opacity: 1, rotate: reduce ? 0 : [0, 0, -14, 12, -10, 8, -4, 0] }
                : phase === 'caught'
                  ? { y: 0, scale: [1, 1.2, 1.6], opacity: [1, 1, 0], rotate: 0 }
                  : { y: 0, scale: 1.7, opacity: 0, rotate: 0 }
            }
            transition={
              phase === 'throwing'
                ? { y: { duration: 0.35, ease: OUT }, scale: { duration: 0.35, ease: OUT }, opacity: { duration: 0.15 }, rotate: { duration: 2, times: [0, 0.2, 0.35, 0.5, 0.65, 0.78, 0.9, 1] } }
                : { duration: 0.45, ease: OUT }
            } />
        )}

        {phase === 'caught' && <Confetti />}
      </div>

      {/* Identity */}
      <motion.div key={`id-${enc.id}`} className="mt-2 text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 1.5, duration: 0.3, ease: OUT }}>
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display text-4xl font-extrabold">{blip.name}</h1>
          {isNew && <span className="rounded-full bg-pink px-2 py-0.5 text-xs font-extrabold text-ink">NEW</span>}
        </div>
        <div className="mt-1 text-sm font-semibold text-white/60">{blip.trait}</div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 ring-1 ring-white/10">
          <span className="flex">
            {Array.from({ length: blip.rarity }, (_, i) => (
              <motion.span key={i} style={{ color }} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduce ? 0 : 1.5 + i * 0.18, type: 'spring', duration: 0.4, bounce: 0.5 }}>★</motion.span>
            ))}
          </span>
          <span className="text-sm font-bold" style={{ color }}>{Math.round(chance * 100)}% catch rate{enc.boosted && ' · 2×'}</span>
        </div>
      </motion.div>

      {/* Tries */}
      <div className="mt-4 flex justify-center gap-2" aria-label={`${enc.attempts_left} tries left`}>
        {Array.from({ length: enc.boosted ? 1 : 2 }, (_, i) => (
          <span key={i} className="h-3 w-3 rounded-full transition-colors duration-200" style={{ background: i < enc.attempts_left ? '#c6ff4d' : '#ffffff22' }} />
        ))}
      </div>

      <div className="flex-1" />
      {err && <p className="mb-3 text-center text-sm text-pink">{err}</p>}

      <div className="min-h-[132px]">
        {phase === 'ready' && <HoldButton onFire={throwBubble} />}
        {phase === 'throwing' && <p className="pt-6 text-center font-display text-2xl font-extrabold text-white/80">wobble… wobble…</p>}
        {phase === 'missed' && <p className="pt-6 text-center font-display text-2xl font-extrabold text-pink">It broke free!</p>}
        {phase === 'caught' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.3, ease: OUT }} className="text-center">
            <p className="font-display text-2xl font-extrabold">“{blip.catchLine}”</p>
            <p className="mt-1 text-sm text-white/55">{isNew ? 'Added to your Blipdex!' : `Caught ×${timesCaught}`}</p>
            <Button className="mt-4 w-full" onClick={onDone}>Nice!</Button>
          </motion.div>
        )}
        {phase === 'out' && (
          <div className="space-y-3">
            <p className="text-center text-sm text-white/60">Both bubbles missed. {blip.name} is getting restless…</p>
            {!enc.boosted && (
              <Button variant="pink" className="w-full" disabled={!profile?.double_bubbles} onClick={boost}>
                Double Bubble · 2× chance ({profile?.double_bubbles ?? 0} left)
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={escape}>Let it bounce</Button>
          </div>
        )}
        {phase === 'escaping' && <p className="pt-6 text-center text-lg font-semibold text-white/70">{blip.escapeLine}</p>}
        {phase === 'gone' && (
          <div className="text-center">
            <p className="text-white/70">No more Blips this session. Your reps and streak still count 💪</p>
            <Button className="mt-4 w-full" onClick={onDone}>Back home</Button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Hold to charge (clip-path fill, slow + linear), release to throw. Release snaps back fast. */
function HoldButton({ onFire }: { onFire: () => void }) {
  const HOLD = 550
  const [holding, setHolding] = useState(false)
  const start = useRef(0)
  return (
    <div>
      <button
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = performance.now(); setHolding(true); buzz(8) }}
        onPointerUp={() => { if (!holding) return; setHolding(false); if (performance.now() - start.current >= HOLD) onFire() }}
        onPointerCancel={() => setHolding(false)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onFire())}
        className="press relative w-full touch-none overflow-hidden rounded-full bg-white/10 py-5 font-display text-xl font-extrabold ring-1 ring-white/15">
        <span className="absolute inset-0 bg-lime"
          style={{ clipPath: holding ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)', transition: holding ? `clip-path ${HOLD}ms linear` : 'clip-path 200ms var(--ease-out)' }} />
        <span className={`relative transition-colors duration-150 ${holding ? 'text-ink' : ''}`}>{holding ? 'Release to throw!' : 'Hold to charge 🫧'}</span>
      </button>
      <p className="mt-2 text-center text-xs text-white/40">Hold, then let go to throw the bubble</p>
    </div>
  )
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    x: `${Math.cos((i / 28) * Math.PI * 2) * (120 + Math.random() * 80)}px`,
    y: `${Math.sin((i / 28) * Math.PI * 2) * (120 + Math.random() * 80) - 40}px`,
    r: `${Math.random() * 720 - 360}deg`,
    c: ['#c6ff4d', '#ff6fb5', '#6fd3ff', '#ffc94d'][i % 4],
    d: Math.random() * 0.2,
  })), [])
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {bits.map((b, i) => (
        <span key={i} className="confetti" style={{ background: b.c, animationDelay: `${0.45 + b.d}s`, ['--x' as string]: b.x, ['--y' as string]: b.y, ['--r' as string]: b.r }} />
      ))}
    </div>
  )
}
