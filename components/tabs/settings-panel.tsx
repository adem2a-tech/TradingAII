'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { CreditCard, Crown, LogOut, Settings, Shield } from 'lucide-react'
import type { AccessStatus } from '@/lib/access/types'
import { PRO_PRICE_LABEL } from '@/lib/access/types'

type Props = {
  access?: AccessStatus | null
  onSubscribe?: () => void
}

export function SettingsPanel({ access, onSubscribe }: Props) {
  const { data: session } = useSession()

  const logout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="tab-panel fade-in settings-tab">
      <div className="settings-tab-head">
        <Settings size={24} className="text-cyan-400 shrink-0" />
        <div>
          <h2>Paramètres</h2>
          {session?.user && (
            <p>{session.user.name} · {session.user.email}</p>
          )}
        </div>
      </div>

      <div className="settings-stack">
        <section className="settings-card settings-card-plan">
          <div className="settings-head"><Crown size={18} /> Plan</div>
          {access?.isLifetime && <p className="plan-status lifetime">Accès à vie activé</p>}
          {access?.isPro && !access?.isLifetime && (
            <p className="plan-status pro">Pro actif · analyses illimitées</p>
          )}
          {!access?.isPro && !access?.isLifetime && (
            <>
              <p className="plan-status free">Gratuit · 1 analyse / 3 jours</p>
              {onSubscribe && (
                <button type="button" className="btn-primary sm" onClick={onSubscribe}>
                  Passer Pro · {PRO_PRICE_LABEL}
                </button>
              )}
            </>
          )}
        </section>

        <section className="settings-card">
          <div className="settings-head"><Shield size={18} /> Sécurité</div>
          <p className="plan-detail">Session chiffrée · données isolées par compte</p>
          <button type="button" className="btn-ghost-logout" onClick={logout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </section>

        <section className="settings-card">
          <div className="settings-head"><CreditCard size={18} /> Plus</div>
          <Link href="/history" className="btn-ghost-sm">Historique complet →</Link>
        </section>
      </div>
    </div>
  )
}
