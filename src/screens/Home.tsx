import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BLIPS, blipById } from '../game/blips'
import { DAILY_TARGET } from '../game/catch'
import { levelInfo, liveStreak, nextStreakReward, totalXp, XP_PER_REP } from '../game/progress'
import { BlipArt, Button, Stars, Stat } from '../components/ui'
import { useStore } from '../lib/store'
import { beep, buzz } from '../lib/fx'
import { localDate } from '../lib/supabase'

const HYPE = [
  'Your Blips are waiting. Probably napping, but waiting.',
  'One session a day keeps Icky away.',
  "Main character energy only. Let's go.",
  'Lock in. The Blipdex will not fill itself.',
  'Rumour says a GOAT was spotted near 30+ reps…',
  'Touch grass? Touch floor. With your nose. 20 times.',
]
const DAY = 864e5

export function Home({ onStart }: { onStart: () => void }) {
  const { profile, caught } = useStore()
  const today = localDate()
  const { streak, doneToday } = liveStreak(profile, today, localDate(new Date(Date.now() - DAY)))
  const xp = profile ? totalXp(profile, caught) : 0
  const lvl = levelInfo(xp)
  const [celebrate, dismiss] = useCelebration(!!profile, xp, lvl.level, streak)
  const dailyDone = profile?.daily_claimed_date === today
  const featured = caught[0] ? blipById(caught[0].blip_id) : null
  const mystery = useMemo(() => BLIPS.find((b) => !caught.some((c) => c.blip_id === b.id)) ?? BLIPS[0], [caught])
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Morning' : hour < 18 ? 'Arvo' : 'Evening'
  const hype = HYPE[new Date().getDate() % HYPE.length]

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl font-extrabold">Blip<span className="text-lime">Up</span></span>
        <div className="flex gap-2">
          <span className="rounded-full bg-lime px-3 py-1.5 text-sm font-extrabold text-ink" aria-label={`Level ${lvl.level}`}>Lv {lvl.level}</span>
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm font-bold ring-1 ring-white/10" aria-label={`${profile?.double_bubbles ?? 0} Double Bubbles`}>🫧 {profile?.double_bubbles ?? 0}</span>
        </div>
      </header>

      <AnimatePresence>
        {celebrate && (
          <motion.button key="celebrate" onClick={dismiss} aria-live="polite"
            initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.35 }}
            className="block w-full rounded-[28px] bg-gradient-to-r from-lime to-sun p-4 text-left text-ink shadow-[0_8px_40px_#c6ff4d44]">
            <div className="font-display text-2xl font-extrabold">{celebrate[0]}</div>
            {celebrate.length > 1 && <div className="font-bold">{celebrate.slice(1).join('  ·  ')}</div>}
          </motion.button>
        )}
      </AnimatePresence>

      <div>
        <h1 className="font-display text-3xl font-extrabold">{greet}, {profile?.username ?? 'Blipper'}</h1>
        <p className="mt-1 text-white/60">{hype}</p>
      </div>

      <StreakHero streak={streak} doneToday={doneToday} best={profile?.best_streak ?? 0} pop={!!celebrate} />
      <LevelBar {...lvl} />

      <Button className="w-full py-5 text-xl" onClick={onStart}>{doneToday || streak === 0 ? 'Start pushups ✨' : `Save your ${streak}-day streak 🔥`}</Button>

      <section className="relative flex items-center gap-4 overflow-hidden rounded-[32px] bg-gradient-to-br from-ink-3 to-ink-2 p-5 ring-1 ring-white/10">
        <BlipArt blip={featured ?? mystery} size={128} locked={!featured} />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/45">{featured ? 'Latest catch' : 'Spotted nearby'}</div>
          <div className="font-display text-2xl font-extrabold">{featured ? featured.name : '???'}</div>
          {featured ? <Stars n={featured.rarity} /> : <p className="text-sm text-white/55">Finish a session to find out who it is.</p>}
        </div>
      </section>

      <section className="flex items-center gap-4 rounded-[28px] bg-white/6 p-5 ring-1 ring-white/10">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun/20 text-2xl">{dailyDone ? '✅' : '🎯'}</div>
        <div className="flex-1">
          <div className="font-display text-lg font-extrabold">Daily challenge</div>
          <div className="text-sm text-white/60">{dailyDone ? 'Done! Come back tomorrow.' : `${DAILY_TARGET}+ pushups in one session`}</div>
        </div>
        <span className="rounded-full bg-sun px-3 py-1 text-xs font-extrabold text-ink">+1 🫧</span>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total pushups" value={profile?.total_reps ?? 0} />
        <Stat label="Blips caught" value={`${caught.length}/${BLIPS.length}`} />
        <Stat label="Sessions" value={profile?.total_sessions ?? 0} />
        <Stat label="Total XP" value={xp.toLocaleString()} />
      </div>
    </div>
  )
}

