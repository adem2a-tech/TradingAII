'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Crown, Sparkles } from 'lucide-react'

export default function SuccessPage() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) { setError('Session invalide'); return }

    fetch('/api/stripe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (r) => {
        const d = await r.json()
        if (d.ok) {
          setDone(true)
          return
        }
        if (r.status === 401) {
          setError('auth')
          return
        }
        setError(d.error || 'Erreur vérification')
      })
      .catch(() => setError('Erreur réseau'))
  }, [])

  return (
    <main className="success-page">
      <div className="success-glow" />
      <div className="success-card neon-card">
        {!done && !error && (
          <>
            <div className="success-spinner" />
            <h1>Vérification du paiement...</h1>
          </>
        )}
        {error === 'auth' && (
          <>
            <h1>Paiement reçu</h1>
            <p>
              Ton paiement Stripe est confirmé. Connecte-toi avec le même compte pour activer Pro
              (ou attends quelques secondes — le webhook l&apos;active automatiquement).
            </p>
            <Link href="/login" className="btn-primary">Se connecter →</Link>
          </>
        )}
        {error && error !== 'auth' && (
          <>
            <h1>Erreur</h1>
            <p>{error}</p>
            <Link href="/analyze" className="btn-primary">Retour</Link>
          </>
        )}
        {done && (
          <>
            <div className="success-icon"><Crown size={40} /></div>
            <span className="success-badge"><Sparkles size={14} /> PRO ACTIVÉ</span>
            <h1>Bienvenue dans TradeAI Pro</h1>
            <p>Analyses <strong>illimitées</strong> — accès Pro débloqué.</p>
            <ul className="success-perks">
              <li><Check size={16} /> Analyses sans limite</li>
              <li><Check size={16} /> Chat expert inclus</li>
              <li><Check size={16} /> Moteur de risque pro</li>
              <li><Check size={16} /> Historique sécurisé par compte</li>
            </ul>
            <Link href="/analyze" className="btn-primary success-cta">Commencer à trader →</Link>
          </>
        )}
      </div>
    </main>
  )
}
