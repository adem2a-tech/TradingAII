'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreditCard, Crown, LogOut } from 'lucide-react'
import { Header } from '@/components/header'
import { useToast } from '@/components/toast'
import type { AccessStatus } from '@/lib/access/types'

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [access, setAccess] = useState<AccessStatus | null>(null)
  const [sub, setSub] = useState<{ status: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stripe/portal')
      .then((r) => r.json())
      .then((d) => {
        if (d.access) setAccess(d.access)
        if (d.subscription) setSub(d.subscription)
      })
      .finally(() => setLoading(false))
  }, [])

  const openPortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.assign(data.url)
    else toast(data.error || 'Aucun abonnement')
  }

  const logout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="page">
          <div className="skeleton-block" style={{ width: 180, height: 32, marginBottom: 24 }} />
          <div className="settings-card skeleton-row"><div className="skeleton-block" style={{ width: '100%', height: 80 }} /></div>
          <div className="settings-card skeleton-row"><div className="skeleton-block" style={{ width: '100%', height: 60 }} /></div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header access={access} />
      <main className="page settings-page">
        <h1>Paramètres</h1>
        {session?.user && (
          <p className="settings-email">{session.user.name} · {session.user.email}</p>
        )}

        <section className="settings-card neon-card">
          <div className="settings-head"><Crown size={18} /> Plan</div>
          {access?.isLifetime && <p className="plan-status lifetime">Accès à vie activé</p>}
          {access?.isPro && (
            <>
              <p className="plan-status pro">Pro actif · analyses illimitées · 79€</p>
              {sub ? (
                <>
                  <p className="plan-detail">
                    {sub.cancelAtPeriodEnd ? 'Expire le' : 'Renouvellement le'}{' '}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </p>
                  <button type="button" className="btn-outline" onClick={openPortal}>
                    <CreditCard size={16} /> Gérer paiement
                  </button>
                </>
              ) : (
                <p className="plan-detail">Paiement unique · accès Pro permanent</p>
              )}
            </>
          )}
          {!access?.isPro && !access?.isLifetime && (
            <>
              <p className="plan-status free">Gratuit · 1 analyse / 3 jours</p>
              <Link href="/analyze" className="btn-primary sm">Passer Pro · 79€</Link>
            </>
          )}
        </section>

        <section className="settings-card">
          <div className="settings-head">Sécurité</div>
          <p className="plan-detail">Session chiffrée · données isolées par compte</p>
          <button type="button" className="btn-ghost-logout" onClick={logout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </section>
      </main>
    </>
  )
}