function StreakHero({ streak, doneToday, best, pop }: { streak: number; doneToday: boolean; best: number; pop: boolean }) {
  const alive = streak > 0
  const next = nextStreakReward(streak)
  const end = doneToday ? 0 : 1 // how many days ago the streak's latest day was
  const days = Array.from({ length: 7 }, (_, i) => 6 - i).map((ago) => ({
    ago,
    label: new Date(Date.now() - ago * DAY).toLocaleDateString('en-AU', { weekday: 'narrow' }),
    lit: alive && ago >= end && ago < end + streak,
  }))
  const status = doneToday
    ? 'Locked in for today. See you tomorrow.'
    : alive
      ? `Do a session in the next ${24 - new Date().getHours()}h or it resets!`
      : 'Do a session today to start a streak.'

  return (
    <section aria-label={`${streak} day streak`}
      className={`relative overflow-hidden rounded-[32px] p-5 ring-1 ${alive ? 'bg-gradient-to-br from-[#ff7a2f40] via-[#ff3d8a26] to-ink-2 ring-[#ff9a4d55]' : 'bg-white/6 ring-white/10'}`}>
      {alive && <div className="absolute -left-8 -top-10 h-40 w-40 rounded-full bg-[#ff7a2f] opacity-30 blur-3xl" />}
      <div className="relative flex items-center gap-4">
        <span className={`text-6xl ${alive ? 'flame' : 'opacity-40 grayscale'}`} aria-hidden>🔥</span>
        <div className="flex-1">
          <motion.div key={streak} initial={pop ? { scale: 1.5 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6, bounce: 0.5 }}
            className="origin-left font-display text-6xl font-extrabold leading-none tabular-nums">{streak}</motion.div>
          <div className="font-display text-lg font-extrabold">day streak</div>
        </div>
        <div className="text-right text-xs text-white/55">Best<div className="font-display text-xl font-extrabold text-white">{best}</div></div>
      </div>

      <ol className="relative mt-4 flex justify-between">
        {days.map((d) => (
          <li key={d.ago} className="flex flex-col items-center gap-1 text-[11px] font-bold text-white/50">
            <span className={`grid h-9 w-9 place-items-center rounded-full text-base ${d.lit ? 'bg-gradient-to-b from-[#ffb04d] to-[#ff5a3d] text-white' : 'bg-white/8'} ${d.ago === 0 ? 'ring-2 ring-white/70' : ''}`}>
              {d.lit ? '🔥' : ''}
            </span>
            {d.label}
          </li>
        ))}
      </ol>

      <p className={`relative mt-4 text-sm font-semibold ${alive && !doneToday ? 'text-sun' : 'text-white/70'}`}>{status}</p>
      <p className="relative mt-1 text-xs text-white/50">🫧 +1 Double Bubble at day {next} · {next - streak} to go</p>
    </section>
  )
}

function LevelBar({ level, into, need, toNext }: { level: number; into: number; need: number; toNext: number }) {
  return (
    <section className="flex items-center gap-4 rounded-[28px] bg-white/6 p-4 ring-1 ring-white/10">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-lime font-display text-2xl font-extrabold text-ink">{level}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-lg font-extrabold">Level {level}</span>
          <span className="text-xs tabular-nums text-white/55">{into.toLocaleString()} / {need.toLocaleString()} XP</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full origin-left rounded-full bg-gradient-to-r from-lime to-sky" style={{ transform: `scaleX(${into / need})`, transition: 'transform 600ms var(--ease-out)' }} />
        </div>
        <div className="mt-1.5 text-xs text-white/45">{toNext.toLocaleString()} XP to Level {level + 1} · {XP_PER_REP} XP per pushup</div>
      </div>
    </section>
  )
}

/** Shows what changed since this device last saw Home (after a session): XP gained, streak up, level up. */
function useCelebration(ready: boolean, xp: number, level: number, streak: number) {
  const [lines, setLines] = useState<string[] | null>(null)
  useEffect(() => {
    if (!ready) return
    let seen: { xp: number; level: number; streak: number } | null = null
    try { seen = JSON.parse(localStorage.getItem('blip.seen') ?? 'null') } catch { /* private mode */ }
    try { localStorage.setItem('blip.seen', JSON.stringify({ xp, level, streak })) } catch { /* private mode */ }
    if (!seen || xp <= seen.xp) return
    const out = [`+${(xp - seen.xp).toLocaleString()} XP`]
    if (level > seen.level) out.push(`Level ${level}!`)
    if (streak > seen.streak) out.push(streak === 1 ? 'Streak started 🔥' : `${streak}-day streak 🔥`)
    setLines(out)
    beep(level > seen.level ? 990 : 760, 0.15)
    buzz(level > seen.level ? [30, 60, 30, 60, 90] : [20, 40, 20])
  }, [ready, xp, level, streak])
  useEffect(() => {
    if (!lines) return
    const t = setTimeout(() => setLines(null), 5000)
    return () => clearTimeout(t)
  }, [lines])
  return [lines, () => setLines(null)] as const
}
