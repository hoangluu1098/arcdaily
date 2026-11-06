import { arcTestnet } from 'viem/chains'
import { getUsdc } from '@/onchain-facts'
import { Amount, formatUnitsExact, usdcDecimalsFor } from '@/onchain-money'

export const CHAIN_ID = arcTestnet.id

const usdcFact = getUsdc(CHAIN_ID)
if (!usdcFact) {
  throw new Error(`USDC is not registered for chain ${CHAIN_ID}`)
}

export const USDC_ADDRESS = usdcFact.address as `0x${string}`
export const DECIMALS = usdcDecimalsFor(CHAIN_ID)

export const toAmount = (raw: bigint): Amount => Amount.fromRaw(raw, DECIMALS)

/** "1,234.50": at least two fraction digits, more only when the value needs them. */
export function fmtUsdc(raw: bigint): string {
  const exact = formatUnitsExact(raw, DECIMALS)
  const negative = exact.startsWith('-')
  const [whole, fraction = ''] = (negative ? exact.slice(1) : exact).split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${withCommas}.${fraction.padEnd(2, '0')}`
}

/** Parses user input into raw units, or null when empty / invalid / zero. */
export function parseInput(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed) || trimmed === '.') return null
  try {
    const parsed = Amount.parse(trimmed, DECIMALS)
    return parsed.isPositive() ? parsed.raw : null
  } catch {
    return null
  }
}

export const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`
export const shortHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-6)}`
