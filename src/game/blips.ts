import type { Rarity } from './catch.ts'

export type Shape = 'round' | 'drop' | 'wide' | 'tall' | 'boxy' | 'blob'
export type Eyes = 'dot' | 'happy' | 'heart' | 'sleepy' | 'flat' | 'shades' | 'swirl' | 'side' | 'star' | 'angry' | 'lash' | 'wink' | 'glow' | 'blank'
export type Mouth = 'grin' | 'smile' | 'flat' | 'o' | 'smirk' | 'yap' | 'frown' | 'shh' | 'none'
export type Extra =
  | 'cowlick' | 'antenna' | 'headband' | 'halo' | 'crown' | 'horns' | 'scarf' | 'headset' | 'blanket'
  | 'flowers' | 'chains' | 'runes' | 'freckles' | 'unibrow' | 'brow' | 'sparks' | 'blush' | 'galaxy'
  | 'cloud' | 'pixels' | 'hands' | 'bubbles' | 'stripe' | 'jaw'
export type Idle = 'bounce' | 'sway' | 'float' | 'jitter' | 'breathe' | 'wobble'

export interface Blip {
  id: string
  name: string
  rarity: Rarity
  trait: string
  bio: string
  catchLine: string
  escapeLine: string
  color: string
  color2: string
  shape: Shape
  eyes: Eyes
  mouth: Mouth
  extras: Extra[]
  idle: Idle
}

