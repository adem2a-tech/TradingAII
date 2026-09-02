'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Crown, LogOut } from 'lucide-react'
import { Header } from '@/components/header'
import type { AccessStatus } from '@/lib/access/types'
import { openProWhatsApp } from '@/lib/pro-contact'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [access, setAccess] = useState<AccessStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/access/promo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.plan) setAccess(d) })
      .finally(() => setLoading(false))
  }, [])

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
      <Header access={access} onSubscribe={openProWhatsApp} />
      <main className="page settings-page">
        <h1>Paramètres</h1>
        {session?.user && (
          <p className="settings-email">{session.user.name} · {session.user.email}</p>
        )}

        <section className="settings-card neon-card">
          <div className="settings-head"><Crown size={18} /> Plan</div>
          {access?.isLifetime && <p className="plan-status lifetime">Accès à vie activé</p>}
          {access?.isPro && !access?.isLifetime && (
            <>
              <p className="plan-status pro">Pro actif · analyses illimitées</p>
              <p className="plan-detail">Accès Pro permanent</p>
            </>
          )}
          {!access?.isPro && !access?.isLifetime && (
            <>
              <p className="plan-status free">Gratuit · 1 analyse / 3 jours</p>
              <button type="button" className="btn-primary sm" onClick={openProWhatsApp}>
                Passer Pro · WhatsApp
              </button>
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
