import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { validateMarketContext } from '@/lib/analysis/chart-freshness'
import { analyzeChartVision } from '@/lib/analysis/chart-vision'
import { computeExperienceBoost } from '@/lib/analysis/experience-boost'
import { analyzeChartLocal } from '@/lib/analysis/local-chart-analyzer'
import { canUserAnalyze, recordAnalysisUsage } from '@/lib/access/manager'
import { calculateRisk } from '@/lib/risk-engine'
import { rateLimit } from '@/lib/security/rate-limit'
import { getHistoryForUser, saveAnalysis } from '@/lib/storage/history'
import { fetchTradingViewContext } from '@/lib/tradingview/fetch-context'
import { isTradingViewUrl } from '@/lib/tradingview/parse-url'
import { getQuote } from '@/lib/market-data/provider'
import type { AnalysisRecord, AssetCategory, Timeframe } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }
    const userId = session.user.id

    if (!rateLimit(`analyze:${userId}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans 1 minute.' }, { status: 429 })
    }

    const form = await req.formData()
    const forceTrade = form.get('forceTrade') === 'true'

    const access = await canUserAnalyze(userId, session.user.email)
    if (!access.canAnalyze) {
      return NextResponse.json({
        error: access.waitMessage || 'Limite : 1 analyse / 3 jours. Passe Pro ou entre un code promo.',
        access,
      }, { status: 403 })
    }

    const file = form.get('image') as File | null
    const assetCategory = form.get('assetCategory') as AssetCategory
    const instrument = String(form.get('instrument') || '')
    const timeframe = form.get('timeframe') as Timeframe
    const balance = Number(form.get('balance'))
    const riskPercent = Number(form.get('riskPercent'))
    const fileLastModified = Number(form.get('fileLastModified') || 0) || undefined
    const tradingViewUrl = String(form.get('tradingViewUrl') || '').trim()

    let tradingView = null
    if (tradingViewUrl && isTradingViewUrl(tradingViewUrl)) {
      tradingView = await fetchTradingViewContext(tradingViewUrl)
    }

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Image PNG/JPG requise' }, { status: 400 })
    }
    if (!assetCategory || !instrument || !timeframe) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }
    if (!balance || balance <= 0 || !riskPercent || riskPercent <= 0 || riskPercent > 100) {
      return NextResponse.json({ error: 'Balance ou risque invalide' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const history = await getHistoryForUser(userId)

    const quotePreview = await getQuote(instrument)

    let chartVision
    try {
      chartVision = await analyzeChartVision(buffer, {
        instrument,
        timeframe,
        category: assetCategory,
        livePrice: quotePreview?.price,
        imageName: file.name,
      })
    } catch {
      chartVision = {
        platform: 'unknown' as const,
        detectedSymbol: null,
        detectedTimeframe: null,
        estimatedTimeframe: timeframe,
        detectedPrice: null,
        lastVisibleDate: null,
        chartAgeFromAxisMinutes: null,
        candleCount: 0,
        userErrors: [],
        summary: 'Analyse visuelle uniquement.',
        confidence: 25,
      }
    }

    const aiDraft = await analyzeChartLocal({
      imageBuffer: buffer, category: assetCategory, instrument, timeframe,
      chartVision,
    })

    const { validation, quote } = await validateMarketContext({
      buffer, instrument, timeframe,
      chartSignal: aiDraft.signal,
      chartTrend: aiDraft.trend,
      fileLastModified,
      chartVision,
      imageName: file.name,
    })

    if (validation.status === 'rejected' && !forceTrade) {
      return NextResponse.json({
        error: validation.messages[0] || 'Graphique trop ancien pour ce timeframe.',
        market: validation,
        canForce: true,
      }, { status: 422 })
    }

    if (tradingView?.hasHighImpactNews) {
      validation.messages.push('⚠️ Annonces macro actives sur TradingView — intégrées à l\'analyse.')
    } else if (tradingView?.news.length) {
      validation.messages.push(`📰 ${tradingView.news.length} annonce(s) TradingView lue(s) pour ${tradingView.tvSymbol}.`)
    }

    const experience = computeExperienceBoost(history, instrument, aiDraft.signal)

    const ai = await analyzeChartLocal({
      imageBuffer: buffer,
      category: assetCategory,
      instrument,
      timeframe,
      livePrice: quote?.price,
      forceTrade,
      experience,
      tradingView,
      chartVision,
    })

    let finalAi = { ...ai }
    if (!forceTrade && validation.status === 'warning' && !validation.aligned && finalAi.signal !== 'NO_TRADE') {
      finalAi = {
        ...finalAi,
        signal: 'NO_TRADE',
        confidence: Math.min(finalAi.confidence, 55),
        explanation: `${finalAi.explanation} ⚠️ Setup invalidé : le marché live ne confirme plus ce signal.`,
        invalidation: 'Trade annulé — graphique périmé ou désaligné avec le marché actuel. Reprenez une capture à jour.',
      }
    } else if (validation.status === 'warning' && !forceTrade) {
      finalAi = {
        ...finalAi,
        explanation: `${finalAi.explanation} ${validation.messages.filter((m) => m.startsWith('⚠️') || m.startsWith('Graphique')).join(' ')}`,
      }
    }

    if (forceTrade && finalAi.signal === 'NO_TRADE') {
      finalAi = await analyzeChartLocal({
        imageBuffer: buffer,
        category: assetCategory,
        instrument,
        timeframe,
        livePrice: quote?.price,
        forceTrade: true,
        tradingView,
        chartVision,
      })
    }

    const risk = calculateRisk({ balance, riskPercent, instrumentId: instrument, ai: finalAi, forced: forceTrade })

    const record: AnalysisRecord = {
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      assetCategory,
      instrument,
      timeframe,
      balance,
      riskPercent,
      ai: finalAi,
      risk,
      imageName: file.name,
      market: {
        ...validation,
        messages: forceTrade
          ? [...validation.messages, '⚠️ Trade forcé par l\'utilisateur — analyse hors critères habituels.']
          : validation.messages,
      },
      forced: forceTrade,
      tradingView: tradingView ?? undefined,
    }

    await saveAnalysis(record)
    await recordAnalysisUsage(userId)
    return NextResponse.json(record)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, { status: 500 })
  }
}
