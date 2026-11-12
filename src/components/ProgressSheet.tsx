import type { ReactNode } from 'react'
import { Sheet } from './ui'
import { useStore } from '../lib/store'
import { localDate } from '../lib/supabase'
import { DAILY_TARGET } from '../game/catch'
import { CATCH_XP, levelInfo, liveStreak, nextStreakReward, rankInfo, RANKS, STREAK_DAY_XP, totalXp, XP_PER_REP, xpForLevel } from '../game/progress'

export type ProgressKind = 'rank' | 'level' | 'streak' | 'bubbles'

/** Tap any rank / level / streak / bubble display to see every step and what it needs. */
export function ProgressSheet({ kind, onClose }: { kind: ProgressKind | null; onClose: () => void }) {
  return (
    <Sheet open={!!kind} onClose={onClose}>
      {kind === 'rank' && <Ranks />}
      {kind === 'level' && <Levels />}
      {kind === 'streak' && <Streak />}
      {kind === 'bubbles' && <Bubbles />}
    </Sheet>
  )
}

function Head({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <span className="text-4xl" aria-hidden>{icon}</span>
      <div>
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        <p className="text-sm text-white/60">{sub}</p>
      </div>
    </header>
  )
}

/** One step in a ladder: reached ✓, the one you're on, or how far to go. */
function Step({ icon, name, need, done, current, tag = 'you', toGo, color }: {
  icon: ReactNode; name: string; need: string; done: boolean; current?: boolean; tag?: string; toGo?: string; color?: string
}) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${current ? 'bg-lime/15 ring-1 ring-lime/50' : 'bg-white/5'} ${!done ? 'opacity-70' : ''}`}
      aria-current={current ? 'step' : undefined}>
      <span className="grid w-8 place-items-center text-xl" aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display font-extrabold" style={color ? { color } : undefined}>{name}{current && <span className="text-lime"> · {tag}</span>}</span>
        <span className="block text-xs text-white/55">{need}</span>
      </span>
      <span className={`shrink-0 text-xs font-extrabold ${done ? 'text-lime' : 'text-white/60'}`}>{done ? '✓' : toGo}</span>
    </li>
  )
}

function Ranks() {
  const reps = useStore().profile?.total_reps ?? 0
  const { i } = rankInfo(reps)
  return (
    <>
      <Head icon={RANKS[i].icon} title="Pushup ranks" sub={`Ranks only count pushups. You've done ${reps.toLocaleString()}.`} />
      <ol className="space-y-1.5">
        {RANKS.map((r, k) => (
          <Step key={r.name} icon={r.icon} name={r.name} color={r.color} need={`${r.min.toLocaleString()} total pushups`}
            done={reps >= r.min} current={k === i} toGo={`${(r.min - reps).toLocaleString()} to go`} />
        ))}
      </ol>
    </>
  )
}

function Levels() {
  const { profile, caught } = useStore()
  const xp = profile ? totalXp(profile, caught) : 0
  const { level, toNext } = levelInfo(xp)
  const last = Math.max(30, level + 10)
  return (
    <>
      <Head icon="⭐" title={`Level ${level}`} sub={`${xp.toLocaleString()} XP · ${toNext.toLocaleString()} more for Lv ${level + 1}`} />
      <h3 className="label">How you earn XP</h3>
      <ul className="mb-4 mt-2 grid grid-cols-2 gap-2 text-sm">
        {[
          ['💪', `${XP_PER_REP} per pushup`],
          ['🔥', `${STREAK_DAY_XP} per day of your best streak`],
          ['🫧', `Catches: ${CATCH_XP[1]} / ${CATCH_XP[2]} / ${CATCH_XP[3]} / ${CATCH_XP[4]} by ★`],
          ['⚡', 'Bonus XP from perks and Blips in your loadout'],
        ].map(([icon, text]) => <li key={text} className="flex gap-2 rounded-2xl bg-white/5 px-3 py-2"><span aria-hidden>{icon}</span>{text}</li>)}
      </ul>
      <h3 className="label">Every level</h3>
      <ol className="mt-2 space-y-1.5">
        {Array.from({ length: last }, (_, k) => k + 1).map((l) => (
          <Step key={l} icon={<span className="font-display text-base font-extrabold">{l}</span>} name={`Level ${l}`}
            need={`${xpForLevel(l).toLocaleString()} XP total`} done={xp >= xpForLevel(l)} current={l === level}
            toGo={`${(xpForLevel(l) - xp).toLocaleString()} XP to go`} />
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-white/45">Levels keep going forever. Each one needs a bit more XP than the last.</p>
    </>
  )
}

function Streak() {
  const { profile } = useStore()
  const { streak, doneToday } = liveStreak(profile, localDate(), localDate(new Date(Date.now() - 864e5)))
  const best = profile?.best_streak ?? 0
  // reward days: 3, then every 7th (mirrors complete_session)
  const days = [3, ...Array.from({ length: Math.max(8, Math.ceil((streak + 14) / 7)) }, (_, k) => (k + 1) * 7)]
  return (
    <>
      <Head icon="🔥" title={`${streak}-day streak`} sub={`Best ever: ${best} days. ${doneToday ? 'Today is done ✓' : streak ? 'Do a session today to keep it!' : 'Do a session today to start one.'}`} />
      <ul className="mb-4 space-y-1 text-sm text-white/75">
        <li>• Finish at least one session every day. Miss a day and it starts again.</li>
        <li>• Your best streak gives {STREAK_DAY_XP} XP per day.</li>
        <li>• Day 3, then every 7th day, pays a Double Bubble 🫧</li>
      </ul>
      <h3 className="label">Streak rewards</h3>
      <ol className="mt-2 space-y-1.5">
        {days.map((d) => (
          <Step key={d} icon="🫧" name={`Day ${d}`} need="+1 Double Bubble" done={streak >= d} current={d === nextStreakReward(streak)} tag="next"
            toGo={`${d - streak} day${d - streak === 1 ? '' : 's'} to go`} />
        ))}
      </ol>
    </>
  )
}

function Bubbles() {
  const p = useStore().profile
  const reps = p?.total_reps ?? 0
  const ways: [string, string, string][] = [
    ['🎯', 'Daily challenge', `${DAILY_TARGET}+ pushups in one session, once a day`],
    ['🔥', 'Streaks', 'Day 3, then every 7th day of a streak'],
    ['👑', 'Campaign bosses', 'Beat every 5th campaign level'],
  ]
  return (
    <>
      <Head icon="🫧" title={`${p?.double_bubbles ?? 0} Double Bubbles`} sub="Missed both throws? Spend one for a last try at double the catch chance." />
      <h3 className="label">How to get more</h3>
      <ul className="mb-4 mt-2 space-y-1.5">
        {ways.map(([icon, name, need]) => (
          <li key={name} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
            <span className="grid w-8 place-items-center text-xl" aria-hidden>{icon}</span>
            <span><span className="block font-display font-extrabold">{name}</span><span className="block text-xs text-white/55">{need}</span></span>
          </li>
        ))}
      </ul>
      <h3 className="label">Pushup milestones (+1 each)</h3>
      <ol className="mt-2 space-y-1.5">
        {[100, 500, 1000, 5000].map((m) => (
          <Step key={m} icon="💪" name={`${m.toLocaleString()} pushups`} need="+1 Double Bubble" done={reps >= m} toGo={`${(m - reps).toLocaleString()} to go`} />
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-white/45">Tip: a Blip with Bubble Saver in your loadout can keep a Double Bubble after you use it.</p>
    </>
  )
}
