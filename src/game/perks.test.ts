import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BLIPS, SETS } from './blips.ts'
import { ABILITIES, abilityOf, loadoutTotals, perkMissing, PERKS } from './perks.ts'

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

test('perks unlock only when the whole collection is caught', () => {
  const head = PERKS.find((p) => p.id === 'headstart')!
  const originals = SETS[0].blips.map((b) => b.id)
  assert.equal(perkMissing(head, new Set(originals.slice(1))).length, 1)
  assert.equal(perkMissing(head, new Set(originals)).length, 0)
  const all = PERKS.find((p) => p.need === 'all')!
  assert.equal(perkMissing(all, new Set(originals)).length, BLIPS.length - originals.length)
})

test('loadout totals add perks and Blip abilities', () => {
  const goat = BLIPS.find((b) => b.id === 'goat')! // 4-star Bubble Finder
  assert.deepEqual(abilityOf(goat), { kind: 'finder', n: 20 })
  const t = loadoutTotals(['headstart', 'packrat'], ['goat', 'blub'])
  assert.deepEqual(t, { xp: 10 + 5, catch: 0, saver: 20, finder: 20 })
  assert.deepEqual(loadoutTotals(['nope'], ['nope']), { xp: 0, catch: 0, saver: 0, finder: 0 })
})
