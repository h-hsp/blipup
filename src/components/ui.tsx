import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RARITY, type Blip } from '../game/blips'

export function Stars({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} style={{ color: RARITY[n as 1].color }} aria-label={`${n} star`}>
      {'★'.repeat(n)}
    </span>
  )
}

export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'pink' }) {
  const v = {
    primary: 'bg-lime text-ink shadow-[0_8px_30px_-6px_#c6ff4d80]',
    pink: 'bg-pink text-ink shadow-[0_8px_30px_-6px_#ff6fb580]',
    ghost: 'bg-white/8 text-white ring-1 ring-white/12',
  }[variant]
  return <button {...p} className={`press rounded-full px-6 py-4 font-display text-lg font-extrabold ${v} ${className}`} />
}

/** Sticker art on a rarity starburst. locked = silhouette. */
export function BlipArt({ blip, size = 160, locked = false, idle = true, burst = true }: { blip: Blip; size?: number; locked?: boolean; idle?: boolean; burst?: boolean }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {burst && <div className="burst absolute inset-[4%]" style={{ background: locked ? '#ffffff10' : `${RARITY[blip.rarity].color}38` }} />}
      {broken ? (
        <div className={`relative h-[70%] w-[70%] rounded-[46%_46%_40%_40%] ${idle && !locked ? `idle-${blip.idle}` : ''}`}
          style={{ background: locked ? '#0008' : `radial-gradient(circle at 35% 30%, #fff8, ${blip.color} 30%, ${blip.color2})` }} />
      ) : (
        <img
          src={`/blips/${blip.id}.webp`}
          alt={locked ? 'Unknown Blip' : blip.name}
          draggable={false}
          onError={() => setBroken(true)}
          className={`relative h-[92%] w-[92%] select-none object-contain ${idle && !locked ? `idle-${blip.idle}` : ''}`}
          style={locked ? { filter: 'brightness(0) opacity(0.55)' } : { filter: 'drop-shadow(0 10px 18px #0006)' }}
        />
      )}
    </div>
  )
}

/** Bottom sheet. Drawer curve on enter, faster exit. */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}>
          <button aria-label="Close" className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-modal className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-ink-2 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-white/10"
            initial={{ y: '100%' }} animate={{ y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }} exit={{ y: '100%', transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/6 p-4 ring-1 ring-white/8">
      <div className="font-display text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-medium text-white/55">{label}</div>
    </div>
  )
}
