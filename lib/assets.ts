import type { AssetCategory } from './types'

export type InstrumentSpec = {
  id: string
  label: string
  category: AssetCategory
  pipSize: number
  pipValuePerLot: number
  lotStep: number
  minLot: number
  maxLot: number
  decimals: number
}

export const INSTRUMENTS: InstrumentSpec[] = [
  { id: 'EURUSD', label: 'EUR/USD', category: 'forex', pipSize: 0.0001, pipValuePerLot: 10, lotStep: 0.01, minLot: 0.01, maxLot: 50, decimals: 5 },
  { id: 'GBPUSD', label: 'GBP/USD', category: 'forex', pipSize: 0.0001, pipValuePerLot: 10, lotStep: 0.01, minLot: 0.01, maxLot: 50, decimals: 5 },
  { id: 'USDJPY', label: 'USD/JPY', category: 'forex', pipSize: 0.01, pipValuePerLot: 9.2, lotStep: 0.01, minLot: 0.01, maxLot: 50, decimals: 3 },
  { id: 'XAUUSD', label: 'XAU/USD', category: 'gold', pipSize: 0.01, pipValuePerLot: 1, lotStep: 0.01, minLot: 0.01, maxLot: 20, decimals: 2 },
  { id: 'BTCUSD', label: 'BTC/USD', category: 'crypto', pipSize: 1, pipValuePerLot: 1, lotStep: 0.001, minLot: 0.001, maxLot: 5, decimals: 2 },
  { id: 'ETHUSD', label: 'ETH/USD', category: 'crypto', pipSize: 0.01, pipValuePerLot: 1, lotStep: 0.01, minLot: 0.01, maxLot: 100, decimals: 2 },
  { id: 'US30', label: 'US30', category: 'indices', pipSize: 1, pipValuePerLot: 1, lotStep: 0.1, minLot: 0.1, maxLot: 50, decimals: 1 },
  { id: 'NAS100', label: 'NAS100', category: 'indices', pipSize: 1, pipValuePerLot: 1, lotStep: 0.1, minLot: 0.1, maxLot: 50, decimals: 1 },
]

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  forex: 'Forex',
  gold: 'Or',
  crypto: 'Crypto',
  indices: 'Indices',
}

export const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'] as const

export function getInstrument(id: string) {
  return INSTRUMENTS.find((i) => i.id === id)
}

export function getInstrumentsByCategory(category: AssetCategory) {
  return INSTRUMENTS.filter((i) => i.category === category)
}
