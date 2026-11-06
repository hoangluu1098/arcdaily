import { useMemo, useState } from 'react'
import type { Daily } from '@/hooks/useDaily'
import { CATEGORIES, categoryOf, type CategoryId } from '@/lib/categories'
import { fmtUsdc } from '@/lib/money'
import { startOfDay } from '@/lib/periods'
import { BudgetCard } from './BudgetCard'
import { Card, CategoryBadge, SectionTitle } from './ui'

const DAY = 86_400_000
const RANGES = [
  { id: 7, label: '7 days' },
  { id: 30, label: '30 days' },
] as const

export function InsightsView({ daily, onEditBudgets }: { daily: Daily; onEditBudgets: () => void }) {
  const [range, setRange] = useState<7 | 30>(7)
  const { ledger, spentIn, budgets, now } = daily
  const today = startOfDay(now)

  const data = useMemo(() => {
    const first = today - (range - 1) * DAY
    const perDay = new Map<number, bigint>()
    for (let i = 0; i < range; i++) perDay.set(first + i * DAY, 0n)
    const perCategory = new Map<CategoryId, bigint>()
    let spent = 0n
    let received = 0n
    for (const e of ledger) {
      if (e.ts < first) continue
      if (e.kind === 'received') {
        received += e.amount
        continue
      }
      spent += e.amount
      const key = startOfDay(e.ts)
      perDay.set(key, (perDay.get(key) ?? 0n) + e.amount)
      const cat = e.category ?? 'other'
      perCategory.set(cat, (perCategory.get(cat) ?? 0n) + e.amount)
    }
    const days = [...perDay.entries()].sort((a, b) => a[0] - b[0])
    const maxDay = days.reduce((m, [, v]) => (v > m ? v : m), 0n)
    const cats = CATEGORIES.map((c) => ({ id: c.id, total: perCategory.get(c.id) ?? 0n }))
      .filter((c) => c.total > 0n)
      .sort((a, b) => (a.total > b.total ? -1 : 1))
    return { days, maxDay, cats, spent, received }
  }, [ledger, range, today])

  const avg = data.spent / BigInt(range)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl p-1" style={{ background: 'rgba(18,45,69,0.06)' }} role="tablist">
        {RANGES.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={range === r.id}
            onClick={() => setRange(r.id)}
            className="min-h-11 rounded-xl text-sm font-semibold transition-colors"
            style={range === r.id ? { background: '#fff', boxShadow: '0 2px 8px rgba(18,45,69,0.1)' } : { color: 'var(--muted)' }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
          Spent in the last {range} days
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="display text-4xl font-bold tabular-nums">{fmtUsdc(data.spent)}</span>
          <span className="text-base font-medium" style={{ color: 'var(--subtle)' }}>
            USDC
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
          <span>
            Avg per day <strong style={{ color: 'var(--ink)' }}>{fmtUsdc(avg)}</strong>
          </span>
          <span>
            Received <strong style={{ color: 'var(--success)' }}>{fmtUsdc(data.received)}</strong>
          </span>
        </div>

        <div className="mt-5 flex h-28 items-end gap-[3px]" role="img" aria-label={`Daily spending for the last ${range} days`}>
          {data.days.map(([day, total]) => {
            const h = data.maxDay > 0n ? Math.max(4, Number((total * 100n) / data.maxDay)) : 4
            const isToday = day === today
            return (
              <div key={day} className="flex h-full flex-1 flex-col justify-end" title={`${new Date(day).toLocaleDateString()}: ${fmtUsdc(total)} USDC`}>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${h}%`,
                    background: total > 0n ? 'var(--accent)' : 'rgba(18,45,69,0.1)',
                    opacity: isToday || total === 0n ? 1 : 0.72,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: 'var(--subtle)' }}>
          <span>{new Date(data.days[0][0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span>Today</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>By category</SectionTitle>
        {data.cats.length === 0 ? (
          <p className="py-3 text-sm" style={{ color: 'var(--muted)' }}>
            No spending in this period yet.
          </p>
        ) : (
          <div className="space-y-4">
            {data.cats.map((c) => {
              const pct = data.spent > 0n ? Number((c.total * 1000n) / data.spent) / 10 : 0
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <CategoryBadge id={c.id} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold">{categoryOf(c.id).label}</span>
                      <span className="tabular-nums" style={{ color: 'var(--muted)' }}>
                        {fmtUsdc(c.total)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(18,45,69,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <BudgetCard budgets={budgets} spentIn={spentIn} onEdit={onEditBudgets} />
    </div>
  )
}
