import type { Timeframe } from '../types'

export type MarketContext = {
  session: string
  sessionAdvice: string
  newsWarning: string | null
  dayAdvice: string
}

export function getMarketContext(): MarketContext {
  const now = new Date()
  const utcH = now.getUTCHours()
  const day = now.getUTCDay()
  const date = now.getUTCDate()

  let session = 'Session calme'
  let sessionAdvice = 'Liquidité faible — spreads plus larges, setups moins fiables.'

  if (utcH >= 7 && utcH < 12) {
    session = 'Session Londres'
    sessionAdvice = 'Forte liquidité EUR/GBP. Meilleur moment pour le Forex majeur.'
  } else if (utcH >= 12 && utcH < 17) {
    session = 'Overlap Londres–New York'
    sessionAdvice = 'Pic de liquidité — mouvements directionnels plus propres.'
  } else if (utcH >= 17 && utcH < 22) {
    session = 'Session New York'
    sessionAdvice = 'USD actif. Attention aux retournements en fin de session US.'
  } else if (utcH >= 0 && utcH < 7) {
    session = 'Session Asie'
    sessionAdvice = 'Ranges fréquents sur JPY et Or. Éviter les breakouts agressifs.'
  }

  let dayAdvice = 'Journée standard — respecte ton risque max.'
  if (day === 5) dayAdvice = 'Vendredi : réduis le risque, les marchés peuvent whipsaw avant le week-end.'
  if (day === 0 || day === 6) dayAdvice = 'Week-end : marchés fermés sur Forex/Indices. Crypto seulement.'

  let newsWarning: string | null = null
  if (day === 5 && date <= 7) {
    newsWarning = '⚠ Semaine possible NFP (vendredi) — volatilité extrême 14h30 CET. Évite de trader 15 min avant/après.'
  }
  if (date >= 10 && date <= 18) {
    newsWarning = newsWarning ?? '⚠ Période CPI/FOMC possible — annonces macro = spreads élargis. Attends la réaction post-news.'
  }

  return { session, sessionAdvice, newsWarning, dayAdvice }
}

export const TRADING_BASICS = [
  'Ne jamais risquer plus de 1-2% par trade.',
  'Un R:R minimum de 1:2 est obligatoire pour être rentable long terme.',
  'Pas de trade sans stop loss placé AVANT l\'entrée.',
  'Ne pas trader pendant les annonces (NFP, CPI, FOMC, BCE).',
  'Si confiance < 65% → NO TRADE, point final.',
]
