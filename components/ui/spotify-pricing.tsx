'use client'

import { Check, Minus } from 'lucide-react'
import { PRO_PRICE_LABEL } from '@/lib/access/types'
import { openProWhatsApp } from '@/lib/pro-contact'

type Props = {
  onSubscribe?: () => void
  onPromoSubmit?: (code: string) => void
  isProActive?: boolean
  isLifetime?: boolean
  promoCode?: string
  onPromoCodeChange?: (code: string) => void
}

const COMPARE_ROWS = [
  { label: 'Analyses de graphiques', free: '1 / 3 jours', pro: 'Illimitées' },
  { label: 'Lecture capture TradingView', free: true, pro: true },
  { label: 'Détection erreurs sur capture', free: false, pro: true },
  { label: 'Chat expert IA', free: false, pro: true },
  { label: 'Dashboard & classement', free: 'Basique', pro: 'Complet' },
  { label: 'Outils pro (lot, sessions…)', free: false, pro: true },
  { label: 'Annonces macro & marché live', free: false, pro: true },
  { label: 'Accès à vie — sans abonnement', free: false, pro: true },
]

const PRO_BULLETS = [
  'Analyses illimitées à vie',
  '1 compte TradeAI Pro',
  'Lecture IA de tes captures TradingView',
  'Dashboard, classement & outils pro',
  'Contact WhatsApp · activation rapide',
]

export function SpotifyPricing({
  onSubscribe,
  onPromoSubmit,
  isProActive = false,
  isLifetime = false,
  promoCode = '',
  onPromoCodeChange,
}: Props) {
  const hasPro = isProActive || isLifetime
  const goPro = () => (onSubscribe ? onSubscribe() : openProWhatsApp())

  return (
    <section className="sp-premium">
      {/* Hero */}
      <div className="sp-hero">
        <h1 className="sp-hero-title">TradeAI Pro</h1>
        {!hasPro ? (
          <>
            <p className="sp-hero-lead">
              Débloque tout pour <strong>{PRO_PRICE_LABEL}</strong> — contacte-nous sur WhatsApp, activation immédiate.
            </p>
            <button
              type="button"
              className="sp-hero-cta"
              onClick={goPro}
            >
              Passer Pro · WhatsApp
            </button>
            <p className="sp-hero-note">
              Message pré-rempli · {PRO_PRICE_LABEL} · code promo disponible
            </p>
          </>
        ) : (
          <>
            <p className="sp-hero-lead sp-hero-active">
              {isLifetime ? 'Accès à vie activé' : 'TradeAI Pro actif'} — analyses illimitées
            </p>
          </>
        )}
      </div>

      {/* Tableau comparatif — desktop */}
      <div className="sp-compare-wrap sp-desktop-only">
        <table className="sp-compare">
          <thead>
            <tr>
              <th className="sp-compare-feature-col">Vos avantages</th>
              <th>TradeAI<br /><span>Gratuit</span></th>
              <th className="sp-compare-pro-col">TradeAI<br /><span>Pro</span></th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label}>
                <td className="sp-compare-feature-col">{row.label}</td>
                <td><CompareCell value={row.free} /></td>
                <td className="sp-compare-pro-col"><CompareCell value={row.pro} pro /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes */}
      <div className="sp-plans-head">
        <h2>Des offres pour chaque trader</h2>
        <p>
          Choisis Pro pour analyser sans limite. Un paiement unique, accès permanent —
          sur ton téléphone, ton PC et partout où tu trades.
        </p>
      </div>

      <div className="sp-cards">
        {/* Pro — en premier sur mobile */}
        <article className="sp-card sp-card-featured">
          <div className="sp-card-badge">Paiement unique</div>
          <div className="sp-card-brand">TradeAI</div>
          <h3 className="sp-card-name">Pro à vie</h3>
          <div className="sp-card-price">{PRO_PRICE_LABEL}</div>
          <p className="sp-card-sub">Accès permanent · pas d&apos;abonnement</p>
          <hr className="sp-card-divider" />
          <ul className="sp-card-list">
            {PRO_BULLETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <button
            type="button"
            className="sp-card-btn sp-card-btn-primary"
            onClick={goPro}
            disabled={hasPro}
          >
            {isLifetime
              ? 'Accès à vie actif ✓'
              : isProActive
                ? 'Pro actif ✓'
                : `Débloquer Pro · WhatsApp`}
          </button>
          <p className="sp-card-legal">
            {PRO_PRICE_LABEL} · contact WhatsApp · offre soumise aux conditions TradeAI.
          </p>
        </article>

        {/* Gratuit */}
        <article className="sp-card sp-card-free">
          <div className="sp-card-badge sp-card-badge-muted">Plan actuel</div>
          <div className="sp-card-brand">TradeAI</div>
          <h3 className="sp-card-name">Gratuit</h3>
          <div className="sp-card-price">0€</div>
          <p className="sp-card-sub">1 analyse tous les 3 jours</p>
          <hr className="sp-card-divider" />
          <ul className="sp-card-list">
            <li>1 analyse / 3 jours</li>
            <li>Lecture intelligente de capture</li>
            <li>Moteur local + marché live</li>
            <li>Annule rien — reste gratuit</li>
          </ul>
          <button type="button" className="sp-card-btn sp-card-btn-outline" disabled={!hasPro}>
            {hasPro ? 'Plan gratuit (passé)' : 'Plan actuel'}
          </button>
        </article>
      </div>

      {!hasPro && onPromoSubmit && (
        <div className="sp-promo">
          <p className="sp-promo-label">Code promo fondateur</p>
          <div className="sp-promo-row">
            <input
              id="promo-code-input"
              value={promoCode}
              onChange={(e) => onPromoCodeChange?.(e.target.value.toUpperCase())}
              placeholder="Entre ton code promo"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && promoCode.trim()) onPromoSubmit(promoCode.trim())
              }}
            />
            <button
              type="button"
              className="sp-card-btn sp-promo-btn"
              onClick={() => promoCode.trim() && onPromoSubmit(promoCode.trim())}
            >
              Activer
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function CompareCell({ value, pro }: { value: boolean | string; pro?: boolean }) {
  if (value === true) {
    return (
      <span className={`sp-check ${pro ? 'sp-check-pro' : ''}`} aria-label="Inclus">
        <Check size={18} strokeWidth={2.5} />
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="sp-dash" aria-label="Non inclus">
        <Minus size={16} />
      </span>
    )
  }
  return <span className="sp-compare-text">{value}</span>
}
