import sharp from 'sharp'
import { parseCaptureFromFilename } from '@/lib/analysis/chart-vision'
import { getMarketTrend, getQuote, type MarketQuote } from '@/lib/market-data/provider'
import type { ChartVision, MarketValidation, Signal, Timeframe } from '@/lib/types'

const MAX_AGE_MINUTES: Record<Timeframe, number> = {
  M1: 5, M5: 15, M15: 30, M30: 60,
  H1: 120, H4: 480, D1: 1440, W1: 10080,
}

async function getChartCaptureTime(
  buffer: Buffer,
  fileLastModified?: number,
  imageName?: string,
): Promise<Date | null> {
  const candidates: Date[] = []

  if (fileLastModified && fileLastModified > 0) {
    candidates.push(new Date(fileLastModified))
  }

  if (imageName) {
    const fromName = parseCaptureFromFilename(imageName)
    if (fromName) candidates.push(fromName)
  }

  try {
    const meta = await sharp(buffer).metadata()
    if (meta.exif) {
      const raw = meta.exif.toString('binary')
      const match = raw.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        const [, y, mo, d, h, mi, s] = match
        candidates.push(new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`))
      }
    }
  } catch { /* ignore */ }

  if (!candidates.length) return null
  return candidates.reduce((a, b) => (a.getTime() < b.getTime() ? a : b))
}

function ageMinutes(capture: Date | null): number | null {
  if (!capture) return null
  return Math.round((Date.now() - capture.getTime()) / 60_000)
}

function trendLabel(t: 'bullish' | 'bearish' | 'neutral') {
  return t === 'bullish' ? 'haussière' : t === 'bearish' ? 'baissière' : 'neutre'
}

function chartTrendFromText(trend: string): 'bullish' | 'bearish' | 'neutral' {
  const t = trend.toLowerCase()
  if (t.includes('hauss') || t.includes('vert')) return 'bullish'
  if (t.includes('baiss') || t.includes('rouge')) return 'bearish'
  return 'neutral'
}

function signalConflicts(signal: Signal, trend: 'bullish' | 'bearish' | 'neutral'): boolean {
  if (signal === 'NO_TRADE' || trend === 'neutral') return false
  return (signal === 'BUY' && trend === 'bearish') || (signal === 'SELL' && trend === 'bullish')
}

function visualMatchesLive(
  chart: 'bullish' | 'bearish' | 'neutral',
  live: 'bullish' | 'bearish' | 'neutral',
): boolean {
  if (chart === 'neutral' || live === 'neutral') return true
  return chart === live
}

function formatPrice(instrument: string, price: number): string {
  if (instrument === 'XAUUSD') return `${price.toLocaleString('fr-FR')} $`
  if (instrument.includes('USD') && !instrument.startsWith('USD')) return price.toFixed(5)
  if (instrument === 'BTCUSD' || instrument === 'ETHUSD') return `${price.toLocaleString('fr-FR')} $`
  return price.toLocaleString('fr-FR')
}

function formatAgeFr(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) {
    const h = Math.round(minutes / 60)
    return h <= 1 ? '1 heure' : `${h} heures`
  }
  const days = Math.round(minutes / 1440)
  return days <= 1 ? '1 jour' : `${days} jours`
}

function effectiveChartAge(
  fileAge: number | null,
  vision: ChartVision | undefined,
): number | null {
  const ages = [fileAge, vision?.chartAgeFromAxisMinutes ?? null].filter(
    (a): a is number => a != null && a >= 0,
  )
  if (!ages.length) return null
  return Math.max(...ages)
}

export async function validateMarketContext(params: {
  buffer: Buffer
  instrument: string
  timeframe: Timeframe
  chartSignal: Signal
  chartTrend: string
  fileLastModified?: number
  chartVision?: ChartVision
  imageName?: string
}): Promise<{ validation: MarketValidation; quote: MarketQuote | null }> {
  const quote = await getQuote(params.instrument)
  const capture = await getChartCaptureTime(params.buffer, params.fileLastModified, params.imageName)
  const fileAgeMinutes = ageMinutes(capture)
  const chartAgeMinutes = effectiveChartAge(fileAgeMinutes, params.chartVision)
  const maxAgeMinutes = MAX_AGE_MINUTES[params.timeframe]
  const chartVisualTrend = chartTrendFromText(params.chartTrend)
  const messages: string[] = []
  const vision = params.chartVision

  if (vision) {
    messages.push(`🔍 ${vision.summary}`)
    for (const err of vision.userErrors) {
      messages.push(`${err.severity === 'error' ? '✕' : '⚠'} ${err.message}`)
    }
  }

  if (!quote) {
    messages.push('Cours live indisponible — impossible de comparer avec le marché réel.')
    return {
      quote: null,
      validation: {
        status: 'warning',
        livePrice: 0,
        livePriceAt: new Date().toISOString(),
        chartAgeMinutes,
        maxAgeMinutes,
        priceSource: 'indisponible',
        marketTrend: 'neutral',
        chartVisualTrend,
        chartSignal: params.chartSignal,
        aligned: true,
        chartMatchesLive: false,
        messages,
      },
    }
  }

  const marketTrend = getMarketTrend(quote, params.timeframe)
  let status: MarketValidation['status'] = 'ok'
  let aligned = true
  let chartMatchesLive = visualMatchesLive(chartVisualTrend, marketTrend)

  if (chartAgeMinutes != null) {
    if (chartAgeMinutes > maxAgeMinutes) {
      status = 'rejected'
      messages.push(
        `✕ Capture trop ancienne : il y a ${formatAgeFr(chartAgeMinutes)} (max ${formatAgeFr(maxAgeMinutes)} pour ${params.timeframe}). ` +
        `Le marché a bougé — reprends une capture à l'instant sur TradingView.`,
      )
    } else {
      messages.push(
        `✓ OK — ta capture date de ${formatAgeFr(chartAgeMinutes)}. C'est valide pour ${params.timeframe} (max ${formatAgeFr(maxAgeMinutes)}).`,
      )
    }
  } else {
    status = 'warning'
    messages.push('Âge de la capture non détecté — vérifie que ton screenshot est récent.')
  }

  if (vision?.userErrors.some((e) => e.severity === 'error' && e.code === 'SYMBOL_MISMATCH')) {
    status = 'rejected'
    aligned = false
  }

  if (vision?.userErrors.some((e) => e.severity === 'error' && e.code === 'STALE_CHART')) {
    status = 'rejected'
    aligned = false
  }

  if (vision?.userErrors.some((e) => e.severity === 'error' && e.code === 'TIMEFRAME_MISMATCH')) {
    if (status !== 'rejected') status = 'warning'
    aligned = false
  }

  const priceStr = formatPrice(params.instrument, quote.price)
  messages.push(
    `Cours live ${params.instrument} : ${priceStr} (${quote.source}). ` +
    `Vérifie que le prix affiché sur ton graphique est proche de ce niveau.`,
  )

  if (chartVisualTrend === 'neutral') {
    messages.push(
      `Comparatif courbe : structure indécise/choppeuse sur ta capture. ` +
      `Marché live en tendance ${trendLabel(marketTrend)} — difficile de confirmer l'alignement visuel.`,
    )
  } else if (chartMatchesLive) {
    messages.push(
      `✓ Comparatif live : ta courbe est ${trendLabel(chartVisualTrend)}, le marché aussi (${trendLabel(marketTrend)}). Bonne cohérence.`,
    )
  } else {
    chartMatchesLive = false
    aligned = false
    if (status !== 'rejected') status = 'warning'
    messages.push(
      `⚠ Comparatif live : ta courbe paraît ${trendLabel(chartVisualTrend)} mais le marché est ${trendLabel(marketTrend)}. ` +
      `Possible mauvais actif, mauvais timeframe, ou capture périmée.`,
    )
  }

  if (signalConflicts(params.chartSignal, marketTrend)) {
    aligned = false
    if (status !== 'rejected') status = 'warning'
    messages.push(
      `⚠ Signal ${params.chartSignal} en conflit avec la tendance live ${trendLabel(marketTrend)}.`,
    )
  } else if (params.chartSignal !== 'NO_TRADE' && aligned) {
    messages.push('Signal cohérent avec le marché live.')
  }

  return {
    quote,
    validation: {
      status,
      livePrice: quote.price,
      livePriceAt: quote.timestamp,
      chartAgeMinutes,
      maxAgeMinutes,
      priceSource: quote.source,
      marketTrend,
      chartVisualTrend,
      chartSignal: params.chartSignal,
      aligned,
      chartMatchesLive,
      messages,
      chartVision: vision,
    },
  }
}
