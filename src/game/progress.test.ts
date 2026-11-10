import { test } from 'node:test'
import assert from 'node:assert/strict'
import { levelInfo, liveStreak, nextStreakReward, rankInfo, RANKS, totalXp, xpForLevel } from './progress.ts'

test('level curve', () => {
  assert.equal(levelInfo(0).level, 1)
  assert.equal(levelInfo(499).level, 1)
  assert.equal(levelInfo(500).level, 2)
  assert.equal(levelInfo(1499).level, 2)
  assert.equal(levelInfo(1500).level, 3)
  assert.equal(levelInfo(22500).level, 10)
  for (let l = 1; l < 60; l++) assert.equal(levelInfo(xpForLevel(l)).level, l) // exact boundaries
  assert.deepEqual(levelInfo(700), { level: 2, into: 200, need: 1000, toNext: 800 })
})

test('xp from reps, best streak and catches', () => {
  // 20 reps + 1-day best streak + one 1★ (blub) caught twice + one 4★ (goat)
  const xp = totalXp({ total_reps: 20, best_streak: 1 }, [{ blip_id: 'blub', times_caught: 2 }, { blip_id: 'goat', times_caught: 1 }])
  assert.equal(xp, 200 + 100 + 100 + 500)
})

test('live streak resets after a missed day', () => {
  const p = { total_reps: 0, best_streak: 5, streak: 5, last_session_date: '2026-11-08' }
  assert.deepEqual(liveStreak(p, '2026-11-08', '2026-11-07'), { streak: 5, doneToday: true })
  assert.deepEqual(liveStreak(p, '2026-11-09', '2026-11-08'), { streak: 5, doneToday: false })
  assert.deepEqual(liveStreak(p, '2026-11-10', '2026-11-09'), { streak: 0, doneToday: false })
  assert.deepEqual(liveStreak(null, '2026-11-10', '2026-11-09'), { streak: 0, doneToday: false })
})

test('next streak reward day', () => {
  assert.deepEqual([0, 1, 2, 3, 6, 7, 13, 14].map(nextStreakReward), [3, 3, 3, 7, 7, 14, 14, 21])
})

test('pushup ranks', () => {
  for (let i = 1; i < RANKS.length; i++) assert.ok(RANKS[i].min > RANKS[i - 1].min, RANKS[i].name)
  assert.equal(rankInfo(0).rank.name, 'Rookie')
  assert.equal(rankInfo(49).rank.name, 'Rookie')
  assert.equal(rankInfo(49).toNext, 1)
  assert.equal(rankInfo(50).rank.name, 'Bronze')
  assert.equal(rankInfo(100).pct, 0.5) // halfway from Bronze (50) to Silver (150)
  const top = rankInfo(12000)
  assert.equal(top.rank.name, 'Mythic')
  assert.equal(top.next, undefined)
  assert.equal(top.pct, 1)
})
