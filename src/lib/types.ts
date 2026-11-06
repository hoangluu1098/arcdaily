import type { Address, Hex } from 'viem'
import type { CategoryId } from './categories'
import type { BudgetPeriod } from './periods'

/** A cash or off-app expense the user logged by hand. Amounts are raw USDC units as strings. */
export interface Expense {
  id: string
  amountRaw: string
  category: CategoryId
  note: string
  ts: number
}

/** Category and memo for a payment, saved on this device and keyed by tx hash. */
export interface PaymentMeta {
  txHash: Hex
  to: Address
  amountRaw: string
  category: CategoryId
  memo: string
  ts: number
}

/** A USDC Transfer event touching the connected wallet, read from Arc Testnet. */
export interface ChainTransfer {
  txHash: Hex
  logIndex: number
  blockNumber: string
  from: Address
  to: Address
  valueRaw: string
  ts: number | null
}

export type Budgets = Record<BudgetPeriod, string>

export type LedgerKind = 'expense' | 'sent' | 'received'

export interface LedgerEntry {
  id: string
  kind: LedgerKind
  amount: bigint
  category: CategoryId | null
  note: string
  counterparty: Address | null
  txHash: Hex | null
  ts: number
}
