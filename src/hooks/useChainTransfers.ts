import { useCallback, useEffect, useRef, useState } from 'react'
import { parseAbiItem, type Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { CHAIN_ID, USDC_ADDRESS } from '@/lib/money'
import type { ChainTransfer } from '@/lib/types'
import { useStoredState } from './useStoredState'

const TRANSFER = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

/** First scan reaches this many blocks behind head; later scans resume from the saved cursor. */
const FIRST_LOOKBACK = 10_000n
/** A returning user is never made to scan a gap larger than this; older history is skipped. */
const MAX_GAP = 30_000n
const START_CHUNK = 2_000n
const MAX_STORED = 500
const POLL_MS = 30_000

interface Store {
  cursor: string | null
  transfers: ChainTransfer[]
}

export interface SyncStatus {
  syncing: boolean
  error: string | null
  /** Blocks still to scan in the current pass, 0 when caught up. */
  remaining: bigint
  head: bigint | null
}

const keyOf = (t: ChainTransfer) => `${t.txHash.toLowerCase()}:${t.logIndex}`

export function useChainTransfers(address: Address | undefined) {
  const client = usePublicClient({ chainId: CHAIN_ID })
  const storageKey = address ? `arcdaily:v1:${address.toLowerCase()}:chain` : null
  const [store, setStore] = useStoredState<Store>(storageKey, { cursor: null, transfers: [] })
  const [status, setStatus] = useState<SyncStatus>({ syncing: false, error: null, remaining: 0n, head: null })
  const running = useRef(false)
  const storeRef = useRef(store)
  useEffect(() => {
    storeRef.current = store
  }, [store])

  const sync = useCallback(async () => {
    if (!client || !address || running.current) return
    running.current = true
    setStatus((s) => ({ ...s, syncing: true, error: null }))
    try {
      const head = await client.getBlockNumber()
      const saved = storeRef.current.cursor
      let from = saved === null ? (head > FIRST_LOOKBACK ? head - FIRST_LOOKBACK : 0n) : BigInt(saved) + 1n
      const gapFloor = head > MAX_GAP ? head - MAX_GAP : 0n
      if (from < gapFloor) from = gapFloor

      let chunk = START_CHUNK
      while (from <= head) {
        const to = from + chunk - 1n > head ? head : from + chunk - 1n
        setStatus((s) => ({ ...s, head, remaining: head - from + 1n }))
        let logs
        try {
          // Sequential on purpose: the public RPC rate limits bursts.
          const sent = await client.getLogs({ address: USDC_ADDRESS, event: TRANSFER, args: { from: address }, fromBlock: from, toBlock: to })
          const received = await client.getLogs({ address: USDC_ADDRESS, event: TRANSFER, args: { to: address }, fromBlock: from, toBlock: to })
          logs = [...sent, ...received]
        } catch (err) {
          const msg = ((err as { message?: string }).message ?? '').toLowerCase()
          const limited = msg.includes('rate limit') || msg.includes('429')
          if (!limited && chunk > 250n) {
            chunk = chunk / 2n
            continue
          }
          throw err
        }

        const blocks = [...new Set(logs.map((l) => l.blockNumber).filter((b): b is bigint => b !== null))]
        const times = new Map<string, number>()
        await Promise.all(
          blocks.slice(0, 100).map(async (blockNumber) => {
            try {
              const block = await client.getBlock({ blockNumber })
              times.set(blockNumber.toString(), Number(block.timestamp) * 1000)
            } catch {
              // Timestamp is filled in on a later pass.
            }
          }),
        )

        const found: ChainTransfer[] = logs.flatMap((l) =>
          l.blockNumber !== null && l.transactionHash !== null && l.logIndex !== null && l.args.from && l.args.to
            ? [
                {
                  txHash: l.transactionHash,
                  logIndex: l.logIndex,
                  blockNumber: l.blockNumber.toString(),
                  from: l.args.from,
                  to: l.args.to,
                  valueRaw: (l.args.value ?? 0n).toString(),
                  ts: times.get(l.blockNumber.toString()) ?? null,
                },
              ]
            : [],
        )

        setStore((prev) => {
          const byKey = new Map(prev.transfers.map((t) => [keyOf(t), t]))
          for (const t of found) byKey.set(keyOf(t), t)
          const merged = [...byKey.values()]
            .sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)) || b.logIndex - a.logIndex)
            .slice(0, MAX_STORED)
          return { cursor: to.toString(), transfers: merged }
        })
        from = to + 1n
      }

      // Fill timestamps that an earlier pass could not resolve.
      const missing = [...new Set(storeRef.current.transfers.filter((t) => t.ts === null).map((t) => t.blockNumber))].slice(0, 50)
      if (missing.length > 0) {
        const times = new Map<string, number>()
        await Promise.all(
          missing.map(async (bn) => {
            try {
              const block = await client.getBlock({ blockNumber: BigInt(bn) })
              times.set(bn, Number(block.timestamp) * 1000)
            } catch {
              // Try again next pass.
            }
          }),
        )
        if (times.size > 0) {
          setStore((prev) => ({
            ...prev,
            transfers: prev.transfers.map((t) => (t.ts === null ? { ...t, ts: times.get(t.blockNumber) ?? null } : t)),
          }))
        }
      }
      setStatus({ syncing: false, error: null, remaining: 0n, head })
    } catch {
      setStatus((s) => ({ ...s, syncing: false, error: 'Could not reach Arc Testnet. Retrying shortly.' }))
    } finally {
      running.current = false
    }
  }, [client, address, setStore])

  useEffect(() => {
    if (!address) return
    const first = window.setTimeout(() => void sync(), 0)
    const id = window.setInterval(() => void sync(), POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [address, sync])

  return { transfers: store.transfers, status, refresh: sync }
}
