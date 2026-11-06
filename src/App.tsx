import { useState } from 'react'
import { isAddress } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'
import { TriangleAlert } from 'lucide-react'
import { useDaily } from '@/hooks/useDaily'
import { CHAIN_ID } from '@/lib/money'
import type { LedgerEntry } from '@/lib/types'
import { ActivityView } from '@/components/ActivityView'
import { Header, TabBar, type Tab } from '@/components/Header'
import { HomeView } from '@/components/HomeView'
import { InsightsView } from '@/components/InsightsView'
import { PayView, type PayMode } from '@/components/PayView'
import type { Prefill } from '@/components/SendForm'
import { BudgetSheet, EntrySheet, ExpenseSheet } from '@/components/Sheets'
import { Welcome } from '@/components/Welcome'

/** A payment link opens the Pay tab with the form filled in. Only well-formed values are kept. */
function readPrefill(): Prefill | null {
  const q = new URLSearchParams(window.location.search)
  const to = q.get('to') ?? ''
  if (!isAddress(to)) return null
  const amount = q.get('amount') ?? ''
  return {
    to,
    amount: /^\d+(\.\d{1,6})?$/.test(amount) ? amount : '',
    memo: (q.get('memo') ?? '').slice(0, 60),
  }
}

export default function App() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const daily = useDaily(address)

  const [initialPrefill] = useState(readPrefill)
  const [tab, setTab] = useState<Tab>(initialPrefill ? 'pay' : 'home')
  const [payMode, setPayMode] = useState<PayMode>('send')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [entry, setEntry] = useState<LedgerEntry | null>(null)

  const prefill: Prefill = initialPrefill ?? { to: '', amount: '', memo: '' }
  const wrongChain = isConnected && chainId !== CHAIN_ID

  const openPay = (mode: PayMode) => {
    setPayMode(mode)
    setTab('pay')
  }

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ background: 'linear-gradient(180deg, #f9f9fc 0%, #fffcf7 52%, #fbf7f2 100%)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          style={{ position: 'absolute', top: '6%', left: '4%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.22) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          style={{ position: 'absolute', bottom: '8%', right: '8%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,205,131,0.20) 0%, transparent 70%)', filter: 'blur(58px)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-24 pt-6">
        <Header />

        {!isConnected || !address ? (
          <Welcome />
        ) : (
          <>
            {wrongChain && (
              <div
                className="mb-4 flex items-center justify-between gap-3 rounded-2xl p-3 text-xs"
                style={{ background: 'rgba(186,43,76,0.1)', color: 'var(--danger)' }}
                role="alert"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <TriangleAlert className="size-4 shrink-0" />
                  Your wallet is on another network.
                </span>
                <button
                  onClick={() => switchChain({ chainId: CHAIN_ID })}
                  disabled={switching}
                  className="min-h-11 shrink-0 rounded-xl px-3 font-semibold text-white disabled:opacity-50"
                  style={{ background: 'var(--danger)' }}
                >
                  {switching ? 'Switching...' : 'Switch to Arc Testnet'}
                </button>
              </div>
            )}

            <TabBar tab={tab} onChange={setTab} />

            {tab === 'home' && (
              <HomeView
                address={address}
                daily={daily}
                onSend={() => openPay('send')}
                onReceive={() => openPay('receive')}
                onAddExpense={() => setExpenseOpen(true)}
                onEditBudgets={() => setBudgetOpen(true)}
                onOpenEntry={setEntry}
                onSeeAll={() => setTab('activity')}
              />
            )}
            {tab === 'pay' && <PayView address={address} daily={daily} mode={payMode} onMode={setPayMode} prefill={prefill} />}
            {tab === 'activity' && <ActivityView daily={daily} onOpenEntry={setEntry} />}
            {tab === 'insights' && <InsightsView daily={daily} onEditBudgets={() => setBudgetOpen(true)} />}

            {(tab === 'activity' || tab === 'insights') && (
              <button
                onClick={() => setExpenseOpen(true)}
                className="mt-4 min-h-12 w-full rounded-2xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.58)', border: '1px solid rgba(255,255,255,0.66)' }}
              >
                Add an expense
              </button>
            )}

            <ExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} daily={daily} />
            <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} daily={daily} />
            <EntrySheet entry={entry} onClose={() => setEntry(null)} daily={daily} />
          </>
        )}
      </div>
    </div>
  )
}
