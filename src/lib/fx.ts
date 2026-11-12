// Tiny sound + haptics helpers. Settings live in localStorage (per device).
export function pref(key: string, fallback = true) {
  try {
    const v = localStorage.getItem(`blip.${key}`)
    return v === null ? fallback : v === '1'
  } catch {
    return fallback
  }
}
export function setPref(key: string, on: boolean) {
  try { localStorage.setItem(`blip.${key}`, on ? '1' : '0') } catch { /* private mode */ }
}

let ctx: AudioContext | undefined
/** A soft synth "blip". freq rises with rep count for a satisfying climb. */
export function beep(freq = 660, dur = 0.09) {
  if (!pref('sound')) return
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur)
    g.gain.setValueAtTime(0.12, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + dur)
  } catch { /* audio blocked */ }
}

/** Speak a short line (rep counts, form tips) so you don't have to read the screen mid-pushup. Follows the Sound setting. */
export function say(text: string) {
  if (!pref('sound') || !('speechSynthesis' in window)) return
  try {
    speechSynthesis.cancel() // never queue up: only the latest count matters
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.15
    speechSynthesis.speak(u)
  } catch { /* speech blocked */ }
}

export const buzz = (pattern: number | number[] = 12) => {
  if (pref('haptics')) navigator.vibrate?.(pattern)
}
