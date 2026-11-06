import { ConnectKitButton } from 'connectkit'
import { House, ArrowUpRight, ListChecks, ChartColumn } from 'lucide-react'
import { motion } from 'framer-motion'
import { shortAddress } from '@/lib/money'

export type Tab = 'home' | 'pay' | 'activity' | 'insights'

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'pay', label: 'Pay', icon: ArrowUpRight },
  { id: 'activity', label: 'Activity', icon: ListChecks },
  { id: 'insights', label: 'Insights', icon: ChartColumn },
]

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="9" fill="#122d45" />
      <path d="M7 20a7 7 0 0 1 14 0" stroke="#acc6e9" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="14" cy="9" r="2.2" fill="#ffcd83" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Mark />
        <span className="display text-xl font-bold">ArcDaily</span>
      </div>
      <ConnectKitButton.Custom>
        {({ isConnected, isConnecting, show, address }) => (
          <button
            onClick={show}
            className="min-h-11 rounded-full px-4 text-xs font-semibold transition-all active:scale-95"
            style={
              isConnected
                ? { background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border)', color: 'var(--ink)' }
                : { background: 'var(--accent)', color: '#fff' }
            }
          >
            {isConnecting ? 'Connecting...' : isConnected && address ? <span className="mono">{shortAddress(address)}</span> : 'Connect wallet'}
          </button>
        )}
      </ConnectKitButton.Custom>
    </header>
  )
}

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="mb-5 grid grid-cols-4 gap-1 rounded-2xl p-1"
      style={{ background: 'rgba(18,45,69,0.06)' }}
      aria-label="Sections"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            className="relative flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold"
            style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-xl bg-white"
                style={{ boxShadow: '0 2px 8px rgba(18,45,69,0.1)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
