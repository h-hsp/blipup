import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CUE, START, step, type Pt, type State } from './pushup.ts'

// One synthetic frame. Shoulders are 0.2 apart, so 0.2 = one shoulder-width.
function frame(shoulderY: number, wristY = 0.9, hipY?: number): Pt[] {
  const lm: Pt[] = Array.from({ length: 25 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }))
  const put = (i: number, x: number, y: number) => { lm[i] = { x, y, visibility: 0.95 } }
  put(11, 0.6, shoulderY); put(12, 0.4, shoulderY)
  put(15, 0.6, wristY); put(16, 0.4, wristY)
  if (hipY !== undefined) { put(23, 0.57, hipY); put(24, 0.43, hipY) }
  return lm
}
const run = (s: State, frames: Pt[][]) => frames.reduce((st, f) => step(st, f), s)
const hold = (y: number, n: number, wristY?: number) => Array.from({ length: n }, () => frame(y, wristY))
const ramp = (a: number, b: number, n = 15) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 1)) / n)

const TOP = 0.5 // shoulders 2 shoulder-widths above the wrists
// Down to `low`, pause, back up, pause.
const rep = (low: number) => [...ramp(TOP, low).map((y) => frame(y)), ...hold(low, 5), ...ramp(low, TOP).map((y) => frame(y)), ...hold(TOP, 5)]
const ready = () => run(START, hold(TOP, 12))

test('holding the top of a pushup starts the set', () => {
  const s = ready()
  assert.equal(s.phase, 'up')
  assert.equal(s.cue, CUE.go)
})

test('full pushups are counted', () => {
  const s = run(ready(), [...rep(0.74), ...rep(0.74), ...rep(0.74)])
  assert.equal(s.reps, 3)
  assert.equal(s.cue, CUE.nice)
})

test('half reps are not counted and ask you to go lower', () => {
  const s = run(ready(), [...rep(0.6), ...rep(0.6)])
  assert.equal(s.reps, 0)
  assert.equal(s.cue, CUE.lower)
})

test('standing in front of the camera never starts a set', () => {
  // Hips 1.5 shoulder-widths under the shoulders = upright.
  const s = run(START, Array.from({ length: 60 }, (_, i) => frame(0.3 + 0.02 * Math.sin(i / 3), 0.7, 0.6)))
  assert.equal(s.reps, 0)
  assert.equal(s.phase, 'out')
  assert.equal(s.cue, CUE.flat)
})

test('moving the hands instead of the body is not a pushup', () => {
  // Arm curl: shoulders stay put, wrists rise to shoulder height and come back.
  const curl = [...ramp(0.9, TOP), ...ramp(TOP, 0.9)].map((wristY) => frame(TOP, wristY))
  const cues = new Set<string>()
  const s = [...curl, ...curl, ...curl].reduce((st, f) => { const n = step(st, f); cues.add(n.cue); return n }, ready())
  assert.equal(s.reps, 0)
  assert.ok(cues.has(CUE.hands))
})

// Same frames, but with a clock: `ms` between frames.
const timed = (s: State, frames: Pt[][], ms: number, t0 = 0) => frames.reduce((st, f, i) => step(st, f, 1, t0 + i * ms), s)

test('pushups at a normal pace count with real frame times', () => {
  const s = timed(ready(), [...rep(0.74), ...rep(0.74)], 33) // 30 fps: each rep takes about 1.3 s
  assert.equal(s.reps, 2)
})

test('bouncing faster than a real pushup is not counted', () => {
  // reaches the bottom, but the whole rep takes about 0.3 s
  const quick = [...ramp(TOP, 0.74, 3).map((y) => frame(y)), ...hold(0.74, 3), ...ramp(0.74, TOP, 3).map((y) => frame(y)), ...hold(TOP, 3)]
  const s = timed(ready(), quick, 33)
  assert.equal(s.reps, 0)
  assert.equal(s.cue, CUE.slow)
  // and a proper rep straight after still counts
  assert.equal(timed(s, rep(0.74), 33, 1000).reps, 1)
})

test('a few dropped frames keep the count, a long dropout pauses the set', () => {
  const one = run(ready(), rep(0.74))
  const blip = run(one, Array.from({ length: 5 }, () => undefined as unknown as Pt[]))
  assert.equal(blip.phase, 'up')
  const gone = run(one, Array.from({ length: 20 }, () => undefined as unknown as Pt[]))
  assert.equal(gone.phase, 'out')
  assert.equal(gone.cue, CUE.frame)
  assert.equal(gone.reps, 1)
})
