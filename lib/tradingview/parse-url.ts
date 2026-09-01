export type ParsedTradingViewUrl = {
  url: string
  chartId: string | null
  tvSymbol: string | null
}

export function isTradingViewUrl(input: string): boolean {
  try {
    const u = new URL(input.trim())
    return u.hostname.includes('tradingview.com')
  } catch {
    return false
  }
}

export function parseTradingViewUrl(input: string): ParsedTradingViewUrl | null {
  try {
    const url = input.trim()
    const u = new URL(url)
    if (!u.hostname.includes('tradingview.com')) return null

    const symbolParam = u.searchParams.get('symbol')
    const chartMatch = u.pathname.match(/\/chart\/([^/?#]+)/i)

    return {
      url,
      chartId: chartMatch?.[1] ?? null,
      tvSymbol: symbolParam ? decodeURIComponent(symbolParam) : null,
    }
  } catch {
    return null
  }
}
