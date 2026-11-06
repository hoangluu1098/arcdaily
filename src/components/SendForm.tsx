import { useEffect, useMemo, useRef, useState } from 'react'
import { erc20Abi, isAddress, type Address } from 'viem'
import { useAccount, useDisconnect, usePublicClient, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CheckCircle2, ExternalLink, Loader2, TriangleAlert } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import type { CategoryId } from '@/lib/categories'
import type { Daily } from '@/hooks/useDaily'
import { CHAIN_ID, USDC_ADDRESS, fmtUsdc, parseInput, shortHash } from '@/lib/money'
import { PERIOD_LABEL, type BudgetPeriod } from '@/lib/periods'
import { AmountField, Card, CategoryPicker, GhostButton, PrimaryButton, TextField, glass } from './ui'

export interface Prefill {
  to: string
  amount: string
  memo: string
}

const QUICK = ['1', '5', '10', '25']
const PERIODS: BudgetPeriod[] = ['daily', 'weekly', 'monthly']

function readableError(error: unknown): string | null {
  if (!error) return null
  const e = error as { message?: string; shortMessage?: string; code?: number }
  const message = (e.message ?? '').toLowerCase()
  if (message.includes('user rejected') || message.includes('user denied') || e.code === 4001) return null
  if (message.includes('not been authorized') || e.code === 4100) {
    return 'Your wallet has not authorized this site for the connected account. Reconnect your wallet, approve the connection, then try again.'
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return 'The Arc Testnet RPC is rate limiting requests right now. Wait a few seconds and try again.'
  }
  if (message.includes('insufficient funds') || message.includes('exceeds balance') || message.includes('transfer amount exceeds')) {
    return 'Insufficient balance to cover this payment and the network fee.'
  }
  const detail = (e.shortMessage ?? e.message ?? '').split('\n')[0].slice(0, 180)
  return detail ? `Could not send: ${detail}` : 'Could not send. Please try again.'
}

interface Pending {
  to: Address
  amountRaw: bigint
  category: CategoryId
  memo: string
}

