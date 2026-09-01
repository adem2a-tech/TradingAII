'use client'

import { ArrowDownRight, ArrowUpRight, Loader2, Minus, Zap } from 'lucide-react'
import type { AnalysisRecord } from '@/lib/types'
import { CATEGORY_LABELS, getInstrument } from '@/lib/assets'
import { AnalysisChat } from './analysis-chat'

type Props = {
  data: AnalysisRecord
  onForceTrade: () => void
  forceLoading?: boolean
}

export function ResultCard({ data, onForceTrade, forceLoading }: Props) {
  const { ai, risk, instrument, timeframe, market, tradingView, forced } = data
  const spec = getInstrument(instrument)
  const dec = spec?.decimals ?? 5
  const trade = ai.signal === 'BUY' || ai.signal === 'SELL'

  return (
    <div className="results">
      {forced && (
        <div className="forced-banner">
          ⚠️ Analyse forcée — confiance réduite, setup hors critères habituels.
        </div>
      )}

      {tradingView && tradingView.news.length > 0 && (
        <div className={`market-validation ${tradingView.hasHighImpactNews ? 'warning' : 'ok'} tv-news-panel`}>
          <h3>📰 Annonces TradingView · {tradingView.instrumentLabel}</h3>
          <p className="tv-news-meta">
            Symbole {tradingView.tvSymbol}
            {tradingView.chartId ? ` · Chart ${tradingView.chartId}` : ''}
          </p>
          <ul className="market-messages tv-news-results">
            {tradingView.news.slice(0, 5).map((n) => (
              <li key={n.id}>
                <strong>{n.provider}</strong> — {n.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {market?.chartVision && (
        <div className={`market-validation ${market.chartVision.userErrors.some((e) => e.severity === 'error') ? 'warning' : 'ok'} chart-vision-panel`}>
          <h3>🔍 Analyse intelligente de ta capture</h3>
          <div className="market-meta">
            {market.chartVision.detectedTimeframe && (
              <span>TF détecté · <strong>{market.chartVision.detectedTimeframe}</strong></span>
            )}
            {!market.chartVision.detectedTimeframe && market.chartVision.estimatedTimeframe && (
              <span>TF estimé · <strong>{market.chartVision.estimatedTimeframe}</strong></span>
            )}
            {market.chartVision.detectedSymbol && (
              <span>Actif lu · <strong>{market.chartVision.detectedSymbol}</strong></span>
            )}
            {market.chartVision.detectedPrice != null && (
              <span>Prix lu · <strong>{market.chartVision.detectedPrice.toLocaleString('fr-FR')}</strong></span>
            )}
            <span>Bougies · <strong>{market.chartVision.candleCount}</strong></span>
            <span>OCR · <strong>{market.chartVision.confidence}%</strong></span>
          </div>
          <p className="vision-summary">{market.chartVision.summary}</p>
          {market.chartVision.userErrors.length > 0 && (
            <ul className="market-messages vision-errors">
              {market.chartVision.userErrors.map((e, i) => (
                <li key={i} className={e.severity}>{e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {market && (
        <div className={`market-validation ${market.status}`}>
          <h3>
            {market.status === 'ok' ? '✓ Marché live vérifié' :
              market.status === 'warning' ? '⚠ Alerte marché' : '✕ Graphique rejeté'}
          </h3>
          <div className="market-meta">
            <span>Cours live · <strong>{market.livePrice.toLocaleString('fr-FR')}</strong></span>
            <span>Source · {market.priceSource}</span>
            {market.chartAgeMinutes != null && (
              <span>Capture · {market.chartAgeMinutes} min (max {market.maxAgeMinutes})</span>
            )}
            <span>Live · {market.marketTrend === 'bullish' ? 'Haussière' : market.marketTrend === 'bearish' ? 'Baissière' : 'Neutre'}</span>
            <span>Graphique · {market.chartVisualTrend === 'bullish' ? 'Haussier' : market.chartVisualTrend === 'bearish' ? 'Baissier' : 'Indécis'}</span>
            {market.chartMatchesLive && <span className="match-ok">✓ Courbe cohérente</span>}
          </div>
          <ul className="market-messages">
            {market.messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="result-card main-signal">
        <span className="badge">{forced ? 'Trade forcé' : 'Potential Setup'}</span>
        <div className={`signal-label ${trade ? ai.signal.toLowerCase() : 'none'}`}>
          {trade ? (ai.signal === 'BUY' ? <ArrowUpRight size={32} /> : <ArrowDownRight size={32} />) : <Minus size={32} />}
          <h2>{trade ? ai.signal : 'NO TRADE'}</h2>
        </div>
        <p className="conf">Confiance · {ai.confidence}%</p>

        {trade && risk && ai.entry != null && (
          <div className="levels">
            <div><label>Entry</label><strong>{ai.entry.toFixed(dec)}</strong></div>
            <div><label>Stop Loss</label><strong className="down">{ai.stopLoss?.toFixed(dec)}</strong></div>
            <div><label>Take Profit</label><strong className="up">{ai.takeProfit?.toFixed(dec)}</strong></div>
            <div><label>Risk/Reward</label><strong>1:{risk.riskReward}</strong></div>
          </div>
        )}

        {!trade && (
          <p className="no-trade">Setup insuffisamment fiable. Aucun trade recommandé.</p>
        )}
      </div>

      {!trade && !forced && (
        <div className="force-trade-bar">
          <p>Tu veux quand même entrer ? L&apos;analyse sera moins fiable.</p>
          <button
            type="button"
            className="btn-force-trade prominent"
            onClick={onForceTrade}
            disabled={forceLoading}
          >
            {forceLoading
              ? <><Loader2 size={18} className="spin" /> Analyse en cours...</>
              : <><Zap size={18} /> Forcer le trade</>}
          </button>
        </div>
      )}

      {trade && risk && (
        <div className="result-card">
          <h3>Gestion du risque</h3>
          <div className="levels three">
            <div><label>Lot suggéré</label><strong>{risk.lotSize}</strong></div>
            <div><label>Risque</label><strong className="down">€{risk.riskAmount}</strong></div>
            <div><label>Profit potentiel</label><strong className="up">€{risk.potentialProfit}</strong></div>
          </div>
          <p className="calc-note">Calculé par le moteur de risque · Balance €{data.balance} × {data.riskPercent}%</p>
        </div>
      )}

      <div className="result-grid">
        <div className="result-card">
          <h3>Pourquoi ce setup ?</h3>
          <p>{ai.explanation}</p>
          <div className="chips">
            <span>{CATEGORY_LABELS[data.assetCategory]}</span>
            <span>{spec?.label ?? instrument}</span>
            <span>{timeframe}</span>
            <span>{ai.setupType}</span>
          </div>
          <div className="meta-grid">
            <div><label>Tendance</label><p>{ai.trend}</p></div>
            <div><label>Structure</label><p>{ai.structure}</p></div>
            <div><label>Momentum</label><p>{ai.momentum}</p></div>
          </div>
        </div>
        <div className="result-card danger">
          <h3>Setup invalidation</h3>
          <p>{ai.invalidation}</p>
          {ai.invalidationLevel != null && (
            <div className="invalid-level">Niveau · <strong>{ai.invalidationLevel.toFixed(dec)}</strong></div>
          )}
        </div>
      </div>

      <AnalysisChat analysis={data} />
    </div>
  )
}
