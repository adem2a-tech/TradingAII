'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export function StripeSetupHelp({ onClose }: { onClose?: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyPath = () => {
    navigator.clipboard.writeText('C:\\Users\\sdiri\\Desktop\\APP TRADE\\.env.local')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="setup-card">
      <h3>Paiement — configuration requise</h3>
      <ol className="setup-steps">
        <li>
          Ouvre <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
            dashboard.stripe.com/apikeys <ExternalLink size={12} />
          </a>
        </li>
        <li>Copie ta <strong>Clé secrète</strong> (<code>sk_live_...</code> ou <code>sk_test_...</code>)</li>
        <li>
          Colle-la dans{' '}
          <button type="button" className="link-btn" onClick={copyPath}>
            .env.local {copied ? '✓ copié' : '(cliquer pour copier le chemin)'}
          </button>
        </li>
        <li>Ligne : <code>STRIPE_SECRET_KEY=sk_...</code></li>
        <li>Redémarre le serveur : <code>npm run dev</code></li>
      </ol>
      <p className="setup-note">Le prix unique 79€ se crée automatiquement au premier clic.</p>
      {onClose && <button type="button" className="btn-ghost-sm" onClick={onClose}>Fermer</button>}
    </div>
  )
}
