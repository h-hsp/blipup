import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '../components/ui'
import { account, supabase } from '../lib/supabase'

const SLIDES = [
  { art: '/art/onboard-1.webp', title: 'Every rep sends a blip', body: 'Pick a pushup target. Each rep sends out a ripple that lures in a Blip.' },
  { art: '/art/onboard-2.webp', title: 'Catch it in a bubble', body: 'Bigger targets = better catch rates. 2 throws per Blip. Miss both? Use a Double Bubble or let it bounce.' },
  { art: '/art/onboard-3.webp', title: 'Collect them all', body: '70 Blips, from sleepy Bedrot to the legendary GOAT. Keep your streak alive to earn more Double Bubbles.' },
]

export function Onboarding() {
  const [step, setStep] = useState(-1) // -1 = splash, SLIDES.length = sign in
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'choose' | 'signup' | 'login' | 'email'>('choose')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const go = (m: typeof mode) => { setMode(m); setMsg('') }

  async function playNow() {
    setBusy(true)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) setMsg(`${error.message}. Try making an account instead.`)
    setBusy(false)
  }

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await account(mode === 'signup' ? 'signup' : 'login', username, password)
    } catch (err) {
      setMsg((err as Error).message)
      setBusy(false)
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } })
    setMsg(error ? error.message : 'Magic link sent! Open it on this device to jump in.')
    setBusy(false)
  }

  if (step === -1) {
    return (
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-end overflow-hidden px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <img src="/art/splash.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <motion.div className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}>
          <h1 className="font-display text-6xl font-extrabold">Blip<span className="text-lime">Up</span></h1>
          <p className="mt-2 text-lg text-white/80">Do pushups. Catch Blips. Every rep sends a blip.</p>
          <Button className="mt-8 w-full" onClick={() => setStep(0)}>Get started</Button>
        </motion.div>
      </div>
    )
  }

  const slide = SLIDES[step]
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex justify-center gap-2" aria-hidden>
        {[...SLIDES, null].map((_, i) => (
          <span key={i} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === step ? 28 : 8, background: i <= step ? '#c6ff4d' : '#ffffff26' }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} className="flex flex-1 flex-col"
          initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
          {slide ? (
            <>
              <div className="grid flex-1 place-items-center"><img src={slide.art} alt="" className="max-h-[42dvh] w-full object-contain" /></div>
              <h1 className="font-display text-4xl font-extrabold">{slide.title}</h1>
              <p className="mt-3 text-lg text-white/70">{slide.body}</p>
              <Button className="mt-8 w-full" onClick={() => setStep(step + 1)}>{step === SLIDES.length - 1 ? "Let's go" : 'Next'}</Button>
            </>
          ) : (
            <>
              <div className="grid flex-1 place-items-center"><img src="/blips/blub.webp" alt="Blub, waving hello" className="idle-bounce h-56 w-56 object-contain" /></div>
              <h1 className="font-display text-4xl font-extrabold">Ready to blip?</h1>
              <p className="mt-3 text-white/70">Pick a username and password. No email needed. Or jump straight in as a guest and save later.</p>
              {mode === 'choose' && (
                <div className="mt-8 space-y-3">
                  <Button className="w-full" onClick={() => go('signup')}>Create account</Button>
                  <Button variant="ghost" className="w-full" onClick={() => go('login')}>I have an account</Button>
                  <button className="w-full py-2 text-sm font-bold text-white/60" disabled={busy} onClick={playNow}>{busy ? 'Summoning Blips…' : 'Play as a guest'}</button>
                </div>
              )}
              {(mode === 'signup' || mode === 'login') && (
                <form onSubmit={submitAccount} className="mt-8 space-y-3">
                  <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" aria-label="Username"
                    autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} className="field w-full px-5 py-4 text-base" />
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} className="field w-full px-5 py-4 text-base" />
                  {mode === 'signup' && <p className="text-xs text-white/50">3-20 letters, numbers, _ or . and only you can have it. Password: 8+ characters. Without an email we can't reset a forgotten password.</p>}
                  <Button className="w-full" disabled={busy}>{busy ? 'One sec…' : mode === 'signup' ? 'Create account' : 'Log in'}</Button>
                  {mode === 'login' && <button type="button" className="w-full py-1 text-sm text-white/60" onClick={() => go('email')}>Signed up with email? Get a login link</button>}
                  <button type="button" className="w-full py-1 text-sm text-white/60" onClick={() => go('choose')}>Back</button>
                </form>
              )}
              {mode === 'email' && (
                <form onSubmit={sendLink} className="mt-8 space-y-3">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" aria-label="Email"
                    className="field w-full px-5 py-4 text-base" />
                  <Button className="w-full" disabled={busy}>Email me a magic link</Button>
                  <button type="button" className="w-full py-2 text-sm text-white/60" onClick={() => go('login')}>Back</button>
                </form>
              )}
              {msg && <p className="mt-3 text-center text-sm text-white/75" role="status">{msg}</p>}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
