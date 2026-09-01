import sharp from 'sharp'
import { INSTRUMENTS } from '../assets'
import { resolveInstrumentFromTvSymbol } from '../tradingview/symbol-map'
import type { AssetCategory, ChartVision, ChartUserError, Timeframe } from '../types'

const TF_PATTERNS: [RegExp, Timeframe][] = [
  [/\b(?:1m|M1|1\s*min)\b/i, 'M1'],
  [/\b(?:5m|M5|5\s*min)\b/i, 'M5'],
  [/\b(?:15m|M15|15\s*min)\b/i, 'M15'],
  [/\b(?:30m|M30|30\s*min)\b/i, 'M30'],
  [/\b(?:1h|H1|1H|60m|60\s*min)\b/i, 'H1'],
  [/\b(?:4h|H4|4H|240m)\b/i, 'H4'],
  [/\b(?:1d|D1|1D|daily|jour)\b/i, 'D1'],
  [/\b(?:1w|W1|1W|weekly|semaine)\b/i, 'W1'],
]

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, janv: 0, fév: 1, fev: 1, feb: 1, february: 1,
  mar: 2, mars: 2, march: 2, apr: 3, avr: 3, avril: 3, april: 3,
  mai: 4, may: 4, jun: 5, juin: 5, june: 5, jul: 6, juil: 6, july: 6,
  aoû: 7, aou: 7, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, déc: 11, dec: 11, december: 11,
}

let ocrWorker: { recognize: (buf: Buffer) => Promise<{ data: { text: string } }> } | null = null
let ocrDisabled = process.env.ENABLE_CHART_OCR !== 'true'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

async function ocrRegion(buffer: Buffer): Promise<string> {
  if (ocrDisabled) return ''
  try {
    const text = await withTimeout(
      (async () => {
        if (!ocrWorker) {
          const { createWorker } = await import('tesseract.js')
          const worker = await withTimeout(createWorker('eng', 1, { logger: () => {} }), 8000, null)
          if (!worker) {
            ocrDisabled = true
            return ''
          }
          ocrWorker = worker
        }
        const { data: { text: ocrText } } = await ocrWorker.recognize(buffer)
        return ocrText.replace(/\s+/g, ' ').trim()
      })(),
      5000,
      '',
    )
    return text
  } catch {
    ocrDisabled = true
    return ''
  }
}

export function parseCaptureFromFilename(name: string): Date | null {
  const patterns = [
    /(\d{4})[-.](\d{2})[-.](\d{2})[\s_-]+(\d{2})[:.]?(\d{2})[:.]?(\d{2})?/,
    /(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/,
  ]
  for (const re of patterns) {
    const m = name.match(re)
    if (m) {
      const d = new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4] ?? 12),
        Number(m[5] ?? 0),
        Number(m[6] ?? 0),
      )
      if (!Number.isNaN(d.getTime())) return d
    }
  }
  return null
}

async function cropForOcr(
  buffer: Buffer,
  region: { left: number; top: number; width: number; height: number },
): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 800
  const h = meta.height ?? 600
  const left = Math.max(0, Math.floor(w * region.left))
  const top = Math.max(0, Math.floor(h * region.top))
  const width = Math.min(w - left, Math.floor(w * region.width))
  const height = Math.min(h - top, Math.floor(h * region.height))
  if (width < 20 || height < 10) return buffer

  return sharp(buffer)
    .extract({ left, top, width, height })
    .greyscale()
    .normalize()
    .sharpen()
    .resize(Math.min(800, width * 2), null, { withoutEnlargement: false })
    .png()
    .toBuffer()
}

function findPeaks(arr: number[], minGap: number): number[] {
  const peaks: number[] = []
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1] && arr[i] > 6) {
      if (!peaks.length || i - peaks[peaks.length - 1] > minGap) peaks.push(i)
    }
  }
  return peaks
}

async function countVisibleCandles(buffer: Buffer): Promise<number> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 800
  const h = meta.height ?? 600

  const { data, info } = await sharp(buffer)
    .extract({
      left: Math.floor(w * 0.07),
      top: Math.floor(h * 0.14),
      width: Math.floor(w * 0.86),
      height: Math.floor(h * 0.72),
    })
    .resize(480, 220, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const colActivity = new Array(info.width).fill(0)
  for (let x = 0; x < info.width; x++) {
    for (let y = 2; y < info.height - 2; y++) {
      const i = y * info.width + x
      const diff = Math.abs(data[i] - data[i - info.width]) + Math.abs(data[i] - data[i + info.width])
      if (diff > 45) colActivity[x]++
    }
  }
  return findPeaks(colActivity, 3).length
}

