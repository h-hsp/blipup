import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BAR_MAX, CUE, DOWN, START, UP, step, type Pt, type State } from '../game/pushup'
import { say } from '../lib/fx'

// shortcut: wasm + model come from CDNs, self-host them in /public if offline use or CSP matters
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm'
const MODEL_URL = (m: string) => `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${m}/float16/1/pose_landmarker_${m}.task`
// GPU phones/laptops get the sharper "full" model; CPU-only falls back to the faster "lite" one.
const MODELS = { GPU: MODEL_URL('full'), CPU: MODEL_URL('lite') }

// Form tips worth saying out loud (you're looking at the floor). Rep counts are spoken by the session.
const SPOKEN: Record<string, string> = {
  [CUE.go]: 'Ready. Go!', [CUE.lower]: 'Go lower', [CUE.hands]: 'Keep your hands planted', [CUE.level]: 'Keep your shoulders level',
  [CUE.slow]: 'Slow down', [CUE.frame]: 'Get your shoulders and hands in the camera', [CUE.flat]: 'Get into a pushup',
}

const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]]
const JOINTS = [11, 12, 13, 14, 15, 16, 23, 24]
const LIME = '#c6ff4d'
const SKY = '#6fd3ff'
const MARKER = 12 // marker height, % of the bar

