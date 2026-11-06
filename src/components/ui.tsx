import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CATEGORIES, categoryOf, type CategoryId } from '@/lib/categories'

export const glass: Record<'card' | 'inner' | 'pill', CSSProperties> = {
  card: {
    background: 'rgba(255,255,255,0.64)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.68)',
    boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
  },
  inner: {
    background: 'rgba(255,255,255,0.46)',
    border: '1px solid rgba(255,255,255,0.56)',
  },
  pill: {
    background: 'rgba(255,255,255,0.58)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.66)',
  },
}

export const SPECTRAL = 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl p-5 ${className}`} style={glass.card}>
      {children}
    </section>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
        {children}
      </h2>
      {action}
    </div>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${className}`}
      style={{ background: 'var(--accent)' }}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className = '',
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all hover:bg-white/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ ...glass.pill, color: 'var(--ink)', ...style }}
    >
      {children}
    </button>
  )
}

export function ProgressBar({ value, max }: { value: bigint; max: bigint }) {
  const pct = max > 0n ? Math.min(100, Number((value * 10_000n) / max) / 100) : 0
  const over = max > 0n && value > max
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(18,45,69,0.08)' }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: over ? 'var(--danger)' : 'var(--accent)' }}
      />
    </div>
  )
}

export function CategoryBadge({ id, size = 40 }: { id: CategoryId | null; size?: number }) {
  const Icon = categoryOf(id).icon
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: 'rgba(18,45,69,0.07)', color: 'var(--ink)' }}
    >
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  )
}

export function CategoryPicker({ value, onChange }: { value: CategoryId; onChange: (id: CategoryId) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Category">
      {CATEGORIES.map((c) => {
        const active = c.id === value
        const Icon = c.icon
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.id)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition-all active:scale-95"
            style={
              active
                ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                : { ...glass.inner, color: 'var(--ink-2)' }
            }
          >
            <Icon className="size-4" />
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

export function AmountField({
  value,
  onChange,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  return (
    <div className="rounded-2xl p-4" style={glass.inner}>
      <label htmlFor="amount" className="sr-only">
        Amount in USDC
      </label>
      <div className="flex items-baseline gap-2">
        <input
          id="amount"
          autoFocus={autoFocus}
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '')
            if (/^\d*\.?\d{0,6}$/.test(v)) onChange(v)
          }}
          placeholder="0.00"
          className="display w-full min-w-0 bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-300"
          style={{ color: 'var(--ink)' }}
        />
        <span className="text-sm font-medium" style={{ color: 'var(--subtle)' }}>
          USDC
        </span>
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono,
  maxLength,
  invalid,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  maxLength?: number
  invalid?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
        className={`min-h-12 w-full rounded-2xl px-4 text-sm outline-none ${mono ? 'mono' : ''}`}
        style={{
          ...glass.inner,
          color: 'var(--ink)',
          borderColor: invalid ? 'var(--danger)' : undefined,
        }}
      />
    </label>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1" style={{ background: SPECTRAL }} />
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>
            <div className="px-5 pb-8 pt-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="display text-xl font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex size-11 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <X className="size-5" />
                </button>
              </div>
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
