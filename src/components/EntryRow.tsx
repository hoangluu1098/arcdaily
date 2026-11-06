import { ArrowDownLeft } from 'lucide-react'
import { categoryOf } from '@/lib/categories'
import { fmtUsdc, shortAddress } from '@/lib/money'
import { relativeTime } from '@/lib/periods'
import type { LedgerEntry } from '@/lib/types'
import { CategoryBadge } from './ui'

export function entryTitle(e: LedgerEntry): string {
  if (e.note) return e.note
  if (e.kind === 'received') return 'Received'
  return categoryOf(e.category).label
}

export function entrySubtitle(e: LedgerEntry): string {
  const when = relativeTime(e.ts)
  if (e.kind === 'expense') return `${categoryOf(e.category).label} · Logged · ${when}`
  if (e.kind === 'sent') return `${categoryOf(e.category).label} · To ${e.counterparty ? shortAddress(e.counterparty) : ''} · ${when}`
  return `From ${e.counterparty ? shortAddress(e.counterparty) : ''} · ${when}`
}

export function EntryRow({ entry, onOpen }: { entry: LedgerEntry; onOpen: (e: LedgerEntry) => void }) {
  const received = entry.kind === 'received'
  return (
    <button
      onClick={() => onOpen(entry)}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-white/60"
    >
      {received ? (
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(26,128,71,0.12)', color: 'var(--success)' }}
        >
          <ArrowDownLeft className="size-[18px]" />
        </div>
      ) : (
        <CategoryBadge id={entry.category} />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{entryTitle(entry)}</div>
        <div className="truncate text-xs" style={{ color: 'var(--muted)' }}>
          {entrySubtitle(entry)}
        </div>
      </div>
      <div
        className="display shrink-0 text-sm font-bold tabular-nums"
        style={{ color: received ? 'var(--success)' : 'var(--ink)' }}
      >
        {received ? '+' : '-'}
        {fmtUsdc(entry.amount)}
      </div>
    </button>
  )
}
