import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import type { Address } from 'viem'
import type { Daily } from '@/hooks/useDaily'
import { fmtUsdc, shortAddress } from '@/lib/money'
import type { LedgerEntry } from '@/lib/types'
import { BudgetCard } from './BudgetCard'
import { EntryRow } from './EntryRow'
import { Card, GhostButton, PrimaryButton, SectionTitle } from './ui'

export function HomeView({
  address,
  daily,
  onSend,
  onReceive,
  onAddExpense,
  onEditBudgets,
  onOpenEntry,
  onSeeAll,
}: {
  address: Address
  daily: Daily
  onSend: () => void
  onReceive: () => void
  onAddExpense: () => void
  onEditBudgets: () => void
  onOpenEntry: (e: LedgerEntry) => void
  onSeeAll: () => void
}) {
  const { balance, balanceLoading, ledger, spentIn, sync } = daily
  const recent = ledger.slice(0, 5)

  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TokenUSDC variant="branded" size={18} />
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              USDC balance
            </span>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: 'rgba(18,45,69,0.07)', color: 'var(--ink-2)' }}
          >
            Arc Testnet
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="display text-5xl font-bold tabular-nums">
            {balanceLoading || balance === undefined ? '...' : fmtUsdc(balance)}
          </span>
          <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>
            USDC
          </span>
        </div>
        <p className="mono mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
          {shortAddress(address)}
        </p>
        {balance === 0n && (
          <p className="mt-3 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(133,177,237,0.18)', color: 'var(--ink-2)' }}>
            Your balance is empty. Tap <strong>Get test USDC</strong> in the Arc Studio sidebar to fund this wallet.
          </p>
        )}
        <div className="mt-3 text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
          Spent today <strong style={{ color: 'var(--ink)' }}>{fmtUsdc(spentIn('daily'))} USDC</strong>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <PrimaryButton onClick={onSend}>
          <ArrowUpRight className="size-4" />
          Send
        </PrimaryButton>
        <GhostButton onClick={onReceive}>
          <ArrowDownLeft className="size-4" />
          Receive
        </GhostButton>
        <GhostButton onClick={onAddExpense}>
          <Plus className="size-4" />
          Expense
        </GhostButton>
      </div>

      <BudgetCard budgets={daily.budgets} spentIn={spentIn} onEdit={onEditBudgets} />

      <Card>
        <SectionTitle
          action={
            <button onClick={onSeeAll} className="min-h-11 px-1 text-xs font-semibold" style={{ color: 'var(--accent-hover)' }}>
              See all
            </button>
          }
        >
          Recent activity
        </SectionTitle>
        {recent.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm" style={{ color: 'var(--muted)' }}>
            {sync.syncing && <RefreshCw className="size-4 animate-spin" />}
            {sync.syncing ? 'Checking Arc Testnet for your payments...' : 'No activity yet. Send USDC or log an expense to get started.'}
          </div>
        ) : (
          <div className="-mx-2">
            {recent.map((e) => (
              <EntryRow key={e.id} entry={e} onOpen={onOpenEntry} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
