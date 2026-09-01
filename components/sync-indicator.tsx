'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { RefreshCw } from 'lucide-react'

type SyncCtx = {
  syncing: boolean
  sync: (label?: string) => Promise<void>
}

const Ctx = createContext<SyncCtx>({ syncing: false, sync: async () => {} })

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false)

  const sync = useCallback(async (label?: string) => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 400))
    setSyncing(false)
    if (label) {
      window.dispatchEvent(new CustomEvent('tradeai-sync-done', { detail: label }))
    }
  }, [])

  return <Ctx.Provider value={{ syncing, sync }}>{children}</Ctx.Provider>
}

export function useSync() {
  return useContext(Ctx)
}

export function SyncIndicator() {
  const { syncing } = useSync()
  if (!syncing) return null
  return (
    <span className="sync-indicator" title="Synchronisation...">
      <RefreshCw size={12} className="spin" />
      Sync
    </span>
  )
}
