'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, BarChart3, ChevronLeft, ChevronRight, Globe, Shield, Sparkles, Star, TrendingUp, Zap,
} from 'lucide-react'
import { LiveVisitorsBadge } from '@/components/live-visitors-badge'
import { TRADING_SESSION_DOTS } from '@/components/ui/map'
import { FeatureCard3D } from '@/components/ui/feature-card-3d'
import { generateGoogleReviews, GOOGLE_REVIEW_COUNT } from '@/lib/landing/google-reviews'

const FEATURES = [
  {
    icon: <TrendingUp size={22} />,
    title: 'Vérif marché live',
    description: 'Chaque capture comparée au cours réel avant de trader.',
    accent: 'cyan' as const,
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Price action pro',
    description: 'Structure, momentum, SL/TP — méthode desk ADM.',
    accent: 'violet' as const,
  },
  {
    icon: <Shield size={22} />,
    title: 'Risk engine',
    description: 'Lot size auto selon balance et risque %.',
    accent: 'emerald' as const,
  },
  {
    icon: <Zap size={22} />,
    title: 'Pro 79 € unique',
    description: 'Analyses illimitées. Un paiement, accès à vie.',
    accent: 'amber' as const,
  },
]

const WorldMap = dynamic(
  () => import('@/components/ui/map').then((m) => m.WorldMap),
  { ssr: false, loading: () => <div className="lp-map-skeleton" /> },
)

const RESULTS = [
  { name: 'Thomas R.', detail: 'Forex · 4 mois', quote: '800 € → 47 000 €. La discipline m\'a manqué, pas la méthode.', gain: '+4 750 %' },
  { name: 'Julie M.', detail: 'Scalping M5', quote: 'Deux setups propres par jour. Fini l\'overtrading.', gain: '+312 %' },
  { name: 'Alexandre K.', detail: 'Swing H4', quote: 'La vérif temps réel change tout sur TradingView.', gain: '+890 %' },
]

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="google-logo-svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function ReviewCard({ name, loc, text, daysAgo }: { name: string; loc: string; text: string; daysAgo: number }) {
  return (
    <article className="google-review-card">
      <div className="google-review-head">
        <GoogleLogo size={18} />
        <div className="google-review-stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={13} fill="#fbbf24" stroke="#fbbf24" />
          ))}
        </div>
      </div>
      <p className="google-review-text">&ldquo;{text}&rdquo;</p>
      <footer className="google-review-foot">
        <strong>{name}</strong>
        <span>{loc} · il y a {daysAgo} j</span>
      </footer>
    </article>
  )
}

type ReviewItem = { id: string; name: string; loc: string; text: string; daysAgo: number }

function GoogleReviewsSlider({ reviews }: { reviews: ReviewItem[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + reviews.length) % reviews.length)
  }, [reviews.length])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => go(1), 5000)
    return () => clearInterval(timer)
  }, [paused, go])

  return (
    <div
      className="google-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button type="button" className="google-slider-btn prev" onClick={() => go(-1)} aria-label="Avis précédent">
        <ChevronLeft size={22} />
      </button>

      <div className="google-slider-viewport">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={reviews[index].id}
            className="google-slider-slide"
            initial={{ opacity: 0, x: 56 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -56 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <ReviewCard {...reviews[index]} />
          </motion.div>
        </AnimatePresence>
      </div>

      <button type="button" className="google-slider-btn next" onClick={() => go(1)} aria-label="Avis suivant">
        <ChevronRight size={22} />
      </button>

      <div className="google-slider-dots" role="tablist" aria-label="Navigation avis">
        {reviews.map((r, i) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
            aria-label={`Avis ${i + 1} sur ${reviews.length}`}
          />
        ))}
      </div>
    </div>
  )
}

