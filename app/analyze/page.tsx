'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Header, type HomeTab } from '@/components/header'
import { LiveVisitorsBadge } from '@/components/live-visitors-badge'
import { UploadZone } from '@/components/upload-zone'
import { TradingViewLinkInput } from '@/components/tradingview-link'
import { ResultCard } from '@/components/result-card'
import { WelcomeModal, PlanBadge } from '@/components/subscription-bar'
import { ProPopups, LimitBlockModal } from '@/components/pro-popups'
import { DashboardPanel } from '@/components/tabs/dashboard-journal'
import { LeaderboardPanel } from '@/components/tabs/leaderboard-panel'
import { SettingsPanel } from '@/components/tabs/settings-panel'
import { ToolsPanel, ProPanel } from '@/components/tabs/tools-pro'
import { useToast } from '@/components/toast'
import { useSync } from '@/components/sync-indicator'
import { CATEGORY_LABELS, getInstrumentsByCategory, TIMEFRAMES } from '@/lib/assets'
import type { AccessStatus } from '@/lib/access/types'
import { loadPrefs, savePrefs, loadDeviceProfile, rememberUser } from '@/lib/storage/user-prefs'
import { openProWhatsApp } from '@/lib/pro-contact'
import type { AnalysisRecord, AssetCategory, Timeframe, TradingViewContext } from '@/lib/types'

