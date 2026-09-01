'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Crown, LayoutDashboard, Settings, Trophy, Wrench, Zap,
} from 'lucide-react'
import type { AccessStatus } from '@/lib/access/types'
import { PRO_PRICE_LABEL } from '@/lib/access/types'
import { SyncIndicator } from '@/components/sync-indicator'

export type HomeTab = 'analyze' | 'dashboard' | 'leaderboard' | 'tools' | 'pro' | 'settings'

export const HOME_TABS: { id: HomeTab; label: string; icon: typeof Zap }[] = [
  { id: 'analyze', label: 'Analyser', icon: Zap },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leaderboard', label: 'Classement', icon: Trophy },
  { id: 'tools', label: 'Outils', icon: Wrench },
  { id: 'pro', label: 'Pro', icon: Crown },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

const MOBILE_TABS: HomeTab[] = ['analyze', 'dashboard', 'leaderboard', 'pro', 'settings']

type Props = {
  access?: AccessStatus | null
  onSubscribe?: () => void
  subLoading?: boolean
  activeTab?: HomeTab
  onTabChange?: (tab: HomeTab) => void
}

export function Header({ access, onSubscribe, subLoading, activeTab, onTabChange }: Props) {
  const path = usePathname()
  const { data: session, status } = useSession()
  const showSub = access && !access.isPro && !access.isLifetime
  const firstName = session?.user?.name?.split(' ')[0]
  const isApp = path === '/analyze' && !!activeTab && !!onTabChange

  return (
    <>
      <header className={`site-header${isApp ? ' site-header-app' : ''}`}>
        <div className={`nav-pill neon-border nav-pill-wide${isApp ? ' nav-pill-app-row' : ''}`}>
          <Link href="/analyze" className="nav-logo nav-link-fx">TRADE<span>AI</span></Link>
          {status === 'loading' ? (
            <span className="nav-greeting skeleton-text">Bonjour...</span>
          ) : firstName ? (
            <span className="nav-greeting nav-enter">Bonjour, <strong>{firstName}</strong></span>
          ) : null}
          <span className="nav-desktop-only nav-sync-slot"><SyncIndicator /></span>

          {isApp ? (
            <nav className="nav-links nav-tabs nav-desktop-only" aria-label="Onglets application">
              {HOME_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-tab${activeTab === id ? ' active' : ''}`}
                  onClick={() => onTabChange(id)}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          ) : (
            <nav className="nav-links nav-desktop-only">
              <Link href="/analyze" className={`nav-link-fx ${path === '/analyze' ? 'active' : ''}`} prefetch>
                <Zap size={14} /> Analyser
              </Link>
              <Link href="/history" className={`nav-link-fx ${path === '/history' ? 'active' : ''}`} prefetch>
                Historique
              </Link>
              <Link href="/settings" className={`nav-link-fx ${path === '/settings' ? 'active' : ''}`} prefetch>
                <Settings size={14} /> Paramètres
              </Link>
            </nav>
          )}

          {showSub && onSubscribe ? (
            <button type="button" className="nav-cta neon-btn nav-link-fx nav-desktop-only" onClick={onSubscribe} disabled={subLoading}>
              {subLoading ? <span className="pulse-dot" /> : `Pro ${PRO_PRICE_LABEL}`}
            </button>
          ) : !isApp ? (
            <Link href="/analyze" className="nav-cta neon-btn nav-link-fx nav-desktop-only">Analyser →</Link>
          ) : null}
        </div>
      </header>

      {isApp ? (
        <div className="mobile-bottom-nav">
          <nav className="mobile-tab-bar mobile-tab-bar-app mobile-tab-bar-five" aria-label="Navigation principale">
            {MOBILE_TABS.map((id) => {
              const tab = HOME_TABS.find((t) => t.id === id)!
              const Icon = tab.icon
              return (
                <button
                  key={id}
                  type="button"
                  className={`mobile-tab ${activeTab === id ? 'active' : ''}`}
                  onClick={() => onTabChange(id)}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : path !== '/' ? (
        <div className="mobile-bottom-nav">
          <nav className="mobile-tab-bar mobile-tab-bar-secondary" aria-label="Navigation">
            <Link href="/analyze" className={`mobile-tab ${path === '/analyze' ? 'active' : ''}`}>
              <Zap size={20} strokeWidth={1.75} />
              <span>Analyser</span>
            </Link>
            <Link href="/history" className={`mobile-tab ${path === '/history' ? 'active' : ''}`}>
              <Trophy size={20} strokeWidth={1.75} />
              <span>Historique</span>
            </Link>
            <div className="mobile-tab-center">
              <Link href="/analyze" className="mobile-tab-logo">TRADE<span>AI</span></Link>
            </div>
            <Link href="/settings" className={`mobile-tab ${path === '/settings' ? 'active' : ''}`}>
              <Settings size={20} strokeWidth={1.75} />
              <span>Paramètres</span>
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  )
}