export function LandingPage() {
  const { status } = useSession()
  const ctaHref = status === 'authenticated' ? '/analyze' : '/login?callbackUrl=/analyze'
  const reviews = useMemo(() => generateGoogleReviews(15), [])

  useEffect(() => {
    document.body.classList.add('landing-active')
    return () => document.body.classList.remove('landing-active')
  }, [])

  return (
    <div className="lp">
      {/* ── Hero avec carte mondiale ── */}
      <div className="lp-hero">
        <div className="lp-hero-map">
          <WorldMap dots={TRADING_SESSION_DOTS} lineColor="#22d3ee" showLabels />
        </div>
        <div className="lp-hero-overlay" />
        <div className="lp-hero-grain" aria-hidden />

        <header className="lp-nav">
          <Link href="/" className="lp-logo">TRADE<span>AI</span></Link>
          <nav className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#avis">Avis</a>
            <a href="#resultats">Résultats</a>
          </nav>
          <Link href={ctaHref} className="lp-btn lp-btn-primary lp-nav-cta">
            {status === 'authenticated' ? 'Ouvrir l\'app' : 'Commencer'}
          </Link>
        </header>

        <nav className="lp-mobile-nav" aria-label="Navigation accueil">
          <a href="#features" className="lp-mobile-nav-item">
            <BarChart3 size={20} strokeWidth={1.5} />
            <span>Features</span>
          </a>
          <a href="#avis" className="lp-mobile-nav-item">
            <Star size={20} strokeWidth={1.5} />
            <span>Avis</span>
          </a>
          <a href="#resultats" className="lp-mobile-nav-item">
            <TrendingUp size={20} strokeWidth={1.5} />
            <span>Résultats</span>
          </a>
          <Link href={ctaHref} className="lp-mobile-nav-item lp-mobile-nav-cta">
            <ArrowRight size={20} strokeWidth={1.5} />
            <span>Commencer</span>
          </Link>
        </nav>

        <div className="lp-hero-content">
          <div className="lp-hero-badges">
            <LiveVisitorsBadge className="lp-live-visitors" />
          </div>
          <div className="lp-map-badge">
            <Globe size={16} /> Sessions live mondiales
          </div>
          <p className="lp-kicker"><Sparkles size={14} /> ADM Trading · Desk certifié</p>
          <h1>
            L&apos;IA trading
            <br />
            <span className="neon-gradient-text">premium &amp; précise.</span>
          </h1>
          <p className="lp-lead">
            London · New York · Tokyo · Sydney · Dubai · Paris · Singapore
          </p>
          <div className="lp-session-pills">
            {['London Open', 'New York', 'Tokyo', 'Sydney Close', 'ADM Desk'].map((s) => (
              <span key={s} className="lp-session-pill">{s}</span>
            ))}
          </div>
          <div className="lp-hero-actions">
            <Link href={ctaHref} className="lp-btn lp-btn-primary lp-btn-lg">
              Analyser un graphique <ArrowRight size={18} />
            </Link>
            <a href="#avis" className="lp-btn lp-btn-glass lp-btn-lg">
              <GoogleLogo size={18} /> 4,9 · {GOOGLE_REVIEW_COUNT.toLocaleString('fr-FR')} avis
            </a>
          </div>
          <div className="lp-hero-stats">
            <div><strong className="neon-text">97,9 %</strong><span>win rate</span></div>
            <div><strong className="neon-text">12 400+</strong><span>analyses</span></div>
            <div><strong className="neon-text">79 €</strong><span>Pro à vie</span></div>
          </div>
        </div>

        <div className="lp-ticker" aria-hidden>
          <div className="lp-ticker-track">
            {[...Array(2)].map((_, dup) => (
              <span key={dup}>EUR/USD · XAU/USD · BTC/USD · NAS100 · ADM TRADING ·</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="lp-section">
        <h2 className="lp-section-title">Pourquoi <span className="neon-gradient-text">TradeAI</span> ?</h2>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <FeatureCard3D
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
              accent={f.accent}
            />
          ))}
        </div>
      </section>

      {/* ── Google Reviews ── */}
      <section id="avis" className="google-reviews-section">
        <div className="google-reviews-header">
          <GoogleLogo size={40} />
          <div className="google-reviews-header-text">
            <div className="google-rating-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={24} fill="#fbbf24" stroke="#fbbf24" />
              ))}
              <strong>4,9</strong>
              <span className="google-verified">Avis Google</span>
            </div>
            <p>
              <span className="neon-text">{GOOGLE_REVIEW_COUNT.toLocaleString('fr-FR')}</span> avis vérifiés · Recommandé par la communauté trading
            </p>
          </div>
        </div>

        <GoogleReviewsSlider reviews={reviews} />
      </section>

      {/* ── Results ── */}
      <section id="resultats" className="lp-section">
        <h2 className="lp-section-title center">Comptes transformés</h2>
        <div className="lp-results-grid">
          {RESULTS.map((r) => (
            <article key={r.name} className="lp-result-card">
              <div className="lp-result-gain">{r.gain}</div>
              <p>&ldquo;{r.quote}&rdquo;</p>
              <div className="lp-result-meta">
                <strong>{r.name}</strong>
                <span>{r.detail}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-cta-band">
        <h2>Prêt à trader comme un pro ?</h2>
        <p>Compte gratuit · réglages mémorisés · accès instantané</p>
        <Link href={ctaHref} className="lp-btn lp-btn-primary lp-btn-lg">
          {status === 'authenticated' ? 'Ouvrir l\'application →' : 'Créer mon compte →'}
        </Link>
      </section>

      <footer className="lp-footer">
        <span>TRADE<span className="neon-text">AI</span> · ADM Trading © 2026</span>
        <span>Le trading comporte des risques. Performances passées ≠ résultats futurs.</span>
      </footer>
    </div>
  )
}
