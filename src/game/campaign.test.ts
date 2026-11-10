import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LEVELS, levelText } from './campaign.ts'

test('50 levels with valid targets, a boss every 5th and The Century last', () => {
  assert.equal(LEVELS.length, 50)
  assert.deepEqual([LEVELS[49].name, LEVELS[49].reps], ['The Century', 100])
  for (const l of LEVELS) {
    assert.ok(l.reps >= 5 && l.reps <= 100 && l.reps % 5 === 0, l.name)
    assert.equal(l.boss, l.n % 5 === 0)
  }
})

test('pushup targets match the server list in 005_campaign_50.sql', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/005_campaign_50.sql', import.meta.url), 'utf8')
  const camp = sql.match(/camp constant int\[\] := array\[([\d,\s]+)\]/)![1].split(',').map(Number)
  assert.deepEqual(LEVELS.map((l) => l.reps), camp)
})

test('levelText shows the time limit only on timed levels', () => {
  assert.equal(levelText(LEVELS[0]), '5 pushups')
  assert.equal(levelText(LEVELS[3]), '10 pushups in 45s')
})
