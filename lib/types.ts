export type AssetCategory = 'forex' | 'gold' | 'crypto' | 'indices'
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1'
export type Signal = 'BUY' | 'SELL' | 'NO_TRADE'

export type AiChartAnalysis = {
  signal: Signal
  confidence: number
  entry: number | null
  stopLoss: number | null
  takeProfit: number | null
  riskReward: number | null
  trend: string
  structure: string
  supportsResistances: string[]
  momentum: string
  setupType: string
  explanation: string
  invalidation: string
  invalidationLevel: number | null
}

export type RiskCalculation = {
  riskAmount: number
  lotSize: number
  potentialProfit: number
  riskReward: number
  slDistance: number
  tpDistance: number
}

export type ChartUserError = {
  code:
    | 'STALE_CHART'
    | 'TIMEFRAME_MISMATCH'
    | 'SYMBOL_MISMATCH'
    | 'PRICE_MISMATCH'
    | 'ESTIMATED_TF_MISMATCH'
    | 'WRONG_PLATFORM'
  severity: 'error' | 'warning'
  message: string
}

export type ChartVision = {
  platform: 'tradingview' | 'metatrader' | 'unknown'
  detectedSymbol: string | null
  detectedTimeframe: Timeframe | null
  estimatedTimeframe: Timeframe | null
  detectedPrice: number | null
  lastVisibleDate: string | null
  chartAgeFromAxisMinutes: number | null
  candleCount: number
  userErrors: ChartUserError[]
  summary: string
  confidence: number
}

export type MarketValidation = {
  status: 'ok' | 'warning' | 'rejected'
  livePrice: number
  livePriceAt: string
  chartAgeMinutes: number | null
  maxAgeMinutes: number
  priceSource: string
  marketTrend: 'bullish' | 'bearish' | 'neutral'
  chartVisualTrend: 'bullish' | 'bearish' | 'neutral'
  chartSignal: Signal
  aligned: boolean
  chartMatchesLive: boolean
  messages: string[]
  chartVision?: ChartVision
}

export type TradingViewNewsItem = {
  id: string
  title: string
  publishedAt: string
  urgency: number
  provider: string
}

export type TradingViewContext = {
  url: string
  chartId: string | null
  tvSymbol: string
  instrumentId: string | null
  instrumentLabel: string
  news: TradingViewNewsItem[]
  headlines: string[]
  hasHighImpactNews: boolean
}

export type AnalysisRecord = {
  id: string
  userId: string
  createdAt: string
  assetCategory: AssetCategory
  instrument: string
  timeframe: Timeframe
  balance: number
  riskPercent: number
  ai: AiChartAnalysis
  risk: RiskCalculation | null
  imageName: string
  market?: MarketValidation
  tradingView?: TradingViewContext
  forced?: boolean
}
