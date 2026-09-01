import sharp from 'sharp'
import { getInstrument } from '../assets'
import { getMarketContext } from '../knowledge/market-context'
import type { ExperienceBoost } from './experience-boost'
import { applyExperienceBoost, experienceNote } from './experience-boost'
import type { AiChartAnalysis, AssetCategory, ChartVision, Signal, Timeframe, TradingViewContext } from '../types'

type PixelStats = {
  bullish: number
  bearish: number
  neutral: number
  activityByRow: number[]
  activityByCol: number[]
  width: number
  height: number
}

const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.0842, GBPUSD: 1.2635, USDJPY: 149.82,
  XAUUSD: 2654.5, BTCUSD: 94200, ETHUSD: 3420,
  US30: 42150, NAS100: 19850,
}

const TF_MULT: Record<Timeframe, { sl: number; tp: number }> = {
  M1: { sl: 0.0008, tp: 0.0016 }, M5: { sl: 0.0012, tp: 0.0024 },
  M15: { sl: 0.0018, tp: 0.0036 }, M30: { sl: 0.0025, tp: 0.005 },
  H1: { sl: 0.0035, tp: 0.007 }, H4: { sl: 0.006, tp: 0.012 },
  D1: { sl: 0.012, tp: 0.024 }, W1: { sl: 0.025, tp: 0.05 },
}

function isBullish(r: number, g: number, b: number) {
  return g > r + 25 && g > b + 10 && g > 80
}

function isBearish(r: number, g: number, b: number) {
  return r > g + 25 && r > b + 10 && r > 80
}

function isActive(r: number, g: number, b: number) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 35 && lum < 240
}

async function extractStats(buffer: Buffer): Promise<PixelStats> {
  const { data, info } = await sharp(buffer)
    .resize(320, 240, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const activityByRow = new Array(height).fill(0)
  const activityByCol = new Array(width).fill(0)
  let bullish = 0, bearish = 0, neutral = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (!isActive(r, g, b)) continue
      activityByRow[y]++
      activityByCol[x]++
      if (isBullish(r, g, b)) bullish++
      else if (isBearish(r, g, b)) bearish++
      else neutral++
    }
  }
  return { bullish, bearish, neutral, activityByRow, activityByCol, width, height }
}

function findPeaks(arr: number[], minGap: number): number[] {
  const peaks: number[] = []
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1] && arr[i] > 8) {
      if (!peaks.length || i - peaks[peaks.length - 1] > minGap) peaks.push(i)
    }
  }
  return peaks
}

function priceLevels(base: number, mult: number, decimals: number) {
  const slDist = base * mult
  const tpDist = slDist * 2
  const round = (n: number) => Number(n.toFixed(decimals))
  return { slDist, tpDist, round }
}

