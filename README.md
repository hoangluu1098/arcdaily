# ArcDaily

A personal spending companion for USDC on Arc Testnet. Connect a browser wallet to see your balance, send and receive USDC with a memo, log everyday expenses, set daily, weekly and monthly spending limits, and review where your money goes.

Built with [Arc Studio](https://studio.arc.io)

## Features

- Wallet connection (MetaMask, Rabby and other browser wallets)
- Live USDC balance on Arc Testnet
- Send USDC with a memo and category, with a warning before a payment would exceed a limit
- Receive USDC with your address or a shareable payment-request link
- Log cash and off-app expenses
- Activity feed combining recent on-chain USDC transfers (with explorer links) and logged expenses
- Spending analytics: daily chart and category breakdown
- Daily, weekly and monthly budgets

Memos, categories, logged expenses and budgets are stored in your browser on the device you use.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, wagmi, viem, ConnectKit, Framer Motion.

## Development

Prerequisites: [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

Other scripts: `bun run build`, `bun run check` (lint and typecheck).

### Environment variables

None.
