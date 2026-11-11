import { test } from 'node:test'
import assert from 'node:assert/strict'
import { catchChance, catchPower, rarityOdds } from './catch.ts'
import { BLIPS } from './blips.ts'

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`)

test('catch power scales 0.5x → 1.5x', () => {
  near(catchPower(5), 0.5)
  near(catchPower(100), 1.5)
})

test('catch chance matches the spec examples and clamps', () => {
  near(catchChance(1, 5), 0.35)
  near(catchChance(1, 100), 0.95) // 1.05 clamped
  near(catchChance(4, 100), 0.225)
  near(catchChance(4, 5), 0.075)
  near(catchChance(3, 5, true), 0.3) // 0.15 doubled
  near(catchChance(1, 100, true), 0.95) // boost never beats the cap
})

test('legendaries locked below 30 reps, odds always sum to 100', () => {
  assert.equal(rarityOdds(25)[4], 0)
  assert.equal(rarityOdds(30)[4], 3)
  for (const t of [5, 29, 30, 100]) {
    const o = rarityOdds(t)
    assert.equal(o[1] + o[2] + o[3] + o[4], 100)
  }
})

test('roster is 24/24/20/14 (82) with unique ids', () => {
  const count = (r: number) => BLIPS.filter((b) => b.rarity === r).length
  assert.deepEqual([count(1), count(2), count(3), count(4)], [24, 24, 20, 14])
  assert.equal(new Set(BLIPS.map((b) => b.id)).size, BLIPS.length)
  assert.equal(BLIPS.length, 82)
})
