import type { TradingViewContext, TradingViewNewsItem } from '../types'
import { parseTradingViewUrl } from './parse-url'
import { resolveInstrumentFromTvSymbol } from './symbol-map'

const HIGH_IMPACT = [
  'NFP', 'CPI', 'FOMC', 'BCE', 'FED', 'INFLATION', 'TAUX', 'RATE', 'GDP', 'PIB',
  'NON-FARM', 'EMPLOI', 'CHÔMAGE', 'UNEMPLOYMENT', 'POWELL', 'LAGARDE', 'GUERRE', 'WAR',
]

type TvNewsResponse = {
  items?: Array<{
    id?: string
    title?: string
    published?: number
    urgency?: number
    provider?: { name?: string }
    source?: string
  }>
}

async function fetchNewsForSymbol(tvSymbol: string, lang = 'fr'): Promise<TradingViewNewsItem[]> {
  const filterSymbol = encodeURIComponent(`symbol:${tvSymbol}`)
  const filterLang = encodeURIComponent(`lang:${lang}`)
  const url = `https://news-mediator.tradingview.com/public/view/v1/symbol?filter=${filterLang}&filter=${filterSymbol}&client=web&user_prostatus=non_pro`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'TradeAI/1.0 (+https://tradeai.app)' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return []

  const data = (await res.json()) as TvNewsResponse
  return (data.items ?? [])
    .filter((item) => item.title)
    .slice(0, 10)
    .map((item) => ({
      id: item.id ?? `tv-${item.title?.slice(0, 24)}`,
      title: item.title!,
      publishedAt: item.published
        ? new Date(item.published * 1000).toISOString()
        : new Date().toISOString(),
      urgency: item.urgency ?? 1,
      provider: item.provider?.name ?? item.source ?? 'TradingView',
    }))
}

function detectHighImpact(news: TradingViewNewsItem[]): boolean {
  return news.some((n) => {
    const upper = n.title.toUpperCase()
    return n.urgency >= 2 || HIGH_IMPACT.some((kw) => upper.includes(kw))
  })
}

export async function fetchTradingViewContext(inputUrl: string): Promise<TradingViewContext | null> {
  const parsed = parseTradingViewUrl(inputUrl)
  if (!parsed?.tvSymbol) return null

  const mapped = resolveInstrumentFromTvSymbol(parsed.tvSymbol)
  const news = await fetchNewsForSymbol(parsed.tvSymbol)
  const headlines = news.slice(0, 5).map((n) => n.title)

  return {
    url: parsed.url,
    chartId: parsed.chartId,
    tvSymbol: parsed.tvSymbol,
    instrumentId: mapped?.instrumentId ?? null,
    instrumentLabel: mapped?.label ?? parsed.tvSymbol,
    news,
    headlines,
    hasHighImpactNews: detectHighImpact(news),
  }
}
