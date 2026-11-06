import { useState } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import type { Daily } from '@/hooks/useDaily'
import type { CategoryId } from '@/lib/categories'
import { categoryOf } from '@/lib/categories'
import { CHAIN_ID, fmtUsdc, parseInput, shortAddress } from '@/lib/money'
import { PERIOD_LABEL, type BudgetPeriod } from '@/lib/periods'
import type { Budgets, LedgerEntry } from '@/lib/types'
import { buildAddressExplorerUrl, buildTxExplorerUrl } from '@/onchain-facts'
import { AmountField, CategoryPicker, GhostButton, PrimaryButton, Sheet, TextField, glass } from './ui'

const DAY = 86_400_000

export function ExpenseSheet({ open, onClose, daily }: { open: boolean; onClose: () => void; daily: Daily }) {
  return (
    <Sheet open={open} onClose={onClose} title="Add expense">
      <ExpenseForm
        onSave={(v) => {
          daily.addExpense(v)
          onClose()
        }}
      />
    </Sheet>
  )
}

function ExpenseForm({
  onSave,
}: {
  onSave: (v: { amountRaw: bigint; category: CategoryId; note: string; ts: number }) => void
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<CategoryId>('food')
  const [note, setNote] = useState('')
  const [yesterday, setYesterday] = useState(false)
  const raw = parseInput(amount)

  return (
    <div className="space-y-4">
      <AmountField value={amount} onChange={setAmount} autoFocus />
      <CategoryPicker value={category} onChange={setCategory} />
      <TextField label="Note (optional)" value={note} onChange={setNote} placeholder="Morning latte" maxLength={60} />
      <div className="grid grid-cols-2 gap-1 rounded-2xl p-1" style={{ background: 'rgba(18,45,69,0.06)' }}>
        {[false, true].map((y) => (
          <button
            key={String(y)}
            onClick={() => setYesterday(y)}
            aria-pressed={yesterday === y}
            className="min-h-11 rounded-xl text-sm font-semibold"
            style={yesterday === y ? { background: '#fff', boxShadow: '0 2px 8px rgba(18,45,69,0.1)' } : { color: 'var(--muted)' }}
          >
            {y ? 'Yesterday' : 'Today'}
          </button>
        ))}
      </div>
      <PrimaryButton
        disabled={raw === null}
        onClick={() => raw !== null && onSave({ amountRaw: raw, category, note: note.trim(), ts: Date.now() - (yesterday ? DAY : 0) })}
      >
        Save expense
      </PrimaryButton>
      <p className="text-center text-[11px]" style={{ color: 'var(--subtle)' }}>
        Logged expenses are saved on this device. They do not move any funds.
      </p>
    </div>
  )
}

const PERIODS: BudgetPeriod[] = ['daily', 'weekly', 'monthly']

export function BudgetSheet({ open, onClose, daily }: { open: boolean; onClose: () => void; daily: Daily }) {
  return (
    <Sheet open={open} onClose={onClose} title="Spending limits">
      <BudgetForm
        initial={daily.budgets}
        onSave={(b) => {
          daily.setBudgets(b)
          onClose()
        }}
      />
    </Sheet>
  )
}

function BudgetForm({ initial, onSave }: { initial: Budgets; onSave: (b: Budgets) => void }) {
  const [values, setValues] = useState<Budgets>(initial)
  const invalid = PERIODS.some((p) => values[p].trim() !== '' && parseInput(values[p]) === null)

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Set a limit in USDC for each period. Leave a field empty for no limit. You get a warning before a payment would go over.
      </p>
      {PERIODS.map((p) => (
        <TextField
          key={p}
          label={`${PERIOD_LABEL[p]} limit (USDC)`}
          value={values[p]}
          onChange={(v) => /^\d*\.?\d{0,6}$/.test(v) && setValues((prev) => ({ ...prev, [p]: v }))}
          placeholder="No limit"
        />
      ))}
      <PrimaryButton disabled={invalid} onClick={() => onSave(values)}>
        Save limits
      </PrimaryButton>
    </div>
  )
}

export function EntrySheet({
  entry,
  onClose,
  daily,
}: {
  entry: LedgerEntry | null
  onClose: () => void
  daily: Daily
}) {
  return (
    <Sheet open={entry !== null} onClose={onClose} title={entry?.kind === 'received' ? 'Payment received' : entry?.kind === 'sent' ? 'Payment sent' : 'Expense'}>
      {entry && <EntryDetail key={entry.id} entry={entry} daily={daily} onClose={onClose} />}
    </Sheet>
  )
}

function EntryDetail({ entry, daily, onClose }: { entry: LedgerEntry; daily: Daily; onClose: () => void }) {
  const [category, setCategory] = useState<CategoryId>(entry.category ?? 'other')
  const [memo, setMemo] = useState(entry.note)
  const sign = entry.kind === 'received' ? '+' : '-'
  const changed = category !== (entry.category ?? 'other') || memo.trim() !== entry.note

  return (
    <div className="space-y-4">
      <div>
        <div className="display text-4xl font-bold tabular-nums" style={{ color: entry.kind === 'received' ? 'var(--success)' : 'var(--ink)' }}>
          {sign}
          {fmtUsdc(entry.amount)} <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
        </div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          {new Date(entry.ts).toLocaleString()}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl p-4 text-xs" style={glass.inner}>
        {entry.kind !== 'received' && (
          <Line label="Category" value={categoryOf(entry.category).label} />
        )}
        {entry.counterparty && (
          <div className="flex justify-between gap-4">
            <span style={{ color: 'var(--muted)' }}>{entry.kind === 'received' ? 'From' : 'To'}</span>
            <a
              href={buildAddressExplorerUrl(CHAIN_ID, entry.counterparty)}
              target="_blank"
              rel="noopener noreferrer"
              className="mono font-semibold underline-offset-2 hover:underline"
            >
              {shortAddress(entry.counterparty)}
            </a>
          </div>
        )}
        {entry.note && entry.kind !== 'sent' && <Line label="Note" value={entry.note} />}
        {entry.txHash && <Line label="Transaction" value={`${entry.txHash.slice(0, 10)}...${entry.txHash.slice(-6)}`} mono />}
      </div>

      {entry.kind === 'sent' && entry.counterparty && entry.txHash && (
        <div className="space-y-3">
          <TextField label="Memo (saved on this device)" value={memo} onChange={setMemo} maxLength={60} />
          <CategoryPicker value={category} onChange={setCategory} />
          <PrimaryButton
            disabled={!changed}
            onClick={() => {
              if (!entry.counterparty || !entry.txHash) return
              daily.saveMeta({
                txHash: entry.txHash,
                to: entry.counterparty,
                amountRaw: entry.amount.toString(),
                category,
                memo: memo.trim(),
                ts: entry.ts,
              })
              onClose()
            }}
          >
            Save changes
          </PrimaryButton>
        </div>
      )}

      {entry.txHash && (
        <a
          href={buildTxExplorerUrl(CHAIN_ID, entry.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--accent-hover)' }}
        >
          View on explorer <ExternalLink className="size-3" />
        </a>
      )}

      {entry.kind === 'expense' && (
        <GhostButton
          className="w-full"
          onClick={() => {
            daily.removeExpense(entry.id)
            onClose()
          }}
          style={{ color: 'var(--danger)' }}
        >
          <Trash2 className="size-4" />
          Delete expense
        </GhostButton>
      )}
    </div>
  )
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span className={`truncate font-semibold ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  )
}
