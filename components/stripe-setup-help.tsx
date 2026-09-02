'use client'

import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'

const VERCEL_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'NEXT_PUBLIC_APP_URL',
  'AUTH_SECRET',
  'AUTH_URL',
  'NEXTAUTH_URL',
  'STRIPE_WEBHOOK_SECRET',
]

export function StripeSetupHelp({ onClose }: { onClose?: () => void }) {
  const [copied, setCopied] = useState(false)
  const isProd = useMemo(() => {
    if (typeof window === 'undefined') return false
    return !['localhost', '127.0.0.1'].includes(window.location.hostname)
  }, [])

  const copyVars = () => {
    navigator.clipboard.writeText(VERCEL_ENV_VARS.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="setup-card">
      <h3>Paiement Stripe — configuration requise</h3>
      {isProd ? (
        <>
          <p className="setup-lead">
            Le site en ligne n&apos;a pas encore les clés Stripe. Elles sont dans ton{' '}
            <code>.env.local</code> en local, mais il faut aussi les ajouter sur <strong>Vercel</strong>.
          </p>
          <ol className="setup-steps">
            <li>
              Ouvre{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                vercel.com/dashboard <ExternalLink size={12} />
              </a>{' '}
              → ton projet <strong>trading-iaa</strong>
            </li>
            <li>
              <strong>Settings → Environment Variables</strong> → ajoute les variables (Production + Preview) :
            </li>
          </ol>
          <ul className="setup-env-list">
            <li><code>STRIPE_SECRET_KEY</code> = ta clé <code>sk_live_...</code> (Dashboard Stripe → API keys)</li>
            <li><code>STRIPE_PRICE_ID</code> = <code>price_...</code> (celui de ton .env.local)</li>
            <li><code>NEXT_PUBLIC_APP_URL</code> = <code>https://trading-iaa.vercel.app</code></li>
            <li><code>AUTH_URL</code> et <code>NEXTAUTH_URL</code> = même URL Vercel</li>
            <li><code>AUTH_SECRET</code> = secret aléatoire (32+ caractères)</li>
            <li><code>STRIPE_WEBHOOK_SECRET</code> = webhook Stripe → URL <code>/api/stripe/webhook</code></li>
          </ul>
          <button type="button" className="btn-ghost-sm setup-copy-btn" onClick={copyVars}>
            {copied ? 'Liste copiée ✓' : 'Copier la liste des variables'}
          </button>
          <p className="setup-note">Après ajout : <strong>Redeploy</strong> le projet (Deployments → ⋯ → Redeploy).</p>
        </>
      ) : (
        <>
          <ol className="setup-steps">
            <li>
              Ouvre{' '}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                dashboard.stripe.com/apikeys <ExternalLink size={12} />
              </a>
            </li>
            <li>Copie ta <strong>Clé secrète</strong> (<code>sk_live_...</code> ou <code>sk_test_...</code>)</li>
            <li>
              Colle-la dans <code>.env.local</code> : <code>STRIPE_SECRET_KEY=sk_...</code>
            </li>
            <li>Redémarre le serveur : <code>npm run dev</code></li>
            <li>
              Pour le site en ligne, ajoute aussi ces variables sur{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                Vercel <ExternalLink size={12} />
              </a>
            </li>
          </ol>
          <p className="setup-note">Le prix unique 79€ se crée automatiquement au premier clic si STRIPE_PRICE_ID est absent.</p>
        </>
      )}
      {onClose && (
        <button type="button" className="btn-ghost-sm" onClick={onClose}>
          Fermer
        </button>
      )}
    </div>
  )
}
