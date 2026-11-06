import { useCallback, useMemo } from 'react'
import { erc20Abi, type Address } from 'viem'
import { useReadContract } from 'wagmi'
import { CHAIN_ID, USDC_ADDRESS } from '@/lib/money'
import type { CategoryId } from '@/lib/categories'
import { periodStart, type BudgetPeriod } from '@/lib/periods'
import type { Budgets, Expense, LedgerEntry, PaymentMeta } from '@/lib/types'
import { useChainTransfers } from './useChainTransfers'
import { useNow } from './useNow'
import { useStoredState } from './useStoredState'

const EMPTY_BUDGETS: Budgets = { daily: '', weekly: '', monthly: '' }

export function useDaily(address: Address | undefined) {
  const prefix = address ? `arcdaily:v1:${address.toLowerCase()}` : null
  const [expenses, setExpenses] = useStoredState<Expense[]>(prefix && `${prefix}:expenses`, [])
  const [payments, setPayments] = useStoredState<PaymentMeta[]>(prefix && `${prefix}:payments`, [])
  const [budgets, setBudgets] = useStoredState<Budgets>(prefix && `${prefix}:budgets`, EMPTY_BUDGETS)
  const { transfers, status, refresh } = useChainTransfers(address)
  const now = useNow()

  const balance = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  })

  const addExpense = useCallback(
    (input: { amountRaw: bigint; category: CategoryId; note: string; ts: number }) => {
      setExpenses((prev) => [
        { id: crypto.randomUUID(), amountRaw: input.amountRaw.toString(), category: input.category, note: input.note, ts: input.ts },
        ...prev,
      ])
    },
    [setExpenses],
  )

  const removeExpense = useCallback(
    (id: string) => setExpenses((prev) => prev.filter((e) => e.id !== id)),
    [setExpenses],
  )

  const saveMeta = useCallback(
    (meta: PaymentMeta) => {
      setPayments((prev) => [meta, ...prev.filter((p) => p.txHash.toLowerCase() !== meta.txHash.toLowerCase())])
    },
    [setPayments],
  )

  const ledger = useMemo<LedgerEntry[]>(() => {
    if (!address) return []
    const me = address.toLowerCase()
    const metaByHash = new Map(payments.map((p) => [p.txHash.toLowerCase(), p]))
    const seen = new Set<string>()
    const entries: LedgerEntry[] = []

    for (const t of transfers) {
      const isOut = t.from.toLowerCase() === me
      const isIn = t.to.toLowerCase() === me
      if (isOut === isIn) continue // self-transfer: neither spending nor income
      const hash = t.txHash.toLowerCase()
      const meta = metaByHash.get(hash)
      if (isOut) seen.add(hash)
      entries.push({
        id: `${hash}:${t.logIndex}`,
        kind: isOut ? 'sent' : 'received',
        amount: BigInt(t.valueRaw),
        category: isOut ? (meta?.category ?? 'other') : null,
        note: isOut ? (meta?.memo ?? '') : '',
        counterparty: isOut ? t.to : t.from,
        txHash: t.txHash,
        ts: t.ts ?? meta?.ts ?? now,
      })
    }

    for (const p of payments) {
      if (seen.has(p.txHash.toLowerCase())) continue
      entries.push({
        id: `${p.txHash.toLowerCase()}:local`,
        kind: 'sent',
        amount: BigInt(p.amountRaw),
        category: p.category,
        note: p.memo,
        counterparty: p.to,
        txHash: p.txHash,
        ts: p.ts,
      })
    }

    for (const e of expenses) {
      entries.push({
        id: e.id,
        kind: 'expense',
        amount: BigInt(e.amountRaw),
        category: e.category,
        note: e.note,
        counterparty: null,
        txHash: null,
        ts: e.ts,
      })
    }

    return entries.sort((a, b) => b.ts - a.ts)
  }, [address, transfers, payments, expenses, now])

  const spentSince = useCallback(
    (since: number) =>
      ledger.reduce((sum, e) => (e.kind !== 'received' && e.ts >= since ? sum + e.amount : sum), 0n),
    [ledger],
  )

  const spentIn = useCallback(
    (period: BudgetPeriod) => spentSince(periodStart(period, now)),
    [spentSince, now],
  )

  return {
    now,
    balance: balance.data,
    balanceLoading: balance.isLoading,
    refetchBalance: balance.refetch,
    ledger,
    expenses,
    budgets,
    setBudgets,
    addExpense,
    removeExpense,
    saveMeta,
    spentIn,
    sync: status,
    refreshChain: refresh,
  }
}

export type Daily = ReturnType<typeof useDaily>
