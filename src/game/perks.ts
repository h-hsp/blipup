import { BLIPS, SETS, type Blip } from './blips.ts'

// Loadout: up to 2 perks (unlocked by finishing a Blipdex collection) and 3 caught Blips, each with an ability.
// The server applies all of it (migration 007_loadout.sql); these numbers must match the SQL there (perks.test.ts checks).

export type Kind = 'xp' | 'catch' | 'saver' | 'finder'
export const MAX_PERKS = 2
export const MAX_BLIPS = 3

export const ABILITIES: Record<Kind, { name: string; icon: string; power: [number, number, number, number]; text: (n: number) => string }> = {
  xp: { name: 'XP Boost', icon: '⚡', power: [5, 8, 12, 20], text: (n) => `+${n}% XP from sessions` },
  catch: { name: 'Lucky Paws', icon: '🎯', power: [2, 3, 5, 8], text: (n) => `+${n}% catch chance` },
  saver: { name: 'Bubble Saver', icon: '🫧', power: [10, 15, 20, 30], text: (n) => `${n}% chance a Double Bubble isn't used up` },
  finder: { name: 'Bubble Finder', icon: '🔍', power: [5, 8, 12, 20], text: (n) => `${n}% chance to find a Double Bubble after a session` },
}

const ORDER: Kind[] = ['xp', 'catch', 'saver', 'finder']
const INDEX = new Map(SETS.flatMap((s) => s.blips.map((b, i) => [b.id, i] as const)))
/** Every Blip's ability, spread evenly through its own collection (so each has all four). Strength comes from rarity. */
export const abilityOf = (b: Blip) => {
  const kind = ORDER[INDEX.get(b.id)! % ORDER.length]
  return { kind, n: ABILITIES[kind].power[b.rarity - 1] }
}

export const PERKS: { id: string; name: string; icon: string; kind: Kind; n: number; need: string }[] = [
  { id: 'headstart', name: 'Head Start', icon: '🚀', kind: 'xp', n: 10, need: 'Originals' },
  { id: 'aurafarmer', name: 'Aura Farmer', icon: '✨', kind: 'catch', n: 5, need: 'Brainrot' },
  { id: 'packrat', name: 'Pack Rat', icon: '🎒', kind: 'saver', n: 20, need: 'Explorer wave' },
  { id: 'plotarmour', name: 'Plot Armour', icon: '🛡️', kind: 'finder', n: 15, need: 'Pop culture' },
  { id: 'completionist', name: 'Completionist', icon: '🏆', kind: 'xp', n: 15, need: 'all' },
]

/** Perks level up as you fill their collection: Lv 1 at 20% caught … Lv 5 at 100%. Lv 0 does nothing and can't be equipped. */
export const PERK_LEVELS = 5

export function perkLevel(perk: (typeof PERKS)[number], owned: Set<string>) {
  const pool = perk.need === 'all' ? BLIPS : SETS.find((s) => s.name === perk.need)!.blips
  const have = pool.filter((b) => owned.has(b.id)).length
  const level = Math.floor((PERK_LEVELS * have) / pool.length) // same integer maths as private.perk_level in SQL
  return {
    level,
    have,
    total: pool.length,
    n: (perk.n * level) / PERK_LEVELS,
    nextAt: level < PERK_LEVELS ? levelNeed(level + 1, pool.length) : null, // Blips needed for the next level
  }
}

/** Blips of a collection you need for a perk level (the smallest count that reaches it). */
export const levelNeed = (level: number, total: number) => Math.ceil((level * total) / PERK_LEVELS)

/** Total of each effect from an equipped loadout. */
export function loadoutTotals(perks: string[], blips: string[], owned: Set<string>) {
  const t: Record<Kind, number> = { xp: 0, catch: 0, saver: 0, finder: 0 }
  for (const id of perks) { const p = PERKS.find((x) => x.id === id); if (p) t[p.kind] += perkLevel(p, owned).n }
  for (const id of blips) { const b = BLIPS.find((x) => x.id === id); if (b) { const a = abilityOf(b); t[a.kind] += a.n } }
  return t
}
