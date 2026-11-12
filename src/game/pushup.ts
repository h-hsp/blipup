// Pushup rep + form checker (pure). Fed MediaPipe pose landmarks by components/PushupCam.tsx.
// Front view: the camera sits on the floor facing you, so a pushup shows up as your shoulders
// dropping towards your (planted) wrists. Everything is measured in shoulder-widths, so it
// does not matter how far from the camera you are.

export interface Pt { x: number; y: number; visibility?: number }

export interface State {
  phase: 'out' | 'up' | 'down'
  r: number // smoothed shoulder height above the wrists, in shoulder-widths
  top: number // r at the top of the pushup (arms straight)
  deepest: number // deepest point since the last top, to catch half reps
  anchor: [number, number] | null // where the hands were planted
  reps: number
  depth: number // 0 = top, grows as you go down
  cue: string
  lost: number // frames in a row without shoulders + hands in view
  hold: number // frames held still at the top before the set starts
  startAt: number // ms when this rep left the top (NaN while at the top), to reject flailing
}

// Tuned on synthetic frames only. Calibrate on a real phone: these four are the knobs.
export const DOWN = 0.4 // depth that counts as the bottom
export const UP = 0.15 // depth that counts as back at the top
export const SHALLOW = 0.2 // deeper than this without reaching DOWN = "Go lower"
export const BAR_MAX = 0.65 // depth at the very bottom of the on-screen bar
const ENTER = 1 // arms must be at least this straight to start
const PLANT = 0.35 // hands may drift this many shoulder-widths before the set is voided
export const MIN_REP_MS = 400 // top → bottom → top faster than this is bouncing, not a pushup

export const CUE = {
  start: 'Get into a pushup, arms straight',
  frame: 'Get your shoulders and hands in frame',
  flat: 'Get horizontal',
  hold: 'Hold it there…',
  go: 'Go down',
  push: 'Push up!',
  lower: 'Go lower',
  hands: 'Keep your hands planted',
  level: 'Keep your shoulders level',
  slow: 'Slow down, full pushups',
  nice: 'Nice!',
}

export const START: State = { phase: 'out', r: NaN, top: 0, deepest: 0, anchor: null, reps: 0, depth: 0, cue: CUE.start, lost: 0, hold: 0, startAt: NaN }

const seen = (p: Pt | undefined, min = 0.5): p is Pt => !!p && (p.visibility ?? 0) > min

/** Advance one camera frame. `aspect` = video width / height (landmarks are 0..1 on each axis).
 *  `now` = frame time in ms; without it the too-fast check is skipped. */
export function step(s: State, lm: Pt[] | undefined, aspect = 1, now?: number): State {
  const [ls, rs, lw, rw, lh, rh] = [11, 12, 15, 16, 23, 24].map((i) => lm?.[i])
  if (!seen(ls) || !seen(rs) || !seen(lw) || !seen(rw)) {
    const lost = s.lost + 1
    // A few dropped frames are normal; only give up after about half a second.
    return lost < 15 ? { ...s, lost } : { ...s, lost, phase: 'out', r: NaN, depth: 0, hold: 0, anchor: null, cue: CUE.frame }
  }
  const sw = Math.hypot((ls.x - rs.x) * aspect, ls.y - rs.y) || 1e-6
  const shoulderY = (ls.y + rs.y) / 2
  const w: [number, number] = [((lw.x + rw.x) / 2) * aspect, (lw.y + rw.y) / 2]
  const raw = (w[1] - shoulderY) / sw
  const r = Number.isNaN(s.r) ? raw : s.r + 0.4 * (raw - s.r)
  const out = (cue: string): State => ({ ...s, lost: 0, r, phase: 'out', depth: 0, deepest: 0, hold: 0, anchor: w, cue, startAt: NaN })

  // Standing up also puts the wrists well below the shoulders, so rule it out by the hips.
  if (seen(lh, 0.7) && seen(rh, 0.7) && ((lh.y + rh.y) / 2 - shoulderY) / sw > 1.2) return out(CUE.flat)

  const moved = !s.anchor || Math.hypot(w[0] - s.anchor[0], w[1] - s.anchor[1]) > PLANT * sw

  if (s.phase === 'out') {
    if (r <= ENTER) return out(CUE.start)
    if (moved) return out(s.cue) // still settling: keep the reason on screen
    const hold = s.hold + 1
    return hold < 10
      ? { ...s, lost: 0, r, hold, cue: hold > 3 ? CUE.hold : s.cue }
      : { ...s, lost: 0, r, hold: 0, phase: 'up', top: r, depth: 0, deepest: 0, cue: CUE.go }
  }

  // Hands lifting or sliding means it is not a pushup (e.g. waving, or curling the arms).
  if (moved) return out(CUE.hands)

  const top = Math.max(s.top * 0.9999, r)
  const depth = Math.min(Math.max(1 - r / top, 0), 1)
  // the moment this rep left the top zone
  const startAt = depth <= UP ? NaN : Number.isNaN(s.startAt) ? (now ?? NaN) : s.startAt
  const next: State = { ...s, lost: 0, r, top, depth, deepest: Math.max(s.deepest, depth), startAt }

  if (s.phase === 'down') {
    if (depth > UP) return next
    const tooFast = now !== undefined && now - s.startAt < MIN_REP_MS
    return { ...next, phase: 'up', reps: s.reps + (tooFast ? 0 : 1), deepest: 0, anchor: w, cue: tooFast ? CUE.slow : CUE.nice }
  }
  if (depth >= DOWN) return { ...next, phase: 'down', cue: CUE.push }
  if (depth <= UP && next.deepest >= SHALLOW) return { ...next, deepest: 0, cue: CUE.lower }
  if (Math.abs(ls.y - rs.y) / sw > 0.3) return { ...next, cue: CUE.level }
  return next
}
