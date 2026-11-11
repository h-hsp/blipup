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
  // SVG-era fields: art is now images, so newer Blips leave these out.
  shape?: Shape
  eyes?: Eyes
  mouth?: Mouth
  extras?: Extra[]
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

  // ── Explorer wave (Override / Treasure Hunter cues) ──
  // 1★ Common
  { id: "bestie", name: "Bestie", rarity: 1, trait: "Loyal", bio: "Will hype your worst set like it was a world record.", catchLine: "Bestie for life. Literally.", escapeLine: "Bestie said \"brb\" and never came back.", color: "#FF9A7A", color2: "#E5674A", idle: "bounce" },
  { id: "scout", name: "Scout", rarity: 1, trait: "Excited explorer", bio: "Has a map for everywhere. Has never once read one.", catchLine: "New map unlocked!", escapeLine: "Scout wandered off to explore.", color: "#3FD6C6", color2: "#1A9C95", idle: "bounce" },
  { id: "shrubby", name: "Shrubby", rarity: 1, trait: "Bashful", bio: "Thinks it is invisible in a hedge. It is not.", catchLine: "...you found me?", escapeLine: "Shrubby blended back into a hedge.", color: "#7BD45A", color2: "#3E8F2E", idle: "breathe" },
  { id: "floaty", name: "Floaty", rarity: 1, trait: "Helpful", bio: "Lights the way for lost reps. Very gentle. Very floaty.", catchLine: "Lighting the way!", escapeLine: "Floaty drifted off on its cloud.", color: "#A8F0D2", color2: "#62C9A3", idle: "float" },
  { id: "shieldy", name: "Shieldy", rarity: 1, trait: "Protective", bio: "Guards its egg, its snacks and your streak.", catchLine: "Guarded. Protected. Caught.", escapeLine: "Shieldy rolled away hugging its egg.", color: "#8FD3FF", color2: "#4A9BD6", idle: "sway" },
  { id: "snacky", name: "Snacky", rarity: 1, trait: "Snack-loving wanderer", bio: "Will follow you anywhere if you have crackers.", catchLine: "Got any crackers?", escapeLine: "Snacky followed a snack trail away.", color: "#FFD25A", color2: "#E5A21F", idle: "bounce" },
  { id: "partyy", name: "Partyy", rarity: 1, trait: "Party animal", bio: "Every rep is a party. Every set is the afterparty.", catchLine: "LET'S GOOO!", escapeLine: "Partyy left for the afterparty.", color: "#FFF1D6", color2: "#FFB0D9", idle: "jitter" },
  { id: "gizmo", name: "Gizmo", rarity: 1, trait: "Tinkerer", bio: "Fixed the same thing nine times. It is now worse.", catchLine: "Fixed it! (I think.)", escapeLine: "Gizmo clanked off to fix something else.", color: "#E08A3C", color2: "#A65A1D", idle: "wobble" },
  { id: "finn", name: "Finn", rarity: 1, trait: "Proud swimmer", bio: "Found one seashell. Will not stop talking about it.", catchLine: "Want to see my shell?", escapeLine: "Finn swam back to the shallows.", color: "#4FB4FF", color2: "#1E73C9", idle: "float" },
  { id: "northy", name: "Northy", rarity: 1, trait: "Guide", bio: "Always knows where north is. Rarely knows where it is.", catchLine: "North is... that way!", escapeLine: "Northy followed its compass. Wrong way.", color: "#8EC9FF", color2: "#4F8FD6", idle: "sway" },
  { id: "squiddy", name: "Squiddy", rarity: 1, trait: "Curious kid", bio: "Pokes everything. Has been bitten by most things.", catchLine: "Ooh, what's this?", escapeLine: "Squiddy wiggled off to poke a crab.", color: "#FF8FC8", color2: "#E0559A", idle: "wobble" },
  { id: "splash", name: "Splash", rarity: 1, trait: "Hype", bio: "Screams every time you finish a set. Gets everyone wet.", catchLine: "SPLASHHH!", escapeLine: "Splash dove into a puddle and vanished.", color: "#3FE0E8", color2: "#13A5B8", idle: "bounce" },
  // 2★ Uncommon
  { id: "speedrun", name: "Speedrun", rarity: 2, trait: "Competitive", bio: "Has a personal best for everything, including blinking.", catchLine: "New PB!", escapeLine: "Speedrun was gone before you blinked.", color: "#FF8A2E", color2: "#D9560E", idle: "jitter" },
  { id: "rival", name: "Rival", rarity: 2, trait: "Serious rival", bio: "Does one more rep than you. Every time.", catchLine: "Fine. Rematch tomorrow.", escapeLine: "Rival stormed off to train.", color: "#E5324A", color2: "#9E1529", idle: "sway" },
  { id: "eightbit", name: "8-Bit", rarity: 2, trait: "Retro", bio: "Speaks only in bloops. Lives at 60 frames a second.", catchLine: "*happy bloop*", escapeLine: "8-Bit despawned.", color: "#4F8BFF", color2: "#2047C9", idle: "jitter" },
  { id: "turbo", name: "Turbo", rarity: 2, trait: "Kinetic", bio: "Strapped a rocket to itself. Does not regret it.", catchLine: "Full throttle!", escapeLine: "Turbo rocketed into the sky.", color: "#2E9BFF", color2: "#1257C9", idle: "float" },
  { id: "puddle", name: "Puddle", rarity: 2, trait: "Hop-happy", bio: "Never met a lily pad it did not jump on.", catchLine: "Ribbit! Caught!", escapeLine: "Puddle hopped to the next lily pad.", color: "#49D9A0", color2: "#1F9E6E", idle: "bounce" },
  { id: "breezy", name: "Breezy", rarity: 2, trait: "Weather-watcher", bio: "Can smell rain three days away. Also smells snacks.", catchLine: "Feels like a catch kind of day.", escapeLine: "Breezy blew away on a gust.", color: "#EAF4FF", color2: "#A9C6E8", idle: "float" },
  { id: "scrapz", name: "Scrapz", rarity: 2, trait: "Scavenger", bio: "Keeps everything. Especially the things you threw out.", catchLine: "Ooh, can I keep you?", escapeLine: "Scrapz ran off with your bottle cap.", color: "#D9692E", color2: "#9E4317", idle: "wobble" },
  { id: "honeybun", name: "Honeybun", rarity: 2, trait: "Beekeeper", bio: "Its bees are its best friends. The bees agree.", catchLine: "Bzz! Sweet catch.", escapeLine: "Honeybun buzzed off with its bees.", color: "#FFB43A", color2: "#D97E0F", idle: "float" },
  { id: "duo", name: "Duo", rarity: 2, trait: "Two-sided", bio: "Half morning person, half night owl. Fully confusing.", catchLine: "Good morning AND good night!", escapeLine: "Duo split up and left both ways.", color: "#FFD84D", color2: "#2B3F99", idle: "sway" },
  { id: "pockets", name: "Pockets", rarity: 2, trait: "Treasure seeker", bio: "Forty pockets. Thirty-nine of them have snacks.", catchLine: "Check pocket thirty-nine.", escapeLine: "Pockets jingled away.", color: "#D9B47A", color2: "#A07E45", idle: "bounce" },
  { id: "kelp", name: "Kelp", rarity: 2, trait: "Healer", bio: "Very calm. Makes everyone else calm. Suspiciously calm.", catchLine: "Breathe in. Caught.", escapeLine: "Kelp drifted back to the reef.", color: "#7FE6C2", color2: "#3AAE8C", idle: "breathe" },
  { id: "ping", name: "Ping", rarity: 2, trait: "Messenger", bio: "Delivering your message. ETA: eventually.", catchLine: "Message delivered!", escapeLine: "Ping left. Slowly.", color: "#A3A9B8", color2: "#6B7180", idle: "sway" },
  // 3★ Epic
  { id: "boing", name: "Boing", rarity: 3, trait: "Springy", bio: "Cannot stand still. Has tried. Bounced off the ceiling.", catchLine: "BOING! Caught!", escapeLine: "Boing bounced over the horizon.", color: "#A6F03A", color2: "#6CB516", idle: "bounce" },
  { id: "parkour", name: "Parkour", rarity: 3, trait: "Acrobat", bio: "Will not use stairs. Has never used stairs.", catchLine: "Stuck the landing.", escapeLine: "Parkour flipped over a wall and left.", color: "#6B7A8F", color2: "#3E4A5C", idle: "jitter" },
  { id: "scanz", name: "Scanz", rarity: 3, trait: "Analyst", bio: "Has already counted your reps. And judged them.", catchLine: "Scan complete: you're cool.", escapeLine: "Scanz beamed itself away.", color: "#B49CFF", color2: "#7656D6", idle: "float" },
  { id: "jumpscare", name: "Jumpscare", rarity: 3, trait: "Easily startled", bio: "Scared of loud noises, quiet noises and its own reflection.", catchLine: "AAH! Oh. It's you.", escapeLine: "Jumpscare got spooked and vanished.", color: "#B8D4FF", color2: "#7A9CE0", idle: "jitter" },
  { id: "dreamy", name: "Dreamy", rarity: 3, trait: "Gentle helper", bio: "Sprinkles good luck on your next catch. Probably.", catchLine: "Sweet dreams, catcher.", escapeLine: "Dreamy floated off on a sparkle.", color: "#FFB8DA", color2: "#E57AAE", idle: "float" },
  { id: "countwobble", name: "Count Wobble", rarity: 3, trait: "Dramatic", bio: "Only comes out at night. Insists on a dramatic entrance.", catchLine: "Bleh! Caught dramatically.", escapeLine: "Count Wobble swept away in its cape.", color: "#9E1F3D", color2: "#5C0E22", idle: "sway" },
  { id: "antlers", name: "Antlers", rarity: 3, trait: "Fearless", bio: "Graceful, quiet, and will absolutely not back down.", catchLine: "A worthy catch.", escapeLine: "Antlers bounded into the forest.", color: "#3FAE6B", color2: "#1E6E40", idle: "breathe" },
  { id: "mapsy", name: "Mapsy", rarity: 3, trait: "Cartographer", bio: "Draws a map of everywhere it goes. X always marks you.", catchLine: "X marks the catch!", escapeLine: "Mapsy folded itself up and blew away.", color: "#E8D3A8", color2: "#B89A62", idle: "wobble" },
  { id: "slam", name: "Slam", rarity: 3, trait: "Show-off", bio: "Does not land. It ARRIVES.", catchLine: "BOOM. Arrived.", escapeLine: "Slam leapt off with a shockwave.", color: "#23C2B5", color2: "#0E8A80", idle: "bounce" },
  // 4★ Legendary
  { id: "fancy", name: "Fancy", rarity: 4, trait: "Regal perfectionist", bio: "Has opinions about your form. All of them are correct.", catchLine: "Acceptable. Barely.", escapeLine: "Fancy left. It had tea plans.", color: "#C9A6FF", color2: "#8F63D9", idle: "sway" },
  { id: "chonk", name: "Chonk", rarity: 4, trait: "Gentle giant", bio: "Huge. Hungry. Would never hurt a fly. Might eat one.", catchLine: "Big hug!", escapeLine: "Chonk waddled off for snacks.", color: "#C98A4E", color2: "#8A5527", idle: "breathe" },
  { id: "spinout", name: "Spinout", rarity: 4, trait: "Whirlwind", bio: "Spun so fast it forgot which way it was going.", catchLine: "Wheee... wait, caught?", escapeLine: "Spinout spun off into the distance.", color: "#A46BFF", color2: "#6A2FD6", idle: "wobble" },
  { id: "phantom", name: "Phantom", rarity: 4, trait: "Ghostly speedster", bio: "Was here. Now it is not. Was that a Blip?", catchLine: "Boo! ...you saw me?", escapeLine: "Phantom vanished mid-zoom.", color: "#CFE8FF", color2: "#7FB2E6", idle: "float" },
  { id: "wishy", name: "Wishy", rarity: 4, trait: "Wish-maker", bio: "Grants one wish per day. Today's wish: more reps.", catchLine: "Your wish came true.", escapeLine: "Wishy granted itself a holiday.", color: "#FFF6D6", color2: "#E8C35A", idle: "float" },
  { id: "capnwobble", name: "Cap'n Wobble", rarity: 4, trait: "Treasure pirate", bio: "Claims every chest it sees. Has never opened one.", catchLine: "Arr, ye caught me fair!", escapeLine: "Cap'n Wobble sailed off with the treasure.", color: "#3FBF8F", color2: "#1E7A5A", idle: "sway" },
  { id: "moonbeam", name: "Moonbeam", rarity: 4, trait: "Dream drifter", bio: "Sleeps on the moon. Wakes up only for legendary reps.", catchLine: "Zzz... caught... zzz", escapeLine: "Moonbeam drifted back to the moon.", color: "#F2EEDC", color2: "#C9C2A0", idle: "breathe" },

  // ── Pop-culture set: Blips in costume (parody homages, art in the original painted sticker style) ──
  // 2★ Uncommon
  { id: 'babyblipa', name: 'Baby Blipa', rarity: 2, trait: 'Snack thief', bio: 'Tiny, green, enormous ears. Will absolutely eat your snacks and look adorable doing it.', catchLine: '*happy cookie noises*', escapeLine: 'Baby Blipa floated off in its cardigan.', color: '#A9D98A', color2: '#6FA857', idle: 'breathe' },
  { id: 'blipubu', name: 'Blipubu', rarity: 2, trait: 'Mischief plush', bio: 'Sold out everywhere. Somehow showed up for your pushups anyway.', catchLine: 'Hehehe. Clip me on.', escapeLine: 'Blipubu sold out again.', color: '#F2E2C4', color2: '#C9AE84', idle: 'jitter' },
  { id: 'spongeblip', name: 'SpongeBlip', rarity: 2, trait: 'Always ready', bio: 'Soaks up good vibes, bad vibes and about a litre of seawater.', catchLine: "I'm ready! I'm ready!", escapeLine: 'SpongeBlip bubbled away.', color: '#FFE45C', color2: '#D9B52B', idle: 'bounce' },
  { id: 'blipcraft', name: 'Blipcraft', rarity: 2, trait: 'Block builder', bio: 'Punches trees for fun. Builds a dirt hut after every set.', catchLine: 'Achievement get!', escapeLine: 'Blipcraft dug straight down.', color: '#8EDB5A', color2: '#4E9B2E', idle: 'wobble' },
  // 3★ Epic
  { id: 'stormblipper', name: 'Stormblipper', rarity: 3, trait: 'Terrible aim', bio: 'Has never once hit its target. You are its first.', catchLine: 'Finally! A hit!', escapeLine: 'Stormblipper missed the exit. Then found it.', color: '#F2F4F8', color2: '#B9BFCC', idle: 'wobble' },
  { id: 'hedgeblip', name: 'Hedgeblip', rarity: 3, trait: 'Gotta go fast', bio: 'Does pushups so fast the counter cannot keep up.', catchLine: 'Too slow! ...wait, caught.', escapeLine: 'Hedgeblip zoomed off in a blue blur.', color: '#3D7BFF', color2: '#1E4FC7', idle: 'jitter' },
  { id: 'spiderblip', name: 'Spider-Blip', rarity: 3, trait: 'Friendly neighbour', bio: 'Sticks to walls, ceilings and its daily streak.', catchLine: 'Thwip! Caught in your web.', escapeLine: 'Spider-Blip swung off on a thread.', color: '#E8323C', color2: '#2A4DB3', idle: 'sway' },
  { id: 'batblip', name: 'Bat-Blip', rarity: 3, trait: 'Night trainer', bio: 'Only trains at night. Brooding is part of the warm-up.', catchLine: "I'm... caught.", escapeLine: 'Bat-Blip vanished mid-sentence.', color: '#4A4A58', color2: '#26262F', idle: 'float' },
  { id: 'superblipio', name: 'Super Blipio', rarity: 3, trait: 'Jumps on everything', bio: 'Jumps on everything. Including you, apparently.', catchLine: 'Wahoo! Here we go!', escapeLine: 'Super Blipio jumped down a pipe.', color: '#FF9C7A', color2: '#E0412F', idle: 'bounce' },
  // 4★ Legendary
  { id: 'ironblip', name: 'Iron Blip', rarity: 4, trait: 'Genius in a suit', bio: 'Built its power suit in a cave. Out of jelly. Still flies.', catchLine: 'I am... caught.', escapeLine: 'Iron Blip jetted off into the sky.', color: '#D93A32', color2: '#E8B53A', idle: 'float' },
  { id: 'darthblipper', name: 'Darth Blipper', rarity: 4, trait: 'Heavy breather', bio: 'Breathes really heavily after every rep. Finds your lack of pushups disturbing.', catchLine: 'Impressive. Most impressive.', escapeLine: 'Darth Blipper swept off, breathing loudly.', color: '#3A3A44', color2: '#C2232F', idle: 'breathe' },
  { id: 'blipzilla', name: 'Blipzilla', rarity: 4, trait: 'City stomper', bio: 'A giant (for a Blip) lizard that stomps on skipped leg days.', catchLine: 'RAWR! ...ok, fair catch.', escapeLine: 'Blipzilla stomped back into the sea.', color: '#4E9B4A', color2: '#2C6A2A', idle: 'sway' },
]

