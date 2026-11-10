import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LEVELS, levelText } from './campaign.ts'

test('20 levels with valid targets and a boss every 5th', () => {
  assert.equal(LEVELS.length, 20)
  for (const l of LEVELS) {
    assert.ok(l.reps >= 5 && l.reps <= 100 && l.reps % 5 === 0, l.name)
    assert.equal(l.boss, l.n % 5 === 0)
  }
})

test('pushup targets match the server list in 004_campaign.sql', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/004_campaign.sql', import.meta.url), 'utf8')
  const camp = sql.match(/camp constant int\[\] := array\[([\d,\s]+)\]/)![1].split(',').map(Number)
  assert.deepEqual(LEVELS.map((l) => l.reps), camp)
})

test('levelText shows the time limit only on timed levels', () => {
  assert.equal(levelText(LEVELS[0]), '5 pushups')
  assert.equal(levelText(LEVELS[2]), '10 pushups in 45s')
})