/** Front camera view that counts real pushups: skeleton overlay, depth bar on the right, form cue below. */
export function PushupCam({ onRep, onError, children }: { onRep: () => void; onError: (msg: string) => void; children?: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const marker = useRef<HTMLDivElement>(null)
  const cb = useRef({ onRep, onError })
  useEffect(() => { cb.current = { onRep, onError } })
  const [ui, setUi] = useState<{ ready: boolean; cue: string; phase: State['phase'] }>({ ready: false, cue: START.cue, phase: 'out' })

  useEffect(() => {
    let stop = false
    let raf = 0
    let stream: MediaStream | undefined
    let close = () => {}
    let s = START
    let lastT = -1
    let stage = 'camera'
    let spoken = { text: '', at: 0 }
    // Keep the screen awake: a phone that dims mid-set stops the camera. Re-taken when you come back to the tab.
    let lock: { release: () => Promise<void> } | undefined
    const wake = () => {
      if (document.visibilityState === 'visible') navigator.wakeLock?.request('screen').then((l) => { if (stop) l.release(); else lock = l }).catch(() => {})
    }
    document.addEventListener('visibilitychange', wake)

    ;(async () => {
      try {
        // Undefined on plain http (not localhost): the browser only gives the camera to secure pages.
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('insecure')
        // Retry "camera busy": in dev, React mounts this twice and the first request may still hold the camera
        // for a moment (Windows reports NotReadableError). Also helps when another app just let go of it.
        for (let tries = 3; ; tries--) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }, audio: false })
            break
          } catch (e) {
            if ((e as Error).name !== 'NotReadableError' || tries <= 1 || stop) throw e
            await new Promise((r) => setTimeout(r, 500))
          }
        }
        if (stop) return stream.getTracks().forEach((t) => t.stop())
        const v = video.current!
        v.srcObject = stream
        await v.play()
        wake()

        stage = 'model'
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
        const fileset = await FilesetResolver.forVisionTasks(WASM)
        const make = (delegate: 'GPU' | 'CPU') =>
          PoseLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODELS[delegate], delegate }, runningMode: 'VIDEO', numPoses: 1 })
        const pose = await make('GPU').catch(() => make('CPU'))
        close = () => pose.close()
        if (stop) return close()
        setUi((u) => ({ ...u, ready: true }))

        const tick = () => {
          if (stop) return
          raf = requestAnimationFrame(tick)
          const c = canvas.current
          if (!c || !v.videoWidth || v.currentTime === lastT) return
          lastT = v.currentTime
          const now = performance.now()
          const pts = pose.detectForVideo(v, now).landmarks[0] as Pt[] | undefined
          const before = s
          s = step(s, pts, v.videoWidth / v.videoHeight, now)
          if (s.reps > before.reps) cb.current.onRep()
          if (s.cue !== before.cue || s.phase !== before.phase) setUi({ ready: true, cue: s.cue, phase: s.phase })
          // say a tip when it changes, or repeat it if it's still the problem 4 s later
          const line = SPOKEN[s.cue]
          if (line && s.cue !== before.cue && (line !== spoken.text || now - spoken.at > 4000)) {
            say(line)
            spoken = { text: line, at: now }
          }

          // Lime inside a target zone (top or bottom), sky while travelling between them.
          const color = s.phase !== 'out' && (s.depth <= UP || s.depth >= DOWN) ? LIME : SKY
          if (marker.current) {
            marker.current.style.transform = `translateY(${Math.min(s.depth / BAR_MAX, 1) * (100 - MARKER)}%)`
            marker.current.style.color = color
          }
          draw(c, v, pts, color)
        }
        tick()
      } catch (e) {
        if (stop) return
        const { name, message } = e as Error
        cb.current.onError(
          stage === 'model' ? 'Could not load the pushup checker. Check your connection and try again.'
            : message === 'insecure' ? 'The camera only works on a secure page: open the app at its https link (or localhost on this computer), not a plain http address.'
              : name === 'NotAllowedError' ? 'Camera is blocked. Allow camera access for this site (and check the browser is allowed to use the camera).'
                : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'No front camera found on this device.'
                  : name === 'NotReadableError' ? 'Camera is busy. Close other apps using it (Teams, Zoom, Camera) and try again.'
                    : `Camera could not start (${name || 'unknown error'}).`,
        )
      }
    })()

    return () => {
      stop = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      close()
      document.removeEventListener('visibilitychange', wake)
      lock?.release().catch(() => {})
    }
  }, [])

  const goingUp = ui.phase === 'down'
  return (
    <div className="relative min-h-[320px] w-full flex-1 overflow-hidden rounded-[28px] bg-black ring-1 ring-white/10" aria-label="Camera pushup checker">
      <video ref={video} playsInline muted aria-hidden className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />

      {/* Depth bar: get the marker into the bright zone, then the other one. Top = arms straight, bottom = chest down. */}
      <div aria-hidden className="absolute bottom-20 right-4 top-16 w-5 rounded-full bg-[#0d0b26]/80 ring-1 ring-white/20">
        <div className={`absolute inset-x-0 top-0 rounded-t-full transition-colors duration-200 ${goingUp ? 'bg-lime/70' : 'bg-lime/25'}`} style={{ height: `${(UP / BAR_MAX) * 100}%` }} />
        <div className={`absolute inset-x-0 bottom-0 rounded-b-full transition-colors duration-200 ${ui.phase === 'up' ? 'bg-lime/70' : 'bg-lime/25'}`} style={{ height: `${(1 - DOWN / BAR_MAX) * 100}%` }} />
        <div ref={marker} className="absolute inset-0 text-sky">
          <div className="absolute -inset-x-2 top-0 rounded-lg bg-current shadow-[0_0_14px_currentColor] ring-2 ring-white/80" style={{ height: `${MARKER}%` }} />
        </div>
      </div>

      {children}

      <div role="status" className={`absolute inset-x-3 bottom-3 rounded-2xl bg-ink/85 px-4 py-3 text-center font-display text-lg font-extrabold ${ui.cue === CUE.nice ? 'text-lime' : ''}`}>
        {ui.ready ? ui.cue : 'Starting camera…'}
      </div>
      {!ui.ready && (
        <div className="absolute inset-0 grid place-items-center bg-ink/80 px-8 text-center text-sm text-white/60">
          Starting the camera and loading the pushup checker. The first time takes a few seconds.
        </div>
      )}
    </div>
  )
}

function draw(c: HTMLCanvasElement, v: HTMLVideoElement, pts: Pt[] | undefined, color: string) {
  if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight }
  const g = c.getContext('2d')!
  g.clearRect(0, 0, c.width, c.height)
  if (!pts) return
  const ok = (i: number) => (pts[i]?.visibility ?? 0) > 0.5
  g.lineCap = 'round'
  g.lineWidth = c.width / 90
  g.strokeStyle = color
  g.shadowColor = color
  g.shadowBlur = c.width / 40
  for (const [a, b] of BONES) {
    if (!ok(a) || !ok(b)) continue
    g.beginPath()
    g.moveTo(pts[a].x * c.width, pts[a].y * c.height)
    g.lineTo(pts[b].x * c.width, pts[b].y * c.height)
    g.stroke()
  }
  g.fillStyle = '#fff'
  for (const i of JOINTS) {
    if (!ok(i)) continue
    g.beginPath()
    g.arc(pts[i].x * c.width, pts[i].y * c.height, c.width / 70, 0, Math.PI * 2)
    g.fill()
  }
}
