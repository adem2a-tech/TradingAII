import type { AnalysisRecord, Signal } from '../types'

export type ExperienceBoost = {
  boost: number
  level: number
  totalAnalyses: number
  instrumentMatches: number
}

export function computeExperienceBoost(
  history: AnalysisRecord[],
  instrument: string,
  signal: Signal,
): ExperienceBoost {
  const total = history.length
  const level = Math.min(10, Math.floor(total / 8) + 1)
  const baseBoost = Math.min(12, Math.floor(total / 6))

  const onInstrument = history.filter((h) => h.instrument === instrument)
  const instrumentMatches = onInstrument.length
  const instrumentBoost = Math.min(6, Math.floor(instrumentMatches / 4))

  const sameSignal = onInstrument.filter(
    (h) => h.ai.signal === signal && signal !== 'NO_TRADE',
  ).length
  const signalBoost = sameSignal >= 4 ? 5 : sameSignal >= 2 ? 3 : 0

  const recent = history.slice(0, 15).filter((h) => h.ai.signal !== 'NO_TRADE')
  const avgConf = recent.length
    ? recent.reduce((s, h) => s + h.ai.confidence, 0) / recent.length
    : 0
  const calibrationBoost = avgConf >= 72 ? 4 : avgConf >= 65 ? 2 : 0

  return {
    boost: baseBoost + instrumentBoost + signalBoost + calibrationBoost,
    level,
    totalAnalyses: total,
    instrumentMatches,
  }
}

export function applyExperienceBoost(
  confidence: number,
  signal: Signal,
  exp: ExperienceBoost,
): number {
  if (signal === 'NO_TRADE' || exp.boost <= 0) return confidence
  return Math.min(94, confidence + exp.boost)
}

export function experienceNote(exp: ExperienceBoost): string {
  if (exp.totalAnalyses < 3) return ''
  return ` IA calibrée · niveau ${exp.level} · ${exp.totalAnalyses} analyses mémorisées — fiabilité renforcée.`
}
