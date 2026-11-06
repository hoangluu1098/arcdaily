import type { Address } from 'viem'
import type { Daily } from '@/hooks/useDaily'
import { ReceiveCard } from './ReceiveCard'
import { SendForm, type Prefill } from './SendForm'

export type PayMode = 'send' | 'receive'

export function PayView({
  address,
  daily,
  mode,
  onMode,
  prefill,
}: {
  address: Address
  daily: Daily
  mode: PayMode
  onMode: (m: PayMode) => void
  prefill: Prefill
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl p-1" style={{ background: 'rgba(18,45,69,0.06)' }} role="tablist">
        {(['send', 'receive'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => onMode(m)}
            className="min-h-11 rounded-xl text-sm font-semibold capitalize transition-colors"
            style={
              mode === m
                ? { background: '#fff', color: 'var(--ink)', boxShadow: '0 2px 8px rgba(18,45,69,0.1)' }
                : { color: 'var(--muted)' }
            }
          >
            {m}
          </button>
        ))}
      </div>
      {mode === 'send' ? <SendForm address={address} daily={daily} prefill={prefill} /> : <ReceiveCard address={address} />}
    </div>
  )
}