export async function analyzeChartLocal(params: {
  imageBuffer: Buffer
  category: AssetCategory
  instrument: string
  timeframe: Timeframe
  livePrice?: number
  forceTrade?: boolean
  experience?: ExperienceBoost
  tradingView?: TradingViewContext | null
  chartVision?: ChartVision | null
}): Promise<AiChartAnalysis> {
  const stats = await extractStats(params.imageBuffer)
  const spec = getInstrument(params.instrument)
  const decimals = spec?.decimals ?? 5
  const base = params.livePrice ?? BASE_PRICES[params.instrument] ?? 1.0
  const tf = TF_MULT[params.timeframe]
  const market = getMarketContext()

  const total = stats.bullish + stats.bearish + stats.neutral || 1
  const bullRatio = stats.bullish / total
  const bearRatio = stats.bearish / total
  const bias = bullRatio - bearRatio

  const rowPeaks = findPeaks(stats.activityByRow, 15)
  const choppiness = rowPeaks.length
  const upperThird = stats.activityByRow.slice(0, Math.floor(stats.height / 3)).reduce((a, b) => a + b, 0)
  const lowerThird = stats.activityByRow.slice(Math.floor(stats.height * 2 / 3)).reduce((a, b) => a + b, 0)
  const positionBias = lowerThird > upperThird * 1.15 ? 'bas' : upperThird > lowerThird * 1.15 ? 'haut' : 'milieu'

  let signal: Signal = 'NO_TRADE'
  let confidence = 50
  let trend = 'Range / indécis'
  let structure = 'Consolidation'
  let momentum = 'Neutre'
  let setupType = 'Aucun setup clair'

  if (Math.abs(bias) > 0.08 && choppiness < 12) {
    if (bias > 0.12) {
      signal = 'BUY'
      confidence = Math.min(88, Math.round(62 + bias * 120))
      trend = 'Haussière — bougies vertes dominantes'
      structure = positionBias === 'bas' ? 'Higher lows en formation' : 'Continuation haussière'
      momentum = bias > 0.2 ? 'Fort momentum acheteur' : 'Momentum haussier modéré'
      setupType = positionBias === 'bas' ? 'Retest support + rebond' : 'Breakout / continuation'
    } else if (bias < -0.12) {
      signal = 'SELL'
      confidence = Math.min(88, Math.round(62 + Math.abs(bias) * 120))
      trend = 'Baissière — bougies rouges dominantes'
      structure = positionBias === 'haut' ? 'Lower highs en formation' : 'Continuation baissière'
      momentum = bias < -0.2 ? 'Fort momentum vendeur' : 'Momentum baissier modéré'
      setupType = positionBias === 'haut' ? 'Rejet résistance + retournement' : 'Breakdown / continuation'
    }
  }

  if (choppiness >= 12) {
    signal = 'NO_TRADE'
    confidence = Math.max(35, confidence - 20)
    structure = 'Marché choppeux — structure illisible'
    setupType = 'Range sans edge'
  }

  if (market.newsWarning) {
    confidence = Math.max(40, confidence - 8)
  }

  if (params.tradingView?.hasHighImpactNews && !params.forceTrade) {
    confidence = Math.max(38, confidence - 12)
  } else if (params.tradingView?.news.length && !params.forceTrade) {
    confidence = Math.max(42, confidence - 4)
  }

  const vision = params.chartVision
  if (vision && !params.forceTrade) {
    const errors = vision.userErrors.filter((e) => e.severity === 'error')
    const warnings = vision.userErrors.filter((e) => e.severity === 'warning')
    if (errors.length) confidence = Math.max(35, confidence - errors.length * 15)
    else if (warnings.length) confidence = Math.max(40, confidence - warnings.length * 6)

    if (vision.detectedTimeframe && vision.detectedTimeframe !== params.timeframe) {
      structure = `${structure} · TF image: ${vision.detectedTimeframe}`
    }
  }

  if (params.experience && signal !== 'NO_TRADE' && !params.forceTrade) {
    confidence = applyExperienceBoost(confidence, signal, params.experience)
  }

  const minConfidence = params.experience && !params.forceTrade
    ? Math.max(58, 65 - Math.floor(params.experience.boost / 2))
    : 65

  if (!params.forceTrade && confidence < minConfidence) signal = 'NO_TRADE'
  if (market.newsWarning && !params.forceTrade && confidence < minConfidence) signal = 'NO_TRADE'

  const { slDist, tpDist, round } = priceLevels(base, tf.sl, decimals)
  let entry: number | null = null
  let stopLoss: number | null = null
  let takeProfit: number | null = null
  let riskReward: number | null = null
  let invalidationLevel: number | null = null

  if (params.forceTrade && signal === 'NO_TRADE') {
    signal = bias >= 0 ? 'BUY' : 'SELL'
    confidence = Math.min(58, Math.max(48, Math.round(50 + Math.abs(bias) * 30)))
    trend = signal === 'BUY' ? 'Bias haussier faible' : 'Bias baissier faible'
    structure = 'Setup imposé — structure non optimale'
    momentum = 'Incertain'
    setupType = 'Trade forcé par l\'utilisateur'
  }

  if (signal === 'BUY') {
    entry = round(base)
    stopLoss = round(base - slDist)
    takeProfit = round(base + tpDist)
    invalidationLevel = stopLoss
    riskReward = 2
  } else if (signal === 'SELL') {
    entry = round(base)
    stopLoss = round(base + slDist)
    takeProfit = round(base - tpDist)
    invalidationLevel = stopLoss
    riskReward = 2
  }

  const srLevels = rowPeaks.slice(0, 3).map((_, i) => {
    const offset = (i + 1) * slDist * 0.8
    return signal === 'SELL' ? round(base + offset) : round(base - offset)
  })

  const marketNote = `${market.session}. ${market.sessionAdvice}`
  const newsNote = market.newsWarning ? ` ${market.newsWarning}` : ''

  const forceNote = params.forceTrade
    ? ' ⚠️ Analyse forcée — je ne suis pas au top de ma forme sur ce setup. Prudence recommandée.'
    : ''

  const tvNewsNote = params.tradingView?.headlines.length
    ? ` Annonces TradingView (${params.tradingView.tvSymbol}) : ${params.tradingView.headlines.slice(0, 3).join(' · ')}.`
    : ''
  const tvImpactNote = params.tradingView?.hasHighImpactNews
    ? ' ⚠️ Flux d\'annonces macro actif sur TradingView — prudence renforcée.'
    : ''

  const expSuffix = params.experience && !params.forceTrade ? experienceNote(params.experience) : ''

  const visionNote = vision
    ? ` Lecture image (${vision.confidence}% fiabilité OCR) : ${vision.summary}` +
      (vision.userErrors.length
        ? ` Alertes : ${vision.userErrors.map((e) => e.message).join(' | ')}`
        : '')
    : ''

  const explanation = signal === 'NO_TRADE'
    ? `Analyse ${params.instrument} (${params.timeframe}) : pas de setup fiable. ${structure}. ${marketNote}${newsNote}${tvNewsNote}${tvImpactNote}${visionNote}${expSuffix}`
    : `Setup ${signal} sur ${params.instrument} ${params.timeframe}. ${trend}. ${structure}. ${momentum}. ${setupType}. ${marketNote}${newsNote}${tvNewsNote}${tvImpactNote}${visionNote}${forceNote}${expSuffix}`

  const invalidation = signal === 'NO_TRADE'
    ? 'Pas de trade — attendre une structure claire (BOS, retest ou breakout confirmé).'
    : signal === 'BUY'
      ? `Invalidation si clôture sous ${invalidationLevel}. Échec du retest ou cassure des lows.`
      : `Invalidation si clôture au-dessus de ${invalidationLevel}. Rejet de la vente invalidé.`

  return {
    signal, confidence, entry, stopLoss, takeProfit, riskReward,
    trend, structure,
    supportsResistances: srLevels.map((l, i) => `Niveau ${i + 1}: ${l}`),
    momentum, setupType, explanation, invalidation, invalidationLevel,
  }
}