// ids must match the `blips` seed in supabase/migrations.
export const BLIPS: Blip[] = [
  // ── 1★ Common ──
  { id: 'blub', name: 'Blub', rarity: 1, trait: 'Cheerful', bio: 'Thinks every pushup is a party thrown in its honour. It is not wrong.', catchLine: 'BEST. DAY. EVER.', escapeLine: 'Blub waved bye and rolled off.', color: '#C6FF4D', color2: '#6FD34A', shape: 'round', eyes: 'happy', mouth: 'grin', extras: ['blush'], idle: 'bounce' },
  { id: 'npc', name: 'NPC', rarity: 1, trait: 'On autopilot', bio: 'Has exactly three lines of dialogue and has used all of them on you.', catchLine: 'Quest accepted.', escapeLine: 'NPC walked off mid-sentence.', color: '#E8D9C4', color2: '#BFA98C', shape: 'tall', eyes: 'blank', mouth: 'flat', extras: [], idle: 'sway' },
  { id: 'lowkey', name: 'Lowkey', rarity: 1, trait: 'Shy', bio: 'Lowkey wants to be caught. Highkey will never admit it.', catchLine: '...ok fine. hi.', escapeLine: 'Lowkey shrank to a dot and vanished.', color: '#FFB3D1', color2: '#FF7FB0', shape: 'drop', eyes: 'dot', mouth: 'none', extras: ['hands', 'blush'], idle: 'breathe' },
  { id: 'mewzy', name: 'Mewzy', rarity: 1, trait: 'Mewing', bio: 'Has not unclenched its jaw since 2024. Communicates only in nods.', catchLine: '*silent nod*', escapeLine: 'Mewzy slid away without a word.', color: '#5FE0D0', color2: '#24A89B', shape: 'tall', eyes: 'flat', mouth: 'shh', extras: ['jaw'], idle: 'breathe' },
  { id: 'delulu', name: 'Delulu', rarity: 1, trait: 'Delusional optimist', bio: 'Already thinks you two are best friends. Delulu is the solulu.', catchLine: 'I KNEW you liked me.', escapeLine: 'Delulu floated off, still thinking it was caught.', color: '#D7B8FF', color2: '#A47BEF', shape: 'round', eyes: 'heart', mouth: 'smile', extras: ['blush'], idle: 'float' },
  { id: 'yapper', name: 'Yapper', rarity: 1, trait: 'Never stops talking', bio: 'Started a story three sessions ago. It is still on the intro.', catchLine: 'so anyway as I was saying—', escapeLine: 'Yapper talked its way out.', color: '#FFA24D', color2: '#F0701F', shape: 'wide', eyes: 'dot', mouth: 'yap', extras: [], idle: 'jitter' },
  { id: 'bedrot', name: 'Bedrot', rarity: 1, trait: 'Chronically sleepy', bio: 'Its screen time report is a cry for help. Wakes up only for reps.', catchLine: '*yawns* ...five more minutes.', escapeLine: 'Bedrot sleepwalked away.', color: '#B9B2FF', color2: '#7E75E0', shape: 'blob', eyes: 'sleepy', mouth: 'o', extras: ['blanket'], idle: 'breathe' },
  { id: 'icky', name: 'Icky', rarity: 1, trait: 'Grumpy', bio: 'Gets the ick from everything. Sunlight. Vibes. You, probably.', catchLine: 'ew. fine.', escapeLine: 'Icky got the ick and stomped off.', color: '#7F9CC4', color2: '#4F6C96', shape: 'wide', eyes: 'angry', mouth: 'frown', extras: ['unibrow'], idle: 'sway' },
  { id: 'zoomie', name: 'Zoomie', rarity: 1, trait: 'Hyper', bio: 'Has never once walked anywhere. Powered by pure caffeine energy.', catchLine: 'AGAIN AGAIN AGAIN!', escapeLine: 'Zoomie streaked off at mach 3.', color: '#FFE14D', color2: '#F5B800', shape: 'drop', eyes: 'dot', mouth: 'grin', extras: ['cowlick'], idle: 'jitter' },
  { id: 'fumble', name: 'Fumble', rarity: 1, trait: 'Clumsy', bio: 'Fumbles the bag daily. Somehow keeps finding new bags.', catchLine: 'oops— I mean, totally planned.', escapeLine: 'Fumble tripped and rolled away.', color: '#FF8A7A', color2: '#E5584A', shape: 'blob', eyes: 'swirl', mouth: 'o', extras: [], idle: 'wobble' },
  { id: 'brainrot', name: 'Brainrot', rarity: 1, trait: 'Chaotic', bio: 'Watched 400 short videos before breakfast. Its thoughts are now memes.', catchLine: 'skrrt bloop ✨', escapeLine: 'Brainrot split into three and scattered.', color: '#8DF06B', color2: '#3FBF3A', shape: 'blob', eyes: 'swirl', mouth: 'grin', extras: ['sparks'], idle: 'jitter' },
  { id: 'mid', name: 'Mid', rarity: 1, trait: 'Unimpressed', bio: 'Rates everything a 5/10. Including this bio.', catchLine: "it's giving... fine.", escapeLine: 'Mid shrugged and faded away.', color: '#BDBDC9', color2: '#8C8C9C', shape: 'round', eyes: 'flat', mouth: 'flat', extras: [], idle: 'sway' },

  // ── 2★ Uncommon ──
  { id: 'rizzlet', name: 'Rizzlet', rarity: 2, trait: 'Smooth talker', bio: 'Unspoken rizz. Spoken rizz. Rizz in at least four languages.', catchLine: 'You had me at rep one. 😏', escapeLine: 'Rizzlet blew a kiss and slid off.', color: '#FF6FB5', color2: '#D93F8A', shape: 'drop', eyes: 'wink', mouth: 'smirk', extras: ['brow'], idle: 'sway' },
  { id: 'gainz', name: 'Gainz', rarity: 2, trait: 'Gym bro', bio: 'Never skips chest day. Has never heard of leg day.', catchLine: "LET'S GOOO! *one pushup*", escapeLine: 'Gainz jogged off. "Spot me next time."', color: '#FF5A5A', color2: '#C92E3A', shape: 'boxy', eyes: 'dot', mouth: 'grin', extras: ['headband'], idle: 'bounce' },
  { id: 'sigma', name: 'Sigma', rarity: 2, trait: 'Lone wolf', bio: 'Works alone. Grinds at 4am. Will not tell you why.', catchLine: '*nods once*', escapeLine: 'Sigma walked away in slow motion.', color: '#3A4A7A', color2: '#1E2850', shape: 'tall', eyes: 'shades', mouth: 'flat', extras: [], idle: 'breathe' },
  { id: 'slay', name: 'Slay', rarity: 2, trait: 'Runway diva', bio: 'Every surface is a runway. Every ripple is applause.', catchLine: 'Mother has arrived. 💅', escapeLine: 'Slay flipped its hair and strutted off.', color: '#F04DD8', color2: '#A821A8', shape: 'drop', eyes: 'lash', mouth: 'smile', extras: [], idle: 'sway' },
  { id: 'vibez', name: 'Vibez', rarity: 2, trait: 'Mood reader', bio: 'Changes colour to match the vibe. Currently: locked in.', catchLine: 'Vibe check: passed. ✅', escapeLine: 'Vibez changed colour and vanished.', color: '#6FD3FF', color2: '#C48BFF', shape: 'round', eyes: 'happy', mouth: 'smile', extras: [], idle: 'float' },
  { id: 'aura', name: 'Aura', rarity: 2, trait: 'Aura farmer', bio: 'Has +10,000 aura. Loses 50 every time it trips. Never trips.', catchLine: '+1000 aura. For both of us.', escapeLine: 'Aura dissolved into glitter.', color: '#F4F1FF', color2: '#C9C0F0', shape: 'round', eyes: 'glow', mouth: 'smile', extras: ['halo'], idle: 'float' },
  { id: 'sus', name: 'Sus', rarity: 2, trait: 'Suspicious', bio: 'Was definitely not doing anything weird. Why do you ask?', catchLine: '...fine. but I saw nothing.', escapeLine: 'Sus sneaked away backwards.', color: '#A6B85A', color2: '#6E8030', shape: 'blob', eyes: 'side', mouth: 'flat', extras: [], idle: 'sway' },
  { id: 'protag', name: 'Protag', rarity: 2, trait: 'Main character energy', bio: 'Hears its own soundtrack at all times. You are a side character.', catchLine: 'And so our story begins...', escapeLine: 'Protag made a dramatic exit.', color: '#6B5BFF', color2: '#3D2FC4', shape: 'tall', eyes: 'dot', mouth: 'smirk', extras: ['scarf'], idle: 'breathe' },

  // ── 3★ Epic ──
  { id: 'nyxie', name: 'Nyxie', rarity: 3, trait: 'Astrology girlie', bio: "Won't commit until it checks your rising sign. The stars said yes today.", catchLine: "Mercury's direct. It's meant to be.", escapeLine: 'Nyxie blinked out like a star.', color: '#2B2F7A', color2: '#141647', shape: 'drop', eyes: 'star', mouth: 'smile', extras: ['freckles'], idle: 'float' },
  { id: 'hyperpop', name: 'Hyperpop', rarity: 3, trait: 'Chaotic energy', bio: 'Lives at 180 BPM. Speaks only in bass drops and glitter.', catchLine: 'DROP! THE! BEAT!', escapeLine: 'Hyperpop glitch-jumped away.', color: '#B44DFF', color2: '#6A1BD9', shape: 'round', eyes: 'swirl', mouth: 'grin', extras: ['sparks'], idle: 'jitter' },
  { id: 'drip', name: 'Drip', rarity: 3, trait: 'Show-off', bio: 'Too much drip. Literally. It leaves sparkles everywhere it goes.', catchLine: 'Ice cold. ❄️', escapeLine: 'Drip shattered into light.', color: '#A8F0FF', color2: '#5CB8E8', shape: 'drop', eyes: 'shades', mouth: 'smirk', extras: ['chains'], idle: 'sway' },
  { id: 'cottage', name: 'Cottage', rarity: 3, trait: 'Cottagecore', bio: 'Logged off years ago. Grows flowers on its head and reads by candlelight.', catchLine: 'Let us touch grass together. 🌷', escapeLine: 'Cottage sank into the roots.', color: '#8FBF6A', color2: '#5A8A3E', shape: 'round', eyes: 'happy', mouth: 'smile', extras: ['flowers', 'blush'], idle: 'breathe' },
  { id: 'clutch', name: 'Clutch', rarity: 3, trait: 'Gamer', bio: 'One HP left? That is when it does its best work.', catchLine: 'GG. Clutched it.', escapeLine: 'Clutch rage-quit.', color: '#2EE6E6', color2: '#119FB0', shape: 'boxy', eyes: 'dot', mouth: 'grin', extras: ['headset'], idle: 'jitter' },
  { id: 'glitch', name: 'Glitch', rarity: 3, trait: 'Trickster', bio: 'Exists at 3 FPS. Loves faking you out right before a catch.', catchLine: 'e̷r̷r̷o̷r̷: caught.', escapeLine: 'Glitch pixel-dissolved.', color: '#FF3DA8', color2: '#24D6C8', shape: 'boxy', eyes: 'side', mouth: 'smirk', extras: ['pixels'], idle: 'jitter' },

  // ── 4★ Legendary ──
  { id: 'goat', name: 'GOAT', rarity: 4, trait: 'The greatest', bio: 'Greatest of all time. It knows. You know. Everybody knows.', catchLine: 'Two GOATs. One team.', escapeLine: 'GOAT ascended in a beam of light.', color: '#FFD34D', color2: '#E59A12', shape: 'round', eyes: 'glow', mouth: 'smirk', extras: ['horns', 'crown'], idle: 'float' },
  { id: 'finalboss', name: 'Final Boss', rarity: 4, trait: 'Cosmic', bio: 'A whole galaxy lives inside it. It has been waiting for a worthy challenger.', catchLine: 'You... are worthy.', escapeLine: 'Final Boss opened a wormhole and left.', color: '#5B2BD9', color2: '#16093F', shape: 'drop', eyes: 'glow', mouth: 'none', extras: ['galaxy'], idle: 'float' },
  { id: 'villainera', name: 'Villain Era', rarity: 4, trait: 'Stormy', bio: 'Was nice once. Then it got left on read. Now it brings the storm.', catchLine: 'Fine. Redemption arc unlocked.', escapeLine: 'Villain Era spun off in a tornado.', color: '#4A4E6B', color2: '#1C1E30', shape: 'blob', eyes: 'angry', mouth: 'smirk', extras: ['cloud'], idle: 'sway' },
  { id: 'lore', name: 'Lore', rarity: 4, trait: 'Ancient', bio: 'Older than the internet. Knows the deep lore of every Blip that ever lived.', catchLine: 'The runes foretold this.', escapeLine: 'Lore crumbled to sand and drifted off.', color: '#9C8F7A', color2: '#5E5444', shape: 'boxy', eyes: 'glow', mouth: 'flat', extras: ['runes'], idle: 'breathe' },
]

export const blipById = (id: string) => BLIPS.find((b) => b.id === id)!

export const RARITY = {
  1: { label: 'Common', color: '#7CF5C4' },
  2: { label: 'Uncommon', color: '#6FD3FF' },
  3: { label: 'Epic', color: '#B98CFF' },
  4: { label: 'Legendary', color: '#FFD34D' },
} as const