export default function HomePage() {
  const { toast } = useToast()
  const { sync } = useSync()
  const { data: session } = useSession()
  const initRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<HomeTab>('analyze')
  const [file, setFile] = useState<File | null>(null)
  const [fileCapturedAt, setFileCapturedAt] = useState<number | null>(null)
  const [category, setCategory] = useState<AssetCategory>('forex')
  const [instrument, setInstrument] = useState('EURUSD')
  const [timeframe, setTimeframe] = useState<Timeframe>('M15')
  const [balance, setBalance] = useState('10000')
  const [riskPercent, setRiskPercent] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisRecord | null>(null)
  const [access, setAccess] = useState<AccessStatus | null>(null)
  const [welcome, setWelcome] = useState<string | null>(null)
  const [showLimit, setShowLimit] = useState(false)
  const [promoModal, setPromoModal] = useState(false)
  const [canForce, setCanForce] = useState(false)
  const [forceConfirm, setForceConfirm] = useState(false)
  const [lastPrefs, setLastPrefs] = useState<{ balance?: string } | null>(null)
  const [tradingViewUrl, setTradingViewUrl] = useState('')
  const [tradingViewContext, setTradingViewContext] = useState<TradingViewContext | null>(null)

  const refreshAccess = useCallback(async (silent = false) => {
    if (!silent) await sync('access')
    const res = await fetch('/api/access/promo', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    setAccess(data)
    return data as AccessStatus
  }, [sync])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const profile = loadDeviceProfile()
    const prefs = profile.prefs ?? loadPrefs()
    if (prefs) {
      if (prefs.balance) setBalance(prefs.balance)
      if (prefs.riskPercent) setRiskPercent(prefs.riskPercent)
      if (prefs.category) setCategory(prefs.category)
      if (prefs.instrument) setInstrument(prefs.instrument)
      if (prefs.timeframe) setTimeframe(prefs.timeframe)
      setLastPrefs(prefs)
      const who = profile.name?.split(' ')[0]
      if (who) toast(`Bonjour ${who} — tes réglages ont été restaurés ✓`)
      else if (prefs.balance) toast(`Balance restaurée : €${prefs.balance}`)
    }
    refreshAccess().finally(() => setReady(true))
  }, [toast, refreshAccess])

  useEffect(() => {
    if (session?.user?.id && session.user.email && session.user.name) {
      rememberUser({ userId: session.user.id, name: session.user.name, email: session.user.email })
    }
  }, [session])

  useEffect(() => {
    if (!ready) return
    savePrefs({ balance, riskPercent, category, instrument, timeframe })
  }, [ready, balance, riskPercent, category, instrument, timeframe])

  useEffect(() => {
    const onFocus = () => { refreshAccess(true) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshAccess])

  useEffect(() => {
    if (session?.user?.name) {
      const first = session.user.name.split(' ')[0]
      const key = `welcomed_${session.user.id}`
      const profile = loadDeviceProfile()
      const isReturn = profile.userId === session.user.id
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        toast(isReturn ? `Bonjour ${first}, content de te revoir 👋` : `Bonjour ${first} ! Bienvenue sur TradeAI 👋`)
      }
    }
  }, [session, toast])

  const instruments = useMemo(() => getInstrumentsByCategory(category), [category])
  const riskPreview = useMemo(() => (Number(balance) * Number(riskPercent)) / 100, [balance, riskPercent])

  const onCategory = (c: AssetCategory) => {
    setCategory(c)
    const list = getInstrumentsByCategory(c)
    if (list[0]) setInstrument(list[0].id)
  }

  const resetAnalyze = () => {
    setResult(null)
    setFile(null)
    setFileCapturedAt(null)
    setError(null)
    setCanForce(false)
    setForceConfirm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePromo = async (code: string) => {
    const res = await fetch('/api/access/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) { toast(data.message || data.error); return }
    setWelcome(data.message)
    if (data.access) setAccess(data.access)
    toast('Code promo activé ✓')
    await refreshAccess(true)
  }

  const handleSubscribe = () => {
    openProWhatsApp()
  }

  const analyze = async (opts?: { force?: boolean }) => {
    if (!file) { setError('Déposez une capture de graphique.'); setTab('analyze'); return }
    if (!opts?.force && access && !access.canAnalyze) { setShowLimit(true); return }
    setLoading(true); setError(null)
    try {
      savePrefs({ balance, riskPercent, category, instrument, timeframe })
      const fd = new FormData()
      fd.append('image', file)
      fd.append('assetCategory', category)
      fd.append('instrument', instrument)
      fd.append('timeframe', timeframe)
      fd.append('balance', balance)
      fd.append('riskPercent', riskPercent)
      if (fileCapturedAt) fd.append('fileLastModified', String(fileCapturedAt))
      if (tradingViewUrl.trim()) fd.append('tradingViewUrl', tradingViewUrl.trim())
      if (opts?.force) fd.append('forceTrade', 'true')
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        if (data.access) { setAccess(data.access); if (!data.access.canAnalyze) setShowLimit(true) }
        if (data.canForce) {
          setError(data.error)
          setCanForce(true)
          return
        }
        throw new Error(data.error || 'Erreur analyse')
      }
      setCanForce(false)
      setResult(data)
      setTab('analyze')
      toast(opts?.force ? `Trade forcé · ${data.ai.signal} · ${data.ai.confidence}%` : `Analyse · ${data.ai.signal} · ${data.ai.confidence}%`)
      await refreshAccess()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      setError(msg)
      toast(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <>
      <Header
        access={access}
        onSubscribe={handleSubscribe}
        activeTab={tab}
        onTabChange={setTab}
      />
      {welcome && <WelcomeModal message={welcome} onClose={() => setWelcome(null)} />}
      {access && !access.canAnalyze && showLimit && (
        <LimitBlockModal access={access} onSubscribe={handleSubscribe} onClose={() => setShowLimit(false)} />
      )}
      <ProPopups access={access} onSubscribe={handleSubscribe} onPromo={() => setPromoModal(true)} />
      {promoModal && (
        <div className="modal-overlay" onClick={() => setPromoModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Code promo</h2>
            <div className="promo-inline" style={{ marginTop: 16 }}>
              <input id="promo-popup" placeholder="Votre code promo" onKeyDown={(e) => {
                if (e.key === 'Enter') handlePromo((e.target as HTMLInputElement).value).then(() => setPromoModal(false))
              }} />
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={() => {
              const v = (document.getElementById('promo-popup') as HTMLInputElement)?.value
              if (v) handlePromo(v).then(() => setPromoModal(false))
            }}>Valider</button>
          </div>
        </div>
      )}
      {forceConfirm && (
        <div className="modal-overlay" onClick={() => setForceConfirm(false)}>
          <div className="modal-box force-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Forcer le trade ?</h2>
            <p className="force-modal-text">
              Vous voulez vraiment trader ? Je vais vous donner une analyse, mais elle ne sera pas au top de ma forme — setup hors critères habituels, confiance réduite.
            </p>
            <div className="force-modal-actions">
              <button type="button" className="btn-ghost-sm" onClick={() => setForceConfirm(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => { setForceConfirm(false); analyze({ force: true }) }}
                disabled={loading}
              >
                {loading ? 'Analyse...' : 'Oui, forcer l\'analyse →'}
              </button>
            </div>
          </div>
        </div>
      )}
      <main className={`page page-app ${tab !== 'analyze' ? 'page-tab-view' : ''}${tab === 'pro' ? ' page-pro-view' : ''}`}>
        <div className={`hero compact-hero ${tab !== 'analyze' ? 'page-analyze-only' : ''}`}>
          <div className="badge-row">
            <LiveVisitorsBadge />
            <PlanBadge status={access} />
          </div>
          <h1>TRADE<span className="accent-text">AI</span></h1>
          {tab === 'analyze' && (
            <div className="analyze-toolbar">
              <button type="button" className="btn-back" onClick={resetAnalyze}>
                ← Nouvelle analyse
              </button>
            </div>
          )}
        </div>


        <div key={tab} className="page-tab-body tab-switch-enter">
        {tab === 'analyze' && (
          result ? (
            <div className="result-section fade-in">
              <ResultCard
                data={result}
                onForceTrade={() => setForceConfirm(true)}
                forceLoading={loading}
              />
            </div>
          ) : (
            <div className="panel fade-in">
              <div className="panel-col">
                <h2>1 · Graphique</h2>
                <UploadZone file={file} onFile={(f) => { setFile(f); setFileCapturedAt(f.lastModified); toast('Graphique chargé ✓') }} onRemove={() => { setFile(null); setFileCapturedAt(null) }} />
                <TradingViewLinkInput
                  value={tradingViewUrl}
                  onChange={setTradingViewUrl}
                  context={tradingViewContext}
                  onContext={setTradingViewContext}
                  onInstrumentDetected={(id, cat) => {
                    setInstrument(id)
                    setCategory(cat as AssetCategory)
                    toast(`Symbole détecté depuis TradingView : ${id}`)
                  }}
                />
              </div>
              {error && (
                <div className="alert alert-in-panel">
                  {error}
                  {canForce && file && (
                    <button type="button" className="btn-force-trade inline" onClick={() => setForceConfirm(true)} disabled={loading}>
                      Forcer le trade quand même →
                    </button>
                  )}
                </div>
              )}
              <div className="panel-col">
                <h2>2 · Paramètres</h2>
                <div className="fields">
                  <div className="field">
                    <label>Actif</label>
                    <div className="pills">
                      {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((c) => (
                        <button key={c} type="button" className={category === c ? 'on' : ''} onClick={() => onCategory(c)}>{CATEGORY_LABELS[c]}</button>
                      ))}
                    </div>
                    <select value={instrument} onChange={(e) => setInstrument(e.target.value)}>
                      {instruments.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Timeframe</label>
                    <div className="pills wrap">
                      {TIMEFRAMES.map((tf) => (
                        <button key={tf} type="button" className={timeframe === tf ? 'on' : ''} onClick={() => setTimeframe(tf)}>{tf}</button>
                      ))}
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Balance {lastPrefs?.balance === balance && <span className="hint">· restaurée</span>}</label>
                      <div className="input-box"><span>€</span><input inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} /></div>
                    </div>
                    <div className="field">
                      <label>Risque %</label>
                      <div className="input-box"><input inputMode="decimal" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} /><span>%</span></div>
                    </div>
                  </div>
                  <div className="risk-box"><span>Risque max</span><strong>€{riskPreview.toFixed(2)}</strong></div>
                  <div className="analyze-submit-wrap">
                    <button type="button" className="btn-primary" onClick={analyze} disabled={loading || (access !== null && !access.canAnalyze)}>
                      {loading ? <><Loader2 size={18} className="spin" /> Analyse...</> : access && !access.canAnalyze ? 'LIMITE ATTEINTE' : 'ANALYSER →'}
                    </button>
                    {access && !access.canAnalyze && !access.isPro && !access.isLifetime && (
                      <p className="analyze-limit-upsell">
                        <button type="button" onClick={handleSubscribe}>Passer au Pro</button>
                        <span>— trader et analyser à l&apos;infini, accès à vie</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {tab === 'dashboard' && <DashboardPanel />}
        {tab === 'leaderboard' && <LeaderboardPanel />}
        {tab === 'tools' && <ToolsPanel balance={balance} riskPercent={riskPercent} instrument={instrument} />}
        {tab === 'pro' && (
          <ProPanel
            onSubscribe={handleSubscribe}
            onPromo={handlePromo}
            onPromoModal={() => setPromoModal(true)}
            isPro={access?.isPro}
            isLifetime={access?.isLifetime}
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel access={access} onSubscribe={handleSubscribe} />
        )}
        </div>
      </main>
    </>
  )
}
