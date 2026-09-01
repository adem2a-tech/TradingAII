import { NextRequest, NextResponse } from 'next/server'
import { fetchTradingViewContext } from '@/lib/tradingview/fetch-context'
import { isTradingViewUrl } from '@/lib/tradingview/parse-url'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')?.trim()
  if (!url || !isTradingViewUrl(url)) {
    return NextResponse.json({ error: 'Lien TradingView invalide' }, { status: 400 })
  }

  try {
    const context = await fetchTradingViewContext(url)
    if (!context) {
      return NextResponse.json({ error: 'Impossible de lire ce graphique TradingView' }, { status: 422 })
    }
    return NextResponse.json(context)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur TradingView' },
      { status: 500 },
    )
  }
}
