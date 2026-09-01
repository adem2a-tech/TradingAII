import type { AnalysisRecord } from '../types'
import { getInstrument } from '../assets'
import { getMarketContext, TRADING_BASICS } from './market-context'

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function answerQuestion(question: string, analysis: AnalysisRecord | null): string {
  const q = norm(question)
  const ctx = getMarketContext()
  const { ai, risk, balance, riskPercent, instrument, timeframe } = analysis ?? {}
  const spec = instrument ? getInstrument(instrument) : null

  if (/bonjour|salut|hello|coucou/.test(q)) {
    return `Salut ! Je suis ton expert trading local (0 token). Pose-moi des questions sur ton setup, le lot, le risque, ou le calendrier marché.`
  }

  if (/news|annonce|calendrier|nfp|fomc|cpi|macro|evenement/.test(q)) {
    let msg = `📅 ${ctx.session} — ${ctx.sessionAdvice}\n${ctx.dayAdvice}`
    if (ctx.newsWarning) msg += `\n\n${ctx.newsWarning}`
    msg += `\n\nRègle pro : ne trade jamais 15 min avant/après une annonce rouge (NFP, taux directeurs, CPI).`
    return msg
  }

  if (/base|regle|conseil|debutant|apprendre/.test(q)) {
    return TRADING_BASICS.map((b, i) => `${i + 1}. ${b}`).join('\n')
  }

  if (!analysis) {
    return 'Lance d\'abord une analyse pour que je puisse répondre sur ton setup précis.'
  }

  if (/lot|taille|position|0\.0/.test(q)) {
    if (!risk) return `Pas de lot calculé — signal ${ai?.signal}. Le moteur ne calcule un lot que si BUY/SELL avec confiance ≥ 65%.`
    const slPips = risk.slDistance && spec ? (risk.slDistance / spec.pipSize).toFixed(1) : '?'
    return `Le lot ${risk.lotSize} vient du moteur de risque :\n\n• Balance : €${balance}\n• Risque : ${riskPercent}% = €${risk.riskAmount}\n• Distance SL : ${risk.slDistance} (${slPips} pips)\n\nFormule : Lot = Risque € ÷ (Pips SL × Valeur pip)\n\nCe n'est PAS inventé — c'est mathématique. Si tu veux un lot plus petit, baisse ton risque % ou ton balance.`
  }

  if (/risque|risk|perdre|perte/.test(q)) {
    if (!risk) return `Risque max prévu : €${((balance * riskPercent) / 100).toFixed(2)} (${riskPercent}% de €${balance}). Pas de trade actif donc pas de lot.`
    return `Tu risques exactement €${risk.riskAmount} — soit ${riskPercent}% de ta balance €${balance}.\n\nC'est ta perte MAX si le SL est touché. Ne déplace jamais le SL plus loin pour "sauver" un trade.`
  }

  if (/profit|gain|tp|take|gagner/.test(q)) {
    if (!risk) return `Pas de profit calculé — ${ai?.signal === 'NO_TRADE' ? 'NO TRADE recommandé, donc 0 exposition.' : 'setup incomplet.'}`
    return `Profit potentiel : €${risk.potentialProfit} (R:R 1:${risk.riskReward}).\n\nC'est le gain SI le TP est atteint. En réalité, ~40-50% de win rate suffit avec un R:R 1:2 pour être rentable. Ne vis pas le TP parfait — un partial à 1:1 sécurise.`
  }

  if (/baiss|redui|diminu|moins|trop/.test(q)) {
    const currentRisk = risk?.riskAmount ?? (balance * riskPercent) / 100
    const suggested = Math.max(1, currentRisk * 0.5)
    return `Si tu hésites, réduis toujours :\n\n• Risque actuel : €${currentRisk.toFixed(2)}\n• Suggéré prudent : €${suggested.toFixed(2)} (÷2)\n\nAvec une balance de €${balance}, reste entre 0.5% et 1% max. Mieux vaut gagner lentement que tout perdre vite.`
  }

  if (/sl|stop|stop loss|invalid/.test(q)) {
    if (!ai?.stopLoss) return ai?.invalidation ?? 'Pas de SL — NO TRADE actif.'
    return `Stop Loss : ${ai.stopLoss}\n\n${ai.invalidation}\n\nLe SL protège ta balance. Distance SL = ${risk?.slDistance ?? '?'}. Ne le supprime jamais.`
  }

  if (/confiance|confident|sur|fiable|pourquoi/.test(q) && !/setup|trade|buy|sell/.test(q)) {
    return `Confiance : ${ai?.confidence}%\n\nCalculée sur : ratio bougies haussier/baissier, structure du graphique, et clarté du marché.\n\nSeuil minimum : 65%. En dessous → NO TRADE automatique.\n\n${ai?.explanation}`
  }

  if (/no trade|pas de trade|attendre|pourquoi pas/.test(q)) {
    return `NO TRADE car :\n\n• Confiance ${ai?.confidence}% ${ai && ai.confidence < 65 ? '(< 65% requis)' : ''}\n• ${ai?.structure}\n• ${ai?.setupType}\n\nPatience = compétence. Les pros passent 80% du temps en dehors du marché.`
  }

  if (/buy|achat|acheter|long|hausse/.test(q)) {
    if (ai?.signal === 'BUY') return `BUY validé (${ai.confidence}%) : ${ai.trend}. ${ai.structure}. Entry ${ai.entry}, SL ${ai.stopLoss}, TP ${ai.takeProfit}.`
    return `Pas de BUY actuellement — signal : ${ai?.signal}. ${ai?.explanation}`
  }

  if (/sell|vente|vendre|short|baisse/.test(q)) {
    if (ai?.signal === 'SELL') return `SELL validé (${ai.confidence}%) : ${ai.trend}. ${ai.structure}. Entry ${ai.entry}, SL ${ai.stopLoss}, TP ${ai.takeProfit}.`
    return `Pas de SELL actuellement — signal : ${ai?.signal}. ${ai?.explanation}`
  }

  if (/setup|analyse|graph|chart|resultat/.test(q)) {
    return ai?.explanation ?? 'Pas d\'explication disponible.'
  }

  if (/session|heure|quand|moment/.test(q)) {
    return `${ctx.session} — ${ctx.sessionAdvice}\n${ctx.dayAdvice}${ctx.newsWarning ? `\n${ctx.newsWarning}` : ''}`
  }

  return `Je n'ai pas compris exactement. Essaie :\n• "Pourquoi ce lot ?"\n• "C'est quoi le risque ?"\n• "Dois-je baisser ?"\n• "Y'a des annonces ?"\n• "Pourquoi NO TRADE ?"`
}

export const QUICK_QUESTIONS = [
  'Pourquoi ce lot ?',
  'C\'est quoi le risque ?',
  'Dois-je baisser ?',
  'Y\'a des annonces ?',
  'Pourquoi ce setup ?',
]
