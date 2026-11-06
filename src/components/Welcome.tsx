import { ConnectKitButton } from 'connectkit'
import { Wallet, PiggyBank, ArrowUpRight, ChartColumn } from 'lucide-react'
import { Card, PrimaryButton } from './ui'

const POINTS = [
  { icon: ArrowUpRight, title: 'Pay with USDC', text: 'Send to anyone on Arc Testnet with a note on every payment.' },
  { icon: PiggyBank, title: 'Stay on budget', text: 'Daily, weekly and monthly limits with live progress.' },
  { icon: ChartColumn, title: 'See where it goes', text: 'Category breakdowns built from your real activity.' },
]

export function Welcome() {
  return (
    <div className="space-y-3">
      <Card className="!p-6">
        <h1 className="display text-balance text-4xl font-bold leading-[1.05]">Spend smarter. Pay with USDC.</h1>
        <p className="mt-3 text-pretty text-sm" style={{ color: 'var(--muted)' }}>
          ArcDaily is your everyday spending companion on Arc. Connect a wallet to see your balance, pay people and
          track every purchase.
        </p>
        <ConnectKitButton.Custom>
          {({ show, isConnecting }) => (
            <PrimaryButton onClick={show} className="mt-5">
              <Wallet className="size-4" />
              {isConnecting ? 'Connecting...' : 'Connect wallet'}
            </PrimaryButton>
          )}
        </ConnectKitButton.Custom>
        <p className="mt-3 text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Works with MetaMask, Rabby and other browser wallets.
        </p>
      </Card>
      <div className="space-y-2">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.46)', border: '1px solid rgba(255,255,255,0.56)' }}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(18,45,69,0.07)' }}>
              <Icon className="size-[18px]" />
            </div>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
