import { INSTRUMENTS } from '../assets'
import type { AssetCategory } from '../types'

const ALIASES: Record<string, string> = {
  'EUR/USD': 'EURUSD',
  'GBP/USD': 'GBPUSD',
  'USD/JPY': 'USDJPY',
  'XAU/USD': 'XAUUSD',
  'GOLD': 'XAUUSD',
  'BTCUSDT': 'BTCUSD',
  'BTC/USD': 'BTCUSD',
  'ETHUSDT': 'ETHUSD',
  'ETH/USD': 'ETHUSD',
  'US30': 'US30',
  'US100': 'NAS100',
  'NAS100': 'NAS100',
  'NDX': 'NAS100',
}

export function resolveInstrumentFromTvSymbol(tvSymbol: string): {
  instrumentId: string
  category: AssetCategory
  label: string
} | null {
  const raw = decodeURIComponent(tvSymbol).toUpperCase().trim()
  const ticker = raw.includes(':') ? raw.split(':').pop()! : raw
  const compact = ticker.replace(/[^A-Z0-9]/g, '')
  const aliased = ALIASES[ticker] ?? ALIASES[compact] ?? compact

  const direct = INSTRUMENTS.find((i) => i.id === aliased || i.id === compact)
  if (direct) {
    return { instrumentId: direct.id, category: direct.category, label: direct.label }
  }

  if (compact.includes('XAU') || compact.includes('GOLD')) {
    const gold = INSTRUMENTS.find((i) => i.id === 'XAUUSD')!
    return { instrumentId: gold.id, category: gold.category, label: gold.label }
  }
  if (compact.includes('BTC')) {
    const btc = INSTRUMENTS.find((i) => i.id === 'BTCUSD')!
    return { instrumentId: btc.id, category: btc.category, label: btc.label }
  }
  if (compact.includes('ETH')) {
    const eth = INSTRUMENTS.find((i) => i.id === 'ETHUSD')!
    return { instrumentId: eth.id, category: eth.category, label: eth.label }
  }
  if (compact.includes('EURUSD')) {
    const fx = INSTRUMENTS.find((i) => i.id === 'EURUSD')!
    return { instrumentId: fx.id, category: fx.category, label: fx.label }
  }

  return null
}
