import { useEffect, useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Address } from 'viem'
import { getShareBase } from '@/lib/share'
import { parseInput } from '@/lib/money'
import { AmountField, Card, GhostButton, SectionTitle, TextField, glass } from './ui'

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(message)
  } catch {
    toast.error('Could not copy. Select the text and copy it manually.')
  }
}

export function ReceiveCard({ address }: { address: Address }) {
  const [base, setBase] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let live = true
    void getShareBase().then((b) => live && setBase(b))
    return () => {
      live = false
    }
  }, [])

  const params = new URLSearchParams({ to: address })
  if (parseInput(amount) !== null) params.set('amount', amount)
  if (memo.trim()) params.set('memo', memo.trim())
  const link = base ? `${base}/?${params.toString()}` : null

  return (
    <div className="space-y-3">
      <Card>
        <SectionTitle>Your address</SectionTitle>
        <div className="mono break-all rounded-2xl p-4 text-sm" style={glass.inner}>
          {address}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          Share this address to receive USDC on Arc Testnet. Incoming payments appear in Activity automatically.
        </p>
        <GhostButton
          className="mt-3 w-full"
          onClick={() => {
            void copy(address, 'Address copied')
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy address'}
        </GhostButton>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Request a payment</SectionTitle>
        <AmountField value={amount} onChange={setAmount} />
        <TextField label="Memo (optional)" value={memo} onChange={setMemo} placeholder="Dinner split" maxLength={60} />
        <GhostButton
          className="w-full"
          disabled={!link}
          onClick={() => link && void copy(link, 'Payment link copied')}
        >
          <Link2 className="size-4" />
          Copy payment link
        </GhostButton>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Whoever opens the link gets the send form pre-filled with your address
          {parseInput(amount) !== null ? ', the amount' : ''}
          {memo.trim() ? ' and memo' : ''}.
        </p>
      </Card>
    </div>
  )
}
