import { useCallback, useEffect, useState } from 'react'
import { rpc } from '../lib/supabase'

type Row = { rank: number; username: string; name: string; reps: number; me: boolean }
type Board = { resets_at: string; top: Row[]; me: { rank: number; reps: number } | null }
type Person = { id: string; username: string; name: string }
type Friends = { friends: Person[]; incoming: Person[]; outgoing: Person[] }

/** "2d 5h" until the Sunday-midnight reset */
function timeLeft(iso: string) {
  const m = Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 60000))
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60)
  return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m % 60}m`
}

const MEDAL = ['🥇', '🥈', '🥉']

export function Social() {
  const [scope, setScope] = useState<'global' | 'friends'>('global')
  const [board, setBoard] = useState<Board | null>(null)
  const [friends, setFriends] = useState<Friends>({ friends: [], incoming: [], outgoing: [] })
  const [add, setAdd] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const [b, f] = await Promise.all([rpc<Board>('leaderboard', { p_scope: scope }), rpc<Friends>('my_friends', {})])
    setBoard(b)
    setFriends(f)
  }, [scope])
  useEffect(() => { load().catch((e) => setMsg(e.message)) }, [load])

  async function act(fn: string, args: Record<string, unknown>, done?: string) {
    try {
      const r = await rpc<{ status?: string } | null>(fn, args)
      setMsg(r?.status === 'friends' ? `You and ${args.p_name} are friends now 🙌` : r?.status === 'sent' ? `Request sent to ${args.p_name}` : done ?? '')
      if (fn === 'add_friend') setAdd('')
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  const meInTop = board?.top.some((r) => r.me)
  const tab = (id: typeof scope, label: string) => (
    <button onClick={() => setScope(id)} aria-pressed={scope === id}
      className={`press flex-1 rounded-xl py-2 text-sm font-extrabold transition-colors duration-200 ${scope === id ? 'bg-lime text-ink shadow-[0_3px_0_#7fb01a]' : 'text-white/60'}`}>{label}</button>
  )

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Social</h1>

      <section className="card p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold">This week</h2>
          {board && <span className="text-xs font-bold text-white/50">Resets Sunday midnight · {timeLeft(board.resets_at)}</span>}
        </div>
        <div className="mt-3 flex gap-1 rounded-2xl bg-ink-3 p-1">{tab('global', 'Global')}{tab('friends', 'Friends')}</div>
        <ol className="mt-3 space-y-1.5">
          {board?.top.map((r) => <BoardRow key={r.username} r={r} />)}
          {board && !board.top.length && <li className="py-4 text-center text-sm text-white/50">No pushups yet this week. Be first!</li>}
          {board?.me && !meInTop && board.me.reps > 0 && (
            <><li className="text-center text-white/30" aria-hidden>⋯</li><BoardRow r={{ rank: board.me.rank, username: '', name: 'You', reps: board.me.reps, me: true }} /></>
          )}
        </ol>
        {scope === 'friends' && board && board.top.length <= 1 && <p className="mt-3 text-center text-sm text-white/50">Add friends below to race them every week.</p>}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-xl font-extrabold">Friends</h2>
        <form onSubmit={(e) => { e.preventDefault(); act('add_friend', { p_name: add.trim() }) }} className="flex gap-2">
          <label htmlFor="add" className="sr-only">Friend's username</label>
          <input id="add" required value={add} onChange={(e) => { setAdd(e.target.value); setMsg('') }} placeholder="Their username"
            autoCapitalize="none" spellCheck={false} maxLength={20} className="field min-w-0 flex-1 px-4 py-3 text-base" />
          <button className="press rounded-2xl bg-lime px-5 font-extrabold text-ink shadow-[0_3px_0_#7fb01a]">Add</button>
        </form>
        {msg && <p role="status" className="text-sm text-white/75">{msg}</p>}

        {friends.incoming.length > 0 && (
          <List title="Requests" people={friends.incoming} actions={(p) => <>
            <Small tone="bg-lime text-ink" onClick={() => act('answer_friend', { p_user: p.id, p_accept: true }, `You and ${p.name} are friends now 🙌`)}>Accept</Small>
            <Small onClick={() => act('answer_friend', { p_user: p.id, p_accept: false })} label={`Decline ${p.name}`}>✕</Small>
          </>} />
        )}
        <List title={`Friends (${friends.friends.length})`} people={friends.friends} empty="No friends yet. Add someone by their username."
          actions={(p) => <Small label={`Remove ${p.name}`} onClick={() => confirm(`Remove ${p.name} from your friends?`) && act('remove_friend', { p_user: p.id })}>✕</Small>} />
        {friends.outgoing.length > 0 && (
          <List title="Waiting for them" people={friends.outgoing}
            actions={(p) => <Small onClick={() => act('remove_friend', { p_user: p.id })}>Cancel</Small>} />
        )}
      </section>
    </div>
  )
}

function BoardRow({ r }: { r: Row }) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${r.me ? 'bg-lime/15 ring-1 ring-lime/50' : 'bg-white/5'}`}>
      <span className="w-8 text-center font-display text-lg font-extrabold tabular-nums">{MEDAL[r.rank - 1] ?? r.rank}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{r.name}{r.me && r.username && <span className="text-lime"> (you)</span>}</span>
        {r.username && <span className="block truncate text-xs text-white/45">@{r.username}</span>}
      </span>
      <span className="font-display text-lg font-extrabold tabular-nums text-lime">{r.reps.toLocaleString()}</span>
    </li>
  )
}

function List({ title, people, actions, empty }: { title: string; people: Person[]; actions: (p: Person) => React.ReactNode; empty?: string }) {
  return (
    <div>
      <h3 className="label">{title}</h3>
      {!people.length && empty && <p className="mt-2 text-sm text-white/50">{empty}</p>}
      <ul className="mt-2 space-y-1.5">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{p.name}</span>
              <span className="block truncate text-xs text-white/45">@{p.username}</span>
            </span>
            {actions(p)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Small({ children, onClick, tone = 'bg-ink-3 text-white/80', label }: { children: React.ReactNode; onClick: () => void; tone?: string; label?: string }) {
  return <button onClick={onClick} aria-label={label} className={`press rounded-xl px-3 py-1.5 text-sm font-extrabold shadow-[0_3px_0_var(--color-edge)] ${tone}`}>{children}</button>
}
