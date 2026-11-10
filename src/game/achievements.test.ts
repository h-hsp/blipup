import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACHIEVEMENTS, type AchCtx } from './achievements.ts'

const profile = { id: 'u', username: 'x', double_bubbles: 2, total_reps: 0, total_sessions: 0, streak: 0, best_streak: 0, best_session: 0, last_session_date: null, daily_claimed_date: null, is_owner: false, campaign_level: 0 }
// Local-time dates, so the checks read the same hours back whatever the machine's time zone.
const at = (y: number, mo: number, d: number, h: number, reps = 20, target = 20) => ({ target, reps, created_at: new Date(y, mo, d, h, 30).toISOString() })
const unlocked = (x: AchCtx) => new Set(ACHIEVEMENTS.filter((a) => a.done(x)).map((a) => a.id))

test('ids are unique', () => {
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length)
})

test('a brand-new player has nothing unlocked', () => {
  assert.equal(unlocked({ p: profile, caught: [], sessions: [] }).size, 0)
})

test('time of day and date achievements read local time', () => {
  // 2026-11-07 is a Saturday, 11-08 a Sunday, 11-16 a Monday.
  const sessions = [at(2026, 10, 7, 6), at(2026, 10, 7, 23), at(2026, 10, 7, 15, 70, 20), at(2026, 10, 8, 18), at(2026, 10, 16, 1)]
  const u = unlocked({ p: profile, caught: [], sessions })
  for (const id of ['early', 'owl', 'midnight', 'golden', 'school', 'clock', 'weekend', 'monday', 'double', 'triple', 'dayhundred', 'comeback', 'over', 'bonus']) assert.ok(u.has(id), id)
  for (const id of ['lunch', 'friday', 'week', 'xmas', 'max', 'chill']) assert.ok(!u.has(id), id)
})

test('stat achievements use the profile and the collection', () => {
  const u = unlocked({ p: { ...profile, total_reps: 1200, best_streak: 7, campaign_level: 5, total_sessions: 10 }, caught: [{ blip_id: 'goat', times_caught: 5 }], sessions: [] })
  for (const id of ['1k', 'unstoppable', 'camp5', 'sess10', 'rankdiamond', 'goat', 'legend', 'besties', 'first']) assert.ok(u.has(id), id)
  assert.ok(!u.has('obsessed'))
})
