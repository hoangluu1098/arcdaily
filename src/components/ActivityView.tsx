import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Daily } from '@/hooks/useDaily'
import { dayLabel, startOfDay } from '@/lib/periods'
import type { LedgerEntry, LedgerKind } from '@/lib/types'
import { EntryRow } from './EntryRow'
import { Card } from './ui'

type Filter = 'all' | LedgerKind

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
  { id: 'expense', label: 'Logged' },
]

export function ActivityView({ daily, onOpenEntry }: { daily: Daily; onOpenEntry: (e: LedgerEntry) => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const { ledger, sync, refreshChain } = daily

  const groups = useMemo(() => {
    const rows = filter === 'all' ? ledger : ledger.filter((e) => e.kind === filter)
    const map = new Map<number, LedgerEntry[]>()
    for (const e of rows) {
      const k = startOfDay(e.ts)
      map.set(k, [...(map.get(k) ?? []), e])
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [ledger, filter])

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter activity">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className="min-h-11 shrink-0 rounded-full px-4 text-xs font-semibold transition-all active:scale-95"
              style={active ? { background: 'var(--accent)', color: '#fff' } : { background: 'rgba(255,255,255,0.58)', border: '1px solid rgba(255,255,255,0.66)' }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <Card className="!p-3">
        {groups.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {sync.syncing ? 'Checking Arc Testnet...' : 'Nothing here yet.'}
          </div>
        ) : (
          groups.map(([day, rows]) => (
            <div key={day} className="mb-2 last:mb-0">
              <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
                {dayLabel(day)}
              </div>
              {rows.map((e) => (
                <EntryRow key={e.id} entry={e} onOpen={onOpenEntry} />
              ))}
            </div>
          ))
        )}
      </Card>

      <div className="flex items-center justify-between gap-3 px-1 text-xs" style={{ color: 'var(--subtle)' }}>
        <span role="status">
          {sync.error
            ? sync.error
            : sync.syncing && sync.remaining > 0n
              ? `Scanning Arc Testnet: ${sync.remaining.toLocaleString()} blocks left`
              : sync.syncing
                ? 'Syncing...'
                : sync.head !== null
                  ? `Synced to block ${sync.head.toLocaleString()}`
                  : 'Waiting for first sync'}
        </span>
        <button
          onClick={() => void refreshChain()}
          disabled={sync.syncing}
          className="flex min-h-11 items-center gap-1 font-semibold disabled:opacity-40"
          style={{ color: 'var(--accent-hover)' }}
        >
          <RefreshCw className={`size-3.5 ${sync.syncing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <p className="px-1 text-[11px]" style={{ color: 'var(--subtle)' }}>
        On-chain history covers recent USDC transfers on Arc Testnet. Memos, categories and logged expenses live on this device.
      </p>
    </div>
  )
}
