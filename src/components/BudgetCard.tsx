import { Settings2 } from 'lucide-react'
import { fmtUsdc, parseInput } from '@/lib/money'
import { PERIOD_LABEL, type BudgetPeriod } from '@/lib/periods'
import type { Budgets } from '@/lib/types'
import { Card, ProgressBar, SectionTitle } from './ui'

const PERIODS: BudgetPeriod[] = ['daily', 'weekly', 'monthly']

export function BudgetCard({
  budgets,
  spentIn,
  onEdit,
}: {
  budgets: Budgets
  spentIn: (p: BudgetPeriod) => bigint
  onEdit: () => void
}) {
  const anySet = PERIODS.some((p) => parseInput(budgets[p]) !== null)
  return (
    <Card>
      <SectionTitle
        action={
          <button
            onClick={onEdit}
            className="flex min-h-11 items-center gap-1 px-1 text-xs font-semibold"
            style={{ color: 'var(--accent-hover)' }}
          >
            <Settings2 className="size-3.5" />
            {anySet ? 'Edit limits' : 'Set limits'}
          </button>
        }
      >
        Smart budget
      </SectionTitle>
      <div className="space-y-4">
        {PERIODS.map((p) => {
          const limit = parseInput(budgets[p])
          const spent = spentIn(p)
          const left = limit !== null ? limit - spent : null
          return (
            <div key={p}>
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-semibold">{PERIOD_LABEL[p]}</span>
                <span className="tabular-nums" style={{ color: 'var(--muted)' }}>
                  {fmtUsdc(spent)}
                  {limit !== null ? ` / ${fmtUsdc(limit)} USDC` : ' USDC spent'}
                </span>
              </div>
              {limit !== null ? (
                <>
                  <ProgressBar value={spent} max={limit} />
                  <div
                    className="mt-1 text-[11px] tabular-nums"
                    style={{ color: left !== null && left < 0n ? 'var(--danger)' : 'var(--subtle)' }}
                  >
                    {left !== null && left < 0n ? `${fmtUsdc(-left)} over limit` : `${fmtUsdc(left ?? 0n)} left`}
                  </div>
                </>
              ) : (
                <div className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                  No limit set
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
