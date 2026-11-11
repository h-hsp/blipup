import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BLIPS, SETS } from './blips.ts'
import { ABILITIES, abilityOf, loadoutTotals, PERK_LEVELS, perkLevel, PERKS } from './perks.ts'

const sql = readFileSync(new URL('../../supabase/migrations/007_loadout.sql', import.meta.url), 'utf8')

test('server ability list matches the app (007_loadout.sql)', () => {
  const rows = new Map([...sql.matchAll(/\('([a-z0-9]+)', '([^']+)', '(xp|catch|saver|finder)'\)/g)].map((m) => [m[1], [m[2], m[3]]]))
  assert.equal(rows.size, BLIPS.length)
  for (const s of SETS) for (const b of s.blips) assert.deepEqual(rows.get(b.id), [s.name, abilityOf(b).kind], b.id)
  for (const k of ['xp', 'catch', 'saver', 'finder'] as const) {
    if (k !== 'finder') assert.ok(sql.includes(`'${k}' then (array[${ABILITIES[k].power.join(',')}])[b.rarity]`), k)
  }
  assert.ok(sql.includes(`else (array[${ABILITIES.finder.power.join(',')}])[b.rarity]`))
  for (const p of PERKS) assert.ok(sql.includes(`('${p.id}', '${p.kind}', ${p.n}, ${p.need === 'all' ? 'null' : `'${p.need}'`})`), p.id)
})

test('every ability shows up in every collection', () => {
  for (const s of SETS.filter((x) => x.blips.length >= 4)) assert.equal(new Set(s.blips.map((b) => abilityOf(b).kind)).size, 4, s.name)
})

test('perks level up with the collection and only reach their full boost when it is complete', () => {
  const head = PERKS.find((p) => p.id === 'headstart')! // Originals: 6 Blips, +10% XP at max
  const originals = SETS[0].blips.map((b) => b.id)
  const at = (n: number) => perkLevel(head, new Set(originals.slice(0, n)))
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((n) => at(n).level), [0, 0, 1, 2, 3, 4, 5])
  assert.deepEqual([0, 2, 4, 6].map((n) => at(n).n), [0, 2, 6, 10])
  assert.equal(at(2).nextAt, 3)
  assert.equal(at(6).nextAt, null)
  // every perk's value is a whole number at every level, and never above today's max
  for (const p of PERKS) for (let l = 0; l <= PERK_LEVELS; l++) assert.ok(Number.isInteger((p.n * l) / PERK_LEVELS) && (p.n * l) / PERK_LEVELS <= p.n, p.id)
  // same perk rows in the levels migration
  const sql9 = readFileSync(new URL('../../supabase/migrations/009_perk_levels.sql', import.meta.url), 'utf8')
  for (const p of PERKS) assert.ok(sql9.includes(`('${p.id}', '${p.kind}', ${p.n}, ${p.need === 'all' ? 'null' : `'${p.need}'`})`), p.id)
})

test('loadout totals add levelled perks and Blip abilities', () => {
  const goat = BLIPS.find((b) => b.id === 'goat')! // 4-star Bubble Finder
  assert.deepEqual(abilityOf(goat), { kind: 'finder', n: 20 })
  const all = new Set(BLIPS.map((b) => b.id))
  assert.deepEqual(loadoutTotals(['headstart', 'packrat'], ['goat', 'blub'], all), { xp: 10 + 5, catch: 0, saver: 20, finder: 20 })
  assert.deepEqual(loadoutTotals(['headstart', 'packrat'], [], new Set()), { xp: 0, catch: 0, saver: 0, finder: 0 })
  assert.deepEqual(loadoutTotals(['nope'], ['nope'], all), { xp: 0, catch: 0, saver: 0, finder: 0 })
})
