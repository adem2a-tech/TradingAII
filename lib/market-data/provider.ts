export type MarketQuote = {
  symbol: string
  price: number
  timestamp: string
  change1hPercent?: number
  change24hPercent?: number
  source: string
}

const cache = new Map<string, { quote: MarketQuote; expires: number }>()
const CACHE_TTL = 30_000

function fromCache(symbol: string): MarketQuote | null {
  const hit = cache.get(symbol)
  if (hit && hit.expires > Date.now()) return hit.quote
  return null
}

function toCache(quote: MarketQuote) {
  cache.set(quote.symbol, { quote, expires: Date.now() + CACHE_TTL })
}

async function fetchForex(instrument: string): Promise<MarketQuote | null> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json() as { rates: Record<string, number>; time_last_update_utc?: string }
  const ts = data.time_last_update_utc ?? new Date().toISOString()

  if (instrument === 'EURUSD' && data.rates.EUR) {
    return { symbol: 'EURUSD', price: 1 / data.rates.EUR, timestamp: ts, source: 'ExchangeRate-API' }
  }
  if (instrument === 'GBPUSD' && data.rates.GBP) {
    return { symbol: 'GBPUSD', price: 1 / data.rates.GBP, timestamp: ts, source: 'ExchangeRate-API' }
  }
  if (instrument === 'USDJPY' && data.rates.JPY) {
    return { symbol: 'USDJPY', price: data.rates.JPY, timestamp: ts, source: 'ExchangeRate-API' }
  }
  return null
}

async function fetchCrypto(instrument: string): Promise<MarketQuote | null> {
  const binance: Record<string, string> = { BTCUSD: 'BTCUSDT', ETHUSD: 'ETHUSDT' }
  const symbol = binance[instrument]
  if (!symbol) return null

  const [priceRes, klineRes, tickerRes] = await Promise.all([
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { cache: 'no-store' }),
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=2`, { cache: 'no-store' }),
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, { cache: 'no-store' }),
  ])
  if (!priceRes.ok) return null

  const priceData = await priceRes.json() as { price: string }
  const price = parseFloat(priceData.price)
  let change1h: number | undefined
  let change24h: number | undefined

  if (klineRes.ok) {
    const klines = await klineRes.json() as string[][]
    if (klines.length >= 2) {
      const prev = parseFloat(klines[0][4])
      const last = parseFloat(klines[1][4])
      if (prev > 0) change1h = ((last - prev) / prev) * 100
    }
  }
  if (tickerRes.ok) {
    const t = await tickerRes.json() as { priceChangePercent: string }
    change24h = parseFloat(t.priceChangePercent)
  }

  return {
    symbol: instrument, price, timestamp: new Date().toISOString(),
    change1hPercent: change1h, change24hPercent: change24h, source: 'Binance',
  }
}

async function fetchGold(): Promise<MarketQuote | null> {
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json() as { price: number }
    return { symbol: 'XAUUSD', price: data.price, timestamp: new Date().toISOString(), source: 'Gold-API' }
  } catch {
    return null
  }
}

async function fetchIndex(instrument: string): Promise<MarketQuote | null> {
  const yahoo: Record<string, string> = { US30: '%5EDJI', NAS100: '%5ENDX' }
  const ySymbol = yahoo[instrument]
  if (!ySymbol) return null

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=1h&range=1d`,
      { cache: 'no-store', headers: { 'User-Agent': 'TradeAI/1.0' } },
    )
    if (!res.ok) return null
    const data = await res.json() as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; regularMarketTime?: number; chartPreviousClose?: number; previousClose?: number } }> }
    }
    const meta = data.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const prev = meta.chartPreviousClose ?? meta.previousClose
    const change24h = prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : undefined
    const ts = meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString()
    return {
      symbol: instrument, price: meta.regularMarketPrice, timestamp: ts,
      change24hPercent: change24h, source: 'Yahoo Finance',
    }
  } catch {
    return null
  }
}

export async function getQuote(symbol: string): Promise<MarketQuote | null> {
  const cached = fromCache(symbol)
  if (cached) return cached

  let quote: MarketQuote | null = null
  if (['EURUSD', 'GBPUSD', 'USDJPY'].includes(symbol)) quote = await fetchForex(symbol)
  else if (['BTCUSD', 'ETHUSD'].includes(symbol)) quote = await fetchCrypto(symbol)
  else if (symbol === 'XAUUSD') quote = await fetchGold()
  else if (['US30', 'NAS100'].includes(symbol)) quote = await fetchIndex(symbol)

  if (quote) toCache(quote)
  return quote
}

export async function getQuotes(symbols: string[]): Promise<MarketQuote[]> {
  const results = await Promise.all(symbols.map(getQuote))
  return results.filter((q): q is MarketQuote => q !== null)
}

export function getMarketTrend(quote: MarketQuote, timeframe: string): 'bullish' | 'bearish' | 'neutral' {
  const useDaily = ['D1', 'W1', 'H4'].includes(timeframe)
  const change = useDaily ? quote.change24hPercent : (quote.change1hPercent ?? quote.change24hPercent)
  if (change == null || Math.abs(change) < 0.15) return 'neutral'
  return change > 0 ? 'bullish' : 'bearish'
}