function estimateTimeframeFromCandles(count: number): Timeframe {
  if (count >= 85) return 'M1'
  if (count >= 60) return 'M5'
  if (count >= 42) return 'M15'
  if (count >= 30) return 'M30'
  if (count >= 18) return 'H1'
  if (count >= 10) return 'H4'
  if (count >= 5) return 'D1'
  return 'W1'
}

function parseTimeframe(text: string): Timeframe | null {
  for (const [re, tf] of TF_PATTERNS) {
    if (re.test(text)) return tf
  }
  return null
}

function parseSymbol(text: string): string | null {
  const upper = text.toUpperCase()
  for (const inst of INSTRUMENTS) {
    if (upper.includes(inst.id)) return inst.id
    if (upper.includes(inst.label.replace('/', ''))) return inst.id
    if (upper.includes(inst.label)) return inst.id
  }

  const colonMatch = upper.match(/([A-Z0-9]+:[A-Z0-9/]+)/)
  if (colonMatch) {
    const resolved = resolveInstrumentFromTvSymbol(colonMatch[1])
    if (resolved) return resolved.instrumentId
  }

  const tvMatch = upper.match(/\b(OANDA|FX|BINANCE|CAPITALCOM):([A-Z0-9]+)/)
  if (tvMatch) {
    const resolved = resolveInstrumentFromTvSymbol(`${tvMatch[1]}:${tvMatch[2]}`)
    if (resolved) return resolved.instrumentId
  }

  if (/XAU|GOLD|OR\b/.test(upper)) return 'XAUUSD'
  if (/BTC/.test(upper)) return 'BTCUSD'
  if (/ETH/.test(upper)) return 'ETHUSD'
  if (/EUR.?USD/.test(upper)) return 'EURUSD'
  if (/GBP.?USD/.test(upper)) return 'GBPUSD'
  if (/USD.?JPY/.test(upper)) return 'USDJPY'
  if (/US30|DOW/.test(upper)) return 'US30'
  if (/NAS100|US100|NDX/.test(upper)) return 'NAS100'

  return null
}