export function SendForm({ address, daily, prefill }: { address: Address; daily: Daily; prefill: Prefill }) {
  const { chainId, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash, chainId: CHAIN_ID })

  const [to, setTo] = useState(prefill.to)
  const [amount, setAmount] = useState(prefill.amount)
  const [memo, setMemo] = useState(prefill.memo)
  const [category, setCategory] = useState<CategoryId>('other')
  const [submitted, setSubmitted] = useState<Pending | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [prepError, setPrepError] = useState<unknown>(null)
  const client = usePublicClient({ chainId: CHAIN_ID })
  const recorded = useRef<string | null>(null)

  const { saveMeta, refetchBalance, refreshChain, balance, budgets, spentIn } = daily

  useEffect(() => {
    if (!receipt.isSuccess || !hash || recorded.current === hash || !submitted) return
    recorded.current = hash
    const p = submitted
    saveMeta({ txHash: hash, to: p.to, amountRaw: p.amountRaw.toString(), category: p.category, memo: p.memo, ts: Date.now() })
    void refetchBalance()
    void refreshChain()
  }, [receipt.isSuccess, hash, submitted, saveMeta, refetchBalance, refreshChain])

  const amountRaw = parseInput(amount)
  const toValid = isAddress(to)
  const isSelf = toValid && to.toLowerCase() === address.toLowerCase()
  const insufficient = amountRaw !== null && balance !== undefined && amountRaw > balance
  const wrongChain = chainId !== CHAIN_ID

  const overLimits = useMemo(() => {
    if (amountRaw === null) return []
    return PERIODS.filter((p) => {
      const limit = parseInput(budgets[p])
      return limit !== null && spentIn(p) + amountRaw > limit
    })
  }, [amountRaw, budgets, spentIn])

  const canSend = toValid && !isSelf && amountRaw !== null && !insufficient
  const busy = preparing || isPending || receipt.isLoading
  const done = receipt.isSuccess && hash
  const failedReceipt = receipt.isError || (receipt.data && receipt.data.status === 'reverted')
  const err = readableError(error ?? prepError)

  const send = async () => {
    if (wrongChain) {
      switchChain({ chainId: CHAIN_ID })
      return
    }
    if (!canSend || amountRaw === null || !client) return
    const args = [to, amountRaw] as const
    setPrepError(null)
    setPreparing(true)
    try {
      // Re-ask the wallet for account access so a stale site permission is refreshed before signing.
      const provider = (await connector?.getProvider()) as { request?: (a: { method: string }) => Promise<unknown> } | undefined
      await provider?.request?.({ method: 'eth_requestAccounts' })
      // Simulate and price the transfer through our own RPC so the wallet is handed a ready-to-sign transaction.
      const gas = await client.estimateContractGas({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args,
        account: address,
      })
      const fees = await client.estimateFeesPerGas().catch(() => null)
      setSubmitted({ to, amountRaw, category, memo: memo.trim() })
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args,
        chainId: CHAIN_ID,
        gas: (gas * 13n) / 10n,
        ...(fees?.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
      })
    } catch (e) {
      setPrepError(e)
    } finally {
      setPreparing(false)
    }
  }

  const startOver = () => {
    reset()
    setSubmitted(null)
    setTo('')
    setAmount('')
    setMemo('')
    setCategory('other')
  }

  if (done) {
    const p = submitted
    return (
      <Card>
        <div className="flex items-center gap-2" style={{ color: 'var(--success)' }}>
          <CheckCircle2 className="size-5" />
          <span className="text-sm font-semibold">Payment confirmed</span>
        </div>
        <div className="display mt-3 text-4xl font-bold tabular-nums">
          {p ? fmtUsdc(p.amountRaw) : ''} <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
        </div>
        <div className="mt-4 space-y-2 rounded-2xl p-4 text-xs" style={glass.inner}>
          <Row label="To" value={p?.to ?? ''} mono />
          {p?.memo ? <Row label="Memo" value={p.memo} /> : null}
          <Row label="Transaction" value={shortHash(hash)} mono />
        </div>
        <a
          href={buildTxExplorerUrl(CHAIN_ID, hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--accent-hover)' }}
        >
          View on explorer <ExternalLink className="size-3" />
        </a>
        <PrimaryButton onClick={startOver} className="mt-2">
          Send another payment
        </PrimaryButton>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <TextField
        label="Recipient address"
        value={to}
        onChange={(v) => setTo(v.trim())}
        placeholder="0x..."
        mono
        invalid={to.length > 0 && (!toValid || isSelf)}
      />
      {to.length > 0 && !toValid && (
        <p className="-mt-2 text-xs" style={{ color: 'var(--danger)' }}>
          Enter a valid EVM address.
        </p>
      )}
      {isSelf && (
        <p className="-mt-2 text-xs" style={{ color: 'var(--danger)' }}>
          That is your own wallet. Enter someone else's address.
        </p>
      )}

      <div>
        <AmountField value={amount} onChange={setAmount} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q)}
                className="min-h-11 rounded-full px-3.5 text-xs font-semibold tabular-nums transition-all active:scale-95"
                style={{ ...glass.pill, color: 'var(--ink)' }}
              >
                ${q}
              </button>
            ))}
          </div>
          <span className="text-xs tabular-nums" style={{ color: 'var(--subtle)' }}>
            Balance {balance === undefined ? '...' : fmtUsdc(balance)}
          </span>
        </div>
        {insufficient && (
          <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            Amount is more than your balance.
          </p>
        )}
      </div>

      <TextField label="Memo (saved on this device)" value={memo} onChange={setMemo} placeholder="Coffee, lunch, rent..." maxLength={60} />

      <div>
        <div className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
          Category
        </div>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>

      {overLimits.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-2xl p-3 text-xs"
          style={{ background: 'rgba(154,106,18,0.12)', color: 'var(--warn)' }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            This payment would put you over your {overLimits.map((p) => PERIOD_LABEL[p].toLowerCase()).join(' and ')} limit.
            You can still send it.
          </span>
        </div>
      )}

      <div className="space-y-2">
        <PrimaryButton onClick={() => void send()} disabled={busy || switching || (!wrongChain && !canSend)}>
          {wrongChain ? (
            switching ? 'Switching...' : 'Switch to Arc Testnet'
          ) : preparing ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Preparing...
            </>
          ) : isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Confirm in wallet...
            </>
          ) : receipt.isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Confirming on Arc...
            </>
          ) : (
            `Send${amountRaw !== null ? ` ${fmtUsdc(amountRaw)} USDC` : ''}`
          )}
        </PrimaryButton>
        <p className="text-center text-[11px]" style={{ color: 'var(--subtle)' }}>
          Network fees on Arc are paid in USDC.
        </p>
      </div>

      {err && (
        <p className="text-xs" style={{ color: 'var(--danger)' }} role="alert">
          {err}
        </p>
      )}
      {failedReceipt && (
        <p className="text-xs" style={{ color: 'var(--danger)' }} role="alert">
          The transaction did not go through. Nothing was sent.
        </p>
      )}
      {err?.includes('Reconnect your wallet') && (
        <GhostButton onClick={() => { reset(); setPrepError(null); disconnect() }} className="w-full">
          Disconnect and reconnect wallet
        </GhostButton>
      )}
      {(err || failedReceipt) && (
        <GhostButton onClick={() => { reset(); setPrepError(null) }} className="w-full">
          Try again
        </GhostButton>
      )}
    </Card>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span className={`truncate font-semibold ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  )
}