export const blipById = (id: string) => BLIPS.find((b) => b.id === id)!

/** Blips named after brainrot, Gen Z and internet terms. New brainrot Blips: add the id here (planned ones are in the BlipUp vault note). */
export const BRAINROT = new Set([
  'npc', 'lowkey', 'mewzy', 'delulu', 'yapper', 'bedrot', 'icky', 'fumble', 'brainrot', 'mid', 'rizzlet', 'sigma', 'slay', 'vibez',
  'aura', 'sus', 'protag', 'drip', 'cottage', 'clutch', 'goat', 'finalboss', 'villainera', 'lore', 'bestie', 'speedrun', 'jumpscare',
])

/** Blipdex sections, lowest rarity first. Each Blip sits in exactly one (catch.test.ts checks it). */
export const SETS = ([
  ['Originals', BLIPS.slice(0, 30).filter((b) => !BRAINROT.has(b.id))],
  ['Brainrot', BLIPS.filter((b) => BRAINROT.has(b.id))],
  ['Explorer wave', BLIPS.slice(30, 70).filter((b) => !BRAINROT.has(b.id))],
  ['Pop culture', BLIPS.slice(70, 82)],
] as const).map(([name, blips]) => ({ name, blips: [...blips].sort((a, b) => a.rarity - b.rarity) }))

export const RARITY = {
  1: { label: 'Common', color: '#7CF5C4' },
  2: { label: 'Uncommon', color: '#6FD3FF' },
  3: { label: 'Epic', color: '#B98CFF' },
  4: { label: 'Legendary', color: '#FFD34D' },
} as const