function parseDatesFromText(text: string): Date[] {
  const dates: Date[] = []
  const now = new Date()

  for (const m of text.matchAll(/(\d{4})[-/](\d{2})[-/](\d{2})/g)) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`)
    if (!Number.isNaN(d.getTime())) dates.push(d)
  }

  for (const m of text.matchAll(/(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,9})\.?\s+(\d{4})/g)) {
    const mo = MONTHS[m[2].toLowerCase().slice(0, 3)]
    if (mo != null) {
      const d = new Date(Number(m[3]), mo, Number(m[1]), 12, 0, 0)
      if (!Number.isNaN(d.getTime())) dates.push(d)
    }
  }

  for (const m of text.matchAll(/([A-Za-zÀ-ÿ]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/g)) {
    const mo = MONTHS[m[1].toLowerCase().slice(0, 3)]
    if (mo != null) {
      const d = new Date(Number(m[3]), mo, Number(m[2]), 12, 0, 0)
      if (!Number.isNaN(d.getTime())) dates.push(d)
    }
  }

  for (const m of text.matchAll(/\b(\d{1,2}):(\d{2})\b/g)) {
    const d = new Date(now)
    d.setHours(Number(m[1]), Number(m[2]), 0, 0)
    dates.push(d)
  }

  return dates
}

function parsePriceFromText(text: string, instrument: string): number | null {
  const cleaned = text.replace(/[^\d.,\s]/g, ' ')
  const nums = cleaned.match(/[\d,]+\.[\d]+|\d+,\d+/g) ?? []
  const parsed = nums
    .map((n) => Number(n.replace(/,/g, '')))
    .filter((n) => !Number.isNaN(n) && n > 0)

  if (!parsed.length) return null

  if (instrument === 'XAUUSD') return parsed.find((n) => n > 500 && n < 10000) ?? parsed[0]
  if (instrument === 'BTCUSD') return parsed.find((n) => n > 1000) ?? parsed[0]
  if (instrument === 'ETHUSD') return parsed.find((n) => n > 10 && n < 50000) ?? parsed[0]
  if (instrument.includes('USD') && !instrument.startsWith('USD')) {
    return parsed.find((n) => n > 0.5 && n < 3) ?? parsed.find((n) => n < 200) ?? parsed[0]
  }
  if (instrument === 'USDJPY') return parsed.find((n) => n > 50 && n < 300) ?? parsed[0]
  return parsed.find((n) => n > 100) ?? parsed[0]
}

function detectPlatform(header: string, footer: string): ChartVision['platform'] {
  const all = `${header} ${footer}`.toLowerCase()
  if (/tradingview|oanda|capital\.com|binance|fx:/i.test(all)) return 'tradingview'
  if (/metatrader|mt4|mt5/i.test(all)) return 'metatrader'
  return 'unknown'
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

function tfLabel(tf: Timeframe): string {
  const labels: Record<Timeframe, string> = {
    M1: '1 minute', M5: '5 minutes', M15: '15 minutes', M30: '30 minutes',
    H1: '1 heure', H4: '4 heures', D1: 'journalier', W1: 'hebdomadaire',
  }
  return labels[tf]
}

function tfIndex(tf: Timeframe): number {
  const order: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']
  return order.indexOf(tf)
}

function tfMismatchSeverity(selected: Timeframe, detected: Timeframe): 'error' | 'warning' | null {
  const diff = Math.abs(tfIndex(selected) - tfIndex(detected))
  if (diff === 0) return null
  if (diff >= 3) return 'error'
  return 'warning'
}

function priceTolerance(instrument: string, price: number): number {
  if (instrument === 'XAUUSD') return price * 0.008
  if (instrument === 'BTCUSD' || instrument === 'ETHUSD') return price * 0.015
  if (instrument.includes('USD')) return price * 0.003
  return price * 0.01
}

export async function analyzeChartVision(
  buffer: Buffer,
  params: {
    instrument: string
    timeframe: Timeframe
    category: AssetCategory
    livePrice?: number
    imageName?: string
  },
): Promise<ChartVision> {
  const filenameDate = params.imageName ? parseCaptureFromFilename(params.imageName) : null

  const [headerBuf, footerBuf, priceBuf, candleCount] = await Promise.all([
    cropForOcr(buffer, { left: 0, top: 0, width: 0.55, height: 0.12 }),
    cropForOcr(buffer, { left: 0.05, top: 0.88, width: 0.9, height: 0.12 }),
    cropForOcr(buffer, { left: 0.82, top: 0.1, width: 0.18, height: 0.8 }),
    countVisibleCandles(buffer),
  ])

  const [ocrHeader, ocrFooter, ocrPriceAxis] = await Promise.all([
    ocrRegion(headerBuf),
    ocrRegion(footerBuf),
    ocrRegion(priceBuf),
  ])

  const platform = detectPlatform(ocrHeader, ocrFooter)
  const detectedTimeframe = parseTimeframe(`${ocrHeader} ${ocrFooter}`)
  const estimatedTimeframe = estimateTimeframeFromCandles(candleCount)
  const detectedSymbol = parseSymbol(`${ocrHeader} ${ocrFooter} ${ocrPriceAxis}`)
  const detectedPrice = parsePriceFromText(ocrPriceAxis, params.instrument)

  const axisDates = parseDatesFromText(ocrFooter)
  if (filenameDate) axisDates.push(filenameDate)
  const lastDate = axisDates.length
    ? axisDates.reduce((a, b) => (a.getTime() > b.getTime() ? a : b))
    : null
  const chartAgeFromAxisMinutes = lastDate
    ? Math.max(0, Math.round((Date.now() - lastDate.getTime()) / 60_000))
    : null

  const userErrors: ChartUserError[] = []
  let confidence = 40

  if (detectedTimeframe) confidence += 25
  if (detectedSymbol) confidence += 20
  if (detectedPrice) confidence += 10
  if (chartAgeFromAxisMinutes != null) confidence += 15
  if (candleCount > 5) confidence += 10
  confidence = Math.min(95, confidence)

  const effectiveTf = detectedTimeframe ?? estimatedTimeframe

  if (detectedTimeframe && detectedTimeframe !== params.timeframe) {
    const sev = tfMismatchSeverity(params.timeframe, detectedTimeframe)
    if (sev) {
      userErrors.push({
        code: 'TIMEFRAME_MISMATCH',
        severity: sev,
        message:
          `Erreur timeframe : tu as sélectionné ${params.timeframe} (${tfLabel(params.timeframe)}) ` +
          `mais ta capture TradingView est en ${detectedTimeframe} (${tfLabel(detectedTimeframe)}). ` +
          `Corrige le timeframe dans l'app ou reprends une capture au bon intervalle.`,
      })
    }
  } else if (!detectedTimeframe && estimatedTimeframe !== params.timeframe) {
    const sev = tfMismatchSeverity(params.timeframe, estimatedTimeframe)
    if (sev === 'error') {
      userErrors.push({
        code: 'ESTIMATED_TF_MISMATCH',
        severity: 'warning',
        message:
          `Le nombre de bougies visibles (~${candleCount}) correspond plutôt à un graphique ${estimatedTimeframe} ` +
          `(${tfLabel(estimatedTimeframe)}), pas ${params.timeframe}. Vérifie ton timeframe.`,
      })
    }
  }

  if (detectedSymbol && detectedSymbol !== params.instrument) {
    userErrors.push({
      code: 'SYMBOL_MISMATCH',
      severity: 'error',
      message:
        `Erreur actif : tu analyses ${params.instrument} mais la capture montre ${detectedSymbol}. ` +
        `Change l'instrument ou envoie le bon graphique.`,
    })
  }

  if (params.livePrice && detectedPrice) {
    const tol = priceTolerance(params.instrument, params.livePrice)
    const diff = Math.abs(params.livePrice - detectedPrice)
    if (diff > tol) {
      const ageHint = chartAgeFromAxisMinutes != null && chartAgeFromAxisMinutes > 60
        ? ` La dernière bougie visible date d'il y a ${formatAgeFr(chartAgeFromAxisMinutes)}.`
        : ''
      userErrors.push({
        code: 'PRICE_MISMATCH',
        severity: diff > tol * 3 ? 'error' : 'warning',
        message:
          `Prix incohérent : live ${params.livePrice.toLocaleString('fr-FR')} vs capture ~${detectedPrice.toLocaleString('fr-FR')}.` +
          `${ageHint} Capture probablement périmée ou mauvais actif.`,
      })
    }
  }

  if (filenameDate && chartAgeFromAxisMinutes != null && chartAgeFromAxisMinutes > 60) {
    userErrors.push({
      code: 'STALE_CHART',
      severity: chartAgeFromAxisMinutes > 1440 ? 'error' : 'warning',
      message:
        `Date fichier détectée (${filenameDate.toLocaleString('fr-FR')}) : capture prise il y a ${formatAgeFr(chartAgeFromAxisMinutes)}.`,
    })
  }

  if (chartAgeFromAxisMinutes != null && chartAgeFromAxisMinutes > 1440) {
    userErrors.push({
      code: 'STALE_CHART',
      severity: 'error',
      message:
        `Capture très ancienne : la dernière date lue sur l'axe du graphique date d'il y a ${formatAgeFr(chartAgeFromAxisMinutes)}. ` +
        `Le marché a beaucoup bougé — reprends une capture à l'instant sur TradingView.`,
    })
  } else if (chartAgeFromAxisMinutes != null && chartAgeFromAxisMinutes > 120) {
    userErrors.push({
      code: 'STALE_CHART',
      severity: 'warning',
      message:
        `Graphique daté : dernière bougie visible il y a ~${formatAgeFr(chartAgeFromAxisMinutes)}. ` +
        `Pour ${params.timeframe}, une capture récente est recommandée.`,
    })
  }

  const parts: string[] = []
  parts.push(`Lecture image : ${effectiveTf} (${tfLabel(effectiveTf)})`)
  if (detectedSymbol) parts.push(`actif ${detectedSymbol}`)
  if (detectedPrice) parts.push(`prix ~${detectedPrice.toLocaleString('fr-FR')}`)
  if (chartAgeFromAxisMinutes != null) parts.push(`dernière bougie ~${formatAgeFr(chartAgeFromAxisMinutes)}`)
  parts.push(`${candleCount} bougies visibles`)

  const ocrUsed = !!(ocrHeader || ocrFooter || ocrPriceAxis)
  const summary = userErrors.length
    ? `${parts.join(' · ')}. ${userErrors.length} alerte(s) détectée(s) sur ta capture.`
    : `${parts.join(' · ')}. Capture cohérente avec tes paramètres.` +
      (ocrUsed ? '' : ' (analyse visuelle — OCR non disponible)')

  return {
    platform,
    detectedSymbol,
    detectedTimeframe,
    estimatedTimeframe,
    detectedPrice,
    lastVisibleDate: lastDate?.toISOString() ?? null,
    chartAgeFromAxisMinutes,
    candleCount,
    userErrors,
    summary,
    confidence,
  }
}
