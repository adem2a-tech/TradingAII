import { getInstrument } from './assets'
import type { AiChartAnalysis, RiskCalculation } from './types'

const MIN_CONFIDENCE = 65
const FORCED_MIN_CONFIDENCE = 45

export function isTradableSetup(ai: AiChartAnalysis, opts?: { forced?: boolean }): boolean {
  const min = opts?.forced ? FORCED_MIN_CONFIDENCE : MIN_CONFIDENCE
  return (
    ai.signal !== 'NO_TRADE' &&
    ai.confidence >= min &&
    ai.entry != null &&
    ai.stopLoss != null &&
    ai.takeProfit != null
  )
}

export function calculateRisk(params: {
  balance: number
  riskPercent: number
  instrumentId: string
  ai: AiChartAnalysis
  forced?: boolean
}): RiskCalculation | null {
  const { balance, riskPercent, instrumentId, ai, forced } = params
  if (!isTradableSetup(ai, { forced }) || ai.entry == null || ai.stopLoss == null || ai.takeProfit == null) {
    return null
  }

  const spec = getInstrument(instrumentId)
  if (!spec) return null

  const entry = ai.entry
  const stopLoss = ai.stopLoss
  const takeProfit = ai.takeProfit
  const slDistance = Math.abs(entry - stopLoss)
  const tpDistance = Math.abs(takeProfit - entry)

  if (slDistance <= 0 || tpDistance <= 0) return null

  const slPips = slDistance / spec.pipSize
  const tpPips = tpDistance / spec.pipSize
  const riskAmount = balance * (riskPercent / 100)
  const rawLot = riskAmount / (slPips * spec.pipValuePerLot)
  const lotSize = clampLot(rawLot, spec.lotStep, spec.minLot, spec.maxLot)
  const potentialProfit = lotSize * tpPips * spec.pipValuePerLot
  const riskReward = tpDistance / slDistance

  return {
    riskAmount: round(riskAmount, 2),
    lotSize: round(lotSize, 3),
    potentialProfit: round(potentialProfit, 2),
    riskReward: round(riskReward, 2),
    slDistance: round(slDistance, spec.decimals),
    tpDistance: round(tpDistance, spec.decimals),
  }
}

function clampLot(value: number, step: number, min: number, max: number) {
  const stepped = Math.floor(value / step) * step
  return Math.min(max, Math.max(min, stepped))
}

function round(n: number, d: number) {
  const f = 10 ** d
  return Math.round(n * f) / f
}
